/// @ai_context
/// Script to calculate pool level floor prices for target RTP (Return To Player)
///
/// This script helps determine what floor prices should be set for each pool level
/// to achieve a target RTP (default 70%) for pack purchases.
///
/// The calculation considers:
/// - Pack prices for each pack type (Bronze, Silver, Gold, Platinum)
/// - Probability distribution for each pack type across pool levels
/// - 3 NFTs per pack (REWARDS_PER_PACK)
/// - Instant cash payout percentage (80% of floor price)

// ==========================================
// Configuration - Edit these values
// ==========================================

// Pack prices in ETH
const PACK_PRICES = {
  Bronze: 0.01,
  Silver: 0.05,
  Gold: 0.1,
  Platinum: 0.5,
};

// Target RTP (Return To Player) as decimal
const TARGET_RTP = 0.7; // 70%

// Instant cash payout percentage (from PackManager)
const INSTANT_CASH_PERCENTAGE = 80; // 80% of floor price
const INSTANT_CASH_DIVISOR = 100;

// NFTs per pack
const REWARDS_PER_PACK = 3;

// Probability thresholds per pack type (from PackManager defaults)
// These are cumulative thresholds out of 10000 (100.00%)
// Order: UltraRare, Legendary, Epic, Rare, Common (remainder)
const PROBABILITY_THRESHOLDS = {
  Bronze: {
    ultraRare: 0,      // 0%
    legendary: 20,     // 0.2%
    epic: 120,         // 1% (0.2% + 1% = 1.2% cumulative, but threshold is 120)
    rare: 620,         // 5% 
    // common: remainder (93.8%)
  },
  Silver: {
    ultraRare: 0,      // 0%
    legendary: 50,     // 0.5%
    epic: 350,         // 3%
    rare: 1350,        // 10%
    // common: remainder (86.5%)
  },
  Gold: {
    ultraRare: 0,      // 0%
    legendary: 100,    // 1%
    epic: 600,         // 5%
    rare: 2100,        // 15%
    // common: remainder (79%)
  },
  Platinum: {
    ultraRare: 50,     // 0.5%
    legendary: 250,    // 2%
    epic: 950,         // 7%
    rare: 2950,        // 20%
    // common: remainder (70.5%)
  },
};

// ==========================================
// Calculation Logic
// ==========================================

interface LevelProbabilities {
  ultraRare: number;
  legendary: number;
  epic: number;
  rare: number;
  common: number;
}

function calculateProbabilities(thresholds: typeof PROBABILITY_THRESHOLDS.Bronze): LevelProbabilities {
  // Convert thresholds to actual probabilities (as decimals)
  const ultraRare = thresholds.ultraRare / 10000;
  const legendary = (thresholds.legendary - thresholds.ultraRare) / 10000;
  const epic = (thresholds.epic - thresholds.legendary) / 10000;
  const rare = (thresholds.rare - thresholds.epic) / 10000;
  const common = (10000 - thresholds.rare) / 10000;
  
  return { ultraRare, legendary, epic, rare, common };
}

function calculateExpectedFloorValue(
  probs: LevelProbabilities,
  floorPrices: { common: number; rare: number; epic: number; legendary: number; ultraRare: number }
): number {
  return (
    probs.common * floorPrices.common +
    probs.rare * floorPrices.rare +
    probs.epic * floorPrices.epic +
    probs.legendary * floorPrices.legendary +
    probs.ultraRare * floorPrices.ultraRare
  );
}

function calculateInstantCashPayout(floorValue: number): number {
  return (floorValue * INSTANT_CASH_PERCENTAGE) / INSTANT_CASH_DIVISOR;
}

// ==========================================
// Main Script
// ==========================================

console.log("╔══════════════════════════════════════════════════════════════════╗");
console.log("║           PACK RTP CALCULATOR - Floor Price Analysis             ║");
console.log("╚══════════════════════════════════════════════════════════════════╝\n");

console.log(`Target RTP: ${(TARGET_RTP * 100).toFixed(0)}%`);
console.log(`Instant Cash Payout: ${INSTANT_CASH_PERCENTAGE}% of floor price`);
console.log(`Rewards per pack: ${REWARDS_PER_PACK}\n`);

// Calculate probabilities for each pack type
const packProbabilities: Record<string, LevelProbabilities> = {};
for (const [packType, thresholds] of Object.entries(PROBABILITY_THRESHOLDS)) {
  packProbabilities[packType] = calculateProbabilities(thresholds);
}

// Display probabilities
console.log("┌─────────────────────────────────────────────────────────────────┐");
console.log("│                    PROBABILITY DISTRIBUTION                      │");
console.log("├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┤");
console.log("│ Pack     │ Common   │ Rare     │ Epic     │ Legendary│ UltraRare│");
console.log("├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤");
for (const [packType, probs] of Object.entries(packProbabilities)) {
  console.log(
    `│ ${packType.padEnd(8)} │ ${(probs.common * 100).toFixed(2).padStart(6)}%  │ ${(probs.rare * 100).toFixed(2).padStart(6)}%  │ ${(probs.epic * 100).toFixed(2).padStart(6)}%  │ ${(probs.legendary * 100).toFixed(2).padStart(6)}%  │ ${(probs.ultraRare * 100).toFixed(2).padStart(6)}%  │`
  );
}
console.log("└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘\n");

// Calculate required floor prices for each pack type to hit target RTP
console.log("┌─────────────────────────────────────────────────────────────────┐");
console.log("│               REQUIRED EXPECTED VALUE PER PACK                   │");
console.log("├──────────┬────────────┬────────────────┬─────────────────────────┤");
console.log("│ Pack     │ Price (ETH)│ Target EV (ETH)│ Target EV per NFT (ETH) │");
console.log("├──────────┼────────────┼────────────────┼─────────────────────────┤");

for (const [packType, price] of Object.entries(PACK_PRICES)) {
  // For instant cash: payout = floor * 0.8, so floor = payout / 0.8
  // Target payout = price * RTP
  // So target floor value = (price * RTP) / 0.8
  const targetPayout = price * TARGET_RTP;
  const targetFloorValue = targetPayout / (INSTANT_CASH_PERCENTAGE / 100);
  const targetFloorPerNft = targetFloorValue / REWARDS_PER_PACK;
  
  console.log(
    `│ ${packType.padEnd(8)} │ ${price.toFixed(4).padStart(10)} │ ${targetFloorValue.toFixed(6).padStart(14)} │ ${targetFloorPerNft.toFixed(6).padStart(23)} │`
  );
}
console.log("└──────────┴────────────┴────────────────┴─────────────────────────┘\n");

// Solve for floor prices that achieve target RTP for Platinum (most restrictive)
// Using weighted average approach
console.log("═══════════════════════════════════════════════════════════════════");
console.log("          SUGGESTED FLOOR PRICES BY POOL LEVEL                     ");
console.log("═══════════════════════════════════════════════════════════════════\n");

// We need to solve: sum(prob_i * floor_i) * 3 * 0.8 = price * RTP
// This gives us: sum(prob_i * floor_i) = price * RTP / (3 * 0.8)

// Let's use a ratio-based approach where higher levels have higher floors
// Common: 1x, Rare: 4x, Epic: 20x, Legendary: 100x, UltraRare: 500x
const FLOOR_RATIOS = {
  common: 1,
  rare: 4,
  epic: 20,
  legendary: 100,
  ultraRare: 500,
};

console.log("Using floor price ratios: Common=1x, Rare=4x, Epic=20x, Legendary=100x, UltraRare=500x\n");

interface FloorPrices {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
  ultraRare: number;
}

function solveForFloorPrices(packType: string, packPrice: number, probs: LevelProbabilities): FloorPrices {
  // Target: sum(prob_i * floor_i) * REWARDS_PER_PACK * PAYOUT_RATE = packPrice * TARGET_RTP
  // floor_i = base * ratio_i
  // sum(prob_i * base * ratio_i) * REWARDS_PER_PACK * PAYOUT_RATE = packPrice * TARGET_RTP
  // base * sum(prob_i * ratio_i) * REWARDS_PER_PACK * PAYOUT_RATE = packPrice * TARGET_RTP
  // base = (packPrice * TARGET_RTP) / (sum(prob_i * ratio_i) * REWARDS_PER_PACK * PAYOUT_RATE)
  
  const weightedRatioSum = 
    probs.common * FLOOR_RATIOS.common +
    probs.rare * FLOOR_RATIOS.rare +
    probs.epic * FLOOR_RATIOS.epic +
    probs.legendary * FLOOR_RATIOS.legendary +
    probs.ultraRare * FLOOR_RATIOS.ultraRare;
  
  const payoutRate = INSTANT_CASH_PERCENTAGE / INSTANT_CASH_DIVISOR;
  const base = (packPrice * TARGET_RTP) / (weightedRatioSum * REWARDS_PER_PACK * payoutRate);
  
  return {
    common: base * FLOOR_RATIOS.common,
    rare: base * FLOOR_RATIOS.rare,
    epic: base * FLOOR_RATIOS.epic,
    legendary: base * FLOOR_RATIOS.legendary,
    ultraRare: base * FLOOR_RATIOS.ultraRare,
  };
}

// Calculate and display suggested floor prices for each pack type
for (const [packType, price] of Object.entries(PACK_PRICES)) {
  const probs = packProbabilities[packType];
  const floors = solveForFloorPrices(packType, price, probs);
  
  console.log(`┌─────────────────────────────────────────────────────────────────┐`);
  console.log(`│ ${packType.toUpperCase()} PACK (Price: ${price} ETH, Target RTP: ${(TARGET_RTP * 100).toFixed(0)}%)`.padEnd(66) + `│`);
  console.log(`├─────────────┬────────────────┬────────────────────────────────────┤`);
  console.log(`│ Pool Level  │ Floor (ETH)    │ Probability │ Contrib to EV       │`);
  console.log(`├─────────────┼────────────────┼─────────────┼─────────────────────┤`);
  
  const levels = ['common', 'rare', 'epic', 'legendary', 'ultraRare'] as const;
  let totalEV = 0;
  
  for (const level of levels) {
    const floor = floors[level];
    const prob = probs[level];
    const contrib = floor * prob;
    totalEV += contrib;
    
    console.log(
      `│ ${level.charAt(0).toUpperCase() + level.slice(1).padEnd(10)} │ ${floor.toFixed(6).padStart(14)} │ ${(prob * 100).toFixed(2).padStart(9)}%  │ ${contrib.toFixed(6).padStart(19)} │`
    );
  }
  
  const totalFloorValuePerPack = totalEV * REWARDS_PER_PACK;
  const instantCashPayout = calculateInstantCashPayout(totalFloorValuePerPack);
  const actualRtp = instantCashPayout / price;
  
  console.log(`├─────────────┴────────────────┴─────────────┴─────────────────────┤`);
  console.log(`│ Expected floor value per NFT: ${totalEV.toFixed(6)} ETH`.padEnd(66) + `│`);
  console.log(`│ Expected floor value per pack (3 NFTs): ${totalFloorValuePerPack.toFixed(6)} ETH`.padEnd(66) + `│`);
  console.log(`│ Instant cash payout (80%): ${instantCashPayout.toFixed(6)} ETH`.padEnd(66) + `│`);
  console.log(`│ Actual RTP: ${(actualRtp * 100).toFixed(2)}%`.padEnd(66) + `│`);
  console.log(`└──────────────────────────────────────────────────────────────────┘\n`);
}

// Summary table with recommended pool ranges
console.log("═══════════════════════════════════════════════════════════════════");
console.log("          RECOMMENDED POOL LEVEL RANGES (for 70% RTP)              ");
console.log("═══════════════════════════════════════════════════════════════════\n");

// Use Platinum pack floors as the baseline (most balanced)
const platinumFloors = solveForFloorPrices("Platinum", PACK_PRICES.Platinum, packProbabilities.Platinum);

console.log("Based on Platinum pack (most balanced probability distribution):\n");
console.log("┌─────────────┬──────────────────────┬──────────────────────┐");
console.log("│ Pool Level  │ Min Floor (ETH)      │ Max Floor (ETH)      │");
console.log("├─────────────┼──────────────────────┼──────────────────────┤");

const levels = ['common', 'rare', 'epic', 'legendary', 'ultraRare'] as const;
const ranges: { level: string; min: number; max: number }[] = [];

for (let i = 0; i < levels.length; i++) {
  const level = levels[i];
  const floor = platinumFloors[level];
  
  // Calculate range: current level floor to next level floor (or infinity for ultraRare)
  const min = i === 0 ? 0 : platinumFloors[levels[i - 1]];
  const max = floor;
  
  ranges.push({ level, min, max });
  
  const minStr = i === 0 ? "0" : min.toFixed(6);
  const maxStr = i === levels.length - 1 ? `${max.toFixed(6)}+` : max.toFixed(6);
  
  console.log(
    `│ ${(level.charAt(0).toUpperCase() + level.slice(1)).padEnd(11)} │ ${minStr.padStart(20)} │ ${maxStr.padStart(20)} │`
  );
}
console.log("└─────────────┴──────────────────────┴──────────────────────┘\n");

// NftPool.sol compatible ranges (low, high)
console.log("For NftPool.sol setPoolInfo() calls:\n");
console.log("```solidity");
for (let i = 0; i < levels.length; i++) {
  const level = levels[i];
  const floor = platinumFloors[level];
  const prevFloor = i === 0 ? 0 : platinumFloors[levels[i - 1]];
  
  const lowWei = Math.floor(prevFloor * 1e18);
  const highWei = Math.floor(floor * 1e18);
  
  console.log(`// ${level.charAt(0).toUpperCase() + level.slice(1)} (${i})`);
  console.log(`nftPool.setPoolInfo(${i}, ${lowWei}, ${highWei});`);
}
console.log("```\n");

console.log("═══════════════════════════════════════════════════════════════════");
console.log("                              NOTES                                 ");
console.log("═══════════════════════════════════════════════════════════════════");
console.log(`
1. These calculations assume the instant cash payout is ${INSTANT_CASH_PERCENTAGE}% of floor price.
2. The floor price ratios used (1:4:20:100:500) can be adjusted based on 
   actual NFT collection valuations.
3. Different pack types have different probability distributions, so floor 
   prices that achieve 70% RTP for one pack type may result in different 
   RTP for other pack types.
4. Consider using the Platinum pack ranges as the baseline since it has 
   the most balanced probability distribution across all levels.
5. Actual RTP depends on which NFTs are in the pool and their floor prices.
`);
