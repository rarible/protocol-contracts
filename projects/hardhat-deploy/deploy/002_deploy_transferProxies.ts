import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { getOwner } from './utils';

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
  const owner  = await getOwner(hre);
  const transferProxyReceipt = await deploy(contractName, {
    from: deployer,
    proxy: {
      execute: {
        init: {
          methodName: `__${contractName}_init_proxy`,
          args: [owner],
        },
      },
      proxyContract: "OpenZeppelinTransparentProxy",
    },
    log: true,
    autoMine: true,
    deterministicDeployment: process.env.DETERMENISTIC_DEPLOYMENT_SALT,
    skipIfAlreadyDeployed: process.env.SKIP_IF_ALREADY_DEPLOYED ? true: false,
  });
  const Proxy = await hre.ethers.getContractFactory(contractName);
  const proxy = await Proxy.attach(transferProxyReceipt.address);

  return proxy;
}

export default func;
func.tags = ['all', 'all-no-tokens', 'deploy-transfer-proxies'];
