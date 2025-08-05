import { task } from "hardhat/config";

task("tokensOfOwner", "Get all tokens owned by an address in an ERC721AQueryableUpgradeable contract")
  .addParam("contract", "The deployed contract address")
  .addParam("owner", "The owner address")
  .addOptionalParam("from", "Address to sign the transaction")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const { tokensOfOwner } = await import("../sdk");

    try {
      const tokens = await tokensOfOwner(args.contract, args.owner, signer);
      console.log(`Tokens owned by ${args.owner}:`, tokens);
    } catch (error) {
      console.error("Error fetching tokens of owner:", error);
    }
  });

task("tokensOfOwnerIn", "Get tokens owned by an address within a range in an ERC721AQueryableUpgradeable contract")
  .addParam("contract", "The deployed contract address")
  .addParam("owner", "The owner address")
  .addParam("start", "Start token ID (inclusive)")
  .addParam("end", "End token ID (exclusive)")
  .addOptionalParam("from", "Address to sign the transaction")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const { tokensOfOwnerIn } = await import("../sdk");

    try {
      const tokens = await tokensOfOwnerIn(args.contract, args.owner, parseInt(args.start), parseInt(args.end), signer);
      console.log(`Tokens owned by ${args.owner} in range [${args.start}, ${args.end}):`, tokens);
    } catch (error) {
      console.error("Error fetching tokens of owner in range:", error);
    }
  });
