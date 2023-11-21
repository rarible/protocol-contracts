import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { ERC721_LAZY, ERC1155_LAZY, COLLECTION, getConfig } from '../utils/utils'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  //deploy and initialise 4 transfer proxies
  const transferProxy = await deployAndInitProxy(hre, "TransferProxy")

  const erc20TransferProxy = await deployAndInitProxy(hre, "ERC20TransferProxy")

  const erc721LazyMintTransferProxy = await deployAndInitProxy(hre, "ERC721LazyMintTransferProxy")

  const erc1155LazyMintTransferProxy = await deployAndInitProxy(hre, "ERC1155LazyMintTransferProxy")

  const { deploy_meta, deploy_non_meta } = getConfig(hre.network.name);

  //deploying ExchangeV2 with meta support if needed
  if (!!deploy_meta) {
    await deployAndSetupExchange(hre, "ExchangeMetaV2", transferProxy, erc20TransferProxy, erc721LazyMintTransferProxy, erc1155LazyMintTransferProxy);
  }

  if (!!deploy_non_meta) {
    await deployAndSetupExchange(hre, "ExchangeV2", transferProxy, erc20TransferProxy, erc721LazyMintTransferProxy, erc1155LazyMintTransferProxy);
  }
};

async function deployAndSetupExchange(hre: HardhatRuntimeEnvironment, contractName: string, transferProxy: any, erc20TransferProxy: any, erc721LazyMintTransferProxy: any, erc1155LazyMintTransferProxy: any) {
  const { deploy } = hre.deployments;
  const { getNamedAccounts} = hre;
  const { deployer } = await getNamedAccounts();

  const royaltiesRegistryAddress = (await hre.deployments.get("RoyaltiesRegistry")).address;

  // deploy ExchangeV2 and initialise contract
  const exchangeV2Receipt = await deploy(contractName, {
    from: deployer,
    proxy: {
      execute: {
        init: {
          methodName: "__ExchangeV2_init",
          args: [transferProxy.address, erc20TransferProxy.address, 0, hre.ethers.constants.AddressZero, royaltiesRegistryAddress],
        },
      },
      proxyContract: "OpenZeppelinTransparentProxy",
    },
    log: true,
    autoMine: true,
  });

  const ExchangeV2 = await hre.ethers.getContractFactory(contractName);
  const exchangeV2 = await ExchangeV2.attach(exchangeV2Receipt.address);

  //add exchangeV2 as operator to all 4 transfer proxies
  await (await transferProxy.addOperator(exchangeV2.address)).wait()
  await (await erc20TransferProxy.addOperator(exchangeV2.address)).wait()
  await (await erc721LazyMintTransferProxy.addOperator(exchangeV2.address)).wait()
  await (await erc1155LazyMintTransferProxy.addOperator(exchangeV2.address)).wait()

  //set 2 lazy transfer proxies in exchangeV2 contract (other 2 are set in initialiser)
  await (await exchangeV2.setTransferProxy(ERC721_LAZY, erc721LazyMintTransferProxy.address)).wait()
  await (await exchangeV2.setTransferProxy(ERC1155_LAZY, erc1155LazyMintTransferProxy.address)).wait()

  //deploy and setup collection matcher
  const assetMatcherCollectionReceipt = await deploy("AssetMatcherCollection", {
    from: deployer,
    log: true,
    autoMine: true,
  });

  await (await exchangeV2.setAssetMatcher(COLLECTION, assetMatcherCollectionReceipt.address)).wait()
}

async function deployAndInitProxy(hre: HardhatRuntimeEnvironment, contractName: string) {
  const { deploy } = hre.deployments;
  const { getNamedAccounts} = hre;
  const { deployer } = await getNamedAccounts();

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
func.tags = ['all', '2'];
