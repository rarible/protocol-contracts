import { task } from 'hardhat/config';
import { ExchangeV2__factory } from "@rarible/exchange-v2/typechain-types";

async function getSetAllProtocolFeeCalldata(receiver: string, buyerAmount: number, sellerAmount: number) {
    const calldata = ExchangeV2__factory.createInterface().encodeFunctionData("setAllProtocolFeeData", [receiver, buyerAmount, sellerAmount]);
    return calldata;
}

export default getSetAllProtocolFeeCalldata;

task("get-set-allprotocol-fee-calldata", "Gets the calldata for the setAllProtocolFeeData function")
  .addParam("receiver", "The receiver address")
  .addParam("buyerAmount", "The buyer amount")
  .addParam("sellerAmount", "The seller amount")
  .setAction(async (args, hre) => {
    const calldata = await getSetAllProtocolFeeCalldata(args.receiver, args.buyerAmount, args.sellerAmount);
    console.log(calldata);
  });