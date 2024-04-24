import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { getConfig } from '../utils/utils'
import { getOwner } from './utils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deploy_meta, deploy_non_meta } = getConfig(hre.network.name);

  //deploying ERC721 with meta support if needed
  if (!!deploy_meta) {
    await deployERC721TokenAndFactory(hre, "ERC721RaribleMeta", "ERC721RaribleMinimalBeaconMeta");
  }

  if (!!deploy_non_meta) {
    await deployERC721TokenAndFactory(hre, "ERC721RaribleMinimal", "ERC721RaribleMinimalBeacon");
  }

};

async function deployERC721TokenAndFactory(hre: HardhatRuntimeEnvironment, contractName: string, beaconName: string) {
  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();
  const owner  = await getOwner(hre);
  
  const transferProxyyAddress = (await hre.deployments.get("TransferProxy")).address;
  const erc721LazyMintTransferProxyAddress = (await hre.deployments.get("ERC721LazyMintTransferProxy")).address;

  //deploy token proxy
  const erc721Receipt = await deploy(contractName, {
    from: deployer,
    proxy: {
      execute: {
        init: {
          methodName: "__ERC721Rarible_init_proxy",
          args: ["Rarible", "RARI", "ipfs:/", "", transferProxyyAddress, erc721LazyMintTransferProxyAddress, owner],
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
  const erc721BeaconReceipt = await deploy(beaconName, {
    from: deployer,
    args: [erc721Receipt.implementation, owner],
    log: true,
    autoMine: true,
    deterministicDeployment: process.env.DETERMENISTIC_DEPLOYMENT_SALT,
    skipIfAlreadyDeployed: process.env.SKIP_IF_ALREADY_DEPLOYED ? true: false,
  });

  //deploy factory
  const factory721Receipt = await deploy("ERC721RaribleFactoryC2", {
    from: deployer,
    args: [erc721BeaconReceipt.address, transferProxyyAddress, erc721LazyMintTransferProxyAddress, owner],
    log: true,
    autoMine: true,
    deterministicDeployment: process.env.DETERMENISTIC_DEPLOYMENT_SALT,
    skipIfAlreadyDeployed: process.env.SKIP_IF_ALREADY_DEPLOYED ? true: false,
  });
}
export default func;

func.tags = ['all', 'tokens', 'erc721', "004"];
