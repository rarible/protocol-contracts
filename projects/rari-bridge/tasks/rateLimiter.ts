// <ai_context>
// Hardhat tasks for configuring LayerZero V2 RateLimiter on OFT/OFTAdapter.
// Uses TypeChain factories (RariOFT__factory, RariOFTAdapter__factory) and Ledger signer.
// Accepts a JSON array for RateLimitConfig: [{ dstEid, limit, window }, ...].
// </ai_context>

import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getLedgerSigner } from "@rarible/deploy-utils";

type RateLimitConfig = {
  dstEid: number | string;
  limit: string;   // in LD units (token decimals)
  window: number | string; // seconds
};

task("rate:set", "Set LayerZero RateLimiter configs on an OFT/OFTAdapter")
  .addParam("contract", "OFT or OFTAdapter contract address")
  .addParam("configs", "JSON array of { dstEid, limit, window }")
  .setAction(async (args: { contract: string; configs: string }, hre: HardhatRuntimeEnvironment) => {
    const { ethers, network } = hre;

    const {  IRateLimiter__factory } = await import("../typechain-types");

    const signer = getLedgerSigner(ethers.provider, "m/44'/60'/0'/0/0");

    const parsed: RateLimitConfig[] = JSON.parse(args.configs);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("configs must be a non-empty JSON array");
    }

    // Try canonical OFT first
    let connected = IRateLimiter__factory.connect(args.contract, signer);

    // Prepare configs in the exact struct shape; any casts are to appease TS
    const cfgs = parsed.map((c) => ({
      dstEid: Number(c.dstEid),
      limit: ethers.BigNumber.from(c.limit),
      window: ethers.BigNumber.from(c.window),
    })) as any[];

    console.log(`[${network.name}] Setting rate limits on ${args.contract}:`, cfgs);
    const tx = await connected.setRateLimits(cfgs);
    console.log("tx.hash:", tx.hash);
    await tx.wait();
    console.log("✅ Rate limits set.");
  });