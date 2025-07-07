import { task } from "hardhat/config";
import { transferOwnershipOfContract } from "../sdk/transfer-ownership";

task("transfer-ownership", "Transfers ownership of an Ownable contract")
  .addParam("contract", "The deployed contract address")
  .addParam("newOwner", "The address to transfer ownership to")
  .addOptionalParam("from", "The current owner's address (defaults to first available signer)")
  .setAction(async (args, hre) => {
    const { ethers } = hre;

    // Resolve signer
    let signer;
    if (args.from) {
      signer = await ethers.getSigner(args.from);
    } else {
      [signer] = await ethers.getSigners();
    }

    const signerAddress = await signer.getAddress();
    const { contract, newOwner } = args;

    console.log(`Transferring ownership of ${contract} to ${newOwner} using ${signerAddress}`);

    await transferOwnershipOfContract(contract, newOwner, signer);
  });
