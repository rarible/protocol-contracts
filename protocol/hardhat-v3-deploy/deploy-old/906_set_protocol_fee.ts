import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { getConfig } from '../utils/utils'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {  execute } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();

  const { deploy_meta, deploy_non_meta } = getConfig(hre.network.name);
  let contractName: string = "";
  if (!!deploy_meta) {
    contractName = "ExchangeMetaV2";
  }
  if (!!deploy_non_meta) {
    contractName = "ExchangeV2";
  }
  const feeReceiver = "0x053F171c0D0Cc9d76247D4d1CdDb280bf1131390";
  const buyerFeeBps = 0;
  const sellerFeeBps = 200;

  const receipt = await execute(contractName, { from: deployer, log: true }, "setAllProtocolFeeData", feeReceiver, buyerFeeBps, sellerFeeBps);
  console.log(`Protocol fee set. Tx hash: ${receipt.transactionHash}`);
};


export default func;
func.tags = ['all', 'set-protocol-fee', '906'];
