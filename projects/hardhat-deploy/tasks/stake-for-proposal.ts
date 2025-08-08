import { task } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";

task(
  "stake-for-proposal",
  "Stake RARI into Locking (veRARI) so the signer reaches the governor's proposal threshold"
)
  .addParam("locking", "Locking (veRARI) contract address")
  .addParam("token", "RARI token address to stake")
  .addParam("governor", "Governor contract address to read proposalThreshold")
  .addOptionalParam("delegate", "Delegate address (defaults to signer)")
  .addOptionalParam("slopePeriod", "Lock slope period (defaults to Locking.minSlopePeriod)")
  .addOptionalParam("cliff", "Lock cliff (defaults to Locking.minCliffPeriod)")
  .addOptionalParam("maxAmount", "Maximum RARI amount to stake (defaults to exact needed)")
  .addOptionalParam("from", "Signer address (defaults to first signer)")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const lockingAddress: string = args.locking;
    const tokenAddress: string = args.token;
    const governorAddress: string = args.governor;
    const delegateAddress: string = args.delegate || signer.address;

    const erc20Abi = [
      "function balanceOf(address) view returns (uint256)",
      "function allowance(address,address) view returns (uint256)",
      "function approve(address,uint256) returns (bool)",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)",
    ];

    const lockingAbi = [
      "function getVotes(address) view returns (uint256)",
      "function minSlopePeriod() view returns (uint256)",
      "function minCliffPeriod() view returns (uint256)",
      "function lock(address account, address _delegate, uint256 amount, uint256 slopePeriod, uint256 cliff) returns (uint256)",
      "function name() view returns (string)",
    ];

    const governorAbi = [
      "function proposalThreshold() view returns (uint256)",
    ];

    const token = new ethers.Contract(tokenAddress, erc20Abi, signer);
    const locking = new ethers.Contract(lockingAddress, lockingAbi, signer);
    const governor = new ethers.Contract(governorAddress, governorAbi, signer);

    const [symbol, decimals, threshold, currentVotes] = await Promise.all([
      token.symbol().catch(() => "RARI"),
      token.decimals().catch(() => 18),
      governor.proposalThreshold(),
      locking.getVotes(signer.address),
    ]);

    console.log(`Signer: ${signer.address}`);
    console.log(`Governor: ${governorAddress}`);
    console.log(`Proposal threshold: ${threshold.toString()}`);
    console.log(`Current veRARI votes: ${currentVotes.toString()}`);

    if (currentVotes.gte(threshold)) {
      console.log("Already at or above proposal threshold. No staking needed.");
      return;
    }

    const needed = threshold.sub(currentVotes);
    console.log(`Additional votes needed: ${needed.toString()}`);

    const balance = await token.balanceOf(signer.address);
    console.log(`Wallet ${symbol} balance: ${balance.toString()}`);

    let slopePeriod = args.slopePeriod
      ? ethers.BigNumber.from(args.slopePeriod)
      : await locking.minSlopePeriod();
    let cliff = args.cliff
      ? ethers.BigNumber.from(args.cliff)
      : await locking.minCliffPeriod();

    console.log(`Using slopePeriod=${slopePeriod.toString()}, cliff=${cliff.toString()}`);

    // Heuristic: assume voting power is non-decreasing with amount for given periods, target 'needed'
    // Cap by maxAmount if provided, else by wallet balance
    const desired = ethers.BigNumber.from(needed);
    const cap = args.maxAmount
      ? ethers.BigNumber.from(args.maxAmount)
      : balance;
    const stakeAmount = desired.lte(cap) ? desired : cap;

    if (stakeAmount.isZero()) {
      throw new Error("Insufficient balance or maxAmount is 0; cannot stake to reach threshold.");
    }
    if (stakeAmount.gt(balance)) {
      throw new Error("Insufficient RARI balance to stake the required amount.");
    }

    // Ensure allowance
    const allowance = await token.allowance(signer.address, lockingAddress);
    if (allowance.lt(stakeAmount)) {
      console.log(`Approving ${stakeAmount.toString()} ${symbol} to Locking...`);
      const txApprove = await token.approve(lockingAddress, stakeAmount);
      await txApprove.wait();
    }

    console.log(
      `Locking ${stakeAmount.toString()} ${symbol} to reach proposal threshold; delegate=${delegateAddress}`
    );
    const tx = await locking.lock(
      signer.address,
      delegateAddress,
      stakeAmount,
      slopePeriod,
      cliff
    );
    const receipt = await tx.wait();
    console.log(`Lock tx hash: ${receipt.transactionHash}`);

    const updatedVotes = await locking.getVotes(signer.address);
    console.log(`Updated veRARI votes: ${updatedVotes.toString()}`);

    if (updatedVotes.lt(threshold)) {
      console.warn(
        "Warning: votes still below threshold. Consider increasing amount or lock periods (slope/cliff)."
      );
    } else {
      console.log("Success: proposal threshold reached.");
    }
  });

export default {};

