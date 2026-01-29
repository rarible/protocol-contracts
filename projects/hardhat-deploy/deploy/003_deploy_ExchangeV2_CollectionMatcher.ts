import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { ERC721_LAZY, ERC1155_LAZY, COLLECTION, getConfig, ROYALTIES_REGISTRY_TYPE, GAS_PRICE } from '../utils/utils'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  //deploy and initialise 4 transfer proxies
  const transferProxy = await getTransferProxy(hre, "TransferProxy")

  const erc20TransferProxy = await getTransferProxy(hre, "ERC20TransferProxy")

  const erc721LazyMintTransferProxy = await getTransferProxy(hre, "ERC721LazyMintTransferProxy")

  const erc1155LazyMintTransferProxy = await getTransferProxy(hre, "ERC1155LazyMintTransferProxy")

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
  const { deploy, execute } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();
  const royaltiesRegistryAddress = (await hre.deployments.get(ROYALTIES_REGISTRY_TYPE)).address;

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
    gasPrice: GAS_PRICE,
  });

  const ExchangeV2 = await hre.ethers.getContractFactory(contractName);
  const exchangeV2 = ExchangeV2.attach(exchangeV2Receipt.address);

  //add exchangeV2 as operator to all 4 transfer proxies
  console.log("Adding exchangeV2 as operator to all 4 transfer proxies")
  await execute(
    "TransferProxy",
    { from: deployer, log: true, gasPrice: GAS_PRICE },
    "addOperator",
    exchangeV2.address
  );
  await execute(
    "ERC20TransferProxy",
    { from: deployer, log: true, gasPrice: GAS_PRICE },
    "addOperator",
    exchangeV2.address
  );
  await execute(
    "ERC721LazyMintTransferProxy",
    { from: deployer, log: true, gasPrice: GAS_PRICE },
    "addOperator",
    exchangeV2.address
  );
  await execute(
    "ERC1155LazyMintTransferProxy",
    { from: deployer, log: true, gasPrice: GAS_PRICE },
    "addOperator",
    exchangeV2.address
  );

  //set 2 lazy transfer proxies in exchangeV2 contract (other 2 are set in initialiser)
  console.log("Setting 2 lazy transfer proxies in exchangeV2 contract")
  await execute(
    contractName,
    { from: deployer, log: true, gasPrice: GAS_PRICE },
    "setTransferProxy",
    ERC721_LAZY,
    erc721LazyMintTransferProxy.address
  );
  await execute(
    contractName,
    { from: deployer, log: true, gasPrice: GAS_PRICE },
    "setTransferProxy",
    ERC1155_LAZY,
    erc1155LazyMintTransferProxy.address
  );

  //deploy and setup collection matcher
  console.log("Deploying and setting collection matcher")
  const assetMatcherCollectionReceipt = await deploy("AssetMatcherCollection", {
    from: deployer,
    log: true,
    autoMine: true,
    gasPrice: GAS_PRICE,
  });

  await execute(
    contractName,
    { from: deployer, log: true, gasPrice: GAS_PRICE },
    "setAssetMatcher",
    COLLECTION,
    assetMatcherCollectionReceipt.address
  );
}

async function getTransferProxy(hre: HardhatRuntimeEnvironment, contractName: string) {
  const address = (await hre.deployments.get(contractName)).address;
  return await hre.ethers.getContractAt(contractName, address)
}

export default func;
func.tags = ['all', 'all-no-tokens', 'all-with-sanity-check', 'deploy-exchange', '003'];
