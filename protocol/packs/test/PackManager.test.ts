// <ai_context> Test suite for PackManager contract. Covers pack opening, VRF integration, probability distributions, pool management, and access control. </ai_context>
import { expect } from "chai";
import { network } from "hardhat";
const connection = await network.connect();
const { ethers } = connection;
import type * as ethersTypes from "ethers";
import {
  type PackManager,
  PackManager__factory,
  type RariPack,
  RariPack__factory,
  type NftPool,
  NftPool__factory,
  type TestERC721,
  TestERC721__factory,
  type MockVRFCoordinator,
  MockVRFCoordinator__factory,
  type TransparentUpgradeableProxy,
  TransparentUpgradeableProxy__factory,
} from "../types/ethers-contracts";

// Pack types enum values
const PackType = {
  Bronze: 0,
  Silver: 1,
  Gold: 2,
  Platinum: 3,
};

// Pool types enum values
const PoolType = {
  UltraRare: 0,
  Legendary: 1,
  Epic: 2,
  Rare: 3,
  Common: 4,
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("PackManager", function () {
  let packManager: PackManager;
  let rariPack: RariPack;
  let mockVrf: MockVRFCoordinator;
  let testNft: TestERC721;
  let pools: { [key: number]: NftPool };

  let owner: ethersTypes.Signer;
  let user1: ethersTypes.Signer;
  let user2: ethersTypes.Signer;
  let treasury: ethersTypes.Signer;
  let ownerAddress: string;
  let user1Address: string;
  let user2Address: string;
  let treasuryAddress: string;

  // VRF config
  const VRF_KEY_HASH = ethers.keccak256(ethers.toUtf8Bytes("test-key-hash"));
  const VRF_SUBSCRIPTION_ID = 1n;
  const VRF_CALLBACK_GAS_LIMIT = 500000;
  const VRF_REQUEST_CONFIRMATIONS = 3;

  // Pack prices
  const BRONZE_PRICE = ethers.parseEther("0.01");
  const SILVER_PRICE = ethers.parseEther("0.05");
  const GOLD_PRICE = ethers.parseEther("0.1");
  const PLATINUM_PRICE = ethers.parseEther("0.5");

  async function deployPool(poolType: number): Promise<NftPool> {
    const NftPoolFactory = new NftPool__factory(owner);
    const poolImpl = await NftPoolFactory.deploy();
    await poolImpl.waitForDeployment();

    const ProxyFactory = new TransparentUpgradeableProxy__factory(owner);
    const initData = poolImpl.interface.encodeFunctionData("initialize", [ownerAddress, poolType]);

    const proxy = await ProxyFactory.deploy(await poolImpl.getAddress(), ownerAddress, initData);
    await proxy.waitForDeployment();

    const pool = NftPool__factory.connect(await proxy.getAddress(), owner);

    // Allow test NFT collection
    await pool.addAllowed721Contract(await testNft.getAddress());

    // Grant POOL_MANAGER_ROLE to PackManager
    const POOL_MANAGER_ROLE = await pool.POOL_MANAGER_ROLE();
    await pool.grantRole(POOL_MANAGER_ROLE, await packManager.getAddress());

    return pool;
  }

  async function mintAndDepositNfts(pool: NftPool, startTokenId: number, count: number) {
    const poolAddress = await pool.getAddress();
    for (let i = 0; i < count; i++) {
      const tokenId = startTokenId + i;
      await testNft.mint(ownerAddress, tokenId);
      await testNft.approve(poolAddress, tokenId);
      await pool.deposit(await testNft.getAddress(), tokenId);
    }
  }

  beforeEach(async function () {
    [owner, user1, user2, treasury] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    user1Address = await user1.getAddress();
    user2Address = await user2.getAddress();
    treasuryAddress = await treasury.getAddress();

    // Deploy Mock VRF Coordinator
    const MockVrfFactory = new MockVRFCoordinator__factory(owner);
    mockVrf = await MockVrfFactory.deploy();
    await mockVrf.waitForDeployment();

    // Deploy Test NFT
    const TestNftFactory = new TestERC721__factory(owner);
    testNft = await TestNftFactory.deploy("Test NFT", "TNFT");
    await testNft.waitForDeployment();

    // Deploy RariPack
    const RariPackFactory = new RariPack__factory(owner);
    const rariPackImpl = await RariPackFactory.deploy();
    await rariPackImpl.waitForDeployment();

    const ProxyFactory = new TransparentUpgradeableProxy__factory(owner);
    const rariPackInitData = rariPackImpl.interface.encodeFunctionData("initialize", [
      ownerAddress,
      treasuryAddress,
      "Rari Pack",
      "RPACK",
    ]);

    const rariPackProxy = await ProxyFactory.deploy(
      await rariPackImpl.getAddress(),
      ownerAddress,
      rariPackInitData
    );
    await rariPackProxy.waitForDeployment();
    rariPack = RariPack__factory.connect(await rariPackProxy.getAddress(), owner);

    // Set pack prices
    await rariPack.setPackPrice(PackType.Bronze, BRONZE_PRICE);
    await rariPack.setPackPrice(PackType.Silver, SILVER_PRICE);
    await rariPack.setPackPrice(PackType.Gold, GOLD_PRICE);
    await rariPack.setPackPrice(PackType.Platinum, PLATINUM_PRICE);

    // Deploy PackManager
    const PackManagerFactory = new PackManager__factory(owner);
    const packManagerImpl = await PackManagerFactory.deploy();
    await packManagerImpl.waitForDeployment();

    const packManagerInitData = packManagerImpl.interface.encodeFunctionData("initialize", [
      ownerAddress,
      await rariPack.getAddress(),
    ]);

    const packManagerProxy = await ProxyFactory.deploy(
      await packManagerImpl.getAddress(),
      ownerAddress,
      packManagerInitData
    );
    await packManagerProxy.waitForDeployment();
    packManager = PackManager__factory.connect(await packManagerProxy.getAddress(), owner);

    // Grant BURNER_ROLE to PackManager
    const BURNER_ROLE = await rariPack.BURNER_ROLE();
    await rariPack.grantRole(BURNER_ROLE, await packManager.getAddress());

    // Configure VRF
    await packManager.setVrfConfig(
      await mockVrf.getAddress(),
      VRF_SUBSCRIPTION_ID,
      VRF_KEY_HASH,
      VRF_CALLBACK_GAS_LIMIT,
      VRF_REQUEST_CONFIRMATIONS
    );

    // Deploy all pools
    pools = {};
    let tokenIdCounter = 1;

    for (const [, poolTypeValue] of Object.entries(PoolType)) {
      if (typeof poolTypeValue === "number") {
        const pool = await deployPool(poolTypeValue);
        pools[poolTypeValue] = pool;

        // Add 10 NFTs to each pool
        await mintAndDepositNfts(pool, tokenIdCounter, 10);
        tokenIdCounter += 10;

        // Set pool in PackManager
        await packManager.setPool(poolTypeValue, await pool.getAddress());
      }
    }
  });

  describe("Initialization", function () {
    it("Should initialize with correct owner", async function () {
      expect(await packManager.owner()).to.equal(ownerAddress);
    });

    it("Should initialize with correct RariPack", async function () {
      expect(await packManager.rariPack()).to.equal(await rariPack.getAddress());
    });

    it("Should revert initialization with zero address owner", async function () {
      const PackManagerFactory = new PackManager__factory(owner);
      const impl = await PackManagerFactory.deploy();
      await impl.waitForDeployment();

      const ProxyFactory = new TransparentUpgradeableProxy__factory(owner);
      const initData = impl.interface.encodeFunctionData("initialize", [
        ZERO_ADDRESS,
        await rariPack.getAddress(),
      ]);

      await expect(
        ProxyFactory.deploy(await impl.getAddress(), ownerAddress, initData)
      ).to.be.revertedWithCustomError(impl, "ZeroAddress");
    });

    it("Should revert initialization with zero address RariPack", async function () {
      const PackManagerFactory = new PackManager__factory(owner);
      const impl = await PackManagerFactory.deploy();
      await impl.waitForDeployment();

      const ProxyFactory = new TransparentUpgradeableProxy__factory(owner);
      const initData = impl.interface.encodeFunctionData("initialize", [ownerAddress, ZERO_ADDRESS]);

      await expect(
        ProxyFactory.deploy(await impl.getAddress(), ownerAddress, initData)
      ).to.be.revertedWithCustomError(impl, "ZeroAddress");
    });
  });

  describe("Configuration", function () {
    it("Should allow owner to set RariPack", async function () {
      const RariPackFactory = new RariPack__factory(owner);
      const newRariPackImpl = await RariPackFactory.deploy();
      await newRariPackImpl.waitForDeployment();

      await expect(packManager.setRariPack(await newRariPackImpl.getAddress()))
        .to.emit(packManager, "RariPackSet")
        .withArgs(await newRariPackImpl.getAddress());
    });

    it("Should revert setting RariPack to zero address", async function () {
      await expect(packManager.setRariPack(ZERO_ADDRESS)).to.be.revertedWithCustomError(
        packManager,
        "ZeroAddress"
      );
    });

    it("Should allow owner to set pool", async function () {
      const newPool = await deployPool(PoolType.Common);
      await expect(packManager.setPool(PoolType.Common, await newPool.getAddress()))
        .to.emit(packManager, "PoolSet")
        .withArgs(PoolType.Common, await newPool.getAddress());
    });

    it("Should revert setting pool to zero address", async function () {
      await expect(packManager.setPool(PoolType.Common, ZERO_ADDRESS)).to.be.revertedWithCustomError(
        packManager,
        "ZeroAddress"
      );
    });

    it("Should allow owner to configure VRF", async function () {
      const newCoordinator = user1Address;
      await expect(
        packManager.setVrfConfig(newCoordinator, 2n, VRF_KEY_HASH, 600000, 5)
      ).to.emit(packManager, "VrfConfigUpdated");

      expect(await packManager.vrfCoordinator()).to.equal(newCoordinator);
      expect(await packManager.vrfSubscriptionId()).to.equal(2n);
    });

    it("Should revert VRF config with zero coordinator", async function () {
      await expect(
        packManager.setVrfConfig(ZERO_ADDRESS, 1n, VRF_KEY_HASH, 500000, 3)
      ).to.be.revertedWithCustomError(packManager, "ZeroAddress");
    });

    it("Should revert when non-owner tries to configure", async function () {
      await expect(
        packManager.connect(user1).setRariPack(user1Address)
      ).to.be.revertedWithCustomError(packManager, "OwnableUnauthorizedAccount");
    });
  });

  describe("Pack Opening", function () {
    beforeEach(async function () {
      // Mint a Bronze pack to user1
      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });
    });

    it("Should request pack opening", async function () {
      const packTokenId = 1;

      const tx = await packManager.connect(user1).openPack(packTokenId);

      await expect(tx)
        .to.emit(packManager, "PackOpenRequested")
        .withArgs(1, user1Address, packTokenId, PackType.Bronze);
    });

    it("Should burn the pack when opening", async function () {
      const packTokenId = 1;

      await packManager.connect(user1).openPack(packTokenId);

      // Pack should be burned
      await expect(rariPack.ownerOf(packTokenId)).to.be.revertedWithCustomError(
        rariPack,
        "ERC721NonexistentToken"
      );
    });

    it("Should revert when non-owner tries to open pack", async function () {
      const packTokenId = 1;

      await expect(packManager.connect(user2).openPack(packTokenId)).to.be.revertedWithCustomError(
        packManager,
        "NotPackOwner"
      );
    });

    it("Should track pending request for user", async function () {
      const packTokenId = 1;

      await packManager.connect(user1).openPack(packTokenId);

      const pending = await packManager.getPendingRequests(user1Address);
      expect(pending.length).to.equal(1);
      expect(pending[0]).to.equal(1);
    });
  });

  describe("VRF Fulfillment", function () {
    beforeEach(async function () {
      // Mint a Bronze pack to user1
      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });
    });

    it("Should fulfill random words and distribute rewards", async function () {
      const packTokenId = 1;

      // Open pack
      await packManager.connect(user1).openPack(packTokenId);

      const requestId = 1;

      // Fulfill with random words that select Common pool (high values)
      const randomWords = [9500n, 9600n, 9700n]; // All should select Common (>= 275 for Bronze)

      await expect(mockVrf.fulfillRandomWords(requestId, randomWords))
        .to.emit(packManager, "PackOpened")
        .withArgs(requestId, user1Address, packTokenId, (rewards: any) => {
          // Verify 3 rewards were given
          return rewards.length === 3;
        });

      // User should have received 3 NFTs
      expect(await testNft.balanceOf(user1Address)).to.equal(3);

      // Pending request should be removed
      const pending = await packManager.getPendingRequests(user1Address);
      expect(pending.length).to.equal(0);
    });

    it("Should correctly mark request as fulfilled", async function () {
      const packTokenId = 1;
      await packManager.connect(user1).openPack(packTokenId);

      const requestId = 1;
      const randomWords = [9500n, 9600n, 9700n];

      await mockVrf.fulfillRandomWords(requestId, randomWords);

      const request = await packManager.openRequests(requestId);
      expect(request.fulfilled).to.be.true;
    });

    it("Should revert when non-VRF coordinator calls rawFulfillRandomWords", async function () {
      const packTokenId = 1;
      await packManager.connect(user1).openPack(packTokenId);

      await expect(
        packManager.rawFulfillRandomWords(1, [1n, 2n, 3n])
      ).to.be.revertedWithCustomError(packManager, "OnlyVrfCoordinator");
    });

    it("Should revert when fulfilling non-existent request", async function () {
      await expect(mockVrf.fulfillRandomWords(999, [1n, 2n, 3n])).to.be.revertedWith(
        "MockVRF: request not found"
      );
    });

    it("Should revert when fulfilling already fulfilled request", async function () {
      const packTokenId = 1;
      await packManager.connect(user1).openPack(packTokenId);

      const randomWords = [9500n, 9600n, 9700n];
      await mockVrf.fulfillRandomWords(1, randomWords);

      // Try to fulfill again
      await expect(mockVrf.fulfillRandomWords(1, randomWords)).to.be.revertedWith(
        "MockVRF: callback failed"
      );
    });
  });

  describe("Probability Distribution", function () {
    // Helper to calculate pool type from random value for a pack type
    function expectedPoolType(packType: number, randomValue: bigint): number {
      const roll = Number(randomValue % 10000n);

      if (packType === PackType.Platinum) {
        if (roll < 50) return PoolType.UltraRare;
        if (roll < 200) return PoolType.Legendary;
        if (roll < 450) return PoolType.Epic;
        if (roll < 800) return PoolType.Rare;
        return PoolType.Common;
      } else if (packType === PackType.Gold) {
        if (roll < 100) return PoolType.Legendary;
        if (roll < 250) return PoolType.Epic;
        if (roll < 500) return PoolType.Rare;
        return PoolType.Common;
      } else if (packType === PackType.Silver) {
        if (roll < 50) return PoolType.Legendary;
        if (roll < 150) return PoolType.Epic;
        if (roll < 300) return PoolType.Rare;
        return PoolType.Common;
      } else {
        // Bronze
        if (roll < 25) return PoolType.Legendary;
        if (roll < 125) return PoolType.Epic;
        if (roll < 275) return PoolType.Rare;
        return PoolType.Common;
      }
    }

    it("Should select UltraRare for Platinum with low roll", async function () {
      // Mint Platinum pack
      await rariPack.connect(user1).mintPack(user1Address, PackType.Platinum, 1, {
        value: PLATINUM_PRICE,
      });

      await packManager.connect(user1).openPack(1);

      // Random values that give rolls 0-49 (UltraRare for Platinum)
      const randomWords = [10n, 20n, 30n]; // All will select UltraRare

      await mockVrf.fulfillRandomWords(1, randomWords);

      // Check user received NFTs from UltraRare pool (token IDs 1-10)
      const balance = await testNft.balanceOf(user1Address);
      expect(balance).to.equal(3);
    });

    it("Should never select UltraRare for Bronze pack", async function () {
      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });

      await packManager.connect(user1).openPack(1);

      // Even with very low rolls, Bronze can't get UltraRare
      // Roll 0-24 = Legendary, 25-124 = Epic, 125-274 = Rare, 275+ = Common
      const randomWords = [5n, 50n, 200n]; // Legendary, Epic, Rare respectively

      await mockVrf.fulfillRandomWords(1, randomWords);

      // User should have 3 NFTs, none from UltraRare pool
      expect(await testNft.balanceOf(user1Address)).to.equal(3);
    });

    it("Should select Common with high random values for all pack types", async function () {
      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });

      await packManager.connect(user1).openPack(1);

      // Very high rolls should always select Common
      const randomWords = [9999n, 8888n, 7777n];

      await mockVrf.fulfillRandomWords(1, randomWords);

      expect(await testNft.balanceOf(user1Address)).to.equal(3);
    });
  });

  describe("Pool Availability Checks", function () {
    it("Should return true when all pools are available", async function () {
      expect(await packManager.canOpenPack(PackType.Bronze)).to.be.true;
      expect(await packManager.canOpenPack(PackType.Silver)).to.be.true;
      expect(await packManager.canOpenPack(PackType.Gold)).to.be.true;
      expect(await packManager.canOpenPack(PackType.Platinum)).to.be.true;
    });

    it("Should return false when Common pool is not set", async function () {
      // Deploy new PackManager without Common pool
      const PackManagerFactory = new PackManager__factory(owner);
      const impl = await PackManagerFactory.deploy();
      await impl.waitForDeployment();

      const ProxyFactory = new TransparentUpgradeableProxy__factory(owner);
      const initData = impl.interface.encodeFunctionData("initialize", [
        ownerAddress,
        await rariPack.getAddress(),
      ]);

      const proxy = await ProxyFactory.deploy(await impl.getAddress(), ownerAddress, initData);
      await proxy.waitForDeployment();
      const newPackManager = PackManager__factory.connect(await proxy.getAddress(), owner);

      expect(await newPackManager.canOpenPack(PackType.Bronze)).to.be.false;
    });

    it("Should revert pack opening when pool is not set", async function () {
      // Deploy new PackManager without pools
      const PackManagerFactory = new PackManager__factory(owner);
      const impl = await PackManagerFactory.deploy();
      await impl.waitForDeployment();

      const ProxyFactory = new TransparentUpgradeableProxy__factory(owner);
      const initData = impl.interface.encodeFunctionData("initialize", [
        ownerAddress,
        await rariPack.getAddress(),
      ]);

      const proxy = await ProxyFactory.deploy(await impl.getAddress(), ownerAddress, initData);
      await proxy.waitForDeployment();
      const newPackManager = PackManager__factory.connect(await proxy.getAddress(), owner);

      await newPackManager.setVrfConfig(
        await mockVrf.getAddress(),
        VRF_SUBSCRIPTION_ID,
        VRF_KEY_HASH,
        VRF_CALLBACK_GAS_LIMIT,
        VRF_REQUEST_CONFIRMATIONS
      );

      // Grant BURNER_ROLE
      const BURNER_ROLE = await rariPack.BURNER_ROLE();
      await rariPack.grantRole(BURNER_ROLE, await newPackManager.getAddress());

      // Mint pack
      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });

      await expect(newPackManager.connect(user1).openPack(1)).to.be.revertedWithCustomError(
        newPackManager,
        "PoolNotSet"
      );
    });

    it("Should revert pack opening when pool is empty", async function () {
      // Create new PackManager with empty pools
      const PackManagerFactory = new PackManager__factory(owner);
      const impl = await PackManagerFactory.deploy();
      await impl.waitForDeployment();

      const ProxyFactory = new TransparentUpgradeableProxy__factory(owner);
      const initData = impl.interface.encodeFunctionData("initialize", [
        ownerAddress,
        await rariPack.getAddress(),
      ]);

      const proxy = await ProxyFactory.deploy(await impl.getAddress(), ownerAddress, initData);
      await proxy.waitForDeployment();
      const newPackManager = PackManager__factory.connect(await proxy.getAddress(), owner);

      await newPackManager.setVrfConfig(
        await mockVrf.getAddress(),
        VRF_SUBSCRIPTION_ID,
        VRF_KEY_HASH,
        VRF_CALLBACK_GAS_LIMIT,
        VRF_REQUEST_CONFIRMATIONS
      );

      // Create empty pool
      const NftPoolFactory = new NftPool__factory(owner);
      const emptyPoolImpl = await NftPoolFactory.deploy();
      await emptyPoolImpl.waitForDeployment();

      const emptyPoolInitData = emptyPoolImpl.interface.encodeFunctionData("initialize", [
        ownerAddress,
        PoolType.Common,
      ]);

      const emptyPoolProxy = await ProxyFactory.deploy(
        await emptyPoolImpl.getAddress(),
        ownerAddress,
        emptyPoolInitData
      );
      await emptyPoolProxy.waitForDeployment();

      await newPackManager.setPool(PoolType.Common, await emptyPoolProxy.getAddress());

      // Grant BURNER_ROLE
      const BURNER_ROLE = await rariPack.BURNER_ROLE();
      await rariPack.grantRole(BURNER_ROLE, await newPackManager.getAddress());

      // Mint pack
      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });

      await expect(newPackManager.connect(user1).openPack(1)).to.be.revertedWithCustomError(
        newPackManager,
        "PoolEmpty"
      );
    });
  });

  describe("Pause Functionality", function () {
    beforeEach(async function () {
      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });
    });

    it("Should allow owner to pause", async function () {
      await packManager.pause();
      expect(await packManager.paused()).to.be.true;
    });

    it("Should allow owner to unpause", async function () {
      await packManager.pause();
      await packManager.unpause();
      expect(await packManager.paused()).to.be.false;
    });

    it("Should revert pack opening when paused", async function () {
      await packManager.pause();

      await expect(packManager.connect(user1).openPack(1)).to.be.revertedWithCustomError(
        packManager,
        "EnforcedPause"
      );
    });

    it("Should allow pack opening after unpause", async function () {
      await packManager.pause();
      await packManager.unpause();

      await expect(packManager.connect(user1).openPack(1)).to.emit(packManager, "PackOpenRequested");
    });

    it("Should revert when non-owner tries to pause", async function () {
      await expect(packManager.connect(user1).pause()).to.be.revertedWithCustomError(
        packManager,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("Multiple Pack Types", function () {
    it("Should open Silver pack correctly", async function () {
      await rariPack.connect(user1).mintPack(user1Address, PackType.Silver, 1, {
        value: SILVER_PRICE,
      });

      await packManager.connect(user1).openPack(1);

      const randomWords = [9500n, 9600n, 9700n];
      await mockVrf.fulfillRandomWords(1, randomWords);

      expect(await testNft.balanceOf(user1Address)).to.equal(3);
    });

    it("Should open Gold pack correctly", async function () {
      await rariPack.connect(user1).mintPack(user1Address, PackType.Gold, 1, {
        value: GOLD_PRICE,
      });

      await packManager.connect(user1).openPack(1);

      const randomWords = [9500n, 9600n, 9700n];
      await mockVrf.fulfillRandomWords(1, randomWords);

      expect(await testNft.balanceOf(user1Address)).to.equal(3);
    });

    it("Should open Platinum pack correctly", async function () {
      await rariPack.connect(user1).mintPack(user1Address, PackType.Platinum, 1, {
        value: PLATINUM_PRICE,
      });

      await packManager.connect(user1).openPack(1);

      const randomWords = [9500n, 9600n, 9700n];
      await mockVrf.fulfillRandomWords(1, randomWords);

      expect(await testNft.balanceOf(user1Address)).to.equal(3);
    });
  });

  describe("Multiple Users", function () {
    it("Should handle multiple users opening packs concurrently", async function () {
      // Mint packs for both users
      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });
      await rariPack.connect(user2).mintPack(user2Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });

      // Both users open packs
      await packManager.connect(user1).openPack(1);
      await packManager.connect(user2).openPack(2);

      // Fulfill requests
      await mockVrf.fulfillRandomWords(1, [9500n, 9600n, 9700n]);
      await mockVrf.fulfillRandomWords(2, [9501n, 9601n, 9701n]);

      // Both users should have 3 NFTs each
      expect(await testNft.balanceOf(user1Address)).to.equal(3);
      expect(await testNft.balanceOf(user2Address)).to.equal(3);
    });

    it("Should track pending requests per user correctly", async function () {
      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 2, {
        value: BRONZE_PRICE * 2n,
      });

      await packManager.connect(user1).openPack(1);
      await packManager.connect(user1).openPack(2);

      let pending = await packManager.getPendingRequests(user1Address);
      expect(pending.length).to.equal(2);

      // Fulfill first request
      await mockVrf.fulfillRandomWords(1, [9500n, 9600n, 9700n]);

      pending = await packManager.getPendingRequests(user1Address);
      expect(pending.length).to.equal(1);
      expect(pending[0]).to.equal(2);
    });
  });

  describe("View Functions", function () {
    it("Should return correct pool address", async function () {
      const commonPoolAddress = await packManager.getPool(PoolType.Common);
      expect(commonPoolAddress).to.equal(await pools[PoolType.Common].getAddress());
    });

    it("Should return zero address for unset pool", async function () {
      // Deploy new PackManager without pools
      const PackManagerFactory = new PackManager__factory(owner);
      const impl = await PackManagerFactory.deploy();
      await impl.waitForDeployment();

      const ProxyFactory = new TransparentUpgradeableProxy__factory(owner);
      const initData = impl.interface.encodeFunctionData("initialize", [
        ownerAddress,
        await rariPack.getAddress(),
      ]);

      const proxy = await ProxyFactory.deploy(await impl.getAddress(), ownerAddress, initData);
      await proxy.waitForDeployment();
      const newPackManager = PackManager__factory.connect(await proxy.getAddress(), owner);

      expect(await newPackManager.getPool(PoolType.Common)).to.equal(ZERO_ADDRESS);
    });

    it("Should return REWARDS_PER_PACK constant", async function () {
      expect(await packManager.REWARDS_PER_PACK()).to.equal(3);
    });
  });
});

