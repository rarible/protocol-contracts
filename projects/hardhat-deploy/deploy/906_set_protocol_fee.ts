import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { GAS_PRICE, getConfig } from '../utils/utils'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {  execute } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();

  const { deploy_meta, deploy_non_meta, fee_receiver } = getConfig(hre.network.name);
  let contractName: string = "";
  if (!!deploy_meta) {
    contractName = "ExchangeMetaV2";
  }
  if (!!deploy_non_meta) {
    contractName = "ExchangeV2";
  }
  const feeReceiver = fee_receiver || "0x735092F168FaeDeeBA11eDAa765455ecFf3C53b7";
  const buyerFeeBps = 0;
  const sellerFeeBps = 200;

  const receipt = await execute(contractName, { from: deployer, log: true, gasPrice: GAS_PRICE }, "setAllProtocolFeeData", feeReceiver, buyerFeeBps, sellerFeeBps);
  console.log(`Protocol fee set. Tx hash: ${receipt.transactionHash}`);
};


export default func;
func.tags = ['all', 'set-protocol-fee', '906'];
