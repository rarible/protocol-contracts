import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { ERC721_LAZY, ERC1155_LAZY, COLLECTION, getConfig } from '../utils/utils'
import { UnsafeTransferProxy, UnsafeTransferProxy__factory } from '../typechain-types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  //deploy and initialise 4 transfer proxies
  const { deploy } = hre.deployments;
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer", deployer.address)

  const transferProxy = await getTransferProxy(hre, "UnsafeTransferProxy")

  const transferProxyContract = UnsafeTransferProxy__factory.connect(transferProxy.address, deployer)

  const tx =  await (await transferProxyContract.addOperator(deployer.address)).wait()
  console.log("Transfer proxy operator added", tx.transactionHash)
};

async function getTransferProxy(hre: HardhatRuntimeEnvironment, contractName: string) {
    const address = (await hre.deployments.get(contractName)).address;
    return await hre.ethers.getContractAt(contractName, address)
  }

export default func;
func.tags = ['all-no-tokens', 'deploy-transfer-proxy-add-operator', '004'];
