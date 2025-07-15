import { task } from "hardhat/config";


task("get-protocol-fee", "Get the protocol fee from ExchangeV2")
  .addParam("contract", "The ExchangeV2 contract address")
  .setAction(async (taskArgs, hre) => {
    const { getProtocolFee } = await import("../sdk/protocolFee");
    const { contract } = taskArgs;
    const [signer] = await hre.ethers.getSigners();
    const fee = await getProtocolFee(contract, signer);
    console.log("Protocol Fee:");
    console.log(`Receiver: ${fee.receiver}`);
    console.log(`Buyer Amount: ${fee.buyerAmount}`);
    console.log(`Seller Amount: ${fee.sellerAmount}`);
  });