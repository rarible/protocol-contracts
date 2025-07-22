import { task } from "hardhat/config";
import fs from "fs";
import { setClaimConditions, ClaimCondition } from "../sdk/set-claim-conditions";
import { uploadMetadataToIPFS, uploadAllowlistToIPFS } from "../utils/fileBaseUploader"; // ← wrap Filebase SDK call here
import { generateMerkleTreeFromCSV, hashLeaf } from "../utils/merkleTreeGenerator";
import { BigNumber } from "ethers";

task("add-phase", "Adds a phase to a drop contract")
  .addParam("contract", "Deployed contract address")
  .addParam("phase", "Phase type: 'allowlist', 'public', 'owner'")
  .addParam("phaseName", "Human-readable name to generate metadata")
  .addParam("start", "Start time in UNIX seconds")
  .addFlag("reset", "Whether to reset claim eligibility")
  .addOptionalParam("from", "Signer address (defaults to first signer)")
  
  // Manual params
  .addOptionalParam("allowlist", "Path to a CSV file with allowlist addresses")
  .addOptionalParam("maxClaimableSupply", "Max supply, if not set, it will assume maximum uint256 value")
  .addOptionalParam("supplyClaimed", "Already claimed (usually 0), if not set, it will assume 0")
  .addOptionalParam("quantityLimitPerWallet", "Per-wallet limit, if not set, it will assume maximum uint256 value")
  .addOptionalParam("pricePerToken", "Token price (as string), if not set, it will assume 0")
  .addOptionalParam("currency", "Currency address (ERC20 or native), if not set, it will assume native currency")

  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const nativeCurrency = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

    const metadataUri = await uploadMetadataToIPFS(args.contract, {
      name: args.phaseName
    });

    let condition: ClaimCondition;

    if (args.phase === "public") {
      let merkleRoot = ethers.constants.HashZero;
      if (args.allowlist) {
        const { root } = generateMerkleTreeFromCSV(args.allowlist);
        const allowlist = JSON.parse(fs.readFileSync("./allowlist.json", "utf8"));
        await uploadAllowlistToIPFS(args.contract, allowlist);
        merkleRoot = root;
      }

      condition = {
        startTimestamp: parseInt(args.start),
        maxClaimableSupply: args.maxClaimableSupply
          ? BigNumber.from(args.maxClaimableSupply)
          : ethers.constants.MaxUint256,
        supplyClaimed: args.supplyClaimed
          ? BigNumber.from(args.supplyClaimed)
          : BigNumber.from("0"),
        quantityLimitPerWallet: args.quantityLimitPerWallet
          ? BigNumber.from(args.quantityLimitPerWallet)
          : ethers.constants.MaxUint256,
        merkleRoot,
        pricePerToken: BigNumber.from(args.pricePerToken || "0"),
        currency: args.currency || nativeCurrency,
        metadata: metadataUri,
      };
    } else if (args.phase === "owner") {
      const { owner } = await import("../sdk");
      const ownerAddress = await owner(args.contract, signer);

      const quantityLimitPerWallet = ethers.constants.MaxUint256;
      const pricePerToken = BigNumber.from(0);
      const currency = nativeCurrency;

      condition = {
        startTimestamp: parseInt(args.start),
        maxClaimableSupply: ethers.constants.MaxUint256,
        supplyClaimed: BigNumber.from(0),
        quantityLimitPerWallet: BigNumber.from(0),
        merkleRoot: hashLeaf({
          address: ownerAddress,
          maxClaimable: quantityLimitPerWallet.toString(),
          price: pricePerToken.toString(),
          currency: currency,
        }),
        pricePerToken,
        currency,
        metadata: metadataUri,
      };
    } else if (args.phase === "allowlist") {
      if (!args.allowlist) {
        throw new Error("Allowlist CSV path is required for 'allowlist' phase.");
      }

      const { root } = generateMerkleTreeFromCSV(args.allowlist);
      const allowlist = JSON.parse(fs.readFileSync("./allowlist.json", "utf8"));
      await uploadAllowlistToIPFS(args.contract, allowlist);
      const merkleRoot = root;

      condition = {
        startTimestamp: parseInt(args.start),
        maxClaimableSupply: args.maxClaimableSupply
          ? BigNumber.from(args.maxClaimableSupply)
          : ethers.constants.MaxUint256,
        supplyClaimed: BigNumber.from(0),
        quantityLimitPerWallet: BigNumber.from(0),
        merkleRoot,
        pricePerToken: BigNumber.from(args.pricePerToken || "0"),
        currency: nativeCurrency,
        metadata: metadataUri,
      };
    } else {
      throw new Error(`Phase '${args.phase}' not yet supported.`);
    }

    await setClaimConditions(args.contract, [condition], args.reset, signer);
    if (fs.existsSync("./allowlist.json")) {
      fs.unlinkSync("./allowlist.json");
    }
    console.log(`✅ Claim condition for phase "${args.phase}" successfully set.`);
  });
