// <ai_context>
// Test suite for NftPool and PackManager distribution across multiple collections and price levels.
// Includes monte-carlo verification of probabilities and RTP summary for 85% return adjustments.
// </ai_context>

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

const PackType = {
  Bronze: 0,
  Silver: 1,
  Gold: 2,
  Platinum: 3,
} as const;
type PackTypeId = (typeof PackType)[keyof typeof PackType];

const PoolLevel = {
  Common: 0,
  Rare: 1,
  Epic: 2,
  Legendary: 3,
  UltraRare: 4,
} as const;
type PoolLevelId = (typeof PoolLevel)[keyof typeof PoolLevel];

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

type LevelCounts = Record<PoolLevelId, number>;

function emptyLevelCounts(): LevelCounts {
  return {
    [PoolLevel.Common]: 0,
    [PoolLevel.Rare]: 0,
    [PoolLevel.Epic]: 0,
    [PoolLevel.Legendary]: 0,
    [PoolLevel.UltraRare]: 0,
  };
}

function levelName(level: PoolLevelId): string {
  if (level === PoolLevel.Common) return "Common";
  if (level === PoolLevel.Rare) return "Rare";
  if (level === PoolLevel.Epic) return "Epic";
  if (level === PoolLevel.Legendary) return "Legendary";
  return "UltraRare";
}

function packTypeName(pt: PackTypeId): string {
  if (pt === PackType.Bronze) return "Bronze";
  if (pt === PackType.Silver) return "Silver";
  if (pt === PackType.Gold) return "Gold";
  return "Platinum";
}

function bpToPercent(bp: number): number {
  return bp / 100; // 10000 bp = 100.00%
}

describe("Distribution / Monte-Carlo (PackManager + NftPool)", function () {
  this.timeout(180_000);

  let packManager: PackManager;
  let rariPack: RariPack;
  let nftPool: NftPool;
  let mockVrf: MockVRFCoordinator;

  let owner: ethersTypes.Signer;
  let user: ethersTypes.Signer;
  let treasury: ethersTypes.Signer;

  let ownerAddress: string;
  let userAddress: string;
  let treasuryAddress: string;

  // VRF config
  const VRF_KEY_HASH = ethers.keccak256(ethers.toUtf8Bytes("test-key-hash"));
  const VRF_SUBSCRIPTION_ID = 1n;
  const VRF_CALLBACK_GAS_LIMIT = 500000;
  const VRF_REQUEST_CONFIRMATIONS = 3;

  // Pack prices (purely test values)
  const PACK_PRICES: Record<PackTypeId, bigint> = {
    [PackType.Bronze]: ethers.parseEther("0.01"),
    [PackType.Silver]: ethers.parseEther("0.05"),
    [PackType.Gold]: ethers.parseEther("0.1"),
    [PackType.Platinum]: ethers.parseEther("0.5"),
  };

  // Floor prices by pool level (must fall WITHIN default NftPool ranges)
  // Default ranges: Common 0-0.5, Rare 0.5-2, Epic 2-10, Legendary 10-50, UltraRare 50+
  const FLOOR_PRICES: Record<PoolLevelId, bigint> = {
    [PoolLevel.Common]: ethers.parseEther("0.3"), // 0 - 0.5 ETH range
    [PoolLevel.Rare]: ethers.parseEther("1"), // 0.5 - 2 ETH range
    [PoolLevel.Epic]: ethers.parseEther("5"), // 2 - 10 ETH range
    [PoolLevel.Legendary]: ethers.parseEther("25"), // 10 - 50 ETH range
    [PoolLevel.UltraRare]: ethers.parseEther("100"), // 50+ ETH range
  };

  // Requested distribution of collections per level
  const COLLECTIONS_PER_LEVEL: Record<PoolLevelId, number> = {
    [PoolLevel.Common]: 15,
    [PoolLevel.Rare]: 10,
    [PoolLevel.Epic]: 5,
    [PoolLevel.Legendary]: 3,
    [PoolLevel.UltraRare]: 2,
  };

  // Tune: smaller makes setup much faster; Monte-Carlo recycles NFTs anyway.
  const TOKENS_PER_COLLECTION = 30;

  const EXPECTED_SIZE_PER_LEVEL: Record<PoolLevelId, bigint> = {
    [PoolLevel.Common]: BigInt(COLLECTIONS_PER_LEVEL[PoolLevel.Common] * TOKENS_PER_COLLECTION),
    [PoolLevel.Rare]: BigInt(COLLECTIONS_PER_LEVEL[PoolLevel.Rare] * TOKENS_PER_COLLECTION),
    [PoolLevel.Epic]: BigInt(COLLECTIONS_PER_LEVEL[PoolLevel.Epic] * TOKENS_PER_COLLECTION),
    [PoolLevel.Legendary]: BigInt(COLLECTIONS_PER_LEVEL[PoolLevel.Legendary] * TOKENS_PER_COLLECTION),
    [PoolLevel.UltraRare]: BigInt(COLLECTIONS_PER_LEVEL[PoolLevel.UltraRare] * TOKENS_PER_COLLECTION),
  };

  async function deployProxy<T extends ethersTypes.BaseContract>(
    impl: ethersTypes.BaseContract,
    admin: string,
    initData: string,
    connectFactory: (proxyAddr: string) => T,
  ): Promise<T> {
    const ProxyFactory = new TransparentUpgradeableProxy__factory(owner);
    const proxy = await ProxyFactory.deploy(await impl.getAddress(), admin, initData);
    await proxy.waitForDeployment();
    return connectFactory(await proxy.getAddress());
  }

  async function getRequestIdFromOpenTx(openTx: ethersTypes.ContractTransactionResponse): Promise<bigint> {
    const receipt = await openTx.wait();
    if (!receipt) throw new Error("Missing receipt");
    for (const log of receipt.logs) {
      try {
        const parsed = packManager.interface.parseLog(log as any);
        if (parsed?.name === "PackOpenRequested") {
          return parsed.args.requestId as bigint;
        }
      } catch {
        // ignore
      }
    }
    throw new Error("PackOpenRequested not found in tx logs");
  }

  async function getPackTokenIdFromMintTx(mintTx: ethersTypes.ContractTransactionResponse): Promise<bigint> {
    const receipt = await mintTx.wait();
    if (!receipt) throw new Error("Missing mint receipt");

    for (const log of receipt.logs) {
      try {
        const parsed = rariPack.interface.parseLog(log as any);
        if (parsed?.name === "Transfer") {
          const from = (parsed.args.from as string).toLowerCase();
          const to = (parsed.args.to as string).toLowerCase();
          if (from === ZERO_ADDRESS.toLowerCase() && to === userAddress.toLowerCase()) {
            return parsed.args.tokenId as bigint;
          }
        }
      } catch {
        // ignore
      }
    }
    throw new Error("Could not determine minted pack tokenId from Transfer log");
  }

  async function seedCollectionsAndDeposit(): Promise<void> {
    for (const level of [
      PoolLevel.Common,
      PoolLevel.Rare,
      PoolLevel.Epic,
      PoolLevel.Legendary,
      PoolLevel.UltraRare,
    ] as const) {
      const numCollections = COLLECTIONS_PER_LEVEL[level];

      for (let c = 0; c < numCollections; c++) {
        const name = `${levelName(level)} Collection ${c + 1}`;
        const symbol = `${levelName(level).slice(0, 2).toUpperCase()}${c + 1}`;

        const TestNftFactory = new TestERC721__factory(owner);
        const nft: TestERC721 = await TestNftFactory.deploy(name, symbol);
        await nft.waitForDeployment();

        const collection = await nft.getAddress();

        await nftPool.configureCollection(collection, true, FLOOR_PRICES[level]);

        for (let i = 0; i < TOKENS_PER_COLLECTION; i++) {
          const tokenId = BigInt(c * TOKENS_PER_COLLECTION + i + 1);
          await nft.mint(ownerAddress, tokenId);
          await nft.approve(await nftPool.getAddress(), tokenId);
          await nftPool.deposit(collection, tokenId);
        }
      }
    }
  }

  async function assertPoolSizes(): Promise<void> {
    for (const level of [
      PoolLevel.Common,
      PoolLevel.Rare,
      PoolLevel.Epic,
      PoolLevel.Legendary,
      PoolLevel.UltraRare,
    ] as const) {
      const size = await nftPool.getPoolLevelSize(level);
      expect(size).to.equal(EXPECTED_SIZE_PER_LEVEL[level]);
    }
  }

  async function expectedBpForPackType(packType: PackTypeId): Promise<Record<PoolLevelId, number>> {
    const [ultraBp, legendaryBp, epicBp, rareBp, commonBp] = await packManager.getPackProbabilitiesPercent(packType);
    return {
      [PoolLevel.UltraRare]: Number(ultraBp),
      [PoolLevel.Legendary]: Number(legendaryBp),
      [PoolLevel.Epic]: Number(epicBp),
      [PoolLevel.Rare]: Number(rareBp),
      [PoolLevel.Common]: Number(commonBp),
    };
  }

  function ceilDiv(a: bigint, b: bigint): bigint {
    return (a + (b - 1n)) / b;
  }

  async function computeEvSummary(packType: PackTypeId): Promise<{
    expectedBp: Record<PoolLevelId, number>;
    expectedFloorPerPackWei: bigint;
    expectedCashPerPackWei: bigint;
    rtpCashBp: bigint; // payout/price in bp
    priceFor85RtpWei: bigint;
  }> {
    const expectedBp = await expectedBpForPackType(packType);

    let expectedFloorPerRewardWei = 0n;
    for (const lvl of [
      PoolLevel.UltraRare,
      PoolLevel.Legendary,
      PoolLevel.Epic,
      PoolLevel.Rare,
      PoolLevel.Common,
    ] as const) {
      expectedFloorPerRewardWei += (FLOOR_PRICES[lvl] * BigInt(expectedBp[lvl])) / 10000n;
    }

    const rewardsPerPack = 3n;
    const expectedFloorPerPackWei = expectedFloorPerRewardWei * rewardsPerPack;

    // instant cash is 80% of floor per NFT, summed
    const expectedCashPerPackWei = (expectedFloorPerPackWei * 8000n) / 10000n;

    const price = PACK_PRICES[packType];
    const rtpCashBp = (expectedCashPerPackWei * 10000n) / price;

    // price that would yield 85% RTP on instant-cash EV
    const priceFor85RtpWei = ceilDiv(expectedCashPerPackWei * 10000n, 8500n);

    return { expectedBp, expectedFloorPerPackWei, expectedCashPerPackWei, rtpCashBp, priceFor85RtpWei };
  }

  async function runMonteCarlo(packType: PackTypeId, opens: number): Promise<{
    observed: LevelCounts;
    draws: number;
    expectedBp: Record<PoolLevelId, number>;
  }> {
    const observed = emptyLevelCounts();
    const expectedBp = await expectedBpForPackType(packType);

    for (let i = 0; i < opens; i++) {
      const price = PACK_PRICES[packType];

      // mint 1 pack to user
      const mintTx = await rariPack.connect(user).mintPack(userAddress, packType, 1, { value: price });
      const packTokenId = await getPackTokenIdFromMintTx(mintTx);

      // open pack -> get request id from event
      const openTx = await packManager.connect(user).openPack(packTokenId);
      const requestId = await getRequestIdFromOpenTx(openTx);

      // fulfill VRF deterministically
      const seed = BigInt(packType) * 1_000_000n + BigInt(i + 1);
      await mockVrf.fulfillRandomWordsWithSeed(requestId, seed, 3);

      // read contents to classify pool levels
      const [collections, tokenIds, opened] = await rariPack.getPackContents(packTokenId);
      expect(opened).to.equal(true);
      expect(collections.length).to.equal(3);
      expect(tokenIds.length).to.equal(3);

      for (let k = 0; k < collections.length; k++) {
        const lvl = await nftPool.getCollectionPoolLevel(collections[k]);
        observed[Number(lvl) as PoolLevelId] += 1;
      }

      // recycle locked NFTs back into accounting (they never left NftPool ownership)
      for (let k = 0; k < collections.length; k++) {
        await nftPool.addLockedNft(collections[k], tokenIds[k]);
      }

      // burn pack to avoid state growth
      await rariPack.burnPack(packTokenId);
    }

    return { observed, draws: opens * 3, expectedBp };
  }

  beforeEach(async function () {
    [owner, user, treasury] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    userAddress = await user.getAddress();
    treasuryAddress = await treasury.getAddress();

    // Mock VRF
    const MockVrfFactory = new MockVRFCoordinator__factory(owner);
    mockVrf = await MockVrfFactory.deploy();
    await mockVrf.waitForDeployment();

    // RariPack impl + proxy
    const RariPackFactory = new RariPack__factory(owner);
    const rariPackImpl = await RariPackFactory.deploy();
    await rariPackImpl.waitForDeployment();

    const rariPackInitData = rariPackImpl.interface.encodeFunctionData("initialize", [
      ownerAddress,
      treasuryAddress,
      "Rari Pack",
      "RPACK",
    ]);

    rariPack = await deployProxy<RariPack>(rariPackImpl, ownerAddress, rariPackInitData, (proxyAddr) =>
      RariPack__factory.connect(proxyAddr, owner),
    );

    // set pack prices
    await rariPack.setPackPrice(PackType.Bronze, PACK_PRICES[PackType.Bronze]);
    await rariPack.setPackPrice(PackType.Silver, PACK_PRICES[PackType.Silver]);
    await rariPack.setPackPrice(PackType.Gold, PACK_PRICES[PackType.Gold]);
    await rariPack.setPackPrice(PackType.Platinum, PACK_PRICES[PackType.Platinum]);

    // NftPool impl + proxy
    const NftPoolFactory = new NftPool__factory(owner);
    const nftPoolImpl = await NftPoolFactory.deploy();
    await nftPoolImpl.waitForDeployment();

    const nftPoolInitData = nftPoolImpl.interface.encodeFunctionData("initialize", [ownerAddress, []]);

    nftPool = await deployProxy<NftPool>(nftPoolImpl, ownerAddress, nftPoolInitData, (proxyAddr) =>
      NftPool__factory.connect(proxyAddr, owner),
    );

    // PackManager impl + proxy
    const PackManagerFactory = new PackManager__factory(owner);
    const packManagerImpl = await PackManagerFactory.deploy();
    await packManagerImpl.waitForDeployment();

    const packManagerInitData = packManagerImpl.interface.encodeFunctionData("initialize", [
      ownerAddress,
      await rariPack.getAddress(),
    ]);

    packManager = await deployProxy<PackManager>(packManagerImpl, ownerAddress, packManagerInitData, (proxyAddr) =>
      PackManager__factory.connect(proxyAddr, owner),
    );

    // roles
    const BURNER_ROLE = await rariPack.BURNER_ROLE();
    await rariPack.grantRole(BURNER_ROLE, await packManager.getAddress()); // PackManager burns in real flow
    // NOTE: owner already has BURNER_ROLE from initialize; we burn packs in this test via owner too.

    const POOL_MANAGER_ROLE = await nftPool.POOL_MANAGER_ROLE();
    await nftPool.grantRole(POOL_MANAGER_ROLE, await packManager.getAddress());

    // VRF config
    await packManager.setVrfConfig(
      await mockVrf.getAddress(),
      VRF_SUBSCRIPTION_ID,
      VRF_KEY_HASH,
      VRF_CALLBACK_GAS_LIMIT,
      VRF_REQUEST_CONFIRMATIONS,
    );

    await packManager.setNftPool(await nftPool.getAddress());

    await seedCollectionsAndDeposit();
    await assertPoolSizes();
  });

  it("prints observed vs expected distribution + EV summary", async function () {
    // Tune these for runtime vs accuracy
    const opensPerPackType: Record<PackTypeId, number> = {
      [PackType.Bronze]: 600,
      [PackType.Silver]: 600,
      [PackType.Gold]: 800,
      [PackType.Platinum]: 1000,
    };

    const toleranceByLevelPctPoints: Record<PoolLevelId, number> = {
      [PoolLevel.Common]: 2.0,
      [PoolLevel.Rare]: 1.5,
      [PoolLevel.Epic]: 1.0,
      [PoolLevel.Legendary]: 0.8,
      [PoolLevel.UltraRare]: 0.5, // ultra is tiny; allow wider
    };

    const distRows: Array<{
      packType: string;
      level: string;
      expectedPercent: number;
      observedPercent: number;
      draws: number;
      deltaPctPoints: number;
    }> = [];

    const evRows: Array<{
      packType: string;
      packPriceEth: string;
      expectedFloorEth: string;
      expectedCashEth: string;
      rtpCashPercent: string;
      priceFor85RtpEth: string;
    }> = [];

    for (const pt of [PackType.Bronze, PackType.Silver, PackType.Gold, PackType.Platinum] as const) {
      const opens = opensPerPackType[pt];
      const { observed, draws, expectedBp } = await runMonteCarlo(pt, opens);

      // distribution table + assertions
      for (const lvl of [
        PoolLevel.UltraRare,
        PoolLevel.Legendary,
        PoolLevel.Epic,
        PoolLevel.Rare,
        PoolLevel.Common,
      ] as const) {
        const expectedPct = bpToPercent(expectedBp[lvl]); // -> %
        const observedPct = (observed[lvl] / draws) * 100;
        const delta = observedPct - expectedPct;

        distRows.push({
          packType: packTypeName(pt),
          level: levelName(lvl),
          expectedPercent: Number(expectedPct.toFixed(2)),
          observedPercent: Number(observedPct.toFixed(2)),
          draws,
          deltaPctPoints: Number(delta.toFixed(2)),
        });

        if (expectedBp[lvl] === 0) {
          expect(observed[lvl], `${packTypeName(pt)} ${levelName(lvl)} should be 0`).to.equal(0);
        } else {
          const tol = toleranceByLevelPctPoints[lvl];
          expect(
            Math.abs(delta),
            `${packTypeName(pt)} ${levelName(lvl)} delta=${delta.toFixed(2)}pp`,
          ).to.be.lessThanOrEqual(tol);
        }
      }

      // EV / RTP summary
      const ev = await computeEvSummary(pt);
      const rtpPct = Number(ev.rtpCashBp) / 100; // bp -> %
      evRows.push({
        packType: packTypeName(pt),
        packPriceEth: ethers.formatEther(PACK_PRICES[pt]),
        expectedFloorEth: ethers.formatEther(ev.expectedFloorPerPackWei),
        expectedCashEth: ethers.formatEther(ev.expectedCashPerPackWei),
        rtpCashPercent: `${rtpPct.toFixed(2)}%`,
        priceFor85RtpEth: ethers.formatEther(ev.priceFor85RtpWei),
      });
    }

    // eslint-disable-next-line no-console
    console.table(distRows);
    // eslint-disable-next-line no-console
    console.table(evRows);
  });
});
