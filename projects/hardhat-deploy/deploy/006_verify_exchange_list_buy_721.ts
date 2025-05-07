import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { BigNumber, ethers } from 'ethers';
import {
  ERC1155RaribleFactoryC2__factory,
  ERC721RaribleFactoryC2__factory,
  ExchangeMetaV2,
  ExchangeV2,
  TestERC20,
  ERC721RaribleMinimal,
  ERC1155Rarible
} from '../typechain-types';
import { getConfig } from '../utils/utils';
import { getTokenAddress } from '@rarible/exchange-v2/sdk/getTokenAddress';
import { listBuyWithERC20 } from '@rarible/exchange-v2/sdk/listBuyERC20';
import { listBuyWithEth } from '@rarible/exchange-v2/sdk/listBuyETH';

// Load environment variables from .env file
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

const dotenvConfigPath: string = process.env.DOTENV_CONFIG_PATH || "./.env";
dotenvConfig({ path: resolve(__dirname, dotenvConfigPath) });

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, ethers: hardhatEthers, network } = hre;
  const { deploy, get } = deployments;
  const signers = await hardhatEthers.getSigners();
  const sellerWallet = signers[0];

  const TRANSFER_AMOUNT = "0.1";
  const PRICE = "1000";
  const SALT = ethers.utils.hexlify(ethers.utils.randomBytes(32));
  console.log('Generated random salt:', SALT);

  console.log('Starting deployment process...');

  let { deploy_meta, deploy_non_meta } = getConfig(network.name);
  console.log('Configuration loaded:', { deploy_meta, deploy_non_meta });
  deploy_meta = false;
  // Fetch previously deployed contract addresses
  let exchangeDeployment;
  if (!!deploy_meta) {
    exchangeDeployment = await get('ExchangeMetaV2');
    console.log('ExchangeMetaV2 deployment fetched:', exchangeDeployment.address);
  } else {
    exchangeDeployment = await get('ExchangeV2');
    console.log('ExchangeV2 deployment fetched:', exchangeDeployment.address);
  }
  const factory721Deployment = await get('ERC721RaribleFactoryC2');
  const factory1155Deployment = await get('ERC1155RaribleFactoryC2');
  const transferProxyDeployment = await get('ERC20TransferProxy');
  console.log('Factory and proxy deployments fetched:');

  const factory721 = ERC721RaribleFactoryC2__factory.connect(factory721Deployment.address, sellerWallet);
  const factory1155 = ERC1155RaribleFactoryC2__factory.connect(factory1155Deployment.address, sellerWallet);
  console.log('Factories connected to seller wallet');

  const tokenAddress721 = await getTokenAddress(factory721, SALT);
  const tokenAddress1155 = await getTokenAddress(factory1155, SALT);
  console.log('Token addresses fetched:', { tokenAddress721, tokenAddress1155 });

  const token721 = await hardhatEthers.getContractAt(
    deploy_meta && !deploy_non_meta ? 'ERC721RaribleMeta' : 'ERC721RaribleMinimal',
    tokenAddress721
  ) as ERC721RaribleMinimal;

  const token1155 = await hardhatEthers.getContractAt(
    deploy_meta && !deploy_non_meta ? 'ERC1155RaribleMeta' : 'ERC1155Rarible',
    tokenAddress1155
  ) as ERC1155Rarible;
  console.log('Token contracts connected');

  const exchangeContract = await hardhatEthers.getContractAt(
    deploy_meta && !deploy_non_meta ? 'ExchangeMetaV2' : 'ExchangeV2',
    exchangeDeployment.address
  ) as ExchangeV2 | ExchangeMetaV2;
  console.log('Exchange contract connected');

  console.log('Created 721 token at:', tokenAddress721);
  console.log('Created 1155 token at:', tokenAddress1155);

  await token721.setApprovalForAll(exchangeContract.address, true);
  await token1155.setApprovalForAll(exchangeContract.address, true);
  console.log('Approvals set for tokens');

  const tokenIdEth = sellerWallet.address + "b00000000000000000000001";
  const tokenIdErc20 = sellerWallet.address + "b00000000000000000000002";
  console.log('Token IDs generated:', { tokenIdEth, tokenIdErc20 });

  const buyerWallet = new ethers.Wallet(process.env.PRIVATE_KEY2!).connect(hardhatEthers.provider);
  await sellerWallet.sendTransaction({
    to: buyerWallet.address,
    value: ethers.utils.parseEther(TRANSFER_AMOUNT),
  });
  console.log('Funds transferred to buyer wallet');

  console.log('New buyer address:', buyerWallet.address);

  await listBuyWithEth(
    token721,
    token1155,
    sellerWallet,
    buyerWallet,
    tokenIdEth,
    PRICE,
    exchangeContract
  );
  console.log('List buy with ETH completed');

  // const erc20Receipt = await deploy("TestERC20", {
  //   from: sellerWallet.address,
  //   proxy: {
  //     execute: {
  //       init: {
  //         methodName: "init",
  //         args: [],
  //       },
  //     },
  //     proxyContract: "OpenZeppelinTransparentProxy",
  //   },
  //   log: true,
  // });

  // const erc20Contract = await hardhatEthers.getContractAt("TestERC20", erc20Receipt.address);
  // await (await erc20Contract.mint(buyerWallet.address, BigNumber.from(PRICE).mul(2))).wait();
  // await erc20Contract.connect(buyerWallet).approve(
  //   transferProxyDeployment.address,
  //   BigNumber.from(PRICE).mul(2)
  // );

  // await listBuyWithERC20(
  //   token721,
  //   token1155,
  //   sellerWallet,
  //   buyerWallet,
  //   tokenIdErc20,
  //   PRICE,
  //   exchangeContract,
  //   erc20Contract as TestERC20
  // );

  // const remainingBalance = await buyerWallet.getBalance();
  // const returnFundsEstimation = await buyerWallet.estimateGas({
  //   to: sellerWallet.address,
  //   value: remainingBalance,
  // });
  // console.log('Return funds estimation completed');

  // const gasPrice = await hardhatEthers.provider.getGasPrice();
  // let gasPriceMultiplier = 1;
  // let success = false;

  // while (!success && gasPriceMultiplier <= 10) {
  //   try {
  //     const totalReturnAmount = remainingBalance.sub(
  //       returnFundsEstimation.mul(gasPrice).mul(gasPriceMultiplier)
  //     );
  //     const returnFundsTx = await buyerWallet.sendTransaction({
  //       to: sellerWallet.address,
  //       value: totalReturnAmount,
  //     });
  //     await returnFundsTx.wait();
  //     success = true;
  //     console.log('Funds returned to seller wallet!');
  //   } catch {
  //     gasPriceMultiplier++;
  //   }
  // }

  // if (!success) {
  //   console.log('Failed to return funds after all attempts');
  // }
};

export default func;
func.tags = ['all-with-sanity-check', '006'];
