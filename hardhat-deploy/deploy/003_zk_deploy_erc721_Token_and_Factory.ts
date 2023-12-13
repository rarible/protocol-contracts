import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { getConfig } from '../utils/utils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deploy_meta, deploy_non_meta } = getConfig(hre.network.name);

  // Deploying ERC721 with meta support if needed
  if (deploy_meta) {
    await deployERC721TokenAndFactory(hre, "ERC721RaribleMeta", "ERC721RaribleMinimalBeaconMeta");
  }

  if (deploy_non_meta) {
    await deployERC721TokenAndFactory(hre, "ERC721RaribleMinimal", "ERC721RaribleMinimalBeacon");
  }
};

async function deployERC721TokenAndFactory(hre: HardhatRuntimeEnvironment, contractName: string, beaconName: string) {
  const { deploy } = hre.deployments;
  const { ethers } = hre;
  const { deployer } = await hre.getNamedAccounts();

  const transferProxyAddress = (await hre.deployments.get("TransferProxy")).address;
  const erc721LazyMintTransferProxyAddress = (await hre.deployments.get("ERC721LazyMintTransferProxy")).address;

  // Deploy token contract without a proxy
  const erc721Receipt = await deploy(contractName, {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  // Manually call the initialization function
  const erc721Contract = await ethers.getContractAt(contractName, erc721Receipt.address);
  await erc721Contract.__ERC721Rarible_init("Rarible", "RARI", "ipfs:/", "", transferProxyAddress, erc721LazyMintTransferProxyAddress);

  // Deploy beacon
  const erc721BeaconReceipt = await deploy(beaconName, {
    from: deployer,
    args: [erc721Receipt.address],
    log: true,
    autoMine: true,
  });

  // Deploy factory
  const factory721Receipt = await deploy("ERC721RaribleFactoryC2", {
    from: deployer,
    args: [erc721BeaconReceipt.address, transferProxyAddress, erc721LazyMintTransferProxyAddress],
    log: true,
    autoMine: true,
  });
}

export default func;
func.tags = ['all-zk', 'tokens-zk'];
