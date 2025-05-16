import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ERC721_LAZY, ERC1155_LAZY, COLLECTION, getConfig, DEPLOY_FROM } from '../utils/utils';


const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // Deploy and initialize 4 transfer proxies
  const transferProxy = await deployAndInitProxy(hre, "TransferProxy");
  const erc20TransferProxy = await deployAndInitProxy(hre, "ERC20TransferProxy");
  const erc721LazyMintTransferProxy = await deployAndInitProxy(hre, "ERC721LazyMintTransferProxy");
  const erc1155LazyMintTransferProxy = await deployAndInitProxy(hre, "ERC1155LazyMintTransferProxy");

  const { deploy_meta, deploy_non_meta } = getConfig(hre.network.name);

  // Deploying ExchangeV2 with or without meta support
  if (deploy_meta) {
    await deployAndSetupExchange(hre, "ExchangeMetaV2", transferProxy, erc20TransferProxy, erc721LazyMintTransferProxy, erc1155LazyMintTransferProxy);
  }

  if (deploy_non_meta) {
    await deployAndSetupExchange(hre, "ExchangeV2", transferProxy, erc20TransferProxy, erc721LazyMintTransferProxy, erc1155LazyMintTransferProxy);
  }
};

async function deployAndSetupExchange(hre: HardhatRuntimeEnvironment, contractName: string, transferProxyAddress: string, erc20TransferProxyAddress: string, erc721LazyMintTransferProxyAddress: string, erc1155LazyMintTransferProxyAddress: string) {
  const { deploy, execute } = hre.deployments;
  let { deployer } = await hre.getNamedAccounts();

  // hardware wallet support
  if(deployer === undefined) {
    deployer = DEPLOY_FROM!;
  }
  const royaltiesRegistryAddress = (await hre.deployments.get("RoyaltiesRegistry")).address;

  // Deploy ExchangeV2
  const exchangeV2Receipt = await deploy(contractName, {
    from: deployer,
    log: true,
    autoMine: true,
  });
  
  const exchangeV2Address = exchangeV2Receipt.address;
  await execute(
    contractName,
    { from: deployer, log: true },
    "__ExchangeV2_init",
    transferProxyAddress, 
    erc20TransferProxyAddress, 
    0, 
    "0x0000000000000000000000000000000000000000", 
    royaltiesRegistryAddress
  );

  //add exchangeV2 as operator to all 4 transfer proxies
  await execute(
    "TransferProxy",
    { from: deployer, log: true },
    "addOperator",
    exchangeV2Address
  );
  await execute(
    "ERC20TransferProxy",
    { from: deployer, log: true },
    "addOperator",
    exchangeV2Address
  );
  await execute(
    "ERC721LazyMintTransferProxy",
    { from: deployer, log: true },
    "addOperator",
    exchangeV2Address
  );
  await execute(
    "ERC1155LazyMintTransferProxy",
    { from: deployer, log: true },
    "addOperator",
    exchangeV2Address
  );

  //set 2 lazy transfer proxies in exchangeV2 contract (other 2 are set in initialiser)
  await execute(
    contractName,
    { from: deployer, log: true },
    "setTransferProxy",
    ERC721_LAZY, erc721LazyMintTransferProxyAddress
  );

  await execute(
    contractName,
    { from: deployer, log: true },
    "setTransferProxy",
    ERC1155_LAZY, erc1155LazyMintTransferProxyAddress
  );

  //deploy and setup collection matcher
  const assetMatcherCollectionReceipt = await deploy("AssetMatcherCollection", {
    from: deployer,
    log: true,
    autoMine: true,
  });
  await execute(
    contractName,
    { from: deployer, log: true },
    "setAssetMatcher",
    COLLECTION, assetMatcherCollectionReceipt.address
  );
}

async function deployAndInitProxy(hre: HardhatRuntimeEnvironment, contractName: string): Promise<string> {
  const { deploy, execute } = hre.deployments;
  let { deployer } = await hre.getNamedAccounts();

  // hardware wallet support
  if(deployer === undefined) {
    deployer = DEPLOY_FROM!;
  }

  const transferProxyReceipt = await deploy(contractName, {
    from: deployer,
    log: true,
    autoMine: true,
  });


  // Initialize the proxy
  await execute(
    contractName,
    { from: deployer, log: true },
    "__OperatorRole_init"
  );

  return transferProxyReceipt.address;
}

export default func;
func.tags = ['all-zk', 'all-zk-no-tokens', "302"];
