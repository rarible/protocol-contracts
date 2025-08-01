import { task } from "hardhat/config";
import { AllowlistProof } from "../sdk";
import { BigNumber, ethers } from "ethers";
import fs from "fs";
import path from "path";

task("claim", "Claims tokens from a drop contract")
  .addParam("contract", "Deployed Drop contract address")
  .addParam("receiver", "Address to receive the tokens")
  .addParam("quantity", "Number of tokens to claim")
  .addOptionalParam("allowlist", "Path to the allowlist JSON file")
  .addOptionalParam("data", "Additional encoded data (default: 0x)", "0x")
  .addOptionalParam("from", "Signer address (defaults to first signer)")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const { getActiveClaimCondition, claim } = await import("../sdk");
    const activeClaimCondition = await getActiveClaimCondition(args.contract, signer);
    console.log("Active claim condition:", activeClaimCondition);

    let allowlistProof: AllowlistProof = {
      proof: [],
      quantityLimitPerWallet: 0,
      pricePerToken: ethers.constants.MaxUint256,
      currency: ethers.constants.AddressZero,
    };

    if (args.allowlist) {
      const allowlistPath = path.resolve(args.allowlist);

      // Check if the file exists
      if (!fs.existsSync(allowlistPath)) {
        throw new Error(`Allowlist file not found at path: ${allowlistPath}`);
      }

      // Parse JSON file
      const rawData = fs.readFileSync(allowlistPath, "utf8");
      let allowlistJson;
      try {
        allowlistJson = JSON.parse(rawData);
      } catch (e) {
        throw new Error(`Invalid JSON format in allowlist file: ${e.message}`);
      }

      if (!Array.isArray(allowlistJson.proofs)) {
        throw new Error("Invalid allowlist JSON: 'proofs' array is missing.");
      }

      // Find entry for the receiver
      const receiverEntry = allowlistJson.proofs.find(
        (entry: any) =>
          entry.address.toLowerCase() === args.receiver.toLowerCase()
      );

      if (!receiverEntry) {
        throw new Error(
          `Receiver address ${args.receiver} not found in the allowlist file.`
        );
      }

      // Build AllowlistProof struct
      allowlistProof = {
        proof: receiverEntry.proof || [],
        quantityLimitPerWallet: BigNumber.from(receiverEntry.maxClaimable || 0),
        pricePerToken: BigNumber.from(receiverEntry.price || 0),
        currency: receiverEntry.currency || ethers.constants.AddressZero,
      };
    } else if (activeClaimCondition.merkleRoot !== ethers.constants.HashZero) {
      const { owner } = await import("../sdk");
      const ownerAddress = await owner(args.contract, signer);
      if (args.receiver === ownerAddress) {
        console.log("Attempting to claim with owner address...")
        const quantityLimitPerWallet = ethers.constants.MaxUint256;
        const pricePerToken = BigNumber.from(0);
        const nativeCurrency = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

        allowlistProof = {
          proof: [],
          quantityLimitPerWallet,
          pricePerToken,
          currency: nativeCurrency,
        };
      } else {
        throw new Error("Attempted to claim with non-owner address.")
      }
    }

    await claim(
      args.contract,
      args.receiver,
      args.quantity,
      activeClaimCondition.currency,
      activeClaimCondition.pricePerToken,
      allowlistProof,
      args.data,
      signer
    );
  });
