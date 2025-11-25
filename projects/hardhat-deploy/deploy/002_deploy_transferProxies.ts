import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { GAS_PRICE } from '../utils/utils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  //deploy and initialise 4 transfer proxies
  await deployAndInitProxy(hre, "TransferProxy")

  await deployAndInitProxy(hre, "ERC20TransferProxy")

  await deployAndInitProxy(hre, "ERC721LazyMintTransferProxy")

  await deployAndInitProxy(hre, "ERC1155LazyMintTransferProxy")

};

async function deployAndInitProxy(hre: HardhatRuntimeEnvironment, contractName: string) {
  
  const { deployer } = await hre.getNamedAccounts();
  
  const { deploy, execute } = hre.deployments;

  const transferProxyReceipt = await deploy(contractName, {
    from: deployer,
    log: true,
    autoMine: true,
    gasPrice: GAS_PRICE,
  });

  const Proxy = await hre.ethers.getContractFactory(contractName);
  const proxy = Proxy.attach(transferProxyReceipt.address);

  await execute(
    contractName,
    { from: deployer, log: true, gasPrice: GAS_PRICE },
    "__OperatorRole_init"
  );

  return proxy;
}

export default func;
func.tags = ['all', 'all-no-tokens', 'all-with-sanity-check', 'deploy-transfer-proxies', '002'];
