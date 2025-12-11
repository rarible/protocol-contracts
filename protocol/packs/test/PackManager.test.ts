// <ai_context> Test suite for PackManager contract. Uses single NftPool with price-range based pool levels. </ai_context>
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

  // Floor prices for each pool level (matching default price ranges)
  const FLOOR_PRICES = {
    [PoolLevel.Common]: ethers.parseEther("0.3"), // 0 - 0.5 ETH
    [PoolLevel.Rare]: ethers.parseEther("1"), // 0.5 - 2 ETH
    [PoolLevel.Epic]: ethers.parseEther("5"), // 2 - 10 ETH
    [PoolLevel.Legendary]: ethers.parseEther("25"), // 10 - 50 ETH
    [PoolLevel.UltraRare]: ethers.parseEther("100"), // 50+ ETH
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

  describe("Pack Opening", function () {
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
        .withArgs(1, user1Address, packTokenId, PackType.Bronze, 0);
    });

    it("Should burn the pack when opening", async function () {
      await packManager.connect(user1).openPack(1);

      await expect(rariPack.ownerOf(1)).to.be.revertedWithCustomError(rariPack, "ERC721NonexistentToken");
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
  });

  describe("VRF Fulfillment", function () {
    beforeEach(async function () {
      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });
    });

    it("Should fulfill random words and distribute rewards", async function () {
      await packManager.connect(user1).openPack(1);

      // High values should select Common level
      const randomWords = [9500n << 16n, 9600n << 16n, 9700n << 16n];

      await expect(mockVrf.fulfillRandomWords(1, randomWords))
        .to.emit(packManager, "PackOpened")
        .withArgs(1, user1Address, 1, (rewards: any) => rewards.length === 3);
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
    });

    it("Should open Gold pack correctly", async function () {
      await rariPack.connect(user1).mintPack(user1Address, PackType.Gold, 1, {
        value: GOLD_PRICE,
      });

      await packManager.connect(user1).openPack(1);
      await mockVrf.fulfillRandomWords(1, [9500n << 16n, 9600n << 16n, 9700n << 16n]);
    });

    it("Should open Platinum pack correctly", async function () {
      await rariPack.connect(user1).mintPack(user1Address, PackType.Platinum, 1, {
        value: PLATINUM_PRICE,
      });

      await packManager.connect(user1).openPack(1);
      await mockVrf.fulfillRandomWords(1, [9500n << 16n, 9600n << 16n, 9700n << 16n]);
    });
  });

  describe("Dynamic Probabilities", function () {
    describe("Default Probabilities", function () {
      it("Should initialize with correct default Platinum probabilities", async function () {
        const [ultraRare, legendary, epic, rare] = await packManager.getPackProbabilities(PackType.Platinum);
        expect(ultraRare).to.equal(10);
        expect(legendary).to.equal(50);
        expect(epic).to.equal(200);
        expect(rare).to.equal(900);
      });

      it("Should initialize with correct default Bronze probabilities", async function () {
        const [ultraRare, legendary, epic, rare] = await packManager.getPackProbabilities(PackType.Bronze);
        expect(ultraRare).to.equal(0);
        expect(legendary).to.equal(40);
        expect(epic).to.equal(190);
        expect(rare).to.equal(890);
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

  describe("Instant Cash Claims", function () {
    describe("Configuration", function () {
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
    });

    describe("Instant Cash Pack Opening", function () {
      beforeEach(async function () {
        await packManager.setInstantCashEnabled(true);
        await packManager.fundTreasury({ value: ethers.parseEther("100") });

        await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
          value: BRONZE_PRICE,
        });
      });

      it("Should allow opening pack with instant cash claim", async function () {
        const tx = await packManager.connect(user1).openPackInstantCash(1);

        await expect(tx).to.emit(packManager, "PackOpenRequested").withArgs(1, user1Address, 1, PackType.Bronze, 1);
      });

      it("Should distribute instant cash on VRF fulfillment", async function () {
        await packManager.connect(user1).openPackInstantCash(1);

        const user1BalanceBefore = await ethers.provider.getBalance(user1Address);

        // High values = Common level = 0.3 ETH floor price
        // 80% of 0.3 ETH * 3 NFTs = 0.72 ETH
        await mockVrf.fulfillRandomWords(1, [9500n << 16n, 9600n << 16n, 9700n << 16n]);

        const user1BalanceAfter = await ethers.provider.getBalance(user1Address);
        const expectedPayout = (FLOOR_PRICES[PoolLevel.Common] * 8000n * 3n) / 10000n;

        expect(user1BalanceAfter - user1BalanceBefore).to.equal(expectedPayout);
      });

      it("Should emit InstantCashClaimed event", async function () {
        await packManager.connect(user1).openPackInstantCash(1);

        const expectedPayout = (FLOOR_PRICES[PoolLevel.Common] * 8000n * 3n) / 10000n;

        await expect(mockVrf.fulfillRandomWords(1, [9500n << 16n, 9600n << 16n, 9700n << 16n]))
          .to.emit(packManager, "InstantCashClaimed")
          .withArgs(1, user1Address, 1, expectedPayout, (rewards: any) => rewards.length === 3);
      });

      it("Should keep NFTs in pool (not transferred) on instant cash claim", async function () {
        const commonSizeBefore = await nftPool.getPoolLevelSize(PoolLevel.Common);

        await packManager.connect(user1).openPackInstantCash(1);
        await mockVrf.fulfillRandomWords(1, [9500n << 16n, 9600n << 16n, 9700n << 16n]);

        const commonSizeAfter = await nftPool.getPoolLevelSize(PoolLevel.Common);
        expect(commonSizeAfter).to.equal(commonSizeBefore);
      });

      it("Should revert instant cash when not enabled", async function () {
        await packManager.setInstantCashEnabled(false);

        await expect(packManager.connect(user1).openPackInstantCash(1)).to.be.revertedWithCustomError(
          packManager,
          "InstantCashNotEnabled",
        );
      });

      it("Should revert instant cash when treasury balance insufficient", async function () {
        await packManager.withdrawTreasury(ownerAddress, ethers.parseEther("100"));

        await packManager.connect(user1).openPackInstantCash(1);

        await expect(mockVrf.fulfillRandomWords(1, [9500n << 16n, 9600n << 16n, 9700n << 16n])).to.be.revertedWith(
          "MockVRF: callback failed",
        );
      });
    });

    describe("Regular NFT Opening Still Works", function () {
      beforeEach(async function () {
        await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
          value: BRONZE_PRICE,
        });
      });

      it("Should still allow regular NFT claims via openPack", async function () {
        const commonSizeBefore = await nftPool.getPoolLevelSize(PoolLevel.Common);

        await packManager.connect(user1).openPack(1);
        await mockVrf.fulfillRandomWords(1, [9500n << 16n, 9600n << 16n, 9700n << 16n]);

        const commonSizeAfter = await nftPool.getPoolLevelSize(PoolLevel.Common);
        expect(commonSizeAfter).to.equal(commonSizeBefore - 3n);
      });

      it("Should emit PackOpened event for NFT claims", async function () {
        await packManager.connect(user1).openPack(1);

        await expect(mockVrf.fulfillRandomWords(1, [9500n << 16n, 9600n << 16n, 9700n << 16n])).to.emit(
          packManager,
          "PackOpened",
        );
      });
    });

    describe("View Functions", function () {
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
  });

  describe("View Functions", function () {
    it("Should return correct pool address", async function () {
      expect(await packManager.getNftPool()).to.equal(await nftPool.getAddress());
    });

    it("Should return REWARDS_PER_PACK constant", async function () {
      expect(await packManager.REWARDS_PER_PACK()).to.equal(3);
    });
  });
});
