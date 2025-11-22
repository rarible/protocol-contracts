import { task } from 'hardhat/config';

async function getSetAllProtocolFeeCalldataAction(receiver: string, buyerAmount: number, sellerAmount: number) {
  const { SetProtocolFeeAction__factory } = await import("../typechain-types");
  const calldata = SetProtocolFeeAction__factory.createInterface().encodeFunctionData("perform", [receiver, buyerAmount, sellerAmount]);
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

  // npx hardhat get-set-allprotocol-fee-calldata --receiver 0x7e9c956e3efa81ace71905ff0daef1a71f42cbc5 --buyer-amount 25 --seller-amount 25
  // npx hardhat get-set-allprotocol-fee-calldata-action --receiver 0xb6ec1d227d5486d344705663f700d90d947d7548 --buyer-amount 0 --seller-amount 200
  // 0x828bd7fe000000000000000000000000b6ec1d227d5486d344705663f700d90d947d7548000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c8
  // address for a call: 0xcaC1fE02cB051672D93eE390136B8E10301B6709