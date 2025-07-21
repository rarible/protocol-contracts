import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  WLCollectionRegistry,
  WLCollectionRegistry__factory
} from "../typechain-types";
import "@nomicfoundation/hardhat-chai-matchers";

describe("WLCollectionRegistry", function () {
  let registry: WLCollectionRegistry;
  let owner: SignerWithAddress;
  let admin: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let collection1: SignerWithAddress;
  let collection2: SignerWithAddress;

  const DEFAULT_ADMIN_ROLE = ethers.constants.HashZero;
  const WL_ADMIN_ROLE = ethers.utils.id("WL_ADMIN_ROLE");
  const CHAIN_ID_1 = 1;
  const CHAIN_ID_137 = 137;

  beforeEach(async function () {
    [owner, admin, user1, user2, collection1, collection2] = await ethers.getSigners();

    // Deploy registry
    const WLCollectionRegistryFactory = new WLCollectionRegistry__factory(owner);
    registry = await WLCollectionRegistryFactory.deploy(owner.address);
    await registry.deployed();

    // Setup roles
    await registry.grantRole(WL_ADMIN_ROLE, admin.address);
  });

  describe("Deployment & Initialization", () => {
    it("should set correct initial values", async () => {
      expect(await registry.owner()).to.equal(owner.address);
      expect(await registry.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await registry.hasRole(WL_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("should revert deployment with zero address owner", async () => {
      const WLCollectionRegistryFactory = new WLCollectionRegistry__factory(owner);
      await expect(
        WLCollectionRegistryFactory.deploy(ethers.constants.AddressZero)
      ).to.be.revertedWith("Invalid owner");
    });
  });

  describe("Add to Whitelist", () => {
    it("should allow WL_ADMIN to add collection", async () => {
      await expect(registry.connect(admin).addToWL(collection1.address, user1.address, CHAIN_ID_1))
        .to.emit(registry, "CollectionAdded")
        .withArgs(collection1.address, user1.address, CHAIN_ID_1);

      const [creator, chainId] = await registry.getCollection(collection1.address);
      expect(creator).to.equal(user1.address);
      expect(chainId).to.equal(CHAIN_ID_1);
    });

    it("should revert when non-admin tries to add collection", async () => {
      await expect(
        registry.connect(user1).addToWL(collection1.address, user1.address, CHAIN_ID_1)
      ).to.be.reverted;
    });

    it("should revert when adding zero address collection", async () => {
      await expect(
        registry.connect(admin).addToWL(ethers.constants.AddressZero, user1.address, CHAIN_ID_1)
      ).to.be.revertedWith("Invalid collection address");
    });

    it("should revert when collection already whitelisted", async () => {
      await registry.connect(admin).addToWL(collection1.address, user1.address, CHAIN_ID_1);
      await expect(
        registry.connect(admin).addToWL(collection1.address, user2.address, CHAIN_ID_137)
      ).to.be.revertedWith("Collection already whitelisted");
    });

    it("should revert when chainId is zero", async () => {
      await expect(
        registry.connect(admin).addToWL(collection1.address, user1.address, 0)
      ).to.be.revertedWith("Invalid chainId");
    });
  });

  describe("Remove from Whitelist", () => {
    beforeEach(async () => {
      await registry.connect(admin).addToWL(collection1.address, user1.address, CHAIN_ID_1);
    });

    it("should allow WL_ADMIN to remove collection", async () => {
      await expect(registry.connect(admin).removeFromWL(collection1.address))
        .to.emit(registry, "CollectionRemoved")
        .withArgs(collection1.address, user1.address, CHAIN_ID_1);

      const [creator, chainId] = await registry.getCollection(collection1.address);
      expect(creator).to.equal(ethers.constants.AddressZero);
      expect(chainId).to.equal(0);
    });

    it("should revert when non-admin tries to remove collection", async () => {
      await expect(
        registry.connect(user1).removeFromWL(collection1.address)
      ).to.be.reverted;
    });

    it("should revert when collection not whitelisted", async () => {
      await expect(
        registry.connect(admin).removeFromWL(collection2.address)
      ).to.be.revertedWith("Collection not whitelisted");
    });
  });

  describe("View Functions", () => {
    it("should return correct collection info", async () => {
      await registry.connect(admin).addToWL(collection1.address, user1.address, CHAIN_ID_1);
      const [creator, chainId] = await registry.getCollection(collection1.address);
      expect(creator).to.equal(user1.address);
      expect(chainId).to.equal(CHAIN_ID_1);
    });

    it("should return zero values for non-existent collection", async () => {
      const [creator, chainId] = await registry.getCollection(collection2.address);
      expect(creator).to.equal(ethers.constants.AddressZero);
      expect(chainId).to.equal(0);
    });
  });

  describe("Access Control", () => {
    it("should allow owner to grant WL_ADMIN role", async () => {
      await registry.connect(owner).grantRole(WL_ADMIN_ROLE, user1.address);
      expect(await registry.hasRole(WL_ADMIN_ROLE, user1.address)).to.be.true;
    });

    it("should allow owner to revoke WL_ADMIN role", async () => {
      await registry.connect(owner).revokeRole(WL_ADMIN_ROLE, admin.address);
      expect(await registry.hasRole(WL_ADMIN_ROLE, admin.address)).to.be.false;
    });

    it("should revert when non-owner tries to grant roles", async () => {
      await expect(
        registry.connect(user1).grantRole(WL_ADMIN_ROLE, user2.address)
      ).to.be.reverted;
    });
  });
});