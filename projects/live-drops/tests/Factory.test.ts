import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  LiveDropFactory,
  LiveDropFactory__factory,
  LiveDropCollection,
  LiveDropCollection__factory,
  MockERC20,
  MockERC20__factory,
} from "../typechain-types";
import "@nomicfoundation/hardhat-chai-matchers";

describe("LiveDropFactory", function () {
  let factory: LiveDropFactory;
  let mockUsdc: MockERC20;
  let owner: SignerWithAddress;
  let feeRecipient: SignerWithAddress;
  let creator: SignerWithAddress;
  let other: SignerWithAddress;

  const DEFAULT_FEE_BPS = 500; // 5%
  const DEFAULT_FEE_FIXED_NATIVE = 0;
  const DEFAULT_FEE_FIXED_ERC20 = 0;

  beforeEach(async function () {
    [owner, feeRecipient, creator, other] = await ethers.getSigners();

    // Deploy mock USDC (6 decimals)
    const MockERC20Factory = (await ethers.getContractFactory(
      "MockERC20"
    )) as MockERC20__factory;
    mockUsdc = await MockERC20Factory.deploy("USD Coin", "USDC", 6);
    await mockUsdc.deployed();

    // Deploy factory
    const FactoryFactory = (await ethers.getContractFactory(
      "LiveDropFactory"
    )) as LiveDropFactory__factory;
    factory = await FactoryFactory.deploy(
      owner.address,
      feeRecipient.address,
      DEFAULT_FEE_BPS,
      DEFAULT_FEE_FIXED_NATIVE,
      DEFAULT_FEE_FIXED_ERC20,
      mockUsdc.address
    );
    await factory.deployed();
  });

  // ==========================================================================
  //                          DEPLOYMENT
  // ==========================================================================

  describe("Deployment", function () {
    it("should set correct owner", async function () {
      expect(await factory.owner()).to.equal(owner.address);
    });

    it("should set correct defaults", async function () {
      const defaults = await factory.getDefaults();
      expect(defaults._feeRecipient).to.equal(feeRecipient.address);
      expect(defaults._feeBps).to.equal(DEFAULT_FEE_BPS);
      expect(defaults._feeFixedNative).to.equal(DEFAULT_FEE_FIXED_NATIVE);
      expect(defaults._feeFixedErc20).to.equal(DEFAULT_FEE_FIXED_ERC20);
      expect(defaults._erc20).to.equal(mockUsdc.address);
    });

    it("should revert with zero fee recipient", async function () {
      const FactoryFactory = (await ethers.getContractFactory(
        "LiveDropFactory"
      )) as LiveDropFactory__factory;
      await expect(
        FactoryFactory.deploy(
          owner.address,
          ethers.constants.AddressZero,
          DEFAULT_FEE_BPS,
          DEFAULT_FEE_FIXED_NATIVE,
          DEFAULT_FEE_FIXED_ERC20,
          mockUsdc.address
        )
      ).to.be.revertedWithCustomError(factory, "InvalidFeeRecipient");
    });

    it("should revert with zero ERC-20 address", async function () {
      const FactoryFactory = (await ethers.getContractFactory(
        "LiveDropFactory"
      )) as LiveDropFactory__factory;
      await expect(
        FactoryFactory.deploy(
          owner.address,
          feeRecipient.address,
          DEFAULT_FEE_BPS,
          DEFAULT_FEE_FIXED_NATIVE,
          DEFAULT_FEE_FIXED_ERC20,
          ethers.constants.AddressZero
        )
      ).to.be.revertedWithCustomError(factory, "InvalidErc20Token");
    });

    it("should revert with fee bps > 10000", async function () {
      const FactoryFactory = (await ethers.getContractFactory(
        "LiveDropFactory"
      )) as LiveDropFactory__factory;
      await expect(
        FactoryFactory.deploy(
          owner.address,
          feeRecipient.address,
          10001,
          DEFAULT_FEE_FIXED_NATIVE,
          DEFAULT_FEE_FIXED_ERC20,
          mockUsdc.address
        )
      ).to.be.revertedWithCustomError(factory, "InvalidFeeBps");
    });
  });

  // ==========================================================================
  //                          CREATE COLLECTION
  // ==========================================================================

  describe("Create Collection", function () {
    const collectionConfig = {
      name: "Stream Drop #1",
      symbol: "SD1",
      description: "First live stream drop",
      icon: "https://example.com/icon.png",
      tokenMetaName: "Stream Token",
      tokenMetaDescription: "A token from the live stream",
      tokenMetaImage: "https://example.com/token.png",
    };

    it("should create a collection and emit event", async function () {
      const tx = await factory.connect(creator).createCollection(collectionConfig);
      const receipt = await tx.wait();

      // Find CollectionCreated event
      const event = receipt.events?.find(
        (e) => e.event === "CollectionCreated"
      );
      expect(event).to.not.be.undefined;
      expect(event!.args!.creator).to.equal(creator.address);
      expect(event!.args!.name).to.equal(collectionConfig.name);
      expect(event!.args!.symbol).to.equal(collectionConfig.symbol);
    });

    it("should set correct collection owner", async function () {
      const tx = await factory.connect(creator).createCollection(collectionConfig);
      const receipt = await tx.wait();

      const event = receipt.events?.find(
        (e) => e.event === "CollectionCreated"
      );
      const collectionAddr = event!.args!.collection;

      const collection = LiveDropCollection__factory.connect(
        collectionAddr,
        creator
      );
      expect(await collection.owner()).to.equal(creator.address);
    });

    it("should set factory defaults on the collection", async function () {
      const tx = await factory.connect(creator).createCollection(collectionConfig);
      const receipt = await tx.wait();

      const event = receipt.events?.find(
        (e) => e.event === "CollectionCreated"
      );
      const collectionAddr = event!.args!.collection;

      const collection = LiveDropCollection__factory.connect(
        collectionAddr,
        creator
      );

      expect(await collection.factory()).to.equal(factory.address);
      expect(await collection.feeRecipient()).to.equal(feeRecipient.address);
      expect(await collection.feeBps()).to.equal(DEFAULT_FEE_BPS);
      expect(await collection.feeFixedNative()).to.equal(DEFAULT_FEE_FIXED_NATIVE);
      expect(await collection.feeFixedErc20()).to.equal(DEFAULT_FEE_FIXED_ERC20);
      expect(await collection.erc20Token()).to.equal(mockUsdc.address);
    });

    it("should set default royalty (10% to creator)", async function () {
      const tx = await factory.connect(creator).createCollection(collectionConfig);
      const receipt = await tx.wait();

      const event = receipt.events?.find(
        (e) => e.event === "CollectionCreated"
      );
      const collectionAddr = event!.args!.collection;

      const collection = LiveDropCollection__factory.connect(
        collectionAddr,
        creator
      );

      // ERC2981 royaltyInfo(tokenId, salePrice) → (receiver, amount)
      const [receiver, royaltyAmount] = await collection.royaltyInfo(0, 10000);
      expect(receiver).to.equal(creator.address);
      expect(royaltyAmount).to.equal(1000); // 10% of 10000
    });

    it("should register collection in the factory", async function () {
      const tx = await factory.connect(creator).createCollection(collectionConfig);
      const receipt = await tx.wait();

      const event = receipt.events?.find(
        (e) => e.event === "CollectionCreated"
      );
      const collectionAddr = event!.args!.collection;

      expect(await factory.isCollection(collectionAddr)).to.be.true;
      expect(await factory.getCollectionCount()).to.equal(1);
      expect(await factory.allCollections(0)).to.equal(collectionAddr);
    });

    it("should create multiple collections", async function () {
      await factory.connect(creator).createCollection(collectionConfig);
      await factory.connect(other).createCollection({
        ...collectionConfig,
        name: "Stream Drop #2",
        symbol: "SD2",
      });

      expect(await factory.getCollectionCount()).to.equal(2);
    });

    it("should set collection metadata correctly", async function () {
      const tx = await factory.connect(creator).createCollection(collectionConfig);
      const receipt = await tx.wait();
      const event = receipt.events?.find((e) => e.event === "CollectionCreated");
      const collectionAddr = event!.args!.collection;

      const collection = LiveDropCollection__factory.connect(collectionAddr, creator);
      expect(await collection.name()).to.equal(collectionConfig.name);
      expect(await collection.symbol()).to.equal(collectionConfig.symbol);
      expect(await collection.collectionDescription()).to.equal(collectionConfig.description);
      expect(await collection.collectionIcon()).to.equal(collectionConfig.icon);
      expect(await collection.tokenMetaName()).to.equal(collectionConfig.tokenMetaName);
      expect(await collection.tokenMetaDescription()).to.equal(collectionConfig.tokenMetaDescription);
      expect(await collection.tokenMetaImage()).to.equal(collectionConfig.tokenMetaImage);
    });
  });

  // ==========================================================================
  //                          ADMIN: SET DEFAULTS
  // ==========================================================================

  describe("Set Default Fees", function () {
    it("should update default fees", async function () {
      await expect(factory.setDefaultFees(1000, 100, 50))
        .to.emit(factory, "DefaultFeesUpdated")
        .withArgs(1000, 100, 50);

      const defaults = await factory.getDefaults();
      expect(defaults._feeBps).to.equal(1000);
      expect(defaults._feeFixedNative).to.equal(100);
      expect(defaults._feeFixedErc20).to.equal(50);
    });

    it("should revert if not owner", async function () {
      await expect(
        factory.connect(other).setDefaultFees(1000, 100, 50)
      ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
    });

    it("should revert if bps > 10000", async function () {
      await expect(
        factory.setDefaultFees(10001, 0, 0)
      ).to.be.revertedWithCustomError(factory, "InvalidFeeBps");
    });
  });

  describe("Set Fee Recipient", function () {
    it("should update fee recipient", async function () {
      await expect(factory.setFeeRecipient(other.address))
        .to.emit(factory, "FeeRecipientUpdated")
        .withArgs(other.address);

      expect(await factory.feeRecipient()).to.equal(other.address);
    });

    it("should revert with zero address", async function () {
      await expect(
        factory.setFeeRecipient(ethers.constants.AddressZero)
      ).to.be.revertedWithCustomError(factory, "InvalidFeeRecipient");
    });

    it("should revert if not owner", async function () {
      await expect(
        factory.connect(other).setFeeRecipient(other.address)
      ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
    });
  });

  describe("Set Default ERC-20", function () {
    it("should update default ERC-20", async function () {
      await expect(factory.setDefaultErc20(other.address))
        .to.emit(factory, "DefaultErc20Updated")
        .withArgs(other.address);

      expect(await factory.defaultErc20()).to.equal(other.address);
    });

    it("should revert with zero address", async function () {
      await expect(
        factory.setDefaultErc20(ethers.constants.AddressZero)
      ).to.be.revertedWithCustomError(factory, "InvalidErc20Token");
    });

    it("should revert if not owner", async function () {
      await expect(
        factory.connect(other).setDefaultErc20(other.address)
      ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
    });
  });

  // ==========================================================================
  //                          VIEWS: PAGINATION
  // ==========================================================================

  describe("Get Collections (pagination)", function () {
    const collectionConfig = {
      name: "Drop",
      symbol: "DRP",
      description: "desc",
      icon: "icon",
      tokenMetaName: "Token",
      tokenMetaDescription: "desc",
      tokenMetaImage: "image",
    };

    beforeEach(async function () {
      // Create 5 collections
      for (let i = 0; i < 5; i++) {
        await factory.connect(creator).createCollection({
          ...collectionConfig,
          name: `Drop ${i}`,
          symbol: `DRP${i}`,
        });
      }
    });

    it("should return all collections with full range", async function () {
      const collections = await factory.getCollections(0, 10);
      expect(collections.length).to.equal(5);
    });

    it("should return partial page", async function () {
      const collections = await factory.getCollections(3, 10);
      expect(collections.length).to.equal(2);
    });

    it("should return empty for out-of-range offset", async function () {
      const collections = await factory.getCollections(10, 10);
      expect(collections.length).to.equal(0);
    });

    it("should return limited results", async function () {
      const collections = await factory.getCollections(0, 2);
      expect(collections.length).to.equal(2);
    });
  });

  // ==========================================================================
  //                          OWNERSHIP
  // ==========================================================================

  describe("Ownership", function () {
    it("should transfer ownership", async function () {
      await factory.transferOwnership(other.address);
      expect(await factory.owner()).to.equal(other.address);
    });
  });
});
