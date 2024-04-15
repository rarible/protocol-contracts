import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  //deploy and initialise 4 transfer proxies
  await deployAndInitProxy(hre, "TransferProxy")

  await deployAndInitProxy(hre, "ERC20TransferProxy")

  await deployAndInitProxy(hre, "ERC721LazyMintTransferProxy")

  await deployAndInitProxy(hre, "ERC1155LazyMintTransferProxy")

};

async function deployAndInitProxy(hre: HardhatRuntimeEnvironment, contractName: string) {
  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();

  const transferProxyReceipt = await deploy(contractName, {
    from: deployer,
    log: true,
    autoMine: true,
  });

  const Proxy = await hre.ethers.getContractFactory(contractName);
  const proxy = await Proxy.attach(transferProxyReceipt.address);

  const initTx = await proxy.__OperatorRole_init();
  await initTx.wait()

  return proxy;
}

export default func;
func.tags = ['all', 'all-no-tokens', 'deploy-transfer-proxies'];
