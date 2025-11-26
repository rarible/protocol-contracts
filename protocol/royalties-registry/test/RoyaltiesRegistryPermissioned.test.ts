import { expect } from "chai";
import { network } from "hardhat";
// import { ethers } from "hardhat";
// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  RoyaltiesRegistryPermissioned,
  RoyaltiesRegistryPermissioned__factory,
  TestERC721WithRoyaltiesV1OwnableUpgradeable,
  TestERC721WithRoyaltiesV1OwnableUpgradeable__factory,
  TestERC721WithRoyaltiesV2OwnableUpgradeable,
  TestERC721WithRoyaltiesV2OwnableUpgradeable__factory,
  RoyaltiesProviderTest,
  RoyaltiesProviderTest__factory,
  TestERC721WithRoyaltyV2981,
  TestERC721WithRoyaltyV2981__factory,
  TestERC721RoyaltiesV2,
  TestERC721RoyaltiesV2__factory,
} from "../types/ethers-contracts";
// import { LibPart } from "../types/ethers-contracts/contracts/RoyaltiesRegistryPermissioned";
// import { upgrades } from "hardhat";
const connection = await network.connect();
const { ethers } = connection;
/**
<ai_context>
This test verifies behavior of the permissioned royalties registry.
Change log:
2025-10-08: Fix deployment of upgradeable ERC721 mocks (no constructor args).
These mocks are Initializable and must be deployed without params, then initialized.
2025-11-25: Updated for hardhat v3 / ethers v6 compatibility (no hardhat-upgrades).
</ai_context>
*/
describe("RoyaltiesRegistryPermissioned", function () {
  let registry: RoyaltiesRegistryPermissioned;
  let owner: any; // SignerWithAddress;
  let whitelister: any; // SignerWithAddress;
  let user: any; // SignerWithAddress;
  let erc721V1: TestERC721WithRoyaltiesV1OwnableUpgradeable;
  let erc721V2: TestERC721WithRoyaltiesV2OwnableUpgradeable;
  let erc721V2981: TestERC721WithRoyaltyV2981;
  let erc721V2Legacy: TestERC721RoyaltiesV2;
  let royaltiesProvider: RoyaltiesProviderTest;
  const tokenId = 1n;
  const royalties = [
    { account: "0x0000000000000000000000000000000000000001", value: 1000n },
    { account: "0x0000000000000000000000000000000000000002", value: 500n },
  ];
  beforeEach(async function () {
    [owner, whitelister, user] = await ethers.getSigners();
    // Manual deployment instead of upgrades.deployProxy
    const RoyaltiesRegistryPermissionedFactory = new RoyaltiesRegistryPermissioned__factory(owner);
    registry = await RoyaltiesRegistryPermissionedFactory.deploy();
    await registry.waitForDeployment();
    await registry.__RoyaltiesRegistry_init(owner.address);
    await registry.connect(owner).grantRole(await registry.WHITELISTER_ROLE(), whitelister.address);
    // --- Deploy upgradeable ERC721 mocks WITHOUT constructor args ---
    const TestERC721V1Factory = new TestERC721WithRoyaltiesV1OwnableUpgradeable__factory(owner);
    erc721V1 = await TestERC721V1Factory.deploy();
    await erc721V1.waitForDeployment();
    await erc721V1.connect(owner).initialize();
    const TestERC721V2Factory = new TestERC721WithRoyaltiesV2OwnableUpgradeable__factory(owner);
    erc721V2 = await TestERC721V2Factory.deploy();
    await erc721V2.waitForDeployment();
    await erc721V2.connect(owner).initialize();
    const TestERC721V2981Factory = new TestERC721WithRoyaltyV2981__factory(owner);
    erc721V2981 = await TestERC721V2981Factory.deploy();
    await erc721V2981.waitForDeployment();
    await erc721V2981.connect(owner).initialize();
    // --- Legacy/non-upgradeable mock keeps constructor args (has its own constructor) ---
    const TestERC721V2LegacyFactory = new TestERC721RoyaltiesV2__factory(owner);
    erc721V2Legacy = await TestERC721V2LegacyFactory.deploy();
    await erc721V2Legacy.waitForDeployment();
    await erc721V2Legacy.connect(owner).initialize();
    const RoyaltiesProviderTestFactory = new RoyaltiesProviderTest__factory(owner);
    royaltiesProvider = await RoyaltiesProviderTestFactory.deploy();
    await royaltiesProvider.waitForDeployment();
  });
  describe("Initialization and Roles", function () {
    it("should initialize correctly", async function () {
      expect(await registry.owner()).to.equal(owner.address);
      expect(await registry.hasRole(await registry.WHITELISTER_ROLE(), whitelister.address)).to.be.true;
    });
  });
  describe("setRoyaltiesAllowed", function () {
    it("should allow whitelister to set royaltiesAllowed", async function () {
      const tx = await registry.connect(whitelister).setRoyaltiesAllowed(await erc721V1.getAddress(), true);
      await expect(tx)
        .to.emit(registry, "RoyaltiesAllowedChanged")
        .withArgs(await erc721V1.getAddress(), true);
      expect(await registry.royaltiesAllowed(await erc721V1.getAddress())).to.be.true;
    });
    it("should revert if non-whitelister tries to set royaltiesAllowed", async function () {
      await expect(registry.connect(user).setRoyaltiesAllowed(await erc721V1.getAddress(), true)).to.be.revertedWith(
        "not whitelister",
      );
    });
  });
  describe("getRoyalties", function () {
    beforeEach(async function () {
      // Mint tokens and set royalties where applicable
      await erc721V1.connect(owner).mint(user.address, tokenId, royalties);
      await erc721V2.connect(owner).mint(user.address, tokenId, royalties);
      await erc721V2981.connect(owner).mint(user.address, tokenId);
      await erc721V2Legacy.connect(owner).mint(user.address, tokenId, royalties);
      // Set external provider
      await royaltiesProvider.connect(owner).initializeProvider(await erc721V1.getAddress(), tokenId, royalties);
      await registry
        .connect(owner)
        .setProviderByToken(await erc721V1.getAddress(), await royaltiesProvider.getAddress());
    });
    it("should return empty royalties if not allowed", async function () {
      const result = await registry.getRoyalties.staticCall(await erc721V1.getAddress(), tokenId);
      expect(result.length).to.equal(0);
    });
    it("should return royalties for V1 if allowed", async function () {
      await registry.connect(whitelister).setRoyaltiesAllowed(await erc721V1.getAddress(), true);
      const result = await registry.getRoyalties.staticCall(await erc721V1.getAddress(), tokenId);
      expect(result.length).to.equal(royalties.length);
      expect(result[0].account).to.equal(royalties[0].account);
      expect(result[0].value).to.equal(royalties[0].value);
      expect(result[1].account).to.equal(royalties[1].account);
      expect(result[1].value).to.equal(royalties[1].value);
    });
    it("should return royalties for V2 if allowed", async function () {
      await registry.connect(whitelister).setRoyaltiesAllowed(await erc721V2.getAddress(), true);
      const result = await registry.getRoyalties.staticCall(await erc721V2.getAddress(), tokenId);
      expect(result.length).to.equal(royalties.length);
    });
    it("should return royalties for 2981 if allowed", async function () {
      await registry.connect(whitelister).setRoyaltiesAllowed(await erc721V2981.getAddress(), true);
      const result = await registry.getRoyalties.staticCall(await erc721V2981.getAddress(), tokenId);
      expect(result.length).to.equal(1); // Default 10% royalty
    });
    it("should return royalties for external provider if allowed", async function () {
      await registry.connect(whitelister).setRoyaltiesAllowed(await erc721V1.getAddress(), true);
      const result = await registry.getRoyalties.staticCall(await erc721V1.getAddress(), tokenId);
      expect(result.length).to.equal(royalties.length);
    });
    it("should return royalties for V2 Legacy if allowed", async function () {
      await registry.connect(whitelister).setRoyaltiesAllowed(await erc721V2Legacy.getAddress(), true);
      const result = await registry.getRoyalties.staticCall(await erc721V2Legacy.getAddress(), tokenId);
      expect(result.length).to.equal(royalties.length);
    });
  });
});
