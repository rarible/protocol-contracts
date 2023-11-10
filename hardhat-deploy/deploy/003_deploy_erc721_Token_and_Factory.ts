import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

import { getConfig } from '../utils/utils'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deploy_meta, deploy_non_meta } = getConfig(hre.network.name);

  //deploying ERC721 with meta support if needed
  if (!!deploy_meta) {
    await deployERC721TokenAndeFactory(hre, "ERC721RaribleMeta", "ERC721RaribleMinimalBeaconMeta");
  } 
  
  if (!!deploy_non_meta){
    await deployERC721TokenAndeFactory(hre, "ERC721RaribleMinimal", "ERC721RaribleMinimalBeacon");
  }

};

async function deployERC721TokenAndeFactory (hre: HardhatRuntimeEnvironment, contractName: string, beaconName: string) {
  const {deploy} = hre.deployments;
  const {deployer} = await hre.getNamedAccounts();

  const transferProxyyAddress = (await hre.deployments.get("TransferProxy")).address;
  const erc721LazyMintTransferProxyAddress = (await hre.deployments.get("ERC721LazyMintTransferProxy")).address;

  //deploy token proxy
  const erc721Receipt = await deploy(contractName, {
    from: deployer,
    proxy: {
      execute: {
        init: {
          methodName: "__ERC721Rarible_init",
          args: ["Rarible", "RARI", "ipfs:/", "", transferProxyyAddress, erc721LazyMintTransferProxyAddress],
        },
      },
      proxyContract: "OpenZeppelinTransparentProxy",
    },
    log: true,
    autoMine: true,
  });

  //deploy beacon
  const erc721BeaconReceipt = await deploy(beaconName, {
    from: deployer,
    args: [erc721Receipt.implementation],
    log: true,
    autoMine: true,
  });

  //deploy factory
  const factory721Receipt = await deploy("ERC721RaribleFactoryC2", {
    from: deployer,
    args: [erc721BeaconReceipt.address, transferProxyyAddress, erc721LazyMintTransferProxyAddress],
    log: true,
    autoMine: true,
  });
}
export default func;

func.tags = ['all'];
