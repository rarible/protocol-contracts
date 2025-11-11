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

// npx hardhat get-proxy-upgrade-action --admin 0x80033c932904e077e55a6e43e5e9a796f34d2525 --target 0x9757f2d2b135150bbeb65308d4a91804107cd8d6 --new-logic 0x1f90567f5f63eab82a2c37414471b13e4896331b
// 0xe17f52e900000000000000000000000080033c932904e077e55a6e43e5e9a796f34d25250000000000000000000000009757f2d2b135150bbeb65308d4a91804107cd8d60000000000000000000000001f90567f5f63eab82a2c37414471b13e4896331b


// npx hardhat get-proxy-upgrade-action --admin 0x80033c932904e077e55a6e43e5e9a796f34d2525 --target 0x9757f2d2b135150bbeb65308d4a91804107cd8d6 --new-logic 0xa669f302574B7E6B1Dd065956Ac1d0A9275d3782
// 0xe17f52e900000000000000000000000080033c932904e077e55a6e43e5e9a796f34d25250000000000000000000000009757f2d2b135150bbeb65308d4a91804107cd8d6000000000000000000000000a669f302574b7e6b1dd065956ac1d0a9275d3782
// address for a call: 0xd22CD47808ae4b13D46Fa8FEFc08C91eb5790Bf8