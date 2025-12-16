// <ai_context>
// Distribution/Monte-Carlo test for PackManager pool-level selection based on current on-chain probabilities.
// Deploys current stack (RariPack + NftPool + PackManager + MockVRFCoordinator), seeds the pool with many
// collections across levels, then opens many packs and measures observed pool-level distribution vs expected.
// It prints a console table for easy inspection and asserts within tolerance.
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
// Pack types enum values
const PackType = {
  Bronze: 0,
  Silver: 1,
  Gold: 2,
  Platinum: 3,
} as const;
type PackTypeId = (typeof PackType)[keyof typeof PackType];
// Pool levels enum values
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
describe("PackManager probability distribution (current deploy)", function () {
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
  // Pack prices
  const BRONZE_PRICE = ethers.parseEther("0.01");
  const SILVER_PRICE = ethers.parseEther("0.05");
  const GOLD_PRICE = ethers.parseEther("0.1");
  const PLATINUM_PRICE = ethers.parseEther("0.5");
  // Floor prices for each pool level (matching default price ranges)
  const FLOOR_PRICES: Record<PoolLevelId, bigint> = {
    [PoolLevel.Common]: ethers.parseEther("0.03195"), // 0 - 0.05325 ETH
    [PoolLevel.Rare]: ethers.parseEther("0.1065"), // 0.05325 - 0.213 ETH
    [PoolLevel.Epic]: ethers.parseEther("0.5325"), // 0.213 - 1.065 ETH
    [PoolLevel.Legendary]: ethers.parseEther("2.6625"), // 1.065 - 5.325 ETH
    [PoolLevel.UltraRare]: ethers.parseEther("10.65"), // 5.325+ ETH
  };
  // Pool seeding requested by user:
  // 15 cheap, 10 more expensive, 5 more expensive, 3 more expensive, 2 the most
  const COLLECTIONS_PER_LEVEL: Record<PoolLevelId, number> = {
    [PoolLevel.Common]: 15,
    [PoolLevel.Rare]: 10,
    [PoolLevel.Epic]: 5,
    [PoolLevel.Legendary]: 3,
    [PoolLevel.UltraRare]: 2,
  };
  // "mint significant amount of tokens"
  // Keep runtime reasonable, but still large enough to not exhaust pool even without recycling.
  const TOKENS_PER_COLLECTION: Record<PoolLevelId, number> = {
    [PoolLevel.Common]: 25,
    [PoolLevel.Rare]: 20,
    [PoolLevel.Epic]: 12,
    [PoolLevel.Legendary]: 8,
    [PoolLevel.UltraRare]: 6,
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
  async function getRequestIdFromOpenTx(tx: ethersTypes.ContractTransactionResponse): Promise<bigint> {
    const receipt = await tx.wait();
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
  async function seedCollectionsAndDeposit(): Promise<void> {
    // Create collections per level, configure with floor price, mint & deposit many NFTs
    for (const level of [
      PoolLevel.Common,
      PoolLevel.Rare,
      PoolLevel.Epic,
      PoolLevel.Legendary,
      PoolLevel.UltraRare,
    ] as const) {
      const numCollections = COLLECTIONS_PER_LEVEL[level];
      const perCollection = TOKENS_PER_COLLECTION[level];
      for (let c = 0; c < numCollections; c++) {
        const name = `${levelName(level)} Collection ${c + 1}`;
        const symbol = `${levelName(level).slice(0, 2).toUpperCase()}${c + 1}`;
        const TestNftFactory = new TestERC721__factory(owner);
        const nft: TestERC721 = await TestNftFactory.deploy(name, symbol);
        await nft.waitForDeployment();
        const collection = await nft.getAddress();
        // Configure collection with allowed=true and floor price
        await nftPool.configureCollection(collection, true, FLOOR_PRICES[level]);
        // Mint and deposit tokenIds 1..N for this collection
        for (let i = 0; i < perCollection; i++) {
          const tokenId = BigInt(i + 1);
          await nft.mint(ownerAddress, tokenId);
          await nft.approve(await nftPool.getAddress(), tokenId);
          await nftPool.deposit(collection, tokenId);
        }
      }
    }
  }
  async function assertPoolSizesNonZero(): Promise<void> {
    const common = await nftPool.getPoolLevelSize(PoolLevel.Common);
    const rare = await nftPool.getPoolLevelSize(PoolLevel.Rare);
    const epic = await nftPool.getPoolLevelSize(PoolLevel.Epic);
    const legendary = await nftPool.getPoolLevelSize(PoolLevel.Legendary);
    const ultra = await nftPool.getPoolLevelSize(PoolLevel.UltraRare);
    expect(common).to.be.greaterThan(0n);
    expect(rare).to.be.greaterThan(0n);
    expect(epic).to.be.greaterThan(0n);
    expect(legendary).to.be.greaterThan(0n);
    expect(ultra).to.be.greaterThan(0n);
  }
  async function expectedBpForPackType(packType: PackTypeId): Promise<Record<PoolLevelId, number>> {
    const [ultraBp, legendaryBp, epicBp, rareBp, commonBp] = await packManager.getPackProbabilitiesPercent(packType);
    // contract returns:
    // ultraRarePercent = probs.ultraRare (basis points)
    // legendaryPercent = probs.legendary - probs.ultraRare
    // epicPercent = probs.epic - probs.legendary
    // rarePercent = probs.rare - probs.epic
    // commonPercent = 10000 - probs.rare
    return {
      [PoolLevel.UltraRare]: Number(ultraBp),
      [PoolLevel.Legendary]: Number(legendaryBp),
      [PoolLevel.Epic]: Number(epicBp),
      [PoolLevel.Rare]: Number(rareBp),
      [PoolLevel.Common]: Number(commonBp),
    };
  }
  async function runMonteCarlo(
    packType: PackTypeId,
    opens: number,
  ): Promise<{
    observed: LevelCounts;
    draws: number;
    expectedBp: Record<PoolLevelId, number>;
  }> {
    const observed = emptyLevelCounts();
    const expectedBp = await expectedBpForPackType(packType);
    // We reuse pool by re-adding locked NFTs back into accounting after measuring each open.
    // This keeps selection distribution stable and avoids draining pool over many iterations.
    for (let i = 0; i < opens; i++) {
      // Mint a fresh pack to the user
      const price =
        packType === PackType.Bronze
          ? BRONZE_PRICE
          : packType === PackType.Silver
            ? SILVER_PRICE
            : packType === PackType.Gold
              ? GOLD_PRICE
              : PLATINUM_PRICE;
      await rariPack.connect(user).mintPack(userAddress, packType, 1, { value: price });
      // Determine pack tokenId:
      // In RariPack, _nextTokenId starts at 1 and increments; easiest is to read Transfer event, but
      // we can also query balance and assume sequential ids. We'll parse Transfer log from mint tx.
      // However mintPack can mint multiple, here amount=1 so the nextTokenId is strictly increasing.
      // We'll track it locally by reading total minted indirectly: use tokenId = (i + 1) across this loop? Not safe if other tests.
      // Instead: fetch latest tokenId via call to ownerOf by scanning near expected id is heavy.
      // We'll parse Transfer event from receipt.
      const mintTx = await rariPack.connect(user).mintPack(userAddress, packType, 1, { value: price });
      const mintReceipt = await mintTx.wait();
      if (!mintReceipt) throw new Error("Missing mint receipt");
      let packTokenId: bigint | null = null;
      for (const log of mintReceipt.logs) {
        try {
          const parsed = rariPack.interface.parseLog(log as any);
          if (parsed?.name === "Transfer") {
            // Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
            const from = (parsed.args.from as string).toLowerCase();
            const to = (parsed.args.to as string).toLowerCase();
            if (from === ZERO_ADDRESS.toLowerCase() && to === userAddress.toLowerCase()) {
              packTokenId = parsed.args.tokenId as bigint;
              break;
            }
          }
        } catch {
          // ignore
        }
      }
      if (packTokenId === null) throw new Error("Could not determine minted pack tokenId from Transfer log");
      // Open pack
      const openTx = await packManager.connect(user).openPack(packTokenId);
      const requestId = await getRequestIdFromOpenTx(openTx);
      // Fulfill VRF with deterministic seed (unique per packType + iteration)
      const seed = BigInt(packType) * 1_000_000n + BigInt(i + 1);
      await mockVrf.fulfillRandomWordsWithSeed(requestId, seed, 3);
      // Read pack contents to classify levels and then recycle NFTs back into pool accounting
      const [collections, tokenIds, opened] = await rariPack.getPackContents(packTokenId);
      expect(opened).to.equal(true);
      expect(collections.length).to.equal(3);
      expect(tokenIds.length).to.equal(3);
      for (let k = 0; k < collections.length; k++) {
        const coll = collections[k];
        const lvl = await nftPool.getCollectionPoolLevel(coll);
        const levelNum = Number(lvl) as PoolLevelId;
        observed[levelNum] += 1;
        // recycle: the NFT is still owned by NftPool but was removed from accounting in selectAndLockFromLevel
        await nftPool.addLockedNft(coll, tokenIds[k]);
      }
    }
    return { observed, draws: opens * 3, expectedBp };
  }
  beforeEach(async function () {
    [owner, user, treasury] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    userAddress = await user.getAddress();
    treasuryAddress = await treasury.getAddress();
    // Deploy Mock VRF Coordinator
    const MockVrfFactory = new MockVRFCoordinator__factory(owner);
    mockVrf = await MockVrfFactory.deploy();
    await mockVrf.waitForDeployment();
    // Deploy RariPack impl + proxy
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
    // Set pack prices
    await rariPack.setPackPrice(PackType.Bronze, BRONZE_PRICE);
    await rariPack.setPackPrice(PackType.Silver, SILVER_PRICE);
    await rariPack.setPackPrice(PackType.Gold, GOLD_PRICE);
    await rariPack.setPackPrice(PackType.Platinum, PLATINUM_PRICE);
    // Deploy NftPool impl + proxy
    const NftPoolFactory = new NftPool__factory(owner);
    const nftPoolImpl = await NftPoolFactory.deploy();
    await nftPoolImpl.waitForDeployment();
    const nftPoolInitData = nftPoolImpl.interface.encodeFunctionData("initialize", [ownerAddress, []]);
    nftPool = await deployProxy<NftPool>(nftPoolImpl, ownerAddress, nftPoolInitData, (proxyAddr) =>
      NftPool__factory.connect(proxyAddr, owner),
    );
    // Deploy PackManager impl + proxy
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
    // Grant BURNER_ROLE to PackManager
    const BURNER_ROLE = await rariPack.BURNER_ROLE();
    await rariPack.grantRole(BURNER_ROLE, await packManager.getAddress());
    // Grant POOL_MANAGER_ROLE to PackManager (owner already has it from initialize)
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
    // Seed pool with requested collection distribution
    await seedCollectionsAndDeposit();
    await assertPoolSizesNonZero();
  });
  it("prints observed vs expected pool-level distribution for each pack type", async function () {
    // Tune these to trade off runtime vs accuracy
    const opensPerPackType: Record<PackTypeId, number> = {
      [PackType.Bronze]: 600,
      [PackType.Silver]: 600,
      [PackType.Gold]: 800,
      [PackType.Platinum]: 1000,
    };
    const rows: Array<{
      packType: string;
      level: string;
      expectedPercent: number;
      observedPercent: number;
      draws: number;
      deltaPctPoints: number;
    }> = [];
    // Tolerance (absolute percentage points)
    // UltraRare is very low probability; allow wider tolerance there.
    const toleranceByLevel: Record<PoolLevelId, number> = {
      [PoolLevel.Common]: 2.0,
      [PoolLevel.Rare]: 1.5,
      [PoolLevel.Epic]: 1.0,
      [PoolLevel.Legendary]: 0.8,
      [PoolLevel.UltraRare]: 0.5,
    };
    for (const pt of [PackType.Bronze, PackType.Silver, PackType.Gold, PackType.Platinum] as const) {
      const opens = opensPerPackType[pt];
      const { observed, draws, expectedBp } = await runMonteCarlo(pt, opens);
      for (const lvl of [
        PoolLevel.UltraRare,
        PoolLevel.Legendary,
        PoolLevel.Epic,
        PoolLevel.Rare,
        PoolLevel.Common,
      ] as const) {
        const expectedPct = bpToPercent(expectedBp[lvl]);
        const observedPct = (observed[lvl] / draws) * 100;
        const delta = observedPct - expectedPct;
        rows.push({
          packType: packTypeName(pt),
          level: levelName(lvl),
          expectedPercent: Number(expectedPct.toFixed(2)),
          observedPercent: Number(observedPct.toFixed(2)),
          draws,
          deltaPctPoints: Number(delta.toFixed(2)),
        });
        // Only assert for levels that are expected to be non-zero (e.g., UltraRare is 0 for non-Platinum)
        if (expectedBp[lvl] === 0) {
          expect(observed[lvl]).to.equal(0);
        } else {
          const tol = toleranceByLevel[lvl];
          expect(
            Math.abs(delta),
            `${packTypeName(pt)} ${levelName(lvl)} delta=${delta.toFixed(2)}pp`,
          ).to.be.lessThanOrEqual(tol);
        }
      }
    }
    // Output for human inspection
    // eslint-disable-next-line no-console
    console.table(rows);
  });
});
