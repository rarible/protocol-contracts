// <ai_context> Test suite for NftPool contract. Single pool with price-range based pool levels. </ai_context>
import { expect } from "chai";
import { network } from "hardhat";
const connection = await network.connect();
const { ethers } = connection;
import type * as ethersTypes from "ethers";
import {
  type NftPool,
  NftPool__factory,
  type TestERC721,
  TestERC721__factory,
  type TransparentUpgradeableProxy,
  TransparentUpgradeableProxy__factory,
} from "../types/ethers-contracts";

// Pool levels enum values
const PoolLevel = {
  Common: 0,
  Rare: 1,
  Epic: 2,
  Legendary: 3,
  UltraRare: 4,
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("NftPool", function () {
  let nftPool: NftPool;
  let nftPoolImpl: NftPool;
  let testNft: TestERC721;
  let testNft2: TestERC721;
  let owner: ethersTypes.Signer;
  let poolManager: ethersTypes.Signer;
  let user1: ethersTypes.Signer;
  let user2: ethersTypes.Signer;
  let ownerAddress: string;
  let poolManagerAddress: string;
  let user1Address: string;
  let user2Address: string;

  let DEFAULT_ADMIN_ROLE: string;
  let POOL_MANAGER_ROLE: string;

  beforeEach(async function () {
    [owner, poolManager, user1, user2] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    poolManagerAddress = await poolManager.getAddress();
    user1Address = await user1.getAddress();
    user2Address = await user2.getAddress();

    const TestNftFactory = new TestERC721__factory(owner);
    testNft = await TestNftFactory.deploy("Test NFT", "TNFT");
    await testNft.waitForDeployment();

    testNft2 = await TestNftFactory.deploy("Test NFT 2", "TNFT2");
    await testNft2.waitForDeployment();

    const NftPoolFactory = new NftPool__factory(owner);
    nftPoolImpl = await NftPoolFactory.deploy();
    await nftPoolImpl.waitForDeployment();

    const ProxyFactory = new TransparentUpgradeableProxy__factory(owner);
    const initData = nftPoolImpl.interface.encodeFunctionData("initialize", [ownerAddress, []]);

    const proxy = await ProxyFactory.deploy(await nftPoolImpl.getAddress(), ownerAddress, initData);
    await proxy.waitForDeployment();

    nftPool = NftPool__factory.connect(await proxy.getAddress(), owner);

    DEFAULT_ADMIN_ROLE = await nftPool.DEFAULT_ADMIN_ROLE();
    POOL_MANAGER_ROLE = await nftPool.POOL_MANAGER_ROLE();
  });

  describe("Initialization", function () {
    it("Should set correct owner", async function () {
      expect(await nftPool.owner()).to.equal(ownerAddress);
    });

    it("Should grant DEFAULT_ADMIN_ROLE to owner", async function () {
      expect(await nftPool.hasRole(DEFAULT_ADMIN_ROLE, ownerAddress)).to.be.true;
    });

    it("Should grant POOL_MANAGER_ROLE to owner", async function () {
      expect(await nftPool.hasRole(POOL_MANAGER_ROLE, ownerAddress)).to.be.true;
    });

    it("Should set default price ranges", async function () {
      const [commonLow, commonHigh] = await nftPool.getPoolInfo(PoolLevel.Common);
      expect(commonLow).to.equal(0);
      expect(commonHigh).to.equal(ethers.parseEther("0.5"));

      const [rareLow, rareHigh] = await nftPool.getPoolInfo(PoolLevel.Rare);
      expect(rareLow).to.equal(ethers.parseEther("0.5"));
      expect(rareHigh).to.equal(ethers.parseEther("2"));

      const [ultraRareLow] = await nftPool.getPoolInfo(PoolLevel.UltraRare);
      expect(ultraRareLow).to.equal(ethers.parseEther("50"));
    });

    it("Should revert initialization with zero address owner", async function () {
      const NftPoolFactory = new NftPool__factory(owner);
      const newPoolImpl = await NftPoolFactory.deploy();
      await newPoolImpl.waitForDeployment();

      const ProxyFactory = new TransparentUpgradeableProxy__factory(owner);
      const initData = newPoolImpl.interface.encodeFunctionData("initialize", [ZERO_ADDRESS, []]);

      await expect(
        ProxyFactory.deploy(await newPoolImpl.getAddress(), ownerAddress, initData),
      ).to.be.revertedWithCustomError(newPoolImpl, "ZeroAddress");
    });

    it("Should not allow reinitialization", async function () {
      await expect(nftPool.initialize(user1Address, [])).to.be.revertedWithCustomError(nftPool, "InvalidInitialization");
    });

    it("Should initialize with custom pool ranges", async function () {
      const NftPoolFactory = new NftPool__factory(owner);
      const newPoolImpl = await NftPoolFactory.deploy();
      await newPoolImpl.waitForDeployment();

      const ProxyFactory = new TransparentUpgradeableProxy__factory(owner);
      const customRanges = [
        { lowPrice: 0, highPrice: ethers.parseEther("1") },
        { lowPrice: ethers.parseEther("1"), highPrice: ethers.parseEther("5") },
        { lowPrice: ethers.parseEther("5"), highPrice: ethers.parseEther("20") },
        { lowPrice: ethers.parseEther("20"), highPrice: ethers.parseEther("100") },
        { lowPrice: ethers.parseEther("100"), highPrice: ethers.MaxUint256 },
      ];
      const initData = newPoolImpl.interface.encodeFunctionData("initialize", [ownerAddress, customRanges]);

      const proxy = await ProxyFactory.deploy(await newPoolImpl.getAddress(), ownerAddress, initData);
      await proxy.waitForDeployment();

      const newPool = NftPool__factory.connect(await proxy.getAddress(), owner);

      const [commonLow, commonHigh] = await newPool.getPoolInfo(PoolLevel.Common);
      expect(commonLow).to.equal(0);
      expect(commonHigh).to.equal(ethers.parseEther("1"));

      const [rareLow, rareHigh] = await newPool.getPoolInfo(PoolLevel.Rare);
      expect(rareLow).to.equal(ethers.parseEther("1"));
      expect(rareHigh).to.equal(ethers.parseEther("5"));
    });

    it("Should revert initialization with wrong number of ranges", async function () {
      const NftPoolFactory = new NftPool__factory(owner);
      const newPoolImpl = await NftPoolFactory.deploy();
      await newPoolImpl.waitForDeployment();

      const ProxyFactory = new TransparentUpgradeableProxy__factory(owner);
      const wrongRanges = [
        { lowPrice: 0, highPrice: ethers.parseEther("1") },
        { lowPrice: ethers.parseEther("1"), highPrice: ethers.parseEther("5") },
      ];
      const initData = newPoolImpl.interface.encodeFunctionData("initialize", [ownerAddress, wrongRanges]);

      await expect(
        ProxyFactory.deploy(await newPoolImpl.getAddress(), ownerAddress, initData),
      ).to.be.revertedWithCustomError(newPoolImpl, "ArrayLengthMismatch");
    });

    it("Should revert initialization with invalid price range in custom ranges", async function () {
      const NftPoolFactory = new NftPool__factory(owner);
      const newPoolImpl = await NftPoolFactory.deploy();
      await newPoolImpl.waitForDeployment();

      const ProxyFactory = new TransparentUpgradeableProxy__factory(owner);
      const invalidRanges = [
        { lowPrice: ethers.parseEther("1"), highPrice: 0 }, // invalid: low >= high
        { lowPrice: ethers.parseEther("1"), highPrice: ethers.parseEther("5") },
        { lowPrice: ethers.parseEther("5"), highPrice: ethers.parseEther("20") },
        { lowPrice: ethers.parseEther("20"), highPrice: ethers.parseEther("100") },
        { lowPrice: ethers.parseEther("100"), highPrice: ethers.MaxUint256 },
      ];
      const initData = newPoolImpl.interface.encodeFunctionData("initialize", [ownerAddress, invalidRanges]);

      await expect(
        ProxyFactory.deploy(await newPoolImpl.getAddress(), ownerAddress, initData),
      ).to.be.revertedWithCustomError(newPoolImpl, "InvalidPriceRange");
    });
  });

  describe("Pool Price Ranges", function () {
    it("Should allow owner to set pool info", async function () {
      const newLow = ethers.parseEther("0.1");
      const newHigh = ethers.parseEther("1");

      await expect(nftPool.setPoolInfo(PoolLevel.Common, newLow, newHigh))
        .to.emit(nftPool, "PoolInfoUpdated")
        .withArgs(PoolLevel.Common, newLow, newHigh);

      const [low, high] = await nftPool.getPoolInfo(PoolLevel.Common);
      expect(low).to.equal(newLow);
      expect(high).to.equal(newHigh);
    });

    it("Should allow batch setting all pool info", async function () {
      await nftPool.setAllPoolInfo([
        { lowPrice: 0, highPrice: ethers.parseEther("1") },
        { lowPrice: ethers.parseEther("1"), highPrice: ethers.parseEther("5") },
        { lowPrice: ethers.parseEther("5"), highPrice: ethers.parseEther("20") },
        { lowPrice: ethers.parseEther("20"), highPrice: ethers.parseEther("100") },
        { lowPrice: ethers.parseEther("100"), highPrice: ethers.MaxUint256 },
      ]);

      const [commonLow, commonHigh] = await nftPool.getPoolInfo(PoolLevel.Common);
      expect(commonLow).to.equal(0);
      expect(commonHigh).to.equal(ethers.parseEther("1"));

      const [rareLow, rareHigh] = await nftPool.getPoolInfo(PoolLevel.Rare);
      expect(rareLow).to.equal(ethers.parseEther("1"));
      expect(rareHigh).to.equal(ethers.parseEther("5"));
    });

    it("Should revert batch setting with wrong array length", async function () {
      await expect(
        nftPool.setAllPoolInfo([
          { lowPrice: 0, highPrice: ethers.parseEther("1") },
          { lowPrice: ethers.parseEther("1"), highPrice: ethers.parseEther("5") },
        ]),
      ).to.be.revertedWithCustomError(nftPool, "ArrayLengthMismatch");
    });

    it("Should revert batch setting with invalid price range", async function () {
      await expect(
        nftPool.setAllPoolInfo([
          { lowPrice: ethers.parseEther("1"), highPrice: 0 }, // invalid
          { lowPrice: ethers.parseEther("1"), highPrice: ethers.parseEther("5") },
          { lowPrice: ethers.parseEther("5"), highPrice: ethers.parseEther("20") },
          { lowPrice: ethers.parseEther("20"), highPrice: ethers.parseEther("100") },
          { lowPrice: ethers.parseEther("100"), highPrice: ethers.MaxUint256 },
        ]),
      ).to.be.revertedWithCustomError(nftPool, "InvalidPriceRange");
    });

    it("Should revert when low >= high", async function () {
      await expect(
        nftPool.setPoolInfo(PoolLevel.Common, ethers.parseEther("1"), ethers.parseEther("1")),
      ).to.be.revertedWithCustomError(nftPool, "InvalidPriceRange");

      await expect(
        nftPool.setPoolInfo(PoolLevel.Common, ethers.parseEther("2"), ethers.parseEther("1")),
      ).to.be.revertedWithCustomError(nftPool, "InvalidPriceRange");
    });

    it("Should only allow owner to set pool info", async function () {
      await expect(
        nftPool.connect(user1).setPoolInfo(PoolLevel.Common, 0, ethers.parseEther("1")),
      ).to.be.revertedWithCustomError(nftPool, "OwnableUnauthorizedAccount");
    });
  });

  describe("Collection Configuration", function () {
    const FLOOR_PRICE = ethers.parseEther("0.3");

    it("Should configure a collection with allowed=true and floor price", async function () {
      await expect(nftPool.configureCollection(await testNft.getAddress(), true, FLOOR_PRICE))
        .to.emit(nftPool, "CollectionConfigured")
        .withArgs(await testNft.getAddress(), true, FLOOR_PRICE);

      const [allowed, floorPrice, poolLevel] = await nftPool.getCollectionInfo(await testNft.getAddress());
      expect(allowed).to.be.true;
      expect(floorPrice).to.equal(FLOOR_PRICE);
      expect(poolLevel).to.equal(PoolLevel.Common);
    });

    it("Should add collection to pool.collections array when allowed", async function () {
      await nftPool.configureCollection(await testNft.getAddress(), true, FLOOR_PRICE);

      const collections = await nftPool.getPoolCollections(PoolLevel.Common);
      expect(collections).to.include(await testNft.getAddress());
      expect(collections.length).to.equal(1);
    });

    it("Should batch configure collections", async function () {
      const price1 = ethers.parseEther("0.3");
      const price2 = ethers.parseEther("15");

      await nftPool.configureCollections(
        [await testNft.getAddress(), await testNft2.getAddress()],
        [true, true],
        [price1, price2],
      );

      expect(await nftPool.isCollectionAllowed(await testNft.getAddress())).to.be.true;
      expect(await nftPool.isCollectionAllowed(await testNft2.getAddress())).to.be.true;
      expect(await nftPool.getCollectionFloorPrice(await testNft.getAddress())).to.equal(price1);
      expect(await nftPool.getCollectionFloorPrice(await testNft2.getAddress())).to.equal(price2);
    });

    it("Should determine pool level automatically from floor price", async function () {
      // Common: 0 - 0.5 ETH
      await nftPool.configureCollection(await testNft.getAddress(), true, ethers.parseEther("0.3"));
      expect(await nftPool.getCollectionPoolLevel(await testNft.getAddress())).to.equal(PoolLevel.Common);

      // Rare: 0.5 - 2 ETH
      await nftPool.setCollectionFloorPrice(await testNft.getAddress(), ethers.parseEther("1"));
      expect(await nftPool.getCollectionPoolLevel(await testNft.getAddress())).to.equal(PoolLevel.Rare);

      // Epic: 2 - 10 ETH
      await nftPool.setCollectionFloorPrice(await testNft.getAddress(), ethers.parseEther("5"));
      expect(await nftPool.getCollectionPoolLevel(await testNft.getAddress())).to.equal(PoolLevel.Epic);

      // Legendary: 10 - 50 ETH
      await nftPool.setCollectionFloorPrice(await testNft.getAddress(), ethers.parseEther("25"));
      expect(await nftPool.getCollectionPoolLevel(await testNft.getAddress())).to.equal(PoolLevel.Legendary);

      // UltraRare: 50+ ETH
      await nftPool.setCollectionFloorPrice(await testNft.getAddress(), ethers.parseEther("100"));
      expect(await nftPool.getCollectionPoolLevel(await testNft.getAddress())).to.equal(PoolLevel.UltraRare);
    });

    it("Should revert configureCollection with allowed=true but floor price=0", async function () {
      await expect(nftPool.configureCollection(await testNft.getAddress(), true, 0)).to.be.revertedWithCustomError(
        nftPool,
        "FloorPriceNotSet",
      );
    });

    it("Should allow configuring with allowed=false and floor price=0", async function () {
      await nftPool.configureCollection(await testNft.getAddress(), false, 0);
      expect(await nftPool.isCollectionAllowed(await testNft.getAddress())).to.be.false;
    });

    it("Should revert with zero address", async function () {
      await expect(nftPool.configureCollection(ZERO_ADDRESS, true, FLOOR_PRICE)).to.be.revertedWithCustomError(
        nftPool,
        "ZeroAddress",
      );
    });

    it("Should revert batch configure with mismatched arrays", async function () {
      await expect(
        nftPool.configureCollections([await testNft.getAddress()], [true, true], [FLOOR_PRICE]),
      ).to.be.revertedWithCustomError(nftPool, "ArrayLengthMismatch");
    });

    it("Should only allow owner to configure collections", async function () {
      await expect(
        nftPool.connect(user1).configureCollection(await testNft.getAddress(), true, FLOOR_PRICE),
      ).to.be.revertedWithCustomError(nftPool, "OwnableUnauthorizedAccount");
    });
  });

  describe("Collection Allowed Status", function () {
    const FLOOR_PRICE = ethers.parseEther("0.3");

    beforeEach(async function () {
      await nftPool.configureCollection(await testNft.getAddress(), true, FLOOR_PRICE);
    });

    it("Should toggle allowed status via configureCollection", async function () {
      expect(await nftPool.isCollectionAllowed(await testNft.getAddress())).to.be.true;

      // Disallow collection (set allowed=false, but floor price must be > 0 if allowed is false it's OK)
      await nftPool.configureCollection(await testNft.getAddress(), false, FLOOR_PRICE);
      expect(await nftPool.isCollectionAllowed(await testNft.getAddress())).to.be.false;

      // Floor price should be preserved
      expect(await nftPool.getCollectionFloorPrice(await testNft.getAddress())).to.equal(FLOOR_PRICE);

      // Re-allow collection
      await nftPool.configureCollection(await testNft.getAddress(), true, FLOOR_PRICE);
      expect(await nftPool.isCollectionAllowed(await testNft.getAddress())).to.be.true;
    });

    it("Should remove collection from pool.collections when disallowed", async function () {
      let collections = await nftPool.getPoolCollections(PoolLevel.Common);
      expect(collections).to.include(await testNft.getAddress());

      await nftPool.configureCollection(await testNft.getAddress(), false, FLOOR_PRICE);

      collections = await nftPool.getPoolCollections(PoolLevel.Common);
      expect(collections).to.not.include(await testNft.getAddress());
    });

    it("Should emit CollectionAllowedUpdated event", async function () {
      await expect(nftPool.configureCollection(await testNft.getAddress(), false, FLOOR_PRICE))
        .to.emit(nftPool, "CollectionAllowedUpdated")
        .withArgs(await testNft.getAddress(), false);
    });
  });

  describe("Floor Price Updates", function () {
    const INITIAL_PRICE = ethers.parseEther("0.3");

    beforeEach(async function () {
      await nftPool.configureCollection(await testNft.getAddress(), true, INITIAL_PRICE);
    });

    it("Should update floor price and change pool level", async function () {
      // Initially Common
      expect(await nftPool.getCollectionPoolLevel(await testNft.getAddress())).to.equal(PoolLevel.Common);
      let collections = await nftPool.getPoolCollections(PoolLevel.Common);
      expect(collections).to.include(await testNft.getAddress());

      // Update to Legendary price
      const newPrice = ethers.parseEther("15");
      await nftPool.setCollectionFloorPrice(await testNft.getAddress(), newPrice);

      expect(await nftPool.getCollectionPoolLevel(await testNft.getAddress())).to.equal(PoolLevel.Legendary);

      // Should be removed from Common and added to Legendary
      collections = await nftPool.getPoolCollections(PoolLevel.Common);
      expect(collections).to.not.include(await testNft.getAddress());

      collections = await nftPool.getPoolCollections(PoolLevel.Legendary);
      expect(collections).to.include(await testNft.getAddress());
    });

    it("Should emit CollectionFloorPriceUpdated event", async function () {
      const newPrice = ethers.parseEther("15");
      await expect(nftPool.setCollectionFloorPrice(await testNft.getAddress(), newPrice))
        .to.emit(nftPool, "CollectionFloorPriceUpdated")
        .withArgs(await testNft.getAddress(), INITIAL_PRICE, newPrice);
    });

    it("Should batch update floor prices", async function () {
      await nftPool.configureCollection(await testNft2.getAddress(), true, INITIAL_PRICE);

      await nftPool.setCollectionFloorPrices(
        [await testNft.getAddress(), await testNft2.getAddress()],
        [ethers.parseEther("5"), ethers.parseEther("25")],
      );

      expect(await nftPool.getCollectionPoolLevel(await testNft.getAddress())).to.equal(PoolLevel.Epic);
      expect(await nftPool.getCollectionPoolLevel(await testNft2.getAddress())).to.equal(PoolLevel.Legendary);
    });
  });

  describe("Depositing NFTs", function () {
    beforeEach(async function () {
      // Configure testNft with Common-level floor price
      await nftPool.configureCollection(await testNft.getAddress(), true, ethers.parseEther("0.3"));

      await testNft.mint(user1Address, 1);
      await testNft.mint(user1Address, 2);
      await testNft.mint(user1Address, 3);
    });

    it("Should deposit NFT into correct pool level", async function () {
      await testNft.connect(user1).approve(await nftPool.getAddress(), 1);
      await nftPool.connect(user1).deposit(await testNft.getAddress(), 1);

      expect(await nftPool.getPoolLevelSize(PoolLevel.Common)).to.equal(1);
      expect(await nftPool.isNftInPool(await testNft.getAddress(), 1)).to.be.true;
      expect(await nftPool.getNftPoolLevel(await testNft.getAddress(), 1)).to.equal(PoolLevel.Common);
    });

    it("Should emit Deposited event with correct level", async function () {
      await testNft.connect(user1).approve(await nftPool.getAddress(), 1);

      await expect(nftPool.connect(user1).deposit(await testNft.getAddress(), 1))
        .to.emit(nftPool, "Deposited")
        .withArgs(await testNft.getAddress(), 1, PoolLevel.Common);
    });

    it("Should deposit to different levels based on floor price", async function () {
      // Configure testNft2 with Legendary-level floor price
      await nftPool.configureCollection(await testNft2.getAddress(), true, ethers.parseEther("15"));

      await testNft2.mint(user1Address, 100);
      await testNft2.connect(user1).approve(await nftPool.getAddress(), 100);
      await nftPool.connect(user1).deposit(await testNft2.getAddress(), 100);

      expect(await nftPool.getPoolLevelSize(PoolLevel.Legendary)).to.equal(1);
      expect(await nftPool.getNftPoolLevel(await testNft2.getAddress(), 100)).to.equal(PoolLevel.Legendary);
    });

    it("Should deposit multiple NFTs", async function () {
      await testNft.connect(user1).approve(await nftPool.getAddress(), 1);
      await testNft.connect(user1).approve(await nftPool.getAddress(), 2);
      await testNft.connect(user1).approve(await nftPool.getAddress(), 3);

      await nftPool.connect(user1).deposit(await testNft.getAddress(), 1);
      await nftPool.connect(user1).deposit(await testNft.getAddress(), 2);
      await nftPool.connect(user1).deposit(await testNft.getAddress(), 3);

      expect(await nftPool.getPoolLevelSize(PoolLevel.Common)).to.equal(3);
      expect(await nftPool.totalPoolSize()).to.equal(3);
    });

    it("Should revert when collection not allowed", async function () {
      // testNft2 is not configured
      await testNft2.mint(user1Address, 1);
      await testNft2.connect(user1).approve(await nftPool.getAddress(), 1);

      await expect(nftPool.connect(user1).deposit(await testNft2.getAddress(), 1)).to.be.revertedWithCustomError(
        nftPool,
        "CollectionNotAllowed",
      );
    });

    it("Should revert when collection is disallowed", async function () {
      // Disallow collection using configureCollection
      await nftPool.configureCollection(await testNft.getAddress(), false, ethers.parseEther("0.3"));

      await testNft.connect(user1).approve(await nftPool.getAddress(), 1);

      await expect(nftPool.connect(user1).deposit(await testNft.getAddress(), 1)).to.be.revertedWithCustomError(
        nftPool,
        "CollectionNotAllowed",
      );
    });

    it("Should return correct NFT info at level index", async function () {
      await testNft.connect(user1).approve(await nftPool.getAddress(), 1);
      await nftPool.connect(user1).deposit(await testNft.getAddress(), 1);

      const [collection, tokenId] = await nftPool.getPoolLevelNftAt(PoolLevel.Common, 0);
      expect(collection).to.equal(await testNft.getAddress());
      expect(tokenId).to.equal(1);
    });
  });

  describe("Floor Price Changes with Deposited NFTs", function () {
    beforeEach(async function () {
      await nftPool.configureCollection(await testNft.getAddress(), true, ethers.parseEther("0.3"));

      await testNft.mint(user1Address, 1);
      await testNft.mint(user1Address, 2);
      await testNft.connect(user1).approve(await nftPool.getAddress(), 1);
      await nftPool.connect(user1).deposit(await testNft.getAddress(), 1);
    });

    it("Should move NFT counts to new pool level when floor price changes", async function () {
      expect(await nftPool.getPoolLevelSize(PoolLevel.Common)).to.equal(1);
      expect(await nftPool.getPoolLevelSize(PoolLevel.Legendary)).to.equal(0);

      // Change floor price to Legendary level
      await nftPool.setCollectionFloorPrice(await testNft.getAddress(), ethers.parseEther("15"));

      // NFT count should move from Common to Legendary
      expect(await nftPool.getPoolLevelSize(PoolLevel.Common)).to.equal(0);
      expect(await nftPool.getPoolLevelSize(PoolLevel.Legendary)).to.equal(1);
    });

    it("Should deposit new NFTs at new pool level after floor price change", async function () {
      await nftPool.setCollectionFloorPrice(await testNft.getAddress(), ethers.parseEther("15"));

      await testNft.connect(user1).approve(await nftPool.getAddress(), 2);
      await nftPool.connect(user1).deposit(await testNft.getAddress(), 2);

      expect(await nftPool.getNftPoolLevel(await testNft.getAddress(), 2)).to.equal(PoolLevel.Legendary);
      expect(await nftPool.getPoolLevelSize(PoolLevel.Legendary)).to.equal(2);
    });

    it("Should adjust totalNfts when disallowing collection with NFTs", async function () {
      expect(await nftPool.getPoolLevelSize(PoolLevel.Common)).to.equal(1);

      const currentPrice = await nftPool.getCollectionFloorPrice(await testNft.getAddress());
      await nftPool.configureCollection(await testNft.getAddress(), false, currentPrice);

      // NFT count should be removed from pool
      expect(await nftPool.getPoolLevelSize(PoolLevel.Common)).to.equal(0);
      expect(await nftPool.totalPoolSize()).to.equal(0);

      // But NFT is still tracked in collection
      expect(await nftPool.isNftInPool(await testNft.getAddress(), 1)).to.be.true;
    });

    it("Should restore totalNfts when re-allowing collection", async function () {
      const currentPrice = await nftPool.getCollectionFloorPrice(await testNft.getAddress());
      await nftPool.configureCollection(await testNft.getAddress(), false, currentPrice);
      expect(await nftPool.getPoolLevelSize(PoolLevel.Common)).to.equal(0);

      await nftPool.configureCollection(await testNft.getAddress(), true, currentPrice);
      expect(await nftPool.getPoolLevelSize(PoolLevel.Common)).to.equal(1);
    });
  });

  describe("Withdrawing NFTs", function () {
    beforeEach(async function () {
      await nftPool.configureCollection(await testNft.getAddress(), true, ethers.parseEther("1"));

      await testNft.mint(user1Address, 1);
      await testNft.mint(user1Address, 2);
      await testNft.connect(user1).approve(await nftPool.getAddress(), 1);
      await testNft.connect(user1).approve(await nftPool.getAddress(), 2);
      await nftPool.connect(user1).deposit(await testNft.getAddress(), 1);
      await nftPool.connect(user1).deposit(await testNft.getAddress(), 2);
    });

    it("Should allow POOL_MANAGER_ROLE to transfer NFT out", async function () {
      await nftPool.transferNft(await testNft.getAddress(), user2Address, 1);

      expect(await testNft.ownerOf(1)).to.equal(user2Address);
      expect(await nftPool.getPoolLevelSize(PoolLevel.Rare)).to.equal(1);
      expect(await nftPool.isNftInPool(await testNft.getAddress(), 1)).to.be.false;
    });

    it("Should emit Withdrawn event with correct level", async function () {
      await expect(nftPool.transferNft(await testNft.getAddress(), user2Address, 1))
        .to.emit(nftPool, "Withdrawn")
        .withArgs(user2Address, await testNft.getAddress(), 1, PoolLevel.Rare);
    });

    it("Should revert when non-POOL_MANAGER_ROLE tries to transfer", async function () {
      await expect(
        nftPool.connect(user1).transferNft(await testNft.getAddress(), user2Address, 1),
      ).to.be.revertedWithCustomError(nftPool, "AccessControlUnauthorizedAccount");
    });

    it("Should revert when transferring NFT not in pool", async function () {
      await expect(nftPool.transferNft(await testNft.getAddress(), user2Address, 999)).to.be.revertedWithCustomError(
        nftPool,
        "NotInPool",
      );
    });
  });

  describe("Select and Transfer from Level", function () {
    beforeEach(async function () {
      await nftPool.configureCollection(await testNft.getAddress(), true, ethers.parseEther("5"));

      for (let i = 1; i <= 5; i++) {
        await testNft.mint(user1Address, i);
        await testNft.connect(user1).approve(await nftPool.getAddress(), i);
        await nftPool.connect(user1).deposit(await testNft.getAddress(), i);
      }
    });

    it("Should select and transfer NFT atomically", async function () {
      const sizeBefore = await nftPool.getPoolLevelSize(PoolLevel.Epic);

      await nftPool.selectAndTransferFromLevel(PoolLevel.Epic, 12345n, user2Address);

      expect(await nftPool.getPoolLevelSize(PoolLevel.Epic)).to.equal(sizeBefore - 1n);
    });

    it("Should transfer NFT to correct recipient", async function () {
      const [collection, tokenId] = await nftPool.selectAndTransferFromLevel.staticCall(
        PoolLevel.Epic,
        0n,
        user2Address,
      );

      await nftPool.selectAndTransferFromLevel(PoolLevel.Epic, 0n, user2Address);

      // First NFT at index 0 should be transferred
      expect(collection).to.equal(await testNft.getAddress());
      expect(tokenId).to.equal(1n);
      expect(await testNft.ownerOf(1)).to.equal(user2Address);
    });

    it("Should revert when level is empty", async function () {
      await expect(
        nftPool.selectAndTransferFromLevel(PoolLevel.UltraRare, 0n, user2Address),
      ).to.be.revertedWithCustomError(nftPool, "LevelEmpty");
    });

    it("Should only allow POOL_MANAGER_ROLE", async function () {
      await expect(
        nftPool.connect(user1).selectAndTransferFromLevel(PoolLevel.Epic, 0n, user2Address),
      ).to.be.revertedWithCustomError(nftPool, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Multiple Collections in Same Pool Level", function () {
    beforeEach(async function () {
      // Both collections at Common level
      await nftPool.configureCollection(await testNft.getAddress(), true, ethers.parseEther("0.3"));
      await nftPool.configureCollection(await testNft2.getAddress(), true, ethers.parseEther("0.4"));

      // Deposit NFTs from both collections
      await testNft.mint(user1Address, 1);
      await testNft.mint(user1Address, 2);
      await testNft2.mint(user1Address, 100);
      await testNft2.mint(user1Address, 101);

      await testNft.connect(user1).approve(await nftPool.getAddress(), 1);
      await testNft.connect(user1).approve(await nftPool.getAddress(), 2);
      await testNft2.connect(user1).approve(await nftPool.getAddress(), 100);
      await testNft2.connect(user1).approve(await nftPool.getAddress(), 101);

      await nftPool.connect(user1).deposit(await testNft.getAddress(), 1);
      await nftPool.connect(user1).deposit(await testNft.getAddress(), 2);
      await nftPool.connect(user1).deposit(await testNft2.getAddress(), 100);
      await nftPool.connect(user1).deposit(await testNft2.getAddress(), 101);
    });

    it("Should track total NFTs across multiple collections", async function () {
      expect(await nftPool.getPoolLevelSize(PoolLevel.Common)).to.equal(4);
      expect(await nftPool.totalPoolSize()).to.equal(4);
    });

    it("Should return correct NFTs when iterating by index", async function () {
      // First collection's NFTs
      const [coll0, id0] = await nftPool.getPoolLevelNftAt(PoolLevel.Common, 0);
      const [coll1, id1] = await nftPool.getPoolLevelNftAt(PoolLevel.Common, 1);
      expect(coll0).to.equal(await testNft.getAddress());
      expect(coll1).to.equal(await testNft.getAddress());

      // Second collection's NFTs
      const [coll2, id2] = await nftPool.getPoolLevelNftAt(PoolLevel.Common, 2);
      const [coll3, id3] = await nftPool.getPoolLevelNftAt(PoolLevel.Common, 3);
      expect(coll2).to.equal(await testNft2.getAddress());
      expect(coll3).to.equal(await testNft2.getAddress());
    });

    it("Should select from multiple collections randomly", async function () {
      // Different random values should potentially select from different collections
      const results: Set<string> = new Set();

      for (let i = 0; i < 4; i++) {
        const [collection] = await nftPool.getPoolLevelNftAt(PoolLevel.Common, i);
        results.add(collection);
      }

      expect(results.size).to.equal(2); // Both collections represented
    });

    it("Should handle removal of one collection's NFTs correctly", async function () {
      await nftPool.transferNft(await testNft.getAddress(), user2Address, 1);
      await nftPool.transferNft(await testNft.getAddress(), user2Address, 2);

      expect(await nftPool.getPoolLevelSize(PoolLevel.Common)).to.equal(2);

      // Remaining should be from testNft2
      const [coll0] = await nftPool.getPoolLevelNftAt(PoolLevel.Common, 0);
      const [coll1] = await nftPool.getPoolLevelNftAt(PoolLevel.Common, 1);
      expect(coll0).to.equal(await testNft2.getAddress());
      expect(coll1).to.equal(await testNft2.getAddress());
    });
  });

  describe("Rescue NFTs", function () {
    beforeEach(async function () {
      await testNft2.mint(user1Address, 1);
      await testNft2
        .connect(user1)
        ["safeTransferFrom(address,address,uint256)"](user1Address, await nftPool.getAddress(), 1);
    });

    it("Should allow owner to rescue non-tracked NFT", async function () {
      await nftPool.rescueNft(await testNft2.getAddress(), user2Address, 1);
      expect(await testNft2.ownerOf(1)).to.equal(user2Address);
    });

    it("Should emit RescuedNft event", async function () {
      await expect(nftPool.rescueNft(await testNft2.getAddress(), user2Address, 1))
        .to.emit(nftPool, "RescuedNft")
        .withArgs(user2Address, await testNft2.getAddress(), 1);
    });

    it("Should revert when rescuing tracked NFT", async function () {
      await nftPool.configureCollection(await testNft.getAddress(), true, ethers.parseEther("1"));
      await testNft.mint(user1Address, 1);
      await testNft.connect(user1).approve(await nftPool.getAddress(), 1);
      await nftPool.connect(user1).deposit(await testNft.getAddress(), 1);

      await expect(nftPool.rescueNft(await testNft.getAddress(), user2Address, 1)).to.be.revertedWith(
        "NftPool: NFT is tracked",
      );
    });

    it("Should revert when non-owner tries to rescue", async function () {
      await expect(
        nftPool.connect(user1).rescueNft(await testNft2.getAddress(), user2Address, 1),
      ).to.be.revertedWithCustomError(nftPool, "OwnableUnauthorizedAccount");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await nftPool.configureCollection(await testNft.getAddress(), true, ethers.parseEther("0.3"));
      await nftPool.configureCollection(await testNft2.getAddress(), true, ethers.parseEther("15"));

      await testNft.mint(user1Address, 1);
      await testNft.mint(user1Address, 2);
      await testNft.connect(user1).approve(await nftPool.getAddress(), 1);
      await testNft.connect(user1).approve(await nftPool.getAddress(), 2);
      await nftPool.connect(user1).deposit(await testNft.getAddress(), 1);
      await nftPool.connect(user1).deposit(await testNft.getAddress(), 2);

      await testNft2.mint(user1Address, 100);
      await testNft2.connect(user1).approve(await nftPool.getAddress(), 100);
      await nftPool.connect(user1).deposit(await testNft2.getAddress(), 100);
    });

    it("Should return correct total pool size", async function () {
      expect(await nftPool.totalPoolSize()).to.equal(3);
    });

    it("Should return correct level sizes", async function () {
      expect(await nftPool.getPoolLevelSize(PoolLevel.Common)).to.equal(2);
      expect(await nftPool.getPoolLevelSize(PoolLevel.Legendary)).to.equal(1);
      expect(await nftPool.getPoolLevelSize(PoolLevel.Rare)).to.equal(0);
    });

    it("Should return correct floor price", async function () {
      expect(await nftPool.getCollectionFloorPrice(await testNft.getAddress())).to.equal(ethers.parseEther("0.3"));
    });

    it("Should return correct collection info", async function () {
      const [allowed, floorPrice, poolLevel] = await nftPool.getCollectionInfo(await testNft.getAddress());
      expect(allowed).to.be.true;
      expect(floorPrice).to.equal(ethers.parseEther("0.3"));
      expect(poolLevel).to.equal(PoolLevel.Common);
    });

    it("Should return pool collections", async function () {
      const commonCollections = await nftPool.getPoolCollections(PoolLevel.Common);
      expect(commonCollections.length).to.equal(1);
      expect(commonCollections[0]).to.equal(await testNft.getAddress());

      const legendaryCollections = await nftPool.getPoolCollections(PoolLevel.Legendary);
      expect(legendaryCollections.length).to.equal(1);
      expect(legendaryCollections[0]).to.equal(await testNft2.getAddress());
    });

    it("Should check if NFT is in pool", async function () {
      expect(await nftPool.isNftInPool(await testNft.getAddress(), 1)).to.be.true;
      expect(await nftPool.isNftInPool(await testNft.getAddress(), 999)).to.be.false;
    });

    it("Should get NFT pool level", async function () {
      expect(await nftPool.getNftPoolLevel(await testNft.getAddress(), 1)).to.equal(PoolLevel.Common);
      expect(await nftPool.getNftPoolLevel(await testNft2.getAddress(), 100)).to.equal(PoolLevel.Legendary);
    });

    it("Should revert getNftPoolLevel for non-pooled NFT", async function () {
      await expect(nftPool.getNftPoolLevel(await testNft.getAddress(), 999)).to.be.revertedWithCustomError(
        nftPool,
        "NotInPool",
      );
    });

    it("Should revert getPoolLevelNftAt with index out of bounds", async function () {
      await expect(nftPool.getPoolLevelNftAt(PoolLevel.Common, 999)).to.be.revertedWithCustomError(
        nftPool,
        "IndexOutOfBounds",
      );
    });
  });

  describe("Role Management", function () {
    it("Should allow admin to grant POOL_MANAGER_ROLE", async function () {
      await nftPool.grantRole(POOL_MANAGER_ROLE, user1Address);
      expect(await nftPool.hasRole(POOL_MANAGER_ROLE, user1Address)).to.be.true;
    });

    it("Should allow admin to revoke POOL_MANAGER_ROLE", async function () {
      await nftPool.grantRole(POOL_MANAGER_ROLE, user1Address);
      await nftPool.revokeRole(POOL_MANAGER_ROLE, user1Address);
      expect(await nftPool.hasRole(POOL_MANAGER_ROLE, user1Address)).to.be.false;
    });

    it("Should not allow non-admin to grant roles", async function () {
      await expect(nftPool.connect(user1).grantRole(POOL_MANAGER_ROLE, user2Address)).to.be.revertedWithCustomError(
        nftPool,
        "AccessControlUnauthorizedAccount",
      );
    });
  });

  describe("Interface Support", function () {
    it("Should support ERC721Receiver interface", async function () {
      expect(await nftPool.supportsInterface("0x150b7a02")).to.be.true;
    });

    it("Should support AccessControl interface", async function () {
      expect(await nftPool.supportsInterface("0x7965db0b")).to.be.true;
    });
  });
});
