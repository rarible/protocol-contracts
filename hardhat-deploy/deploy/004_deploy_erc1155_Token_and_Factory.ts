import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

import { getConfig } from '../utils/utils'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deploy_meta, deploy_non_meta } = getConfig(hre.network.name);

  //deploying ERC1155 with meta support if needed
  if (!!deploy_meta) {
    await deployERC1155TokenAndeFactory(hre, "ERC1155RaribleMeta", "ERC1155RaribleBeaconMeta");
  } 
  
  if (!!deploy_non_meta){
    await deployERC1155TokenAndeFactory(hre, "ERC1155Rarible", "ERC1155RaribleBeacon");
  }

};

async function deployERC1155TokenAndeFactory (hre: HardhatRuntimeEnvironment, contractName: string, beaconName: string) {
  const {deploy} = hre.deployments;
  const {deployer} = await hre.getNamedAccounts();

  const transferProxyyAddress = (await hre.deployments.get("TransferProxy")).address;
  const erc1155LazyMintTransferProxyAddress = (await hre.deployments.get("ERC1155LazyMintTransferProxy")).address;

  //deploy token proxy
  const erc1155Receipt = await deploy(contractName, {
    from: deployer,
    proxy: {
      execute: {
        init: {
          methodName: "__ERC1155Rarible_init",
          args: ["Rarible", "RARI", "ipfs:/", "", transferProxyyAddress, erc1155LazyMintTransferProxyAddress],
        },
      },
      proxyContract: "OpenZeppelinTransparentProxy",
    },
    log: true,
    autoMine: true,
  });

  //deploy beacon
  const erc1155BeaconReceipt = await deploy(beaconName, {
    from: deployer,
    args: [erc1155Receipt.implementation],
    log: true,
    autoMine: true,
  });

  //deploy factory
  const factory1155Receipt = await deploy("ERC1155RaribleFactoryC2", {
    from: deployer,
    args: [erc1155BeaconReceipt.address, transferProxyyAddress, erc1155LazyMintTransferProxyAddress],
    log: true,
    autoMine: true,
  });

}


export default func;
func.tags = ['all'];
