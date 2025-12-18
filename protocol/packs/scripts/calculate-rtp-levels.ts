/// @ai_context
/// Calculates pool level ranges (Common..UltraRare) and collection->level assignments
/// so that expected instant-cash return approximates a target RTP (default 70%),
/// given a set of NFT collections with known floor prices. Output is compatible
/// with NftPool's price-range based level assignment.
///
/// Usage:
///   npx tsx scripts/calculate-rtp-levels.ts --input scripts/rtp-levels.example.json
///
/// Input format (JSON):
/// {
///   "collections": [
///     { "address": "0x...", "name": "CoolCats", "floorEth": "0.12", "weight": 10 },
///     { "address": "0x...", "floorWei": "100000000000000000", "weight": 5 }
///   ],
///   "targetRtpBps": 7000,
///   "baselinePackType": "Platinum",
///   "instantCashPayoutBps": 8000,
///   "rewardsPerPack": 3,
///   "levelRatios": { "Common": 1, "Rare": 4, "Epic": 20, "Legendary": 100, "UltraRare": 500 },
///   "packPricesEth": { "Bronze": "0.01", "Silver": "0.05", "Gold": "0.1", "Platinum": "0.5" }
/// }

import { readFileSync } from "node:fs";
import process from "node:process";
import { ethers } from "ethers";

type PackType = "Bronze" | "Silver" | "Gold" | "Platinum";
type PoolLevel = "Common" | "Rare" | "Epic" | "Legendary" | "UltraRare";

const POOL_LEVELS: PoolLevel[] = ["Common", "Rare", "Epic", "Legendary", "UltraRare"];
const PACK_TYPES: PackType[] = ["Bronze", "Silver", "Gold", "Platinum"];

interface CollectionInput {
  address: string;
  name?: string;
  floorEth?: string;
  floorWei?: string;
  weight?: number;
}

interface ScriptInputFile {
  collections: CollectionInput[];

  targetRtpBps?: number; // default 7000
  baselinePackType?: PackType; // default "Platinum"
  instantCashPayoutBps?: number; // default 8000
  rewardsPerPack?: number; // default 3

  levelRatios?: Partial<Record<PoolLevel, number>>; // default ladder

  packPricesEth?: Partial<Record<PackType, string>>; // defaults from your README/Setup module
}

interface Bucket {
  floorWei: bigint;
  totalWeight: bigint;
  collections: CollectionInput[];
}

type ProbBpsByLevel = Record<PoolLevel, number>;

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

function requireString(v: unknown, label: string): string {
  if (typeof v !== "string" || v.length === 0) throw new Error(`Missing or invalid ${label}`);
  return v;
}

function isHexAddress(addr: string): boolean {
  try {
    return ethers.isAddress(addr);
  } catch {
    return false;
  }
}

function parseFloorWei(c: CollectionInput): bigint {
  if (c.floorWei && c.floorWei.trim().length > 0) {
    const s = c.floorWei.trim();
    if (!/^\d+$/.test(s)) throw new Error(`Invalid floorWei for ${c.address}: "${c.floorWei}"`);
    return BigInt(s);
  }
  if (c.floorEth && c.floorEth.trim().length > 0) {
    return ethers.parseEther(c.floorEth.trim());
  }
  throw new Error(`Collection ${c.address} must provide either floorWei or floorEth`);
}

function formatEth(wei: bigint, decimals = 6): string {
  const s = ethers.formatEther(wei);
  if (!s.includes(".")) return s;
  const [a, b] = s.split(".");
  return `${a}.${(b ?? "").slice(0, decimals)}`.replace(/\.$/, "");
}

