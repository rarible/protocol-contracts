import { task } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import { LedgerSigner } from "@anders-t/ethers-ledger";

task(
  "stake-for-proposal",
  "Stake RARI into Locking (veRARI) so the signer reaches the governor's proposal threshold"
)
  .addOptionalParam("delegate", "Delegate address (defaults to signer)")
  .addOptionalParam("slopePeriod", "Lock slope period (defaults to Locking.minSlopePeriod)")
  .addOptionalParam("cliff", "Lock cliff (defaults to Locking.minCliffPeriod)")
  .addOptionalParam("maxAmount", "Maximum RARI amount to stake (defaults to exact needed)")
  .addOptionalParam("from", "Signer address (defaults to first signer)")
  .setAction(async (args, hre) => {
    console.log("hre", hre);
    const { ethers } = hre;
    const { execute, getSigner } = hre.deployments;
    const provider = hre.ethers.provider;
    const signer = new LedgerSigner(provider, "m/44'/60'/0'/0/0");
    const signerAddress = await signer.getAddress();
    
    const lockingAddress: string = "0x096Bd9a7a2e703670088C05035e23c7a9F428496";
    const tokenAddress: string = "0xFca59Cd816aB1eaD66534D82bc21E7515cE441CF";
    const governorAddress: string = "0x6552C8fb228f7776Fc0e4056AA217c139D4baDa1";
    const delegateAddress: string = await signer.getAddress();

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

    console.log("load contracts");

    const token = new ethers.Contract(tokenAddress, erc20Abi, signer);
    const locking = new ethers.Contract(lockingAddress, lockingAbi, signer);
    const governor = new ethers.Contract(governorAddress, governorAbi, signer);

    const [symbol, decimals, threshold, currentVotes] = await Promise.all([
      token.symbol().catch(() => "RARI"),
      token.decimals().catch(() => 18),
      governor.proposalThreshold(),
      locking.getVotes(signerAddress),
    ]);

    console.log(`Signer: ${signerAddress}`);
    console.log(`Governor: ${governorAddress}`);
    console.log(`Proposal threshold: ${threshold.toString()}`);
    console.log(`Current veRARI votes: ${currentVotes.toString()}`);

    if (currentVotes.gte(threshold)) {
      console.log("Already at or above proposal threshold. No staking needed.");
      return;
    }

    const needed = threshold.sub(currentVotes);
    console.log(`Additional votes needed: ${needed.toString()}`);

    const balance = await token.balanceOf(signerAddress);
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
    // const desired = ethers.BigNumber.from(needed);
    // const cap = args.maxAmount
    //   ? ethers.BigNumber.from(args.maxAmount)
    //   : balance;
    // const stakeAmount = desired.lte(cap) ? desired : cap;
    const stakeAmount = ethers.BigNumber.from("10000000000000000000");

    if (stakeAmount.isZero()) {
      throw new Error("Insufficient balance or maxAmount is 0; cannot stake to reach threshold.");
    }
    if (stakeAmount.gt(balance)) {
      throw new Error("Insufficient RARI balance to stake the required amount.");
    }

    // Ensure allowance
    // const allowance = await token.allowance(deployer, lockingAddress);
    // if (allowance.lt(stakeAmount)) {
      // console.log(`Approving ${stakeAmount.toString()} ${symbol} to Locking...`);
      // const approveTx = await token.connect(signer).approve(lockingAddress, stakeAmount);
      // console.log(`Approve tx hash: ${approveTx.hash}`);
      // const res = await execute(tokenAddress, { from: deployer, log: true, to: tokenAddress }, "approve", lockingAddress, stakeAmount);
      // console.log(`Approve tx hash: ${res.transactionHash}`);
    //}

    console.log(
      `Locking ${stakeAmount.toString()} ${symbol} to reach proposal threshold; delegate=${delegateAddress}`
    );
    // const lockTx = await locking.lock(signerAddress, signerAddress, stakeAmount, slopePeriod, cliff);
    // const lockReceipt = await lockTx.wait();
    // console.log(`Lock tx hash: ${lockReceipt.transactionHash}`);

    const updatedVotes = await locking.getVotes(signerAddress);
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

