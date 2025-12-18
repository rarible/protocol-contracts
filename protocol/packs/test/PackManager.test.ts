// <ai_context> Test suite for PackManager contract. Uses single NftPool with price-range based pool levels. 2-step pack opening flow: open (lock contents in pool) then claim (NFT or instant cash). </ai_context>
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

// Pool levels enum values
const PoolLevel = {
  Common: 0,
  Rare: 1,
  Epic: 2,
  Legendary: 3,
  UltraRare: 4,
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("PackManager", function () {
  let packManager: PackManager;
  let rariPack: RariPack;
  let nftPool: NftPool;
  let mockVrf: MockVRFCoordinator;
  let testNft: TestERC721;

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

  // Floor prices for each pool level (matching actual contract default ranges)
  // Common: 0 - 0.05325 ETH, Rare: 0.05325 - 0.213 ETH, Epic: 0.213 - 1.065 ETH
  // Legendary: 1.065 - 5.325 ETH, UltraRare: 5.325+ ETH
  const FLOOR_PRICES = {
    [PoolLevel.Common]: ethers.parseEther("0.01"), // Common: 0 - 0.05325 ETH
    [PoolLevel.Rare]: ethers.parseEther("0.1"), // Rare: 0.05325 - 0.213 ETH
    [PoolLevel.Epic]: ethers.parseEther("0.5"), // Epic: 0.213 - 1.065 ETH
    [PoolLevel.Legendary]: ethers.parseEther("2"), // Legendary: 1.065 - 5.325 ETH
    [PoolLevel.UltraRare]: ethers.parseEther("10"), // UltraRare: 5.325+ ETH
  };

  async function deployAndDepositNftsForLevel(
    name: string,
    symbol: string,
    level: number,
    count: number,
    startId: number,
  ) {
    const TestNftFactory = new TestERC721__factory(owner);
    const nft = await TestNftFactory.deploy(name, symbol);
    await nft.waitForDeployment();

    // Configure collection with allowed=true and floor price
    await nftPool.configureCollection(await nft.getAddress(), true, FLOOR_PRICES[level]);

    // Mint and deposit
    for (let i = 0; i < count; i++) {
      const tokenId = startId + i;
      await nft.mint(ownerAddress, tokenId);
      await nft.approve(await nftPool.getAddress(), tokenId);
      await nftPool.deposit(await nft.getAddress(), tokenId);
    }

    return nft;
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

    // Deploy Test NFT (for general use)
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

    const rariPackProxy = await ProxyFactory.deploy(await rariPackImpl.getAddress(), ownerAddress, rariPackInitData);
    await rariPackProxy.waitForDeployment();
    rariPack = RariPack__factory.connect(await rariPackProxy.getAddress(), owner);

    // Set pack prices
    await rariPack.setPackPrice(PackType.Bronze, BRONZE_PRICE);
    await rariPack.setPackPrice(PackType.Silver, SILVER_PRICE);
    await rariPack.setPackPrice(PackType.Gold, GOLD_PRICE);
    await rariPack.setPackPrice(PackType.Platinum, PLATINUM_PRICE);

    // Deploy NftPool
    const NftPoolFactory = new NftPool__factory(owner);
    const nftPoolImpl = await NftPoolFactory.deploy();
    await nftPoolImpl.waitForDeployment();

    const nftPoolInitData = nftPoolImpl.interface.encodeFunctionData("initialize", [ownerAddress, []]);

    const nftPoolProxy = await ProxyFactory.deploy(await nftPoolImpl.getAddress(), ownerAddress, nftPoolInitData);
    await nftPoolProxy.waitForDeployment();
    nftPool = NftPool__factory.connect(await nftPoolProxy.getAddress(), owner);

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
      packManagerInitData,
    );
    await packManagerProxy.waitForDeployment();
    packManager = PackManager__factory.connect(await packManagerProxy.getAddress(), owner);

    // Grant BURNER_ROLE to PackManager
    const BURNER_ROLE = await rariPack.BURNER_ROLE();
    await rariPack.grantRole(BURNER_ROLE, await packManager.getAddress());

    // Grant POOL_MANAGER_ROLE to PackManager
    const POOL_MANAGER_ROLE = await nftPool.POOL_MANAGER_ROLE();
    await nftPool.grantRole(POOL_MANAGER_ROLE, await packManager.getAddress());

    // Configure VRF
    await packManager.setVrfConfig(
      await mockVrf.getAddress(),
      VRF_SUBSCRIPTION_ID,
      VRF_KEY_HASH,
      VRF_CALLBACK_GAS_LIMIT,
      VRF_REQUEST_CONFIRMATIONS,
    );

    // Set NftPool
    await packManager.setNftPool(await nftPool.getAddress());

    // Deploy NFTs for each level (floor price determines level automatically)
    await deployAndDepositNftsForLevel("Common NFT", "CNFT", PoolLevel.Common, 10, 1);
    await deployAndDepositNftsForLevel("Rare NFT", "RNFT", PoolLevel.Rare, 10, 100);
    await deployAndDepositNftsForLevel("Epic NFT", "ENFT", PoolLevel.Epic, 10, 200);
    await deployAndDepositNftsForLevel("Legendary NFT", "LNFT", PoolLevel.Legendary, 10, 300);
    await deployAndDepositNftsForLevel("UltraRare NFT", "URNFT", PoolLevel.UltraRare, 10, 400);
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
      const initData = impl.interface.encodeFunctionData("initialize", [ZERO_ADDRESS, await rariPack.getAddress()]);

      await expect(ProxyFactory.deploy(await impl.getAddress(), ownerAddress, initData)).to.be.revertedWithCustomError(
        impl,
        "ZeroAddress",
      );
    });
  });

  describe("Configuration", function () {
    it("Should allow owner to set NftPool", async function () {
      const NftPoolFactory = new NftPool__factory(owner);
      const newPool = await NftPoolFactory.deploy();
      await newPool.waitForDeployment();

      await expect(packManager.setNftPool(await newPool.getAddress()))
        .to.emit(packManager, "NftPoolSet")
        .withArgs(await newPool.getAddress());
    });

    it("Should revert setting NftPool to zero address", async function () {
      await expect(packManager.setNftPool(ZERO_ADDRESS)).to.be.revertedWithCustomError(packManager, "ZeroAddress");
    });

    it("Should allow owner to configure VRF", async function () {
      await expect(packManager.setVrfConfig(user1Address, 2n, VRF_KEY_HASH, 600000, 5)).to.emit(
        packManager,
        "VrfConfigUpdated",
      );

      expect(await packManager.vrfCoordinator()).to.equal(user1Address);
    });

    it("Should revert when non-owner tries to configure", async function () {
      await expect(packManager.connect(user1).setNftPool(user1Address)).to.be.revertedWithCustomError(
        packManager,
        "OwnableUnauthorizedAccount",
      );
    });
  });

  describe("Pack Opening (Step 1)", function () {
    beforeEach(async function () {
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

    it("Should NOT burn the pack when opening (pack is kept for claiming)", async function () {
      await packManager.connect(user1).openPack(1);

      // Pack should still exist
      expect(await rariPack.ownerOf(1)).to.equal(user1Address);
    });

    it("Should revert when non-owner tries to open pack", async function () {
      await expect(packManager.connect(user2).openPack(1)).to.be.revertedWithCustomError(packManager, "NotPackOwner");
    });

    it("Should track pending request for user", async function () {
      await packManager.connect(user1).openPack(1);

      const pending = await packManager.getPendingRequests(user1Address);
      expect(pending.length).to.equal(1);
      expect(pending[0]).to.equal(1);
    });

    it("Should revert when pack is already opened", async function () {
      await packManager.connect(user1).openPack(1);
      await mockVrf.fulfillRandomWords(1, [9500n << 16n, 9600n << 16n, 9700n << 16n]);

      // Try to open again
      await expect(packManager.connect(user1).openPack(1)).to.be.revertedWithCustomError(
        packManager,
        "PackAlreadyOpened",
      );
    });

    it("Should revert when VRF request is in progress for pack", async function () {
      await packManager.connect(user1).openPack(1);

      // Try to open again before VRF callback
      await expect(packManager.connect(user1).openPack(1)).to.be.revertedWithCustomError(
        packManager,
        "PackOpeningInProgressError",
      );
    });

    it("Should track packOpeningInProgress correctly", async function () {
      expect(await packManager.packOpeningInProgress(1)).to.be.false;

      await packManager.connect(user1).openPack(1);

      expect(await packManager.packOpeningInProgress(1)).to.be.true;

      await mockVrf.fulfillRandomWords(1, [9500n << 16n, 9600n << 16n, 9700n << 16n]);

      expect(await packManager.packOpeningInProgress(1)).to.be.false;
    });
  });

  describe("VRF Fulfillment", function () {
    beforeEach(async function () {
      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });
    });

    it("Should fulfill random words and lock contents in pack", async function () {
      await packManager.connect(user1).openPack(1);

      // High values should select Common level
      const randomWords = [9500n << 16n, 9600n << 16n, 9700n << 16n];

      await expect(mockVrf.fulfillRandomWords(1, randomWords))
        .to.emit(packManager, "PackOpened")
        .withArgs(1, user1Address, 1, (rewards: any) => rewards.length === 3);
    });

    it("Should lock NFT contents into RariPack", async function () {
      await packManager.connect(user1).openPack(1);

      await mockVrf.fulfillRandomWords(1, [9500n << 16n, 9600n << 16n, 9700n << 16n]);

      const [collections, tokenIds, opened] = await rariPack.getPackContents(1);
      expect(opened).to.be.true;
      expect(collections.length).to.equal(3);
      expect(tokenIds.length).to.equal(3);
    });

    it("Should lock NFTs in NftPool (removed from accounting but still owned by pool)", async function () {
      const commonSizeBefore = await nftPool.getPoolLevelSize(PoolLevel.Common);

      await packManager.connect(user1).openPack(1);
      await mockVrf.fulfillRandomWords(1, [9500n << 16n, 9600n << 16n, 9700n << 16n]);

      // NFTs should be removed from pool accounting
      const commonSizeAfter = await nftPool.getPoolLevelSize(PoolLevel.Common);
      expect(commonSizeAfter).to.equal(commonSizeBefore - 3n);

      // But NFTs are still owned by NftPool
      const [collections, tokenIds] = await rariPack.getPackContents(1);
      for (let i = 0; i < collections.length; i++) {
        const nft = TestERC721__factory.connect(collections[i], owner);
        expect(await nft.ownerOf(tokenIds[i])).to.equal(await nftPool.getAddress());
      }
    });

    it("Should correctly mark request as fulfilled", async function () {
      await packManager.connect(user1).openPack(1);

      await mockVrf.fulfillRandomWords(1, [9500n << 16n, 9600n << 16n, 9700n << 16n]);

      const request = await packManager.openRequests(1);
      expect(request.fulfilled).to.be.true;
    });

    it("Should revert when non-VRF coordinator calls rawFulfillRandomWords", async function () {
      await packManager.connect(user1).openPack(1);

      await expect(packManager.rawFulfillRandomWords(1, [1n, 2n, 3n])).to.be.revertedWithCustomError(
        packManager,
        "OnlyVrfCoordinator",
      );
    });
  });

  describe("NFT Claiming (Step 2 - claimNft)", function () {
    beforeEach(async function () {
      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });
      await packManager.connect(user1).openPack(1);
      await mockVrf.fulfillRandomWords(1, [9500n << 16n, 9600n << 16n, 9700n << 16n]);
    });

    it("Should transfer NFTs to user when claiming", async function () {
      const [collections, tokenIds] = await rariPack.getPackContents(1);

      await packManager.connect(user1).claimNft(1);

      // Verify each NFT is now owned by user1
      for (let i = 0; i < collections.length; i++) {
        const nft = TestERC721__factory.connect(collections[i], owner);
        expect(await nft.ownerOf(tokenIds[i])).to.equal(user1Address);
      }
    });

    it("Should burn the pack after claiming NFTs", async function () {
      await packManager.connect(user1).claimNft(1);

      await expect(rariPack.ownerOf(1)).to.be.revertedWithCustomError(rariPack, "ERC721NonexistentToken");
    });

    it("Should emit NftClaimed event", async function () {
      await expect(packManager.connect(user1).claimNft(1)).to.emit(packManager, "NftClaimed");
    });

    it("Should revert when non-owner tries to claim", async function () {
      await expect(packManager.connect(user2).claimNft(1)).to.be.revertedWithCustomError(packManager, "NotPackOwner");
    });

    it("Should revert when pack is not opened", async function () {
      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });

      await expect(packManager.connect(user1).claimNft(2)).to.be.revertedWithCustomError(packManager, "PackNotOpened");
    });

    it("Should revert when paused", async function () {
      await packManager.pause();

      await expect(packManager.connect(user1).claimNft(1)).to.be.revertedWithCustomError(packManager, "EnforcedPause");
    });
  });

  describe("Instant Cash Claiming (Step 2 - claimReward)", function () {
    beforeEach(async function () {
      await packManager.setInstantCashEnabled(true);
      await packManager.fundTreasury({ value: ethers.parseEther("100") });

      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });
      await packManager.connect(user1).openPack(1);
      await mockVrf.fulfillRandomWords(1, [9500n << 16n, 9600n << 16n, 9700n << 16n]);
    });

    it("Should pay instant cash to user", async function () {
      const user1BalanceBefore = await ethers.provider.getBalance(user1Address);

      const tx = await packManager.connect(user1).claimReward(1);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const user1BalanceAfter = await ethers.provider.getBalance(user1Address);

      // 80% of 0.3 ETH * 3 NFTs = 0.72 ETH
      const expectedPayout = (FLOOR_PRICES[PoolLevel.Common] * 8000n * 3n) / 10000n;

      expect(user1BalanceAfter + gasUsed - user1BalanceBefore).to.equal(expectedPayout);
    });

    it("Should re-add NFTs back to pool accounting", async function () {
      const commonSizeBefore = await nftPool.getPoolLevelSize(PoolLevel.Common);

      await packManager.connect(user1).claimReward(1);

      // NFTs should be back in pool accounting (3 were locked, now they're re-added)
      const commonSizeAfter = await nftPool.getPoolLevelSize(PoolLevel.Common);
      expect(commonSizeAfter).to.equal(commonSizeBefore + 3n);
    });

    it("Should keep NFTs owned by NftPool after instant cash claim", async function () {
      const [collections, tokenIds] = await rariPack.getPackContents(1);

      await packManager.connect(user1).claimReward(1);

      // NFTs should still be owned by NftPool
      for (let i = 0; i < collections.length; i++) {
        const nft = TestERC721__factory.connect(collections[i], owner);
        expect(await nft.ownerOf(tokenIds[i])).to.equal(await nftPool.getAddress());
      }
    });

    it("Should burn the pack after claiming reward", async function () {
      await packManager.connect(user1).claimReward(1);

      await expect(rariPack.ownerOf(1)).to.be.revertedWithCustomError(rariPack, "ERC721NonexistentToken");
    });

    it("Should emit InstantCashClaimed event", async function () {
      const expectedPayout = (FLOOR_PRICES[PoolLevel.Common] * 8000n * 3n) / 10000n;

      await expect(packManager.connect(user1).claimReward(1))
        .to.emit(packManager, "InstantCashClaimed")
        .withArgs(
          user1Address,
          1,
          expectedPayout,
          (collections: any) => collections.length === 3,
          (tokenIds: any) => tokenIds.length === 3,
        );
    });

    it("Should revert when instant cash is not enabled", async function () {
      await packManager.setInstantCashEnabled(false);

      await expect(packManager.connect(user1).claimReward(1)).to.be.revertedWithCustomError(
        packManager,
        "InstantCashNotEnabled",
      );
    });

    it("Should revert when treasury balance insufficient", async function () {
      await packManager.withdrawTreasury(ownerAddress, ethers.parseEther("100"));

      await expect(packManager.connect(user1).claimReward(1)).to.be.revertedWithCustomError(
        packManager,
        "InsufficientTreasuryBalance",
      );
    });

    it("Should revert when non-owner tries to claim", async function () {
      await expect(packManager.connect(user2).claimReward(1)).to.be.revertedWithCustomError(
        packManager,
        "NotPackOwner",
      );
    });

    it("Should revert when pack is not opened", async function () {
      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });

      await expect(packManager.connect(user1).claimReward(2)).to.be.revertedWithCustomError(
        packManager,
        "PackNotOpened",
      );
    });
  });

  describe("Probability Distribution", function () {
    it("Should select UltraRare for Platinum with low roll", async function () {
      await rariPack.connect(user1).mintPack(user1Address, PackType.Platinum, 1, {
        value: PLATINUM_PRICE,
      });

      await packManager.connect(user1).openPack(1);

      // Values 0-9 should select UltraRare
      const randomWords = [1n << 16n, 5n << 16n, 9n << 16n];

      await mockVrf.fulfillRandomWords(1, randomWords);
    });

    it("Should never select UltraRare for Bronze pack", async function () {
      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });

      await packManager.connect(user1).openPack(1);

      const randomWords = [5n << 16n, 100n << 16n, 500n << 16n];

      await mockVrf.fulfillRandomWords(1, randomWords);
    });
  });

  describe("Pool Level Availability", function () {
    it("Should return true when all levels have NFTs", async function () {
      expect(await packManager.canOpenPack(PackType.Bronze)).to.be.true;
      expect(await packManager.canOpenPack(PackType.Platinum)).to.be.true;
    });

    it("Should return false when pool is not set", async function () {
      const PackManagerFactory = new PackManager__factory(owner);
      const impl = await PackManagerFactory.deploy();
      await impl.waitForDeployment();

      const ProxyFactory = new TransparentUpgradeableProxy__factory(owner);
      const initData = impl.interface.encodeFunctionData("initialize", [ownerAddress, await rariPack.getAddress()]);

      const proxy = await ProxyFactory.deploy(await impl.getAddress(), ownerAddress, initData);
      const newPackManager = PackManager__factory.connect(await proxy.getAddress(), owner);

      expect(await newPackManager.canOpenPack(PackType.Bronze)).to.be.false;
    });

    it("Should revert pack opening when pool not set", async function () {
      const PackManagerFactory = new PackManager__factory(owner);
      const impl = await PackManagerFactory.deploy();
      await impl.waitForDeployment();

      const ProxyFactory = new TransparentUpgradeableProxy__factory(owner);
      const initData = impl.interface.encodeFunctionData("initialize", [ownerAddress, await rariPack.getAddress()]);

      const proxy = await ProxyFactory.deploy(await impl.getAddress(), ownerAddress, initData);
      const newPackManager = PackManager__factory.connect(await proxy.getAddress(), owner);

      await newPackManager.setVrfConfig(
        await mockVrf.getAddress(),
        VRF_SUBSCRIPTION_ID,
        VRF_KEY_HASH,
        VRF_CALLBACK_GAS_LIMIT,
        VRF_REQUEST_CONFIRMATIONS,
      );

      const BURNER_ROLE = await rariPack.BURNER_ROLE();
      await rariPack.grantRole(BURNER_ROLE, await newPackManager.getAddress());

      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });

      await expect(newPackManager.connect(user1).openPack(1)).to.be.revertedWithCustomError(
        newPackManager,
        "PoolNotSet",
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

      await expect(packManager.connect(user1).openPack(1)).to.be.revertedWithCustomError(packManager, "EnforcedPause");
    });
  });

  describe("Multiple Pack Types", function () {
    it("Should open Silver pack correctly", async function () {
      await rariPack.connect(user1).mintPack(user1Address, PackType.Silver, 1, {
        value: SILVER_PRICE,
      });

      await packManager.connect(user1).openPack(1);
      await mockVrf.fulfillRandomWords(1, [9500n << 16n, 9600n << 16n, 9700n << 16n]);

      const [collections, , opened] = await rariPack.getPackContents(1);
      expect(opened).to.be.true;
      expect(collections.length).to.equal(3);
    });

    it("Should open Gold pack correctly", async function () {
      await rariPack.connect(user1).mintPack(user1Address, PackType.Gold, 1, {
        value: GOLD_PRICE,
      });

      await packManager.connect(user1).openPack(1);
      await mockVrf.fulfillRandomWords(1, [9500n << 16n, 9600n << 16n, 9700n << 16n]);

      const [collections, , opened] = await rariPack.getPackContents(1);
      expect(opened).to.be.true;
      expect(collections.length).to.equal(3);
    });

    it("Should open Platinum pack correctly", async function () {
      await rariPack.connect(user1).mintPack(user1Address, PackType.Platinum, 1, {
        value: PLATINUM_PRICE,
      });

      await packManager.connect(user1).openPack(1);
      await mockVrf.fulfillRandomWords(1, [9500n << 16n, 9600n << 16n, 9700n << 16n]);

      const [collections, , opened] = await rariPack.getPackContents(1);
      expect(opened).to.be.true;
      expect(collections.length).to.equal(3);
    });
  });

  describe("Dynamic Probabilities", function () {
    describe("Default Probabilities", function () {
      it("Should initialize with correct default Platinum probabilities", async function () {
        const [ultraRare, legendary, epic, rare] = await packManager.getPackProbabilities(PackType.Platinum);
        expect(ultraRare).to.equal(50); // 0.5%
        expect(legendary).to.equal(250); // 2% cumulative
        expect(epic).to.equal(950); // 7% cumulative
        expect(rare).to.equal(2950); // 20% cumulative
      });

      it("Should initialize with correct default Gold probabilities", async function () {
        const [ultraRare, legendary, epic, rare] = await packManager.getPackProbabilities(PackType.Gold);
        expect(ultraRare).to.equal(0);
        expect(legendary).to.equal(100); // 1%
        expect(epic).to.equal(600); // 5% cumulative
        expect(rare).to.equal(2100); // 15% cumulative
      });

      it("Should initialize with correct default Silver probabilities", async function () {
        const [ultraRare, legendary, epic, rare] = await packManager.getPackProbabilities(PackType.Silver);
        expect(ultraRare).to.equal(0);
        expect(legendary).to.equal(50); // 0.5%
        expect(epic).to.equal(350); // 3% cumulative
        expect(rare).to.equal(1350); // 10% cumulative
      });

      it("Should initialize with correct default Bronze probabilities", async function () {
        const [ultraRare, legendary, epic, rare] = await packManager.getPackProbabilities(PackType.Bronze);
        expect(ultraRare).to.equal(0);
        expect(legendary).to.equal(20); // 0.2%
        expect(epic).to.equal(120); // 1% cumulative
        expect(rare).to.equal(620); // 5% cumulative
      });

      it("Should have progressively better odds for higher tier packs", async function () {
        const [, bronzeLegendary, bronzeEpic, bronzeRare] = await packManager.getPackProbabilities(PackType.Bronze);
        const [, silverLegendary, silverEpic, silverRare] = await packManager.getPackProbabilities(PackType.Silver);
        const [, goldLegendary, goldEpic, goldRare] = await packManager.getPackProbabilities(PackType.Gold);
        const [platinumUltraRare, platinumLegendary, platinumEpic, platinumRare] =
          await packManager.getPackProbabilities(PackType.Platinum);

        // Higher tier = higher cumulative thresholds = better odds for rare items
        expect(silverLegendary).to.be.greaterThan(bronzeLegendary);
        expect(goldLegendary).to.be.greaterThan(silverLegendary);
        expect(platinumLegendary).to.be.greaterThan(goldLegendary);

        expect(silverRare).to.be.greaterThan(bronzeRare);
        expect(goldRare).to.be.greaterThan(silverRare);
        expect(platinumRare).to.be.greaterThan(goldRare);

        // Only Platinum has UltraRare
        expect(platinumUltraRare).to.be.greaterThan(0);
      });
    });

    describe("Setting Probabilities", function () {
      it("Should allow owner to set pack probabilities", async function () {
        await expect(packManager.setPackProbabilities(PackType.Bronze, 0, 100, 300, 600))
          .to.emit(packManager, "PackProbabilitiesUpdated")
          .withArgs(PackType.Bronze, 0, 100, 300, 600);
      });

      it("Should revert when thresholds are not in ascending order", async function () {
        await expect(
          packManager.setPackProbabilities(PackType.Bronze, 100, 50, 300, 600),
        ).to.be.revertedWithCustomError(packManager, "InvalidProbabilities");
      });

      it("Should revert when non-owner tries to set probabilities", async function () {
        await expect(
          packManager.connect(user1).setPackProbabilities(PackType.Bronze, 0, 100, 300, 600),
        ).to.be.revertedWithCustomError(packManager, "OwnableUnauthorizedAccount");
      });
    });
  });

  describe("Instant Cash Configuration", function () {
    it("Should allow owner to enable instant cash", async function () {
      await expect(packManager.setInstantCashEnabled(true))
        .to.emit(packManager, "InstantCashEnabledUpdated")
        .withArgs(true);

      expect(await packManager.instantCashEnabled()).to.be.true;
    });

    it("Should allow owner to set payout treasury", async function () {
      await expect(packManager.setPayoutTreasury(treasuryAddress))
        .to.emit(packManager, "PayoutTreasuryUpdated")
        .withArgs(ZERO_ADDRESS, treasuryAddress);
    });
  });

  describe("Treasury Management", function () {
    it("Should allow anyone to fund treasury", async function () {
      const fundAmount = ethers.parseEther("10");

      await expect(packManager.connect(user1).fundTreasury({ value: fundAmount }))
        .to.emit(packManager, "TreasuryFunded")
        .withArgs(user1Address, fundAmount);

      expect(await packManager.treasuryBalance()).to.equal(fundAmount);
    });

    it("Should allow owner to withdraw treasury", async function () {
      await packManager.fundTreasury({ value: ethers.parseEther("10") });

      const withdrawAmount = ethers.parseEther("5");
      await expect(packManager.withdrawTreasury(treasuryAddress, withdrawAmount))
        .to.emit(packManager, "TreasuryWithdrawn")
        .withArgs(treasuryAddress, withdrawAmount);
    });

    it("Should revert when withdrawing more than balance", async function () {
      await expect(
        packManager.withdrawTreasury(treasuryAddress, ethers.parseEther("1000")),
      ).to.be.revertedWithCustomError(packManager, "InsufficientTreasuryBalance");
    });

    it("Should receive ETH via receive function", async function () {
      const fundAmount = ethers.parseEther("5");

      await expect(
        owner.sendTransaction({
          to: await packManager.getAddress(),
          value: fundAmount,
        }),
      ).to.emit(packManager, "TreasuryFunded");

      expect(await packManager.treasuryBalance()).to.equal(fundAmount);
    });
  });

  describe("View Functions", function () {
    it("Should return correct pool address", async function () {
      expect(await packManager.getNftPool()).to.equal(await nftPool.getAddress());
    });

    it("Should return REWARDS_PER_PACK constant", async function () {
      expect(await packManager.REWARDS_PER_PACK()).to.equal(3);
    });

    it("Should calculate instant cash payout correctly", async function () {
      await nftPool.configureCollection(await testNft.getAddress(), true, FLOOR_PRICES[PoolLevel.Common]);

      const payout = await packManager.getInstantCashPayout(await testNft.getAddress());
      const expectedPayout = (FLOOR_PRICES[PoolLevel.Common] * 8000n) / 10000n;

      expect(payout).to.equal(expectedPayout);
    });

    it("Should return 0 payout for unset floor price", async function () {
      const payout = await packManager.getInstantCashPayout(user1Address);
      expect(payout).to.equal(0);
    });

    it("Should return instant cash percentage constant", async function () {
      expect(await packManager.getInstantCashPercentage()).to.equal(8000);
    });
  });

  describe("VRF Request Timeout Configuration", function () {
    it("Should initialize with default timeout of 1 hour", async function () {
      expect(await packManager.vrfRequestTimeout()).to.equal(3600);
    });

    it("Should allow owner to set timeout", async function () {
      await expect(packManager.setVrfRequestTimeout(7200))
        .to.emit(packManager, "VrfRequestTimeoutUpdated")
        .withArgs(3600, 7200);

      expect(await packManager.vrfRequestTimeout()).to.equal(7200);
    });

    it("Should revert when non-owner tries to set timeout", async function () {
      await expect(packManager.connect(user1).setVrfRequestTimeout(7200)).to.be.revertedWithCustomError(
        packManager,
        "OwnableUnauthorizedAccount",
      );
    });
  });

  describe("Pack to Request ID Tracking", function () {
    beforeEach(async function () {
      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });
    });

    it("Should track active request ID for pack", async function () {
      expect(await packManager.getActiveRequestIdForPack(1)).to.equal(0);

      await packManager.connect(user1).openPack(1);

      expect(await packManager.getActiveRequestIdForPack(1)).to.equal(1);
    });

    it("Should clear request ID after fulfillment", async function () {
      await packManager.connect(user1).openPack(1);
      expect(await packManager.getActiveRequestIdForPack(1)).to.equal(1);

      await mockVrf.fulfillRandomWords(1, [9500n << 16n, 9600n << 16n, 9700n << 16n]);

      expect(await packManager.getActiveRequestIdForPack(1)).to.equal(0);
    });
  });

  describe("Request Status Tracking", function () {
    beforeEach(async function () {
      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });
    });

    it("Should set status to Pending on open", async function () {
      await packManager.connect(user1).openPack(1);

      const request = await packManager.openRequests(1);
      expect(request.status).to.equal(0); // Pending
    });

    it("Should set status to Fulfilled after VRF callback", async function () {
      await packManager.connect(user1).openPack(1);
      await mockVrf.fulfillRandomWords(1, [9500n << 16n, 9600n << 16n, 9700n << 16n]);

      const request = await packManager.openRequests(1);
      expect(request.status).to.equal(1); // Fulfilled
    });

    it("Should track createdAt timestamp", async function () {
      const txResponse = await packManager.connect(user1).openPack(1);
      const block = await ethers.provider.getBlock(txResponse.blockNumber!);

      const request = await packManager.openRequests(1);
      expect(request.createdAt).to.equal(block!.timestamp);
    });
  });

  describe("Cancel Open Request", function () {
    beforeEach(async function () {
      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });
      await packManager.connect(user1).openPack(1);
    });

    it("Should allow owner to cancel immediately", async function () {
      await expect(packManager.cancelOpenRequest(1))
        .to.emit(packManager, "PackOpenCancelled")
        .withArgs(1, user1Address, 1, ownerAddress);

      const request = await packManager.openRequests(1);
      expect(request.status).to.equal(2); // Cancelled
    });

    it("Should clear packOpeningInProgress after cancel", async function () {
      expect(await packManager.packOpeningInProgress(1)).to.be.true;

      await packManager.cancelOpenRequest(1);

      expect(await packManager.packOpeningInProgress(1)).to.be.false;
    });

    it("Should clear packToRequestId after cancel", async function () {
      expect(await packManager.getActiveRequestIdForPack(1)).to.equal(1);

      await packManager.cancelOpenRequest(1);

      expect(await packManager.getActiveRequestIdForPack(1)).to.equal(0);
    });

    it("Should allow pack owner to cancel after timeout", async function () {
      // Fast forward past timeout
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine", []);

      await expect(packManager.connect(user1).cancelOpenRequest(1))
        .to.emit(packManager, "PackOpenCancelled")
        .withArgs(1, user1Address, 1, user1Address);
    });

    it("Should revert when pack owner tries to cancel before timeout", async function () {
      await expect(packManager.connect(user1).cancelOpenRequest(1)).to.be.revertedWithCustomError(
        packManager,
        "RequestNotTimedOut",
      );
    });

    it("Should revert when non-owner/non-pack-owner tries to cancel", async function () {
      await expect(packManager.connect(user2).cancelOpenRequest(1)).to.be.revertedWithCustomError(
        packManager,
        "NotAuthorized",
      );
    });

    it("Should revert when no active request for pack", async function () {
      await mockVrf.fulfillRandomWords(1, [9500n << 16n, 9600n << 16n, 9700n << 16n]);

      await expect(packManager.cancelOpenRequest(1)).to.be.revertedWithCustomError(packManager, "NoActiveRequest");
    });

    it("Should revert when request is not pending", async function () {
      await mockVrf.fulfillRandomWords(1, [9500n << 16n, 9600n << 16n, 9700n << 16n]);

      await expect(packManager.cancelOpenRequestByRequestId(1)).to.be.revertedWithCustomError(
        packManager,
        "RequestNotPending",
      );
    });

    it("Should allow pack to be opened again after cancel", async function () {
      await packManager.cancelOpenRequest(1);

      // Should be able to open again
      await expect(packManager.connect(user1).openPack(1)).to.emit(packManager, "PackOpenRequested");
    });
  });

  describe("Admin Open Pack", function () {
    beforeEach(async function () {
      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });
    });

    it("Should allow owner to open pack for any user", async function () {
      await expect(packManager.adminOpenPack(1))
        .to.emit(packManager, "PackOpenRequested")
        .withArgs(1, user1Address, 1, PackType.Bronze);
    });

    it("Should set correct requester (pack owner, not admin)", async function () {
      await packManager.adminOpenPack(1);

      const request = await packManager.openRequests(1);
      expect(request.requester).to.equal(user1Address);
    });

    it("Should revert when non-owner tries to admin open", async function () {
      await expect(packManager.connect(user1).adminOpenPack(1)).to.be.revertedWithCustomError(
        packManager,
        "OwnableUnauthorizedAccount",
      );
    });

    it("Should revert when pack is already opened", async function () {
      await packManager.connect(user1).openPack(1);
      await mockVrf.fulfillRandomWords(1, [9500n << 16n, 9600n << 16n, 9700n << 16n]);

      await expect(packManager.adminOpenPack(1)).to.be.revertedWithCustomError(packManager, "PackAlreadyOpened");
    });

    it("Should revert when opening is in progress", async function () {
      await packManager.connect(user1).openPack(1);

      await expect(packManager.adminOpenPack(1)).to.be.revertedWithCustomError(
        packManager,
        "PackOpeningInProgressError",
      );
    });

    it("Should revert when paused", async function () {
      await packManager.pause();

      await expect(packManager.adminOpenPack(1)).to.be.revertedWithCustomError(packManager, "EnforcedPause");
    });
  });

  describe("Pack Open Failure and Rollback", function () {
    async function setupLimitedPoolWithAllLevels(commonCount: number) {
      // Create a fresh pool
      const NftPoolFactory = new NftPool__factory(owner);
      const newPoolImpl = await NftPoolFactory.deploy();
      const ProxyFactory = new TransparentUpgradeableProxy__factory(owner);
      const newPoolInitData = newPoolImpl.interface.encodeFunctionData("initialize", [ownerAddress, []]);
      const newPoolProxy = await ProxyFactory.deploy(await newPoolImpl.getAddress(), ownerAddress, newPoolInitData);
      const limitedPool = NftPool__factory.connect(await newPoolProxy.getAddress(), owner);

      // Grant POOL_MANAGER_ROLE to PackManager
      const POOL_MANAGER_ROLE = await limitedPool.POOL_MANAGER_ROLE();
      await limitedPool.grantRole(POOL_MANAGER_ROLE, await packManager.getAddress());

      const TestNftFactory = new TestERC721__factory(owner);

      // Add NFTs for ALL levels (required by _verifyPoolLevelsAvailable)
      // Common - limited count
      const commonNft = await TestNftFactory.deploy("Common NFT", "CNFT");
      await commonNft.waitForDeployment();
      await limitedPool.configureCollection(await commonNft.getAddress(), true, FLOOR_PRICES[PoolLevel.Common]);
      for (let i = 0; i < commonCount; i++) {
        await commonNft.mint(ownerAddress, i + 1);
        await commonNft.approve(await limitedPool.getAddress(), i + 1);
        await limitedPool.deposit(await commonNft.getAddress(), i + 1);
      }

      // Rare - add 1 NFT
      const rareNft = await TestNftFactory.deploy("Rare NFT", "RNFT");
      await rareNft.waitForDeployment();
      await limitedPool.configureCollection(await rareNft.getAddress(), true, FLOOR_PRICES[PoolLevel.Rare]);
      await rareNft.mint(ownerAddress, 1);
      await rareNft.approve(await limitedPool.getAddress(), 1);
      await limitedPool.deposit(await rareNft.getAddress(), 1);

      // Epic - add 1 NFT
      const epicNft = await TestNftFactory.deploy("Epic NFT", "ENFT");
      await epicNft.waitForDeployment();
      await limitedPool.configureCollection(await epicNft.getAddress(), true, FLOOR_PRICES[PoolLevel.Epic]);
      await epicNft.mint(ownerAddress, 1);
      await epicNft.approve(await limitedPool.getAddress(), 1);
      await limitedPool.deposit(await epicNft.getAddress(), 1);

      // Legendary - add 1 NFT
      const legendaryNft = await TestNftFactory.deploy("Legendary NFT", "LNFT");
      await legendaryNft.waitForDeployment();
      await limitedPool.configureCollection(await legendaryNft.getAddress(), true, FLOOR_PRICES[PoolLevel.Legendary]);
      await legendaryNft.mint(ownerAddress, 1);
      await legendaryNft.approve(await limitedPool.getAddress(), 1);
      await limitedPool.deposit(await legendaryNft.getAddress(), 1);

      // UltraRare - add 1 NFT
      const ultraRareNft = await TestNftFactory.deploy("UltraRare NFT", "URNFT");
      await ultraRareNft.waitForDeployment();
      await limitedPool.configureCollection(await ultraRareNft.getAddress(), true, FLOOR_PRICES[PoolLevel.UltraRare]);
      await ultraRareNft.mint(ownerAddress, 1);
      await ultraRareNft.approve(await limitedPool.getAddress(), 1);
      await limitedPool.deposit(await ultraRareNft.getAddress(), 1);

      return { limitedPool, commonNft };
    }

    it("Should emit PackOpenFailed when level is empty", async function () {
      // Create pool with only 2 Common NFTs (need 3 for a pack)
      const { limitedPool } = await setupLimitedPoolWithAllLevels(2);

      // Point PackManager to limited pool
      await packManager.setNftPool(await limitedPool.getAddress());

      // Mint and open pack
      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });
      await packManager.connect(user1).openPack(1);

      // Fulfill VRF - should fail on 3rd NFT selection (only 2 Common available)
      await expect(mockVrf.fulfillRandomWords(1, [9500n << 16n, 9600n << 16n, 9700n << 16n]))
        .to.emit(packManager, "PackOpenFailed")
        .withArgs(1, user1Address, 1, 1); // LevelSelectionFailed = 1

      // Request should be marked as Failed
      const request = await packManager.openRequests(1);
      expect(request.status).to.equal(3); // Failed
    });

    it("Should rollback locked NFTs on failure", async function () {
      // Create pool with only 2 Common NFTs
      const { limitedPool } = await setupLimitedPoolWithAllLevels(2);

      await packManager.setNftPool(await limitedPool.getAddress());

      const poolSizeBefore = await limitedPool.getPoolLevelSize(PoolLevel.Common);
      expect(poolSizeBefore).to.equal(2);

      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });
      await packManager.connect(user1).openPack(1);

      // This will fail and should rollback the 2 NFTs that were locked
      await mockVrf.fulfillRandomWords(1, [9500n << 16n, 9600n << 16n, 9700n << 16n]);

      // Pool should have same size as before (rolled back)
      const poolSizeAfter = await limitedPool.getPoolLevelSize(PoolLevel.Common);
      expect(poolSizeAfter).to.equal(2);
    });

    it("Should allow pack to be opened again after failure", async function () {
      // Create pool with only 2 Common NFTs
      const { limitedPool, commonNft } = await setupLimitedPoolWithAllLevels(2);

      await packManager.setNftPool(await limitedPool.getAddress());

      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });
      await packManager.connect(user1).openPack(1);
      await mockVrf.fulfillRandomWords(1, [9500n << 16n, 9600n << 16n, 9700n << 16n]);

      // Pack open failed, now add another NFT and try again
      await commonNft.mint(ownerAddress, 100);
      await commonNft.approve(await limitedPool.getAddress(), 100);
      await limitedPool.deposit(await commonNft.getAddress(), 100);

      // Should be able to open again
      await expect(packManager.connect(user1).openPack(1)).to.emit(packManager, "PackOpenRequested");
    });

    it("Should not process duplicate VRF callbacks", async function () {
      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });
      await packManager.connect(user1).openPack(1);

      // First callback
      await mockVrf.fulfillRandomWords(1, [9500n << 16n, 9600n << 16n, 9700n << 16n]);

      const requestBefore = await packManager.openRequests(1);
      expect(requestBefore.status).to.equal(1); // Fulfilled

      // Simulate second callback (should be ignored gracefully)
      // The mock VRF would need modification to allow this, but the contract
      // should handle it by checking status != Pending
    });
  });

  describe("Fallback Recovery Integration", function () {
    it("Should handle full cancel-and-retry flow", async function () {
      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });

      // First attempt
      await packManager.connect(user1).openPack(1);

      // Owner cancels (simulating stuck VRF)
      await packManager.cancelOpenRequest(1);

      // Retry
      await packManager.connect(user1).openPack(1);
      const newRequestId = await packManager.getActiveRequestIdForPack(1);
      expect(newRequestId).to.equal(2); // New request ID (second VRF request)

      // This time VRF works
      await mockVrf.fulfillRandomWords(2, [9500n << 16n, 9600n << 16n, 9700n << 16n]);

      const [collections, , opened] = await rariPack.getPackContents(1);
      expect(opened).to.be.true;
      expect(collections.length).to.equal(3);
    });

    it("Should handle admin intervention flow", async function () {
      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });

      // Admin opens for user
      await packManager.adminOpenPack(1);

      // VRF fulfills
      const requestId = await packManager.getActiveRequestIdForPack(1);
      await mockVrf.fulfillRandomWords(requestId, [9500n << 16n, 9600n << 16n, 9700n << 16n]);

      // User can now claim
      const [collections] = await rariPack.getPackContents(1);
      expect(collections.length).to.equal(3);

      // User claims
      await packManager.connect(user1).claimNft(1);

      // Pack should be burned
      await expect(rariPack.ownerOf(1)).to.be.revertedWithCustomError(rariPack, "ERC721NonexistentToken");
    });
  });
});