function clampInt(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function computePackProbabilitiesBps(): Record<PackType, ProbBpsByLevel> {
  // These match PackManager._setDefaultProbabilities() (cumulative thresholds out of 10000).
  const cumulative: Record<PackType, { ultraRare: number; legendary: number; epic: number; rare: number }> = {
    Bronze: { ultraRare: 0, legendary: 20, epic: 120, rare: 620 },
    Silver: { ultraRare: 0, legendary: 50, epic: 350, rare: 1350 },
    Gold: { ultraRare: 0, legendary: 100, epic: 600, rare: 2100 },
    Platinum: { ultraRare: 50, legendary: 250, epic: 950, rare: 2950 },
  };

  const out: Record<PackType, ProbBpsByLevel> = {
    Bronze: { Common: 0, Rare: 0, Epic: 0, Legendary: 0, UltraRare: 0 },
    Silver: { Common: 0, Rare: 0, Epic: 0, Legendary: 0, UltraRare: 0 },
    Gold: { Common: 0, Rare: 0, Epic: 0, Legendary: 0, UltraRare: 0 },
    Platinum: { Common: 0, Rare: 0, Epic: 0, Legendary: 0, UltraRare: 0 },
  };

  for (const pt of PACK_TYPES) {
    const t = cumulative[pt];
    const ultraRare = t.ultraRare;
    const legendary = t.legendary;
    const epic = t.epic;
    const rare = t.rare;

    const ultraRareBps = ultraRare;
    const legendaryBps = legendary - ultraRare;
    const epicBps = epic - legendary;
    const rareBps = rare - epic;
    const commonBps = 10000 - rare;

    out[pt] = {
      Common: commonBps,
      Rare: rareBps,
      Epic: epicBps,
      Legendary: legendaryBps,
      UltraRare: ultraRareBps,
    };
  }

  return out;
}

function bucketCollections(collections: CollectionInput[]): Bucket[] {
  const map = new Map<string, Bucket>();

  for (const c of collections) {
    const address = requireString(c.address, "collection.address");
    if (!isHexAddress(address)) throw new Error(`Invalid collection address: ${address}`);

    const floorWei = parseFloorWei(c);
    const weight = BigInt(c.weight ?? 1);
    if (weight <= 0n) throw new Error(`Invalid weight for ${address}: ${c.weight}`);

    const key = floorWei.toString();
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        floorWei,
        totalWeight: weight,
        collections: [{ ...c, address }],
      });
    } else {
      existing.totalWeight += weight;
      existing.collections.push({ ...c, address });
    }
  }

  const buckets = [...map.values()].sort((a, b) => (a.floorWei < b.floorWei ? -1 : a.floorWei > b.floorWei ? 1 : 0));
  return buckets;
}

function prefixSums(buckets: Bucket[]) {
  const n = buckets.length;
  const prefW: bigint[] = new Array(n + 1).fill(0n);
  const prefSumWei: bigint[] = new Array(n + 1).fill(0n);

  for (let i = 0; i < n; i++) {
    const w = buckets[i].totalWeight;
    const sum = buckets[i].floorWei * w;
    prefW[i + 1] = prefW[i] + w;
    prefSumWei[i + 1] = prefSumWei[i] + sum;
  }

  return { prefW, prefSumWei };
}

function segmentAverageWei(prefW: bigint[], prefSumWei: bigint[], l: number, r: number): bigint {
  const w = prefW[r] - prefW[l];
  if (w <= 0n) throw new Error("segmentAverageWei: empty segment");
  const sum = prefSumWei[r] - prefSumWei[l];
  return sum / w;
}

function absBigint(x: bigint): bigint {
  return x < 0n ? -x : x;
}

function squaredErrorWei(avgWei: bigint, targetWei: bigint): bigint {
  const d = absBigint(avgWei - targetWei);
  return d * d;
}

function computeTargetMeansWeiFromRatios(params: {
  baselinePackType: PackType;
  targetRtpBps: number;
  payoutBps: number;
  rewardsPerPack: number;
  packPriceWei: bigint;
  baselineProbBps: ProbBpsByLevel;
  levelRatios: Record<PoolLevel, number>;
}): Record<PoolLevel, bigint> {
  const { targetRtpBps, payoutBps, rewardsPerPack, packPriceWei, baselineProbBps, levelRatios } = params;

  // For instant cash:
  // payoutWei = E[floorWei] * rewardsPerPack * payoutBps / 10000
  // target payoutWei = packPriceWei * targetRtpBps / 10000
  // => E[floorWei] = packPriceWei * targetRtpBps / payoutBps / rewardsPerPack
  const targetExpectedFloorPerNftWei =
    (packPriceWei * BigInt(targetRtpBps)) / BigInt(payoutBps) / BigInt(rewardsPerPack);

  const weightedRatioSum =
    BigInt(baselineProbBps.Common * (levelRatios.Common ?? 1) +
      baselineProbBps.Rare * (levelRatios.Rare ?? 1) +
      baselineProbBps.Epic * (levelRatios.Epic ?? 1) +
      baselineProbBps.Legendary * (levelRatios.Legendary ?? 1) +
      baselineProbBps.UltraRare * (levelRatios.UltraRare ?? 1));

  if (weightedRatioSum <= 0n) throw new Error("weightedRatioSum is zero");

  // base * (sum(probBps * ratio)/10000) = targetExpectedFloorPerNft
  // => base = targetExpectedFloorPerNft * 10000 / sum(probBps * ratio)
  const baseWei = (targetExpectedFloorPerNftWei * 10000n) / weightedRatioSum;

  return {
    Common: baseWei * BigInt(levelRatios.Common),
    Rare: baseWei * BigInt(levelRatios.Rare),
    Epic: baseWei * BigInt(levelRatios.Epic),
    Legendary: baseWei * BigInt(levelRatios.Legendary),
    UltraRare: baseWei * BigInt(levelRatios.UltraRare),
  };
}

function solvePartitionDP(buckets: Bucket[], targetMeanWeiByLevel: Record<PoolLevel, bigint>) {
  const n = buckets.length;
  if (n < POOL_LEVELS.length) {
    throw new Error(
      `Not enough unique floor-price buckets (${n}) to form ${POOL_LEVELS.length} monotonic levels. Need >= ${POOL_LEVELS.length}.`,
    );
  }

  const { prefW, prefSumWei } = prefixSums(buckets);

  const INF = 10n ** 80n;

  // dp[k][i]: min cost to split first i buckets into k levels (k=0..5, i=0..n)
  const levelsCount = POOL_LEVELS.length;
  const dp: bigint[][] = Array.from({ length: levelsCount + 1 }, () => new Array<bigint>(n + 1).fill(INF));
  const back: number[][] = Array.from({ length: levelsCount + 1 }, () => new Array<number>(n + 1).fill(-1));

  dp[0][0] = 0n;
  back[0][0] = 0;

  for (let k = 1; k <= levelsCount; k++) {
    const level = POOL_LEVELS[k - 1];
    const target = targetMeanWeiByLevel[level];

    for (let i = k; i <= n; i++) {
      let best = INF;
      let bestJ = -1;

      for (let j = k - 1; j <= i - 1; j++) {
        if (dp[k - 1][j] === INF) continue;

        const avgWei = segmentAverageWei(prefW, prefSumWei, j, i);
        const cost = squaredErrorWei(avgWei, target);
        const total = dp[k - 1][j] + cost;

        if (total < best) {
          best = total;
          bestJ = j;
        }
      }

      dp[k][i] = best;
      back[k][i] = bestJ;
    }
  }

  // reconstruct segments (start,end) for each level
  const segments: Array<{ level: PoolLevel; start: number; end: number }> = [];
  let end = n;

  for (let k = levelsCount; k >= 1; k--) {
    const start = back[k][end];
    if (start < 0) throw new Error("Failed to reconstruct partition");
    segments.push({ level: POOL_LEVELS[k - 1], start, end });
    end = start;
  }
  segments.reverse();

  return { segments, dpCost: dp[levelsCount][n] };
}

function computeRangesFromSegments(buckets: Bucket[], segments: Array<{ level: PoolLevel; start: number; end: number }>) {
  const boundaries: bigint[] = [];

  for (let i = 1; i < segments.length; i++) {
    const nextStart = segments[i].start;
    const b = buckets[nextStart].floorWei;
    boundaries.push(b);
  }

  const maxUint256 = (1n << 256n) - 1n;

  const ranges = POOL_LEVELS.map((level, idx) => {
    const low = idx === 0 ? 0n : boundaries[idx - 1];
    const high = idx === POOL_LEVELS.length - 1 ? maxUint256 : boundaries[idx];
    return { level, low, high };
  });

  return { ranges, boundaries };
}

function levelOfFloor(floorWei: bigint, ranges: Array<{ level: PoolLevel; low: bigint; high: bigint }>): PoolLevel {
  // mimic NftPool: iterate from highest to lowest, highest match wins if overlaps
  for (let i = ranges.length - 1; i >= 0; i--) {
    const r = ranges[i];
    if (floorWei >= r.low && floorWei < r.high) return r.level;
  }
  return "Common";
}

function expectedRtpBpsForPack(params: {
  packPriceWei: bigint;
  probsBps: ProbBpsByLevel;
  avgFloorWeiByLevel: Record<PoolLevel, bigint>;
  rewardsPerPack: number;
  payoutBps: number;
}): number {
  const { packPriceWei, probsBps, avgFloorWeiByLevel, rewardsPerPack, payoutBps } = params;

  const expFloorPerNftWei =
    (BigInt(probsBps.Common) * avgFloorWeiByLevel.Common +
      BigInt(probsBps.Rare) * avgFloorWeiByLevel.Rare +
      BigInt(probsBps.Epic) * avgFloorWeiByLevel.Epic +
      BigInt(probsBps.Legendary) * avgFloorWeiByLevel.Legendary +
      BigInt(probsBps.UltraRare) * avgFloorWeiByLevel.UltraRare) /
    10000n;

  const payoutWei = (expFloorPerNftWei * BigInt(rewardsPerPack) * BigInt(payoutBps)) / 10000n;
  const rtpBps = Number((payoutWei * 10000n) / packPriceWei);
  return clampInt(rtpBps, 0, 20000);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = typeof args.input === "string" ? args.input : "";

  if (!inputPath) {
    throw new Error(`Missing --input. Example: --input scripts/rtp-levels.example.json`);
  }

  const raw = readFileSync(inputPath, "utf8");
  const parsed = JSON.parse(raw) as ScriptInputFile;

  if (!parsed.collections || !Array.isArray(parsed.collections) || parsed.collections.length === 0) {
    throw new Error("Input JSON must contain non-empty 'collections' array");
  }

  const targetRtpBps = parsed.targetRtpBps ?? 7000;
  const baselinePackType = parsed.baselinePackType ?? "Platinum";
  const payoutBps = parsed.instantCashPayoutBps ?? 8000;
  const rewardsPerPack = parsed.rewardsPerPack ?? 3;

  if (targetRtpBps <= 0 || targetRtpBps > 20000) throw new Error(`Invalid targetRtpBps: ${targetRtpBps}`);
  if (payoutBps <= 0 || payoutBps > 10000) throw new Error(`Invalid instantCashPayoutBps: ${payoutBps}`);
  if (rewardsPerPack <= 0 || rewardsPerPack > 10) throw new Error(`Invalid rewardsPerPack: ${rewardsPerPack}`);

  const defaultRatios: Record<PoolLevel, number> = {
    Common: 1,
    Rare: 4,
    Epic: 20,
    Legendary: 100,
    UltraRare: 500,
  };

  const levelRatios: Record<PoolLevel, number> = {
    Common: parsed.levelRatios?.Common ?? defaultRatios.Common,
    Rare: parsed.levelRatios?.Rare ?? defaultRatios.Rare,
    Epic: parsed.levelRatios?.Epic ?? defaultRatios.Epic,
    Legendary: parsed.levelRatios?.Legendary ?? defaultRatios.Legendary,
    UltraRare: parsed.levelRatios?.UltraRare ?? defaultRatios.UltraRare,
  };

  for (const l of POOL_LEVELS) {
    const v = levelRatios[l];
    if (!Number.isFinite(v) || v <= 0) throw new Error(`Invalid levelRatios.${l}: ${v}`);
  }

  const defaultPackPricesEth: Record<PackType, string> = {
    Bronze: "0.01",
    Silver: "0.05",
    Gold: "0.1",
    Platinum: "0.5",
  };

  const packPricesEth: Record<PackType, string> = {
    Bronze: parsed.packPricesEth?.Bronze ?? defaultPackPricesEth.Bronze,
    Silver: parsed.packPricesEth?.Silver ?? defaultPackPricesEth.Silver,
    Gold: parsed.packPricesEth?.Gold ?? defaultPackPricesEth.Gold,
    Platinum: parsed.packPricesEth?.Platinum ?? defaultPackPricesEth.Platinum,
  };

  const packPricesWei: Record<PackType, bigint> = {
    Bronze: ethers.parseEther(packPricesEth.Bronze),
    Silver: ethers.parseEther(packPricesEth.Silver),
    Gold: ethers.parseEther(packPricesEth.Gold),
    Platinum: ethers.parseEther(packPricesEth.Platinum),
  };

  const probs = computePackProbabilitiesBps();

  const buckets = bucketCollections(parsed.collections);

  console.log("╔══════════════════════════════════════════════════════════════════╗");
  console.log("║                 PACK RTP LEVEL ASSIGNMENT TOOL                   ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝\n");

  console.log(`Input file: ${inputPath}`);
  console.log(`Collections: ${parsed.collections.length}`);
  console.log(`Unique floor buckets: ${buckets.length}`);
  console.log(`Target RTP: ${(targetRtpBps / 100).toFixed(2)}%`);
  console.log(`Instant cash payout: ${(payoutBps / 100).toFixed(2)}% of floor`);
  console.log(`Rewards per pack: ${rewardsPerPack}`);
  console.log(`Baseline pack type: ${baselinePackType}`);
  console.log(
    `Level ratios: Common=${levelRatios.Common}x, Rare=${levelRatios.Rare}x, Epic=${levelRatios.Epic}x, Legendary=${levelRatios.Legendary}x, UltraRare=${levelRatios.UltraRare}x\n`,
  );

  const baselineProb = probs[baselinePackType];
  const baselinePriceWei = packPricesWei[baselinePackType];

  const targetMeansWei = computeTargetMeansWeiFromRatios({
    baselinePackType,
    targetRtpBps,
    payoutBps,
    rewardsPerPack,
    packPriceWei: baselinePriceWei,
    baselineProbBps: baselineProb,
    levelRatios,
  });

  console.log("Target mean floor per level (derived from baseline pack + ratios):");
  for (const l of POOL_LEVELS) {
    console.log(`  - ${l.padEnd(10)}: ${formatEth(targetMeansWei[l], 8)} ETH`);
  }
  console.log("");

  const { segments, dpCost } = solvePartitionDP(buckets, targetMeansWei);
  const { ranges } = computeRangesFromSegments(buckets, segments);

  const { prefW, prefSumWei } = prefixSums(buckets);
  const avgFloorWeiByLevel: Record<PoolLevel, bigint> = {
    Common: 0n,
    Rare: 0n,
    Epic: 0n,
    Legendary: 0n,
    UltraRare: 0n,
  };

  for (const s of segments) {
    avgFloorWeiByLevel[s.level] = segmentAverageWei(prefW, prefSumWei, s.start, s.end);
  }

  console.log("Solved partition segments (bucket indices):");
  for (const s of segments) {
    const first = buckets[s.start].floorWei;
    const last = buckets[s.end - 1].floorWei;
    const avg = avgFloorWeiByLevel[s.level];
    console.log(
      `  - ${s.level.padEnd(10)}: buckets[${s.start}..${s.end - 1}] floors ${formatEth(first, 8)}..${formatEth(last, 8)} ETH | avg=${formatEth(avg, 8)} ETH`,
    );
  }
  console.log("");

  console.log("Suggested NftPool price ranges (low inclusive, high exclusive):");
  for (const r of ranges) {
    const highStr = r.level === "UltraRare" ? "MAX_UINT256" : `${r.high.toString()} (${formatEth(r.high, 8)} ETH)`;
    console.log(`  - ${r.level.padEnd(10)}: low=${r.low.toString()} (${formatEth(r.low, 8)} ETH) | high=${highStr}`);
  }
  console.log("");

  console.log("Estimated RTP using resulting per-level mean floors (instant cash path):");
  for (const pt of PACK_TYPES) {
    const rtpBps = expectedRtpBpsForPack({
      packPriceWei: packPricesWei[pt],
      probsBps: probs[pt],
      avgFloorWeiByLevel,
      rewardsPerPack,
      payoutBps,
    });
    console.log(`  - ${pt.padEnd(8)}: ~${(rtpBps / 100).toFixed(2)}%`);
  }
  console.log("");

  console.log("PoolRange[] for Solidity (setAllPoolInfo):");
  console.log("```solidity");
  console.log("NftPool.PoolRange;");
  for (let i = 0; i < ranges.length; i++) {
    const r = ranges[i];
    const high = r.level === "UltraRare" ? "type(uint256).max" : r.high.toString();
    console.log(`ranges[${i}] = NftPool.PoolRange({ lowPrice: ${r.low.toString()}, highPrice: ${high} }); // ${r.level}`);
  }
  console.log("nftPool.setAllPoolInfo(ranges);");
  console.log("```");
  console.log("");

  console.log("Ignition parameters snippet for nftPool.json (customRanges):");
  console.log("```json");
  const jsonRanges = ranges.map((r) => ({
    lowPrice: r.low.toString(),
    highPrice: r.level === "UltraRare" ? ((1n << 256n) - 1n).toString() : r.high.toString(),
  }));
  console.log(
    JSON.stringify(
      {
        NftPoolModule: {
          useCustomRanges: true,
          customRanges: jsonRanges,
        },
      },
      null,
      2,
    ),
  );
  console.log("```");
  console.log("");

  console.log("Collection -> level assignment (by floor price bucket):");
  for (const b of buckets) {
    const lvl = levelOfFloor(b.floorWei, ranges);
    const label = `${formatEth(b.floorWei, 8)} ETH`.padEnd(20);
    console.log(`- Floor ${label} => ${lvl}`);
    for (const c of b.collections) {
      const name = c.name ? ` (${c.name})` : "";
      const w = c.weight ?? 1;
      console.log(`    • ${c.address}${name} weight=${w}`);
    }
  }

  console.log("");
  console.log(`DP objective cost (wei^2): ${dpCost.toString()}`);
}

main();