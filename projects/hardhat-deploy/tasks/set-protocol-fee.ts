/*
<ai_context>
Hardhat task: Set protocol fee for ExchangeV2 contract.
Usage: 
  npx hardhat set-protocol-fee --exchange 0x... --fee 300 --recipient 0x...
</ai_context>
*/
import { task } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import { setProtocolFee } from "../sdk/set-protocol-fee";

task("set-protocol-fee", "Sets the protocol fee on ExchangeV2")
  .addOptionalParam("exchange", "ExchangeV2 contract address")
  .addParam("sellerFeeBps", "Seller fee in basis points (e.g. 300 for 3%)")
  .addParam("buyerFeeBps", "Buyer fee in basis points (e.g. 300 for 3%)")
  .addOptionalParam("recipient", "Fee recipient address (optional, will use current if not provided)")
  .setAction(async (args, hre) => {
    const { sellerFeeBps, buyerFeeBps, recipient } = args;
    let { exchange } = args;
    const signers = await hre.ethers.getSigners();
    const signer = signers[0];
    if (!exchange) {
      exchange = (await hre.deployments.get("ExchangeV2")).address;
    }
    console.log(`Setting protocol fee for ExchangeV2 at ${exchange}`);
    console.log(`New fee: ${sellerFeeBps} bps (${(parseInt(sellerFeeBps) / 10000).toFixed(2)}%)`);
    console.log(`New fee: ${buyerFeeBps} bps (${(parseInt(buyerFeeBps) / 10000).toFixed(2)}%)`);
    if (recipient) console.log(`New fee recipient: ${recipient}`);
    else console.log(`Fee recipient: (no change)`);

    try {
      const receipt = await setProtocolFee(
        exchange,
        parseInt(sellerFeeBps, 10),
        parseInt(buyerFeeBps, 10),
        recipient,
        signer
      );
      console.log(`✅ Protocol fee set. Tx hash: ${receipt.transactionHash}`);
    } catch (err: any) {
      console.error(`❌ Error setting protocol fee: ${err.message || err}`);
    }
  });

export default {};