// <ai_context> TypeScript port of MinterAccessControl.test.js. Tests MinterAccessControl functionality including adding/removing minters, emitting events, preserving minter status after upgrades, and access control verification. </ai_context>
import { expect } from "chai";
import { network } from "hardhat";
import type * as ethersTypes from "ethers";

const connection = await network.connect();
const { ethers } = connection;

import {
  type MinterAccessControlTestV1,
  MinterAccessControlTestV1__factory,
  type MinterAccessControlTestV2,
  MinterAccessControlTestV2__factory,
  type ProxyAdmin,
} from "../types/ethers-contracts";
import { deployTransparentProxy } from "@rarible/common-sdk/src/deploy";

// -----------------------------------------------------------------------------
// Main Test Suite
// -----------------------------------------------------------------------------
describe("MinterAccessControl", function () {
  let token: MinterAccessControlTestV1;
  let tokenOwner: ethersTypes.Signer;
  let accounts: ethersTypes.Signer[];
  let deployer: ethersTypes.Signer;
  let proxyAdmin: ProxyAdmin;

  before(async () => {
    accounts = await ethers.getSigners();
    [deployer, , , , , , , , , tokenOwner] = accounts;
  });

  beforeEach(async () => {
    const { instance, proxyAdmin: admin } = await deployTransparentProxy<MinterAccessControlTestV1>(ethers, {
      contractName: "MinterAccessControlTestV1",
      initFunction: "initialize",
      initArgs: [await deployer.getAddress()],
      proxyOwner: await deployer.getAddress(),
    });
    token = instance;
    proxyAdmin = admin;

    // Transfer ownership to tokenOwner
    await token.transferOwnership(await tokenOwner.getAddress());
  });

  // ---------------------------------------------------------------------------
  // Upgrade tests
  // ---------------------------------------------------------------------------
  describe("Upgrade", () => {
    it("conserve minter access control after upgrade", async () => {
      const minter = accounts[1];
      const minterAddress = await minter.getAddress();

      await token.connect(tokenOwner).addMinter(minterAddress);
      expect(await token.isMinter(minterAddress)).to.be.true;

      // Deploy new implementation
      const newImpl = await new MinterAccessControlTestV2__factory(deployer).deploy();
      await newImpl.waitForDeployment();

      // Upgrade proxy to new implementation
      const proxyAddress = await token.getAddress();
      await proxyAdmin.upgradeAndCall(proxyAddress, await newImpl.getAddress(), "0x");

      // Get new instance at same proxy address
      const newInstance = MinterAccessControlTestV2__factory.connect(proxyAddress, deployer);

      expect(await newInstance.version()).to.equal(await newInstance.V2());
      expect(await newInstance.isMinter(minterAddress)).to.be.true;
    });
  });

  // ---------------------------------------------------------------------------
  // Add minter tests
  // ---------------------------------------------------------------------------
  describe("Add minter", () => {
    it("should add a minter and emit event", async () => {
      const minter = accounts[2];
      const minterAddress = await minter.getAddress();

      const tx = await token.connect(tokenOwner).addMinter(minterAddress);
      const receipt = await tx.wait();

      // Check event
      let addedMinter: string | undefined;
      let status: boolean | undefined;
      for (const log of receipt?.logs ?? []) {
        try {
          const parsed = token.interface.parseLog(log);
          if (parsed?.name === "MinterStatusChanged") {
            status = parsed.args.status as boolean;
            addedMinter = parsed.args.minter as string;
            break;
          }
        } catch {
          // ignore
        }
      }

      expect(status).to.be.true;
      expect(addedMinter).to.equal(minterAddress);
      expect(await token.isMinter(minterAddress)).to.be.true;
    });

    it("should add a list of minters and emit events", async () => {
      const minter = accounts[2];
      const minter2 = accounts[3];
      const minterAddress = await minter.getAddress();
      const minter2Address = await minter2.getAddress();

      const tx = await token.connect(tokenOwner).addMinters([minterAddress, minter2Address]);
      const receipt = await tx.wait();

      expect(await token.isMinter(minterAddress)).to.be.true;
      expect(await token.isMinter(minter2Address)).to.be.true;

      // Check that events were emitted for both minters
      let eventCount = 0;
      for (const log of receipt?.logs ?? []) {
        try {
          const parsed = token.interface.parseLog(log);
          if (parsed?.name === "MinterStatusChanged" && parsed.args.status === true) {
            eventCount++;
          }
        } catch {
          // ignore
        }
      }
      expect(eventCount).to.equal(2);
    });

    it("should revert when non-owner tries to add a minter", async () => {
      const minter = accounts[2];
      const minterAddress = await minter.getAddress();
      const nonOwner = accounts[1];

      await expect(token.connect(nonOwner).addMinter(minterAddress)).to.be.revertedWithCustomError(
        token,
        "OwnableUnauthorizedAccount",
      );
    });

    it("should revert when non-owner tries to add minters list", async () => {
      const minter = accounts[2];
      const minter2 = accounts[3];
      const minterAddress = await minter.getAddress();
      const minter2Address = await minter2.getAddress();
      const nonOwner = accounts[1];

      await expect(token.connect(nonOwner).addMinters([minterAddress, minter2Address])).to.be.revertedWithCustomError(
        token,
        "OwnableUnauthorizedAccount",
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Remove minter tests
  // ---------------------------------------------------------------------------
  describe("Remove minter", () => {
    it("should remove a minter and emit event", async () => {
      const minter = accounts[2];
      const minterAddress = await minter.getAddress();

      await token.connect(tokenOwner).addMinter(minterAddress);
      expect(await token.isMinter(minterAddress)).to.be.true;

      const tx = await token.connect(tokenOwner).removeMinter(minterAddress);
      const receipt = await tx.wait();

      // Check event
      let removedMinter: string | undefined;
      let status: boolean | undefined;
      for (const log of receipt?.logs ?? []) {
        try {
          const parsed = token.interface.parseLog(log);
          if (parsed?.name === "MinterStatusChanged") {
            status = parsed.args.status as boolean;
            removedMinter = parsed.args.minter as string;
            break;
          }
        } catch {
          // ignore
        }
      }

      expect(status).to.be.false;
      expect(removedMinter).to.equal(minterAddress);
      expect(await token.isMinter(minterAddress)).to.be.false;
    });

    it("should revert when non-owner tries to remove a minter", async () => {
      const minter = accounts[2];
      const minterAddress = await minter.getAddress();
      const nonOwner = accounts[1];

      await token.connect(tokenOwner).addMinter(minterAddress);
      expect(await token.isMinter(minterAddress)).to.be.true;

      await expect(token.connect(nonOwner).removeMinter(minterAddress)).to.be.revertedWithCustomError(
        token,
        "OwnableUnauthorizedAccount",
      );

      // Minter should still be active
      expect(await token.isMinter(minterAddress)).to.be.true;
    });
  });

  // ---------------------------------------------------------------------------
  // isMinter tests
  // ---------------------------------------------------------------------------
  describe("isMinter", () => {
    it("should return false for non-minter address", async () => {
      const nonMinter = accounts[5];
      const nonMinterAddress = await nonMinter.getAddress();

      expect(await token.isMinter(nonMinterAddress)).to.be.false;
    });

    it("should return true after adding minter", async () => {
      const minter = accounts[2];
      const minterAddress = await minter.getAddress();

      expect(await token.isMinter(minterAddress)).to.be.false;
      await token.connect(tokenOwner).addMinter(minterAddress);
      expect(await token.isMinter(minterAddress)).to.be.true;
    });

    it("should return false after removing minter", async () => {
      const minter = accounts[2];
      const minterAddress = await minter.getAddress();

      await token.connect(tokenOwner).addMinter(minterAddress);
      expect(await token.isMinter(minterAddress)).to.be.true;

      await token.connect(tokenOwner).removeMinter(minterAddress);
      expect(await token.isMinter(minterAddress)).to.be.false;
    });
  });
});