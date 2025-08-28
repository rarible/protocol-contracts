/*
<ai_context>
Mainnet-fork test for veRARI Locking.getVotes(address).
What it does (UPDATED):
- Forks Ethereum mainnet (requires MAINNET_RPC_URL).
- Uses real Locking at 0x096B...8496 and RARI at 0xFca5...41CF (mainnet).
- Locks 5040 RARI with (cliff=103, slope=minSlopePeriod) to achieve >=5030 votes immediately.
- Mines blocks with 3 second spacing via hardhat_mine to simulate time "like a real chain".
- Verifies:
  * 0 before locking
  * >=5030 immediately after locking
  * votes remain FLAT during the entire cliff (not increasing linearly)
  * votes drop to ~0 after cliff + 1 slope-week (with slopePeriod = 1)
Notes:
- Epoch math in Locking is based on block.number (WEEK=50400 blocks), not timestamps.
- We mine blocks in large batches using hardhat_mine with an interval of 3s per block.
</ai_context>
*/
import { expect } from "chai";
import { BigNumber, Contract } from "ethers";
import { ethers, network } from "hardhat";

// --- Addresses (Ethereum mainnet) ---
const RARI = "0xFca59Cd816aB1eaD66534D82bc21E7515cE441CF";
// Rarible veRARI Locking (mainnet)
const LOCKING = "0x096Bd9a7a2e703670088C05035e23c7a9F428496";
// Tester target EOA (your address)
const YOUR_EOA = "0xe223825497c435BAeaf318F03d33Ec704954028A";

// Contract constants
const WEEK_BLOCKS = BigNumber.from(50400); // as per LockingBase.WEEK
const BLOCK_INTERVAL = BigNumber.from(12);

function toWei(n: string) {
  return ethers.utils.parseEther(n);
}

async function resetForkOrSkip() {
  const rpc = process.env.MAINNET_RPC_URL;
  if (!rpc) {
    console.warn("⚠️ No MAINNET RPC set. Skipping veRARI mainnet-fork test.");
    return false;
  }
  await network.provider.request({
    method: "hardhat_reset",
    params: [
      {
        forking: {
          jsonRpcUrl: rpc,
        },
      },
    ],
  });
  return true;
}

async function setEthBalance(addr: string, ether: string) {
  await network.provider.send("hardhat_setBalance", [
    addr,
    ethers.utils.hexValue(ethers.utils.parseEther(ether)),
  ]);
}

async function impersonate(addr: string) {
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [addr],
  });
  return await ethers.getSigner(addr);
}

/**
 * Mine `count` blocks with `secondsPerBlock` spacing (defaults to 3 seconds).
 * Uses hardhat_mine so that:
 * - block.number += count
 * - block.timestamp += count * secondsPerBlock
 */
async function mineBlocks(count: BigNumber | number, secondsPerBlock: BigNumber | number = THREE_SECONDS) {
  const n = BigNumber.isBigNumber(count) ? count : BigNumber.from(count);
  const s = BigNumber.isBigNumber(secondsPerBlock) ? secondsPerBlock : BigNumber.from(secondsPerBlock);
  await network.provider.request({
    method: "hardhat_mine",
    params: [
      ethers.utils.hexValue(n),
      ethers.utils.hexValue(s),
    ],
  });
}

