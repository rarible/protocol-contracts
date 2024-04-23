import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { getConfig } from '../utils/utils'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deploy_meta, deploy_non_meta } = getConfig(hre.network.name);

  //deploying ERC1155 with meta support if needed
  if (!!deploy_meta) {
    await deployERC1155TokenAndFactory(hre, "ERC1155RaribleMeta", "ERC1155RaribleBeaconMetaOwnerManaged");
  }

  if (!!deploy_non_meta) {
    await deployERC1155TokenAndFactory(hre, "ERC1155Rarible", "ERC1155RaribleBeaconOwnerManaged");
  }

};

async function deployERC1155TokenAndFactory(hre: HardhatRuntimeEnvironment, contractName: string, beaconName: string) {
  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();

  const transferProxyyAddress = (await hre.deployments.get("TransferProxy")).address;
  const erc1155LazyMintTransferProxyAddress = (await hre.deployments.get("ERC1155LazyMintTransferProxy")).address;

  //deploy token proxy
  const erc1155Receipt = await deploy(contractName, {
    from: deployer,
    proxy: {
      execute: {
        init: {
          methodName: "__ERC1155Rarible_init_proxy",
          args: ["Rarible", "RARI", "ipfs:/", "", transferProxyyAddress, erc1155LazyMintTransferProxyAddress, deployer],
        },
      },
      proxyContract: "OpenZeppelinTransparentProxy",
    },
    log: true,
    autoMine: true,
    deterministicDeployment: process.env.DETERMENISTIC_DEPLOYMENT_SALT,
    skipIfAlreadyDeployed: process.env.SKIP_IF_ALREADY_DEPLOYED ? true: false,
  });

  //deploy beacon
  const erc1155BeaconReceipt = await deploy(beaconName, {
    from: deployer,
    args: [erc1155Receipt.implementation, deployer],
    log: true,
    autoMine: true,
    deterministicDeployment: process.env.DETERMENISTIC_DEPLOYMENT_SALT,
    skipIfAlreadyDeployed: process.env.SKIP_IF_ALREADY_DEPLOYED ? true: false,
  });

  //deploy factory
  const factory1155Receipt = await deploy("ERC1155RaribleFactoryC2OwnerManaged", {
    from: deployer,
    args: [erc1155BeaconReceipt.address, transferProxyyAddress, erc1155LazyMintTransferProxyAddress, deployer],
    log: true,
    autoMine: true,
    deterministicDeployment: process.env.DETERMENISTIC_DEPLOYMENT_SALT,
    skipIfAlreadyDeployed: process.env.SKIP_IF_ALREADY_DEPLOYED ? true: false,
  });

}

export default func;
func.tags = ['all', 'tokens', 'erc1155'];
