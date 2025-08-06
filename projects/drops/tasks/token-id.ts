import { task } from "hardhat/config";

task("next-token-id-to-claim", "Get the next token ID to claim from a Drop contract")
  .addParam("contract", "The deployed contract address")
  .addParam("type", 'Contract type: "721" or "oe"')
  .addOptionalParam("from", "Address to sign the transaction")
  .setAction(async (args, hre) => {
    const { ethers } = hre;

    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const { nextTokenIdToClaim } = await import("../sdk");

    try {
      const nextId = await nextTokenIdToClaim(args.contract, args.type, signer);
      console.log(`Next token ID to claim: ${nextId.toString()}`);
    } catch (error) {
      console.error("Error fetching next token ID to claim:", error);
    }
  });

task("next-token-id-to-mint", "Get the next token ID to mint from a Drop contract")
  .addParam("contract", "The deployed contract address")
  .addParam("type", 'Contract type: "721", "1155", or "oe"')
  .addOptionalParam("from", "Address to sign the transaction")
  .setAction(async (args, hre) => {
    const { ethers } = hre;

    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const { nextTokenIdToMint } = await import("../sdk");

    try {
      const nextId = await nextTokenIdToMint(args.contract, args.type, signer);
      console.log(`Next token ID to mint: ${nextId.toString()}`);
    } catch (error) {
      console.error("Error fetching next token ID to mint:", error);
    }
  });

task("start-token-id", "Get the start token ID from an OpenEdition Drop contract")
  .addParam("contract", "The deployed contract address")
  .addOptionalParam("from", "Address to sign the transaction")
  .setAction(async (args, hre) => {
    const { ethers } = hre;

    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const { startTokenId } = await import("../sdk");

    try {
      const startId = await startTokenId(args.contract, signer);
      console.log(`Start token ID: ${startId.toString()}`);
    } catch (error) {
      console.error("Error fetching start token ID:", error);
    }
  });
