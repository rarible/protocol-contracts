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
    const initData = nftPoolImpl.interface.encodeFunctionData("initialize", [ownerAddress]);

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
      const [commonLow, commonHigh] = await nftPool.getPoolPriceRange(PoolLevel.Common);
      expect(commonLow).to.equal(0);
      expect(commonHigh).to.equal(ethers.parseEther("0.5"));

      const [rareLow, rareHigh] = await nftPool.getPoolPriceRange(PoolLevel.Rare);
      expect(rareLow).to.equal(ethers.parseEther("0.5"));
      expect(rareHigh).to.equal(ethers.parseEther("2"));

      const [ultraRareLow] = await nftPool.getPoolPriceRange(PoolLevel.UltraRare);
      expect(ultraRareLow).to.equal(ethers.parseEther("50"));
    });

    it("Should revert initialization with zero address owner", async function () {
      const NftPoolFactory = new NftPool__factory(owner);
      const newPoolImpl = await NftPoolFactory.deploy();
      await newPoolImpl.waitForDeployment();

      const ProxyFactory = new TransparentUpgradeableProxy__factory(owner);
      const initData = newPoolImpl.interface.encodeFunctionData("initialize", [ZERO_ADDRESS]);

      await expect(
        ProxyFactory.deploy(await newPoolImpl.getAddress(), ownerAddress, initData)
      ).to.be.revertedWithCustomError(newPoolImpl, "ZeroAddress");
    });

    it("Should not allow reinitialization", async function () {
      await expect(nftPool.initialize(user1Address)).to.be.revertedWithCustomError(
        nftPool,
        "InvalidInitialization"
      );
    });
  });

  describe("Pool Price Ranges", function () {
    it("Should allow owner to set pool price range", async function () {
      const newLow = ethers.parseEther("0.1");
      const newHigh = ethers.parseEther("1");

      await expect(nftPool.setPoolPriceRange(PoolLevel.Common, newLow, newHigh))
        .to.emit(nftPool, "PoolPriceRangeUpdated")
        .withArgs(PoolLevel.Common, newLow, newHigh);

      const [low, high] = await nftPool.getPoolPriceRange(PoolLevel.Common);
      expect(low).to.equal(newLow);
      expect(high).to.equal(newHigh);
    });

    it("Should allow batch setting all price ranges", async function () {
      await nftPool.setAllPoolPriceRanges(
        [0, ethers.parseEther("1")],
        [ethers.parseEther("1"), ethers.parseEther("5")],
        [ethers.parseEther("5"), ethers.parseEther("20")],
        [ethers.parseEther("20"), ethers.parseEther("100")],
        [ethers.parseEther("100"), ethers.MaxUint256]
      );

      const [commonLow, commonHigh] = await nftPool.getPoolPriceRange(PoolLevel.Common);
      expect(commonLow).to.equal(0);
      expect(commonHigh).to.equal(ethers.parseEther("1"));
    });

    it("Should revert when low >= high", async function () {
      await expect(
        nftPool.setPoolPriceRange(PoolLevel.Common, ethers.parseEther("1"), ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(nftPool, "InvalidPriceRange");

      await expect(
        nftPool.setPoolPriceRange(PoolLevel.Common, ethers.parseEther("2"), ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(nftPool, "InvalidPriceRange");
    });

    it("Should only allow owner to set price ranges", async function () {
      await expect(
        nftPool.connect(user1).setPoolPriceRange(PoolLevel.Common, 0, ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(nftPool, "OwnableUnauthorizedAccount");
    });
  });

  describe("Collection Floor Prices", function () {
    const FLOOR_PRICE = ethers.parseEther("0.3");

    it("Should set floor price for a collection", async function () {
      await expect(nftPool.setCollectionFloorPrice(await testNft.getAddress(), FLOOR_PRICE))
        .to.emit(nftPool, "CollectionFloorPriceUpdated")
        .withArgs(await testNft.getAddress(), 0, FLOOR_PRICE);

      expect(await nftPool.getCollectionFloorPrice(await testNft.getAddress())).to.equal(
        FLOOR_PRICE
      );
      expect(await nftPool.isCollectionConfigured(await testNft.getAddress())).to.be.true;
    });

    it("Should batch set floor prices", async function () {
      const price1 = ethers.parseEther("0.3");
      const price2 = ethers.parseEther("15");

      await nftPool.setCollectionFloorPrices(
        [await testNft.getAddress(), await testNft2.getAddress()],
        [price1, price2]
      );

      expect(await nftPool.getCollectionFloorPrice(await testNft.getAddress())).to.equal(price1);
      expect(await nftPool.getCollectionFloorPrice(await testNft2.getAddress())).to.equal(price2);
    });

    it("Should determine pool level automatically from floor price", async function () {
      // Common: 0 - 0.5 ETH
      await nftPool.setCollectionFloorPrice(await testNft.getAddress(), ethers.parseEther("0.3"));
      expect(await nftPool.getCollectionPoolLevel(await testNft.getAddress())).to.equal(
        PoolLevel.Common
      );

      // Rare: 0.5 - 2 ETH
      await nftPool.setCollectionFloorPrice(await testNft.getAddress(), ethers.parseEther("1"));
      expect(await nftPool.getCollectionPoolLevel(await testNft.getAddress())).to.equal(
        PoolLevel.Rare
      );

      // Epic: 2 - 10 ETH
      await nftPool.setCollectionFloorPrice(await testNft.getAddress(), ethers.parseEther("5"));
      expect(await nftPool.getCollectionPoolLevel(await testNft.getAddress())).to.equal(
        PoolLevel.Epic
      );

      // Legendary: 10 - 50 ETH
      await nftPool.setCollectionFloorPrice(await testNft.getAddress(), ethers.parseEther("25"));
      expect(await nftPool.getCollectionPoolLevel(await testNft.getAddress())).to.equal(
        PoolLevel.Legendary
      );

      // UltraRare: 50+ ETH
      await nftPool.setCollectionFloorPrice(await testNft.getAddress(), ethers.parseEther("100"));
      expect(await nftPool.getCollectionPoolLevel(await testNft.getAddress())).to.equal(
        PoolLevel.UltraRare
      );
    });

    it("Should mark collection as not configured when floor price is 0", async function () {
      await nftPool.setCollectionFloorPrice(await testNft.getAddress(), FLOOR_PRICE);
      expect(await nftPool.isCollectionConfigured(await testNft.getAddress())).to.be.true;

      await nftPool.setCollectionFloorPrice(await testNft.getAddress(), 0);
      expect(await nftPool.isCollectionConfigured(await testNft.getAddress())).to.be.false;
    });

    it("Should revert with zero address", async function () {
      await expect(
        nftPool.setCollectionFloorPrice(ZERO_ADDRESS, FLOOR_PRICE)
      ).to.be.revertedWithCustomError(nftPool, "ZeroAddress");
    });

    it("Should revert batch set with mismatched arrays", async function () {
      await expect(
        nftPool.setCollectionFloorPrices([await testNft.getAddress()], [FLOOR_PRICE, FLOOR_PRICE])
      ).to.be.revertedWithCustomError(nftPool, "ArrayLengthMismatch");
    });

    it("Should only allow owner to set floor prices", async function () {
      await expect(
        nftPool.connect(user1).setCollectionFloorPrice(await testNft.getAddress(), FLOOR_PRICE)
      ).to.be.revertedWithCustomError(nftPool, "OwnableUnauthorizedAccount");
    });
  });

  describe("Depositing NFTs", function () {
    beforeEach(async function () {
      // Configure testNft with Common-level floor price
      await nftPool.setCollectionFloorPrice(await testNft.getAddress(), ethers.parseEther("0.3"));

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
      await nftPool.setCollectionFloorPrice(await testNft2.getAddress(), ethers.parseEther("15"));

      await testNft2.mint(user1Address, 100);
      await testNft2.connect(user1).approve(await nftPool.getAddress(), 100);
      await nftPool.connect(user1).deposit(await testNft2.getAddress(), 100);

      expect(await nftPool.getPoolLevelSize(PoolLevel.Legendary)).to.equal(1);
      expect(await nftPool.getNftPoolLevel(await testNft2.getAddress(), 100)).to.equal(
        PoolLevel.Legendary
      );
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

    it("Should revert when collection not configured", async function () {
      await testNft2.mint(user1Address, 1);
      await testNft2.connect(user1).approve(await nftPool.getAddress(), 1);

      await expect(
        nftPool.connect(user1).deposit(await testNft2.getAddress(), 1)
      ).to.be.revertedWithCustomError(nftPool, "CollectionNotConfigured");
    });

    it("Should return correct NFT info at level index", async function () {
      await testNft.connect(user1).approve(await nftPool.getAddress(), 1);
      await nftPool.connect(user1).deposit(await testNft.getAddress(), 1);

      const [collection, tokenId] = await nftPool.getPoolLevelNftAt(PoolLevel.Common, 0);
      expect(collection).to.equal(await testNft.getAddress());
      expect(tokenId).to.equal(1);
    });
  });

  describe("Floor Price Changes", function () {
    beforeEach(async function () {
      await nftPool.setCollectionFloorPrice(await testNft.getAddress(), ethers.parseEther("0.3"));

      await testNft.mint(user1Address, 1);
      await testNft.mint(user1Address, 2);
      await testNft.connect(user1).approve(await nftPool.getAddress(), 1);
      await nftPool.connect(user1).deposit(await testNft.getAddress(), 1);
    });

    it("Should keep existing NFTs in their original pool when floor price changes", async function () {
      expect(await nftPool.getNftPoolLevel(await testNft.getAddress(), 1)).to.equal(PoolLevel.Common);

      await nftPool.setCollectionFloorPrice(await testNft.getAddress(), ethers.parseEther("15"));

      // NFT 1 should still be in Common pool
      expect(await nftPool.getNftPoolLevel(await testNft.getAddress(), 1)).to.equal(PoolLevel.Common);
      expect(await nftPool.getPoolLevelSize(PoolLevel.Common)).to.equal(1);
    });

    it("Should deposit new NFTs at new pool level after floor price change", async function () {
      expect(await nftPool.getPoolLevelSize(PoolLevel.Common)).to.equal(1);

      await nftPool.setCollectionFloorPrice(await testNft.getAddress(), ethers.parseEther("15"));

      await testNft.connect(user1).approve(await nftPool.getAddress(), 2);
      await nftPool.connect(user1).deposit(await testNft.getAddress(), 2);

      expect(await nftPool.getNftPoolLevel(await testNft.getAddress(), 2)).to.equal(
        PoolLevel.Legendary
      );
      expect(await nftPool.getPoolLevelSize(PoolLevel.Legendary)).to.equal(1);
      expect(await nftPool.getPoolLevelSize(PoolLevel.Common)).to.equal(1);
    });
  });

  describe("Withdrawing NFTs", function () {
    beforeEach(async function () {
      await nftPool.setCollectionFloorPrice(await testNft.getAddress(), ethers.parseEther("1"));

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
        nftPool.connect(user1).transferNft(await testNft.getAddress(), user2Address, 1)
      ).to.be.revertedWithCustomError(nftPool, "AccessControlUnauthorizedAccount");
    });

    it("Should revert when transferring NFT not in pool", async function () {
      await expect(
        nftPool.transferNft(await testNft.getAddress(), user2Address, 999)
      ).to.be.revertedWithCustomError(nftPool, "NotInPool");
    });
  });

  describe("Select and Transfer from Level", function () {
    beforeEach(async function () {
      await nftPool.setCollectionFloorPrice(await testNft.getAddress(), ethers.parseEther("5"));

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

    it("Should revert when level is empty", async function () {
      await expect(
        nftPool.selectAndTransferFromLevel(PoolLevel.UltraRare, 0n, user2Address)
      ).to.be.revertedWithCustomError(nftPool, "LevelEmpty");
    });

    it("Should only allow POOL_MANAGER_ROLE", async function () {
      await expect(
        nftPool.connect(user1).selectAndTransferFromLevel(PoolLevel.Epic, 0n, user2Address)
      ).to.be.revertedWithCustomError(nftPool, "AccessControlUnauthorizedAccount");
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
      await nftPool.setCollectionFloorPrice(await testNft.getAddress(), ethers.parseEther("1"));
      await testNft.mint(user1Address, 1);
      await testNft.connect(user1).approve(await nftPool.getAddress(), 1);
      await nftPool.connect(user1).deposit(await testNft.getAddress(), 1);

      await expect(
        nftPool.rescueNft(await testNft.getAddress(), user2Address, 1)
      ).to.be.revertedWith("NftPool: NFT is tracked");
    });

    it("Should revert when non-owner tries to rescue", async function () {
      await expect(
        nftPool.connect(user1).rescueNft(await testNft2.getAddress(), user2Address, 1)
      ).to.be.revertedWithCustomError(nftPool, "OwnableUnauthorizedAccount");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await nftPool.setCollectionFloorPrice(await testNft.getAddress(), ethers.parseEther("0.3"));
      await nftPool.setCollectionFloorPrice(await testNft2.getAddress(), ethers.parseEther("15"));

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
      expect(await nftPool.getCollectionFloorPrice(await testNft.getAddress())).to.equal(
        ethers.parseEther("0.3")
      );
    });

    it("Should check if NFT is in pool", async function () {
      expect(await nftPool.isNftInPool(await testNft.getAddress(), 1)).to.be.true;
      expect(await nftPool.isNftInPool(await testNft.getAddress(), 999)).to.be.false;
    });

    it("Should get NFT pool level", async function () {
      expect(await nftPool.getNftPoolLevel(await testNft.getAddress(), 1)).to.equal(PoolLevel.Common);
      expect(await nftPool.getNftPoolLevel(await testNft2.getAddress(), 100)).to.equal(
        PoolLevel.Legendary
      );
    });

    it("Should revert getNftPoolLevel for non-pooled NFT", async function () {
      await expect(nftPool.getNftPoolLevel(await testNft.getAddress(), 999)).to.be.revertedWith(
        "NftPool: not in pool"
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
      await expect(
        nftPool.connect(user1).grantRole(POOL_MANAGER_ROLE, user2Address)
      ).to.be.revertedWithCustomError(nftPool, "AccessControlUnauthorizedAccount");
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
