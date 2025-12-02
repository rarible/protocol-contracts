// <ai_context> TypeScript port of ExchangeV2.simple.test.js. Tests ExchangeSimpleV2 functionality including order matching for ETH and ERC20 tokens, order cancellation, upgrades, validation (taker, signatures, dates), and asset matcher verification. </ai_context>
import { expect } from "chai";
import { network } from "hardhat";
import type * as ethersTypes from "ethers";

const connection = await network.connect();
const { ethers } = connection;

import {
  type ExchangeSimpleV2,
  type ExchangeSimpleV2_1,
  ExchangeSimpleV2_1__factory,
  type TestERC20,
  TestERC20__factory,
  type TransferProxyTest,
  TransferProxyTest__factory,
  type ERC20TransferProxyTest,
  ERC20TransferProxyTest__factory,
  type LibOrderTest,
  LibOrderTest__factory,
  type ProxyAdmin,
} from "../types/ethers-contracts";
import { deployTransparentProxy } from "@rarible/common-sdk/src/deploy";
import { Order, Asset, sign, type OrderStruct } from "@rarible/common-sdk/src/order";
import { ETH, ERC20, enc } from "@rarible/common-sdk/src/assets";
import { verifyBalanceChangeReturnTx } from "@rarible/common-sdk/src/balance";

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const ZERO = "0x0000000000000000000000000000000000000000";

