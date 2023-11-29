import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { getConfig } from '../utils/utils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deploy_meta, deploy_non_meta } = getConfig(hre.network.name);

  // Deploying ERC1155 with meta support if needed
  if (deploy_meta) {
    await deployERC1155TokenAndFactory(hre, "ERC1155RaribleMeta", "ERC1155RaribleBeaconMeta");
  }

  if (deploy_non_meta) {
    await deployERC1155TokenAndFactory(hre, "ERC1155Rarible", "ERC1155RaribleBeacon");
  }
};

async function deployERC1155TokenAndFactory(hre: HardhatRuntimeEnvironment, contractName: string, beaconName: string) {
  const { deploy } = hre.deployments;
  const { ethers } = hre;
  const { deployer } = await hre.getNamedAccounts();

  const transferProxyAddress = (await hre.deployments.get("TransferProxy")).address;
  const erc1155LazyMintTransferProxyAddress = (await hre.deployments.get("ERC1155LazyMintTransferProxy")).address;

  // Deploy token contract without a proxy
  const erc1155Receipt = await deploy(contractName, {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  // Manually call the initialization function
  const erc1155Contract = await ethers.getContractAt(contractName, erc1155Receipt.address);
  await erc1155Contract.__ERC1155Rarible_init("Rarible", "RARI", "ipfs:/", "", transferProxyAddress, erc1155LazyMintTransferProxyAddress);

  // Deploy beacon
  const erc1155BeaconReceipt = await deploy(beaconName, {
    from: deployer,
    args: [erc1155Receipt.address],
    log: true,
    autoMine: true,
  });

  // Deploy factory
  const factory1155Receipt = await deploy("ERC1155RaribleFactoryC2", {
    from: deployer,
    args: [erc1155BeaconReceipt.address, transferProxyAddress, erc1155LazyMintTransferProxyAddress],
    log: true,
    autoMine: true,
  });
}

export default func;
func.tags = ['all_zk'];
