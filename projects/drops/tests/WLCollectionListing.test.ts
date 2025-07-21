import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  WLCollectionListing,
  WLCollectionListing__factory,
  WLCollectionRegistry,
  WLCollectionRegistry__factory,
  TestERC20,
  TestERC20__factory
} from "../typechain-types";
import "@nomicfoundation/hardhat-chai-matchers";

describe("WLCollectionListing", function () {
  let listing: WLCollectionListing;
  let registry: WLCollectionRegistry;
  let listingToken: TestERC20;
  let otherToken: TestERC20;
  let owner: SignerWithAddress;
  let admin: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let collection1: SignerWithAddress;
  let collection2: SignerWithAddress;
  let recipient: SignerWithAddress;
  let treasury: SignerWithAddress;

  const DEFAULT_ADMIN_ROLE = ethers.constants.HashZero;
  const WL_ADMIN_ROLE = ethers.utils.id("WL_ADMIN_ROLE");
  const CHAIN_ID_1 = 1;
  const CHAIN_ID_137 = 137;

  beforeEach(async function () {
    [owner, admin, user1, user2, collection1, collection2, recipient, treasury] = await ethers.getSigners();

    // Deploy test ERC20 tokens
    const TestERC20Factory = new TestERC20__factory(owner);
    listingToken = await TestERC20Factory.deploy("Listing Token", "LST", ethers.utils.parseEther("1000"), owner.address);
    await listingToken.deployed();
    otherToken = await TestERC20Factory.deploy("Other Token", "OTHER", ethers.utils.parseEther("1000"), owner.address);
    await otherToken.deployed();

    // Deploy registry
    const WLCollectionRegistryFactory = new WLCollectionRegistry__factory(owner);
    registry = await WLCollectionRegistryFactory.deploy(owner.address);
    await registry.deployed();

    // Deploy listing
    const WLCollectionListingFactory = new WLCollectionListing__factory(owner);
    listing = await WLCollectionListingFactory.deploy(owner.address, treasury.address);
    await listing.deployed();

    // Set registry in listing
    await listing.setWLCollectionRegistry(registry.address);

    // Grant WL_ADMIN_ROLE to listing in registry
    await registry.grantRole(WL_ADMIN_ROLE, listing.address);

    // Setup roles in listing
    await listing.grantRole(WL_ADMIN_ROLE, admin.address);

    // Mint tokens to users
    await listingToken.mint(user1.address, ethers.utils.parseEther("100"));
    await listingToken.mint(user2.address, ethers.utils.parseEther("100"));
    await otherToken.mint(user1.address, ethers.utils.parseEther("50"));

    // Approve listing to spend tokens
    await listingToken.connect(user1).approve(listing.address, ethers.constants.MaxUint256);
    await listingToken.connect(user2).approve(listing.address, ethers.constants.MaxUint256);
  });

  describe("Deployment & Initialization", () => {
    it("should set correct initial values", async () => {
      expect(await listing.owner()).to.equal(owner.address);
      expect(await listing.treasury()).to.equal(treasury.address);
      expect(await listing.wlPrice()).to.equal(ethers.utils.parseEther("1"));
      expect(await listing.nativeWlPrice()).to.equal(ethers.utils.parseEther("1"));
      expect(await listing.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await listing.hasRole(WL_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("should revert on zero address owner", async () => {
      const WLCollectionListingFactory = new WLCollectionListing__factory(owner);
      await expect(
        WLCollectionListingFactory.deploy(ethers.constants.AddressZero, treasury.address)
      ).to.be.revertedWith("Invalid owner");
    });

    it("should revert on zero address treasury", async () => {
      const WLCollectionListingFactory = new WLCollectionListing__factory(owner);
      await expect(
        WLCollectionListingFactory.deploy(owner.address, ethers.constants.AddressZero)
      ).to.be.revertedWith("Invalid treasury");
    });
  });

  describe("Adding Collections to Whitelist", () => {
    it("should allow user to add collection by paying ERC20 tokens", async () => {
      await listing.setWLToken(listingToken.address);
      await listing.setPayWithNative(false);

      const wlPrice = await listing.wlPrice();
      const balanceBefore = await listingToken.balanceOf(user1.address);

      await expect(listing.connect(user1).addToWL(collection1.address, CHAIN_ID_1))
        .to.emit(registry, "CollectionAdded")
        .withArgs(collection1.address, user1.address, CHAIN_ID_1);

      const balanceAfter = await listingToken.balanceOf(user1.address);
      expect(balanceBefore.sub(balanceAfter)).to.equal(wlPrice);

      const [creator, chainId] = await registry.getCollection(collection1.address);
      expect(creator).to.equal(user1.address);
      expect(chainId).to.equal(CHAIN_ID_1);
    });

    it("should allow user to add collection by paying native tokens", async () => {
      await listing.setPayWithNative(true);
      const nativeWlPrice = await listing.nativeWlPrice();
      const treasuryBalanceBefore = await ethers.provider.getBalance(treasury.address);
      await expect(listing.connect(user1).addToWL(collection1.address, CHAIN_ID_1, { value: nativeWlPrice }))
        .to.emit(registry, "CollectionAdded")
        .withArgs(collection1.address, user1.address, CHAIN_ID_1);

      const treasuryBalanceAfter = await ethers.provider.getBalance(treasury.address);
      expect(treasuryBalanceAfter.sub(treasuryBalanceBefore)).to.equal(nativeWlPrice);
    });

    it("should revert if incorrect native token amount", async () => {
      await listing.setPayWithNative(true);
      const nativeWlPrice = await listing.nativeWlPrice();

      await expect(
        listing.connect(user1).addToWL(collection1.address, CHAIN_ID_1, { value: nativeWlPrice.sub(1) })
      ).to.be.revertedWith("Incorrect native token amount");
    });

    it("should revert if wlToken not set and payWithNative is false", async () => {
      await listing.setPayWithNative(false);
      await expect(
        listing.connect(user1).addToWL(collection1.address, CHAIN_ID_1)
      ).to.be.revertedWith("WL token not set or pay with native is false");
    });

    it("should revert when collection already whitelisted", async () => {
      await listing.setWLToken(listingToken.address);
      await listing.setPayWithNative(false);
      await listing.connect(user1).addToWL(collection1.address, CHAIN_ID_1);

      await expect(
        listing.connect(user1).addToWL(collection1.address, CHAIN_ID_1)
      ).to.be.revertedWith("Collection already whitelisted");
    });

    it("should revert when collection address is zero", async () => {
      await listing.setWLToken(listingToken.address);
      await listing.setPayWithNative(false);
      await expect(
        listing.connect(user1).addToWL(ethers.constants.AddressZero, CHAIN_ID_1)
      ).to.be.revertedWith("Invalid collection address");
    });

    it("should revert when chainId is zero", async () => {
      await listing.setWLToken(listingToken.address);
      await listing.setPayWithNative(false);
      await expect(
        listing.connect(user1).addToWL(collection1.address, 0)
      ).to.be.revertedWith("Invalid chainId");
    });
  });

  describe("Removing Collections from Whitelist", () => {
    beforeEach(async () => {
      await listing.setWLToken(listingToken.address);
      await listing.setPayWithNative(false);
      await listing.connect(user1).addToWL(collection1.address, CHAIN_ID_1);
    });

    it("should allow creator to remove collection", async () => {
      await expect(listing.connect(user1).removeFromWL(collection1.address))
        .to.emit(registry, "CollectionRemoved")
        .withArgs(collection1.address, user1.address, CHAIN_ID_1);

      const [creator, chainId] = await registry.getCollection(collection1.address);
      expect(creator).to.equal(ethers.constants.AddressZero);
      expect(chainId).to.equal(0);
    });

    it("should allow WL_ADMIN to remove collection", async () => {
      await expect(listing.connect(admin).removeFromWL(collection1.address))
        .to.emit(registry, "CollectionRemoved")
        .withArgs(collection1.address, user1.address, CHAIN_ID_1);
    });

    it("should revert if collection not whitelisted", async () => {
      await expect(
        listing.connect(user1).removeFromWL(collection2.address)
      ).to.be.revertedWith("Collection not whitelisted");
    });

    it("should revert if non-creator/non-admin tries to remove", async () => {
      await expect(
        listing.connect(user2).removeFromWL(collection1.address)
      ).to.be.revertedWith("Collection not whitelisted");
    });
  });

  describe("Admin & Access Control", () => {
    it("should allow DEFAULT_ADMIN to set wlToken", async () => {
      await expect(listing.connect(owner).setWLToken(otherToken.address))
        .to.emit(listing, "WLTokenSet")
        .withArgs(ethers.constants.AddressZero, otherToken.address);

      expect(await listing.wlToken()).to.equal(otherToken.address);
    });

    it("should revert when non-admin tries to set wlToken", async () => {
      await expect(
        listing.connect(user1).setWLToken(otherToken.address)
      ).to.be.reverted;
    });

    it("should allow owner to set wlPrice", async () => {
      const newPrice = ethers.utils.parseEther("2");
      await expect(listing.connect(owner).setWLPrice(newPrice))
        .to.emit(listing, "WLPriceSet")
        .withArgs(ethers.utils.parseEther("1"), newPrice);

      expect(await listing.wlPrice()).to.equal(newPrice);
    });

    it("should revert when non-owner tries to set wlPrice", async () => {
      await expect(
        listing.connect(user1).setWLPrice(ethers.utils.parseEther("2"))
      ).to.be.revertedWith("AccessControl: account " + user1.address.toLocaleLowerCase() + " is missing role " + DEFAULT_ADMIN_ROLE);
    });

    it("should revert when setting zero wlPrice", async () => {
      await expect(
        listing.connect(owner).setWLPrice(0)
      ).to.be.revertedWith("Price must be greater than 0");
    });

    it("should allow role management by DEFAULT_ADMIN", async () => {
      expect(await listing.hasRole(WL_ADMIN_ROLE, user1.address)).to.be.false;
      await listing.connect(owner).grantRole(WL_ADMIN_ROLE, user1.address);
      expect(await listing.hasRole(WL_ADMIN_ROLE, user1.address)).to.be.true;
      await listing.connect(owner).revokeRole(WL_ADMIN_ROLE, user1.address);
      expect(await listing.hasRole(WL_ADMIN_ROLE, user1.address)).to.be.false;
    });

    it("should revert when non-admin tries to grant/revoke", async () => {
      await expect(
        listing.connect(user1).grantRole(WL_ADMIN_ROLE, user2.address)
      ).to.be.reverted;
    });
  });

});