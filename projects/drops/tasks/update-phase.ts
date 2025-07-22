import { task } from "hardhat/config";
import fs from "fs";
import { BigNumber } from "ethers";
import { ClaimCondition } from "../sdk/set-claim-conditions";

task("update-phase", "Updates a specific phase by index")
  .addParam("contract", "Deployed contract address")
  .addParam("phaseIndex", "Index of the phase to update")
  .addOptionalParam("from", "Signer address (defaults to first signer)")

  // Optional parameters to update
  .addOptionalParam("start", "New start time in UNIX seconds")
  .addOptionalParam("phaseName", "New metadata name (if provided, will update IPFS metadata)")
  .addOptionalParam("allowlist", "Path to a CSV file with allowlist addresses")
  .addOptionalParam("maxClaimableSupply", "Max supply")
  .addOptionalParam("supplyClaimed", "Already claimed supply")
  .addOptionalParam("quantityLimitPerWallet", "Per-wallet limit")
  .addOptionalParam("pricePerToken", "Token price")
  .addOptionalParam("currency", "Currency address")

  .setAction(async (args, hre) => {
    const { setClaimConditions, getClaimConditions } = await import("../sdk");
    const { uploadMetadataToIPFS, uploadAllowlistToIPFS } = await import("../utils/fileBaseUploader");
    const { generateMerkleTreeFromCSV } = await import("../utils/merkleTreeGenerator");
    const { ethers } = hre;
    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const claimConditions: ClaimCondition[] = await getClaimConditions(args.contract, signer);
    const index = parseInt(args.phaseIndex);
    const existing = claimConditions[index];

    if (!existing) {
      throw new Error(`No phase exists at index ${index}`);
    }

    const nativeCurrency = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

    // Check if at least one updatable parameter is provided
    const isAnyUpdate =
      args.start !== undefined ||
      args.phaseName !== undefined ||
      args.allowlist !== undefined ||
      args.maxClaimableSupply !== undefined ||
      args.supplyClaimed !== undefined ||
      args.quantityLimitPerWallet !== undefined ||
      args.pricePerToken !== undefined ||
      args.currency !== undefined;

    if (!isAnyUpdate) {
      throw new Error("You must provide at least one parameter to update.");
    }

    // If allowlist is present, update merkleRoot
    let newMerkleRoot = existing.merkleRoot;
    if (args.allowlist) {
      const { root } = generateMerkleTreeFromCSV(args.allowlist);
      const allowlist = JSON.parse(fs.readFileSync("./allowlist.json", "utf8"));
      await uploadAllowlistToIPFS(args.contract, allowlist);
      newMerkleRoot = root;
    }

    // If metadata name is present, re-upload metadata
    let newMetadata = existing.metadata;
    if (args.phaseName) {
      newMetadata = await uploadMetadataToIPFS(args.contract, {
        name: args.phaseName,
      });
    }

    const updatedCondition = {
      startTimestamp: args.start ? parseInt(args.start) : existing.startTimestamp,
      maxClaimableSupply: args.maxClaimableSupply
        ? BigNumber.from(args.maxClaimableSupply)
        : existing.maxClaimableSupply,
      supplyClaimed: args.supplyClaimed
        ? BigNumber.from(args.supplyClaimed)
        : existing.supplyClaimed,
      quantityLimitPerWallet: args.quantityLimitPerWallet
        ? BigNumber.from(args.quantityLimitPerWallet)
        : existing.quantityLimitPerWallet,
      merkleRoot: newMerkleRoot,
      pricePerToken: args.pricePerToken
        ? BigNumber.from(args.pricePerToken)
        : existing.pricePerToken,
      currency: args.currency || existing.currency || nativeCurrency,
      metadata: newMetadata,
    };

    const newConditions = [...claimConditions];
    newConditions[index] = updatedCondition;

    await setClaimConditions(args.contract, newConditions, false, signer);
    if (fs.existsSync("./allowlist.json")) {
      fs.unlinkSync("./allowlist.json");
    }
    console.log(`✅ Phase at index ${index} updated successfully.`);
  });