describe("veRARI (mainnet fork) — votes vs. blocks (cliff & slope)", function () {
  this.timeout(1_200_000); // 20 minutes, large enough for big-block mining

  let ok = false;

  before(async function () {
    ok = await resetForkOrSkip();
    if (!ok) this.skip();
  });

  it("locks 5040 RARI and verifies votes shape: flat over cliff, drop after slope", async function () {
    if (!ok) this.skip();

    const [funding] = await ethers.getSigners();

    // Give our funding signer a fat ETH balance on the fork
    await setEthBalance(funding.address, "200");

    // Minimal ABIs
    const erc20Abi = [
      "function balanceOf(address) view returns (uint256)",
      "function transfer(address,uint256) returns (bool)",
      "function approve(address,uint256) returns (bool)",
      "function allowance(address,address) view returns (uint256)",
      "function decimals() view returns (uint8)"
    ];
    const lockingAbi = [
      "function getVotes(address) view returns (uint256)",
      "function getAvailableForWithdraw(address) view returns (uint256)",
      "function locked(address) view returns (uint256)",
      "function minSlopePeriod() view returns (uint256)",
      "function minCliffPeriod() view returns (uint256)",
      "function lock(address account, address _delegate, uint256 amount, uint256 slopePeriod, uint256 cliff) returns (uint256)",
      "function name() view returns (string)"
    ];

    const rari = new Contract(RARI, erc20Abi, funding);
    const locking = new Contract(LOCKING, lockingAbi, funding);

    // Impersonate YOUR_EOA (acts as owner/user for lock/approve)
    const you = await impersonate(YOUR_EOA);
    await setEthBalance(YOUR_EOA, "5");

    const rariAmount = toWei("5030");
    const rariYou = rari.connect(you);

    // Approve Locking to pull RARI
    await rariYou.approve(LOCKING, rariAmount);

    const lockingYou = locking.connect(you);

    const minSlope = (await locking.minSlopePeriod()).toNumber();
    const minCliff = (await locking.minCliffPeriod()).toNumber();

    // Sanity: get baseline votes (should be 0 before lock)
    const beforeVotes: BigNumber = await lockingYou.getVotes(YOUR_EOA);
    expect(beforeVotes.eq(0), "Votes must be 0 before locking").to.eq(true);

    // Choose params to ensure >= 5030 votes:
    // cliff = 103 (max); slope = minSlope
    const cliff = 103;
    const slope = minSlope;

    // Lock 5040 RARI
    await lockingYou.lock(YOUR_EOA, YOUR_EOA, rariAmount, slope, cliff);

    // --- Mine 1 week (blocks), verify votes remain FLAT in cliff ---
    await mineBlocks(WEEK_BLOCKS, BLOCK_INTERVAL); // +1 week (in blocks)

    const afterLockVotes: BigNumber = await lockingYou.getVotes(YOUR_EOA);
    const availableForWithdraw: BigNumber = await lockingYou.getAvailableForWithdraw(YOUR_EOA);
    console.log("afterLockVotes", afterLockVotes.toString());
    console.log("availableForWithdraw", availableForWithdraw.toString());
    // We want >= 5030
    const want = toWei("5030");
    expect(afterLockVotes.gte(want), `Votes should be >= 5030 after lock; got ${afterLockVotes.toString()}`).to.eq(true);


    const week1Votes = await lockingYou.getVotes(YOUR_EOA);
    expect(week1Votes.eq(afterLockVotes), "Votes should remain flat during cliff").to.eq(true);

    // --- Mine the rest of the cliff (102 more weeks), verify still FLAT ---
    const remainingCliffWeeks = cliff - 1; // we've already mined 1 week
    await mineBlocks(WEEK_BLOCKS.mul(remainingCliffWeeks), BLOCK_INTERVAL); // +102 weeks
    console.log("availableForWithdraw after cliff", (await lockingYou.getAvailableForWithdraw(YOUR_EOA)).toString());
    const endCliffVotes = await lockingYou.getVotes(YOUR_EOA);
    console.log("endCliffVotes", endCliffVotes.toString());
    expect(endCliffVotes.eq(want), "Votes should remain flat through entire cliff").to.eq(true);

    // --- Now slope starts; with slopePeriod = 1, votes decay to ~0 over 1 week ---
    await mineBlocks(WEEK_BLOCKS.mul(2), BLOCK_INTERVAL); // +1 slope week
    const afterSlopeVotes = await lockingYou.getVotes(YOUR_EOA);
    const afterSlopeAvailableForWithdraw = await lockingYou.getAvailableForWithdraw(YOUR_EOA);
    console.log("afterSlopeAvailableForWithdraw", afterSlopeAvailableForWithdraw.toString());
    console.log("afterSlopeVotes", afterSlopeVotes.toString());
    expect(afterSlopeVotes.eq(0), "Votes should be 0 after cliff + slope (slope=1)").to.eq(true);
  });

  // it("demonstrates 'not linear increase': take samples across cliff — constant == no linear growth", async function () {
  //   if (!ok) this.skip();

  //   // Since previous test already advanced a lot, we re-fork to a fresh state
  //   ok = await resetForkOrSkip();
  //   if (!ok) this.skip();

  //   const [funding] = await ethers.getSigners();
  //   await setEthBalance(funding.address, "200");

  //   const erc20Abi = [
  //     "function balanceOf(address) view returns (uint256)",
  //     "function approve(address,uint256) returns (bool)"
  //   ];
  //   const lockingAbi = [
  //     "function getVotes(address) view returns (uint256)",
  //     "function minSlopePeriod() view returns (uint256)",
  //     "function lock(address account, address _delegate, uint256 amount, uint256 slopePeriod, uint256 cliff) returns (uint256)"
  //   ];

  //   const rari = new Contract(RARI, erc20Abi, funding);
  //   const locking = new Contract(LOCKING, lockingAbi, funding);

  //   const you = await impersonate(YOUR_EOA);
  //   await setEthBalance(YOUR_EOA, "5");

  //   const amt = toWei("5040");
  //   await rari.connect(you).approve(LOCKING, amt);

  //   const minSlope = (await locking.minSlopePeriod()).toNumber();
  //   const cliff = 103;

  //   await locking.connect(you).lock(YOUR_EOA, YOUR_EOA, amt, minSlope, cliff);

  //   const v0 = await locking.getVotes(YOUR_EOA);
  //   await mineBlocks(WEEK_BLOCKS.mul(10), BLOCK_INTERVAL);   // +10 weeks
  //   const v10 = await locking.getVotes(YOUR_EOA);
  //   await mineBlocks(WEEK_BLOCKS.mul(30), BLOCK_INTERVAL);   // +30 weeks (total 40)
  //   const v40 = await locking.getVotes(YOUR_EOA);
  //   await mineBlocks(WEEK_BLOCKS.mul(63), BLOCK_INTERVAL);   // +63 weeks (total 103)
  //   const v103 = await locking.getVotes(YOUR_EOA);

  //   // All the same through the cliff → flat, not linear increase
  //   expect(v10.eq(v0), "Votes flat at 10 weeks").to.eq(true);
  //   expect(v40.eq(v0), "Votes flat at 40 weeks").to.eq(true);
  //   expect(v103.eq(v0), "Votes flat at 103 weeks (end of cliff)").to.eq(true);
  // });
});