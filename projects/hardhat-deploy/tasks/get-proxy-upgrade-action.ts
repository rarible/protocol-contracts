import { task } from 'hardhat/config';
import { IProxyUpgradeAction__factory } from "../typechain-types";

async function getProxyUpgradeActionCalldata(admin: string, target: string, newLogic: string) {
    const calldata = IProxyUpgradeAction__factory.createInterface().encodeFunctionData("perform", [admin, target, newLogic]);
    return calldata;
}

export default getProxyUpgradeActionCalldata;
// https://www.tally.xyz/gov/rari-foundation/proposal/64443561092723928501818567121519051108693422626070463342810224372241233243885
task("get-proxy-upgrade-action", "Gets the calldata for the update implementation via action")
  .addParam("admin", "proxy admin address")
  .addParam("target", "target address to call")
  .addParam("newLogic", "new implementation address")
  .setAction(async (args, hre) => {
    const calldata = await getProxyUpgradeActionCalldata(args.admin, args.target, args.newLogic);
    console.log(calldata);
  });