import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { ERC721_LAZY, ERC1155_LAZY, COLLECTION, getConfig } from '../utils/utils'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(``)

  //transfer proxies
  const transferProxy = await getContract(hre, "TransferProxy")
  const erc20TransferProxy = await getContract(hre, "ERC20TransferProxy")
  const erc721LazyMintTransferProxy = await getContract(hre, "ERC721LazyMintTransferProxy")
  const erc1155LazyMintTransferProxy = await getContract(hre, "ERC1155LazyMintTransferProxy")

  //exchangeV2
  const exchangeV2 = await getContract(hre, "ExchangeV2")

  //AssetMatcherCollection
  const assetMatcherCollectionReceipt = await getContract(hre, "AssetMatcherCollection")

  console.log("start setting other configs")
  //add exchangeV2 as operator to all 4 transfer proxies
  await (await transferProxy.addOperator(exchangeV2.address)).wait()
  await (await erc20TransferProxy.addOperator(exchangeV2.address)).wait()
  await (await erc721LazyMintTransferProxy.addOperator(exchangeV2.address)).wait()
  await (await erc1155LazyMintTransferProxy.addOperator(exchangeV2.address)).wait()

  //set 2 lazy transfer proxies in exchangeV2 contract (other 2 are set in initialiser)
  await (await exchangeV2.setTransferProxy(ERC721_LAZY, erc721LazyMintTransferProxy.address)).wait()
  await (await exchangeV2.setTransferProxy(ERC1155_LAZY, erc1155LazyMintTransferProxy.address)).wait()

  //set collection asset matcher
  await (await exchangeV2.setAssetMatcher(COLLECTION, assetMatcherCollectionReceipt.address)).wait()
  console.log("end setting other configs")
};

async function getContract(hre: HardhatRuntimeEnvironment, contractName: string) {
  const address = (await hre.deployments.get(contractName)).address;
  return await hre.ethers.getContractAt(contractName, address)
}

export default func;
func.tags = ['oasys', "oasys_config"];