// -----------------------------------------------------------------------------
// Main Test Suite
// -----------------------------------------------------------------------------
describe("ExchangeSimpleV2", function () {
  let testing: ExchangeSimpleV2;
  let transferProxy: TransferProxyTest;
  let erc20TransferProxy: ERC20TransferProxyTest;
  let t1: TestERC20;
  let t2: TestERC20;
  let libOrder: LibOrderTest;
  let accounts: ethersTypes.Signer[];
  let deployer: ethersTypes.Signer;
  let proxyAdmin: ProxyAdmin;

  before(async () => {
    accounts = await ethers.getSigners();
    [deployer] = accounts;

    // Deploy LibOrderTest
    libOrder = await new LibOrderTest__factory(deployer).deploy();
    await libOrder.waitForDeployment();

    // Deploy TransferProxyTest
    transferProxy = await new TransferProxyTest__factory(deployer).deploy();
    await transferProxy.waitForDeployment();

    // Deploy ERC20TransferProxyTest
    erc20TransferProxy = await new ERC20TransferProxyTest__factory(deployer).deploy();
    await erc20TransferProxy.waitForDeployment();

    // Deploy ExchangeSimpleV2 via transparent proxy
    const { instance, proxyAdmin: admin } = await deployTransparentProxy<ExchangeSimpleV2>(ethers, {
      contractName: "ExchangeSimpleV2",
      initFunction: "__ExchangeSimpleV2_init",
      initArgs: [await transferProxy.getAddress(), await erc20TransferProxy.getAddress(), await deployer.getAddress()],
      proxyOwner: await deployer.getAddress(),
    });
    testing = instance;
    proxyAdmin = admin;
  });

  beforeEach(async () => {
    // Deploy fresh test tokens for each test
    t1 = await new TestERC20__factory(deployer).deploy();
    await t1.waitForDeployment();

    t2 = await new TestERC20__factory(deployer).deploy();
    await t2.waitForDeployment();
  });

  // ---------------------------------------------------------------------------
  // Helper functions
  // ---------------------------------------------------------------------------
  async function getSignature(order: OrderStruct, signer: ethersTypes.Signer): Promise<string> {
    return sign(signer, order, await testing.getAddress());
  }

  async function prepare2Orders(t1Amount = 100n, t2Amount = 200n) {
    const account1Address = await accounts[1].getAddress();
    const account2Address = await accounts[2].getAddress();
    const erc20TransferProxyAddress = await erc20TransferProxy.getAddress();
    const t1Address = await t1.getAddress();
    const t2Address = await t2.getAddress();

    await t1.mintTo(account1Address, t1Amount);
    await t2.mintTo(account2Address, t2Amount);
    await t1.connect(accounts[1]).approve(erc20TransferProxyAddress, 10000000n);
    await t2.connect(accounts[2]).approve(erc20TransferProxyAddress, 10000000n);

    const left = Order(
      account1Address,
      Asset(ERC20, enc(t1Address), 100n),
      ZERO,
      Asset(ERC20, enc(t2Address), 200n),
      1n,
      0n,
      0n,
      "0xffffffff",
      "0x",
    );
    const right = Order(
      account2Address,
      Asset(ERC20, enc(t2Address), 200n),
      ZERO,
      Asset(ERC20, enc(t1Address), 100n),
      1n,
      0n,
      0n,
      "0xffffffff",
      "0x",
    );
    return { left, right };
  }

  // ---------------------------------------------------------------------------
  // Upgrade tests
  // ---------------------------------------------------------------------------
  describe("Upgrade", () => {
    it("upgrade works", async () => {
      const proxyAddress = await testing.getAddress();

      // Try to call getSomething before upgrade - should fail
      const wrapperBefore = ExchangeSimpleV2_1__factory.connect(proxyAddress, deployer);
      await expect(wrapperBefore.getSomething()).to.be.revertedWith("Error: Not implemented");

      // Deploy new implementation
      const newImpl = await new ExchangeSimpleV2_1__factory(deployer).deploy();
      await newImpl.waitForDeployment();

      // Upgrade proxy to new implementation
      await proxyAdmin.upgradeAndCall(proxyAddress, await newImpl.getAddress(), "0x");

      // Now getSomething should work
      const wrapperAfter = ExchangeSimpleV2_1__factory.connect(proxyAddress, deployer);
      expect(await wrapperAfter.getSomething()).to.equal(10n);
    });
  });

  // ---------------------------------------------------------------------------
  // matchOrders tests
  // ---------------------------------------------------------------------------
  describe("matchOrders", () => {
    it("eth orders work, rest is returned to taker", async () => {
      const account1Address = await accounts[1].getAddress();
      const account2Address = await accounts[2].getAddress();
      const erc20TransferProxyAddress = await erc20TransferProxy.getAddress();
      const t1Address = await t1.getAddress();

      await t1.mintTo(account1Address, 100n);
      await t1.connect(accounts[1]).approve(erc20TransferProxyAddress, 10000000n);

      const left = Order(
        account1Address,
        Asset(ERC20, enc(t1Address), 100n),
        ZERO,
        Asset(ETH, "0x", 200n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      
      const right = Order(
        account2Address,
        Asset(ETH, "0x", 200n),
        ZERO,
        Asset(ERC20, enc(t1Address), 100n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      const signature = await getSignature(left, accounts[1]);

      // Should fail with insufficient ETH
      await expect(
        testing.connect(accounts[2]).matchOrders(left, signature, right, "0x", { value: 199n }),
      ).to.be.revertedWith("transfer failed");

      // Should succeed with correct ETH amount
      const provider = accounts[2].provider;
      await verifyBalanceChangeReturnTx(provider, account2Address, 200n, async () =>
        verifyBalanceChangeReturnTx(provider, account1Address, -200n, () =>
          testing.connect(accounts[2]).matchOrders(left, signature, right, "0x", { value: 200n }),
        ),
      );

      expect(await t1.balanceOf(account1Address)).to.equal(0n);
      expect(await t1.balanceOf(account2Address)).to.equal(100n);
    });

    it("eth orders work, rest is returned to taker (other side)", async () => {
      const account1Address = await accounts[1].getAddress();
      const account2Address = await accounts[2].getAddress();
      const erc20TransferProxyAddress = await erc20TransferProxy.getAddress();
      const t1Address = await t1.getAddress();

      await t1.mintTo(account1Address, 100n);
      await t1.connect(accounts[1]).approve(erc20TransferProxyAddress, 10000000n);

      const right = Order(
        account1Address,
        Asset(ERC20, enc(t1Address), 100n),
        ZERO,
        Asset(ETH, "0x", 200n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      const left = Order(
        account2Address,
        Asset(ETH, "0x", 200n),
        ZERO,
        Asset(ERC20, enc(t1Address), 100n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      const signature = await getSignature(right, accounts[1]);

      // Should fail with insufficient ETH
      // check why not "'not enough eth'"
      await expect(
        testing.connect(accounts[2]).matchOrders(left, "0x", right, signature, { value: 199n }),
      ).to.be.revertedWith("transfer failed");

      // Should succeed with correct ETH amount
      const provider = accounts[2].provider;
      await verifyBalanceChangeReturnTx(provider, account2Address, 200n, async () =>
        verifyBalanceChangeReturnTx(provider, account1Address, -200n, () =>
          testing.connect(accounts[2]).matchOrders(left, "0x", right, signature, { value: 200n }),
        ),
      );

      expect(await t1.balanceOf(account1Address)).to.equal(0n);
      expect(await t1.balanceOf(account2Address)).to.equal(100n);
    });

    it("only owner can change transfer proxy", async () => {
      const account1Address = await accounts[1].getAddress();
      const account2Address = await accounts[2].getAddress();

      await expect(
        testing.connect(accounts[1]).setTransferProxy("0x00112233", account2Address),
      ).to.be.revertedWithCustomError(testing, "OwnableUnauthorizedAccount");

      // Owner (deployer) should be able to set transfer proxy
      await testing.connect(deployer).setTransferProxy("0x00112233", account2Address);
    });

    it("simplest possible exchange works", async () => {
      const { left, right } = await prepare2Orders();
      const account1Address = await accounts[1].getAddress();
      const account2Address = await accounts[2].getAddress();

      await testing.matchOrders(
        left,
        await getSignature(left, accounts[1]),
        right,
        await getSignature(right, accounts[2]),
      );

      expect(await testing.fills(await libOrder.hashKey(left))).to.equal(200n);
      expect(await testing.fills(await libOrder.hashKey(right))).to.equal(100n);

      expect(await t1.balanceOf(account1Address)).to.equal(0n);
      expect(await t1.balanceOf(account2Address)).to.equal(100n);
      expect(await t2.balanceOf(account1Address)).to.equal(200n);
      expect(await t2.balanceOf(account2Address)).to.equal(0n);
    });

    it("cancel", async () => {
      const { left, right } = await prepare2Orders();

      // Non-maker should not be able to cancel
      await expect(testing.connect(accounts[2]).cancel(left)).to.be.revertedWith("not a maker");

      // Maker should be able to cancel
      await testing.connect(accounts[1]).cancel(left);

      // Matching canceled order should fail
      await expect(
        testing.matchOrders(left, await getSignature(left, accounts[1]), right, await getSignature(right, accounts[2])),
      ).to.be.revertedWith("nothing to fill");
    });

    it("order with salt 0 can't be canceled", async () => {
      const { left } = await prepare2Orders();
      left.salt = 0n;

      await expect(testing.connect(accounts[1]).cancel(left)).to.be.revertedWith("0 salt can't be used");
    });

    it("doesn't allow to fill more than 100% of the order", async () => {
      const { left, right } = await prepare2Orders();
      const account1Address = await accounts[1].getAddress();
      const account2Address = await accounts[2].getAddress();

      right.makeAsset.value = 100n;
      right.takeAsset.value = 50n;
      right.salt = 0n;

      const signature = await getSignature(left, accounts[1]);

      // First fill: 50%
      await testing.connect(accounts[2]).matchOrders(left, signature, right, "0x");
      // Second fill: 100%
      await testing.connect(accounts[2]).matchOrders(left, signature, right, "0x");

      // Third fill should fail (already 100% filled)
      await expect(testing.connect(accounts[2]).matchOrders(left, signature, right, "0x")).to.be.revertedWith(
        "nothing to fill",
      );

      expect(await t1.balanceOf(account1Address)).to.equal(0n);
      expect(await t1.balanceOf(account2Address)).to.equal(100n);
      expect(await t2.balanceOf(account1Address)).to.equal(200n);
      expect(await t2.balanceOf(account2Address)).to.equal(0n);
    });
  });

  // ---------------------------------------------------------------------------
  // validate tests
  // ---------------------------------------------------------------------------
  describe("validate", () => {
    it("should not let proceed if taker is not correct", async () => {
      const { left, right } = await prepare2Orders();
      const account3Address = await accounts[3].getAddress();
      left.taker = account3Address;

      const leftSig = await getSignature(left, accounts[1]);
      const rightSig = await getSignature(right, accounts[2]);

      await expect(testing.matchOrders(left, leftSig, right, rightSig)).to.be.revertedWith(
        "leftOrder.taker verification failed",
      );

      await expect(testing.matchOrders(right, rightSig, left, leftSig)).to.be.revertedWith(
        "rightOrder.taker verification failed",
      );
    });

    it("should not let proceed if one of the signatures is incorrect", async () => {
      const { left, right } = await prepare2Orders();

      // Wrong signature for left order
      await expect(
        testing.matchOrders(left, await getSignature(left, accounts[2]), right, await getSignature(right, accounts[2])),
      ).to.be.revertedWith("order signature verification error");

      // Wrong signature for right order
      await expect(
        testing.matchOrders(right, await getSignature(right, accounts[2]), left, await getSignature(left, accounts[2])),
      ).to.be.revertedWith("order signature verification error");
    });

    it("should not let proceed if order dates are wrong", async () => {
      const now = Math.floor(Date.now() / 1000);

      const { left, right } = await prepare2Orders();
      left.start = BigInt(now + 1000);

      await expect(
        testing.matchOrders(left, await getSignature(left, accounts[1]), right, await getSignature(right, accounts[2])),
      ).to.be.revertedWith("Order start validation failed");
    });
  });

  // ---------------------------------------------------------------------------
  // asset matcher tests
  // ---------------------------------------------------------------------------
  describe("asset matcher", () => {
    it("should throw if assets do not match", async () => {
      const { left, right } = await prepare2Orders();
      const account1Address = await accounts[1].getAddress();
      left.takeAsset.assetType.data = enc(account1Address);

      const leftSig = await getSignature(left, accounts[1]);
      const rightSig = await getSignature(right, accounts[2]);

      await expect(testing.matchOrders(left, leftSig, right, rightSig)).to.be.revertedWith("assets don't match");
    });
  });
});
