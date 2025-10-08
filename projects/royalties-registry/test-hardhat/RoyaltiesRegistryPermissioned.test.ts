import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { RoyaltiesRegistryPermissioned, TestERC721WithRoyaltiesV1OwnableUpgradeable, TestERC721WithRoyaltiesV2OwnableUpgradeable, RoyaltiesProviderTest, TestERC721WithRoyaltyV2981, TestERC721RoyaltiesV2 } from "../typechain-types";
import { LibPart } from "../typechain-types/contracts/RoyaltiesRegistryPermissioned";

describe("RoyaltiesRegistryPermissioned", function () {
  let registry: RoyaltiesRegistryPermissioned;
  let owner: SignerWithAddress;
  let whitelister: SignerWithAddress;
  let user: SignerWithAddress;
  let erc721V1: TestERC721WithRoyaltiesV1OwnableUpgradeable;
  let erc721V2: TestERC721WithRoyaltiesV2OwnableUpgradeable;
  let erc721V2981: TestERC721WithRoyaltyV2981;
  let erc721V2Legacy: TestERC721RoyaltiesV2;
  let royaltiesProvider: RoyaltiesProviderTest;
  const tokenId = 1;
  const royalties: LibPart.PartStruct[] = [
    { account: "0x0000000000000000000000000000000000000001", value: 1000 },
    { account: "0x0000000000000000000000000000000000000002", value: 500 },
  ];

  beforeEach(async function () {
    [owner, whitelister, user] = await ethers.getSigners();
    const RoyaltiesRegistryPermissionedFactory = await ethers.getContractFactory("RoyaltiesRegistryPermissioned");
    registry = await RoyaltiesRegistryPermissionedFactory.deploy() as RoyaltiesRegistryPermissioned;
    await registry.connect(owner).__RoyaltiesRegistry_init();

    await registry.connect(owner).grantRole(await registry.WHITELISTER_ROLE(), whitelister.address);

    const TestERC721V1Factory = await ethers.getContractFactory("TestERC721WithRoyaltiesV1OwnableUpgradeable");
    erc721V1 = await TestERC721V1Factory.deploy("Rarible", "RARI", "https://ipfs.rarible.com") as TestERC721WithRoyaltiesV1OwnableUpgradeable;
    await erc721V1.connect(owner).__Ownable_init();
    await erc721V1.connect(owner).initialize();

    const TestERC721V2Factory = await ethers.getContractFactory("TestERC721WithRoyaltiesV2OwnableUpgradeable");
    erc721V2 = await TestERC721V2Factory.deploy("Rarible", "RARI", "https://ipfs.rarible.com") as TestERC721WithRoyaltiesV2OwnableUpgradeable;
    await erc721V2.connect(owner).__Ownable_init();
    await erc721V2.connect(owner).initialize();

    const TestERC721V2981Factory = await ethers.getContractFactory("TestERC721WithRoyaltyV2981");
    erc721V2981 = await TestERC721V2981Factory.deploy("Rarible", "RARI", "https://ipfs.rarible.com") as TestERC721WithRoyaltyV2981;
    await erc721V2981.connect(owner).__Ownable_init();
    await erc721V2981.connect(owner).initialize();

    const TestERC721V2LegacyFactory = await ethers.getContractFactory("TestERC721RoyaltiesV2");
    erc721V2Legacy = await TestERC721V2LegacyFactory.deploy("Rarible", "RARI", "https://ipfs.rarible.com") as TestERC721RoyaltiesV2;

    const RoyaltiesProviderTestFactory = await ethers.getContractFactory("RoyaltiesProviderTest");
    royaltiesProvider = await RoyaltiesProviderTestFactory.deploy() as RoyaltiesProviderTest;
  });

  describe("Initialization and Roles", function () {
    it("should initialize correctly", async function () {
      expect(await registry.owner()).to.equal(owner.address);
      expect(await registry.hasRole(await registry.WHITELISTER_ROLE(), whitelister.address)).to.be.true;
    });
  });

  describe("setRoyaltiesAllowed", function () {
    it("should allow whitelister to set royaltiesAllowed", async function () {
      const tx = await registry.connect(whitelister).setRoyaltiesAllowed(erc721V1.address, true);
      await expect(tx).to.emit(registry, "RoyaltiesAllowedChanged").withArgs(erc721V1.address, true);
      expect(await registry.royaltiesAllowed(erc721V1.address)).to.be.true;
    });

    it("should revert if non-whitelister tries to set royaltiesAllowed", async function () {
      await expect(registry.connect(user).setRoyaltiesAllowed(erc721V1.address, true)).to.be.revertedWith("not whitelister");
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
      await royaltiesProvider.connect(owner).initializeProvider(erc721V1.address, tokenId, royalties);
      await registry.connect(owner).setProviderByToken(erc721V1.address, royaltiesProvider.address);
    });

    it("should return empty royalties if not allowed", async function () {
      const result = await registry.getRoyalties(erc721V1.address, tokenId);
      expect(result.length).to.equal(0);
    });

    it("should return royalties for V1 if allowed", async function () {
      await registry.connect(whitelister).setRoyaltiesAllowed(erc721V1.address, true);
      const result = await registry.getRoyalties(erc721V1.address, tokenId);
      expect(result.length).to.equal(royalties.length);
      expect(result[0].account).to.equal(royalties[0].account);
      expect(result[0].value).to.equal(royalties[0].value);
      expect(result[1].account).to.equal(royalties[1].account);
      expect(result[1].value).to.equal(royalties[1].value);
    });

    it("should return royalties for V2 if allowed", async function () {
      await registry.connect(whitelister).setRoyaltiesAllowed(erc721V2.address, true);
      const result = await registry.getRoyalties(erc721V2.address, tokenId);
      expect(result.length).to.equal(royalties.length);
    });

    it("should return royalties for 2981 if allowed", async function () {
      await registry.connect(whitelister).setRoyaltiesAllowed(erc721V2981.address, true);
      const result = await registry.getRoyalties(erc721V2981.address, tokenId);
      expect(result.length).to.equal(1); // Default 10% royalty
    });

    it("should return royalties for external provider if allowed", async function () {
      await registry.connect(whitelister).setRoyaltiesAllowed(erc721V1.address, true);
      const result = await registry.getRoyalties(erc721V1.address, tokenId);
      expect(result.length).to.equal(royalties.length);
    });

    it("should return royalties for V2 Legacy if allowed", async function () {
      await registry.connect(whitelister).setRoyaltiesAllowed(erc721V2Legacy.address, true);
      const result = await registry.getRoyalties(erc721V2Legacy.address, tokenId);
      expect(result.length).to.equal(royalties.length);
    });
  });
});