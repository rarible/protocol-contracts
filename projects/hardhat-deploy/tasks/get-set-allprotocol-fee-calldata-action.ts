import { task } from 'hardhat/config';
import { ISetPrtocolFeeAction__factory } from "../typechain-types";

async function getSetAllProtocolFeeCalldataAction(receiver: string, buyerAmount: number, sellerAmount: number) {
    const calldata = ISetPrtocolFeeAction__factory.createInterface().encodeFunctionData("perform", [receiver, buyerAmount, sellerAmount]);
    return calldata;
}

export default getSetAllProtocolFeeCalldataAction;
// https://www.tally.xyz/gov/rari-foundation/proposal/64443561092723928501818567121519051108693422626070463342810224372241233243885
task("get-set-allprotocol-fee-calldata-action", "Gets the calldata for the setAllProtocolFeeData function")
  .addParam("receiver", "The receiver address")
  .addParam("buyerAmount", "The buyer amount")
  .addParam("sellerAmount", "The seller amount")
  .setAction(async (args, hre) => {
    const calldata = await getSetAllProtocolFeeCalldataAction(args.receiver, args.buyerAmount, args.sellerAmount);
    console.log(calldata);
  });