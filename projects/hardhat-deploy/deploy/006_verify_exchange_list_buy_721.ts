import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { BigNumber, ethers } from 'ethers';
import {
  ERC1155RaribleFactoryC2__factory,
  ERC721RaribleFactoryC2__factory,
  ExchangeMetaV2,
  ExchangeV2,
  TestERC20,
} from '../typechain-types';
import { getConfig } from '../utils/utils';
import { createTokenFromFactory } from '@rarible/tokens/sdk/createTokenFromFactory';
import { listBuyWithERC20 } from '@rarible/exchange-v2/sdk/listBuyERC20';
import { listBuyWithEth } from '@rarible/exchange-v2/sdk/listBuyETH';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, ethers: hardhatEthers, network } = hre;
  const { deploy, get } = deployments;
  const signers = await hardhatEthers.getSigners();
  const sellerWallet = signers[0];

  const TRANSFER_AMOUNT = "0.1";
  const PRICE = "1000";
  const SALT = "0";

  const { deploy_meta, deploy_non_meta } = getConfig(network.name);

  // Fetch previously deployed contract addresses
  let exchangeDeployment;
  if (!!deploy_meta) {
    exchangeDeployment = await get('ExchangeMetaV2');
  } else {
    exchangeDeployment = await get('ExchangeV2');
  }
  const factory721Deployment = await get('ERC721RaribleFactoryC2');
  const factory1155Deployment = await get('ERC1155RaribleFactoryC2');
  const transferProxyDeployment = await get('ERC20TransferProxy');

  const factory721 = ERC721RaribleFactoryC2__factory.connect(factory721Deployment.address, sellerWallet);
  const factory1155 = ERC1155RaribleFactoryC2__factory.connect(factory1155Deployment.address, sellerWallet);

  const tokenAddress721 = await createTokenFromFactory(factory721, `SanityMintable_721${SALT}`, `SMNTBL_721${SALT}`, `ipfs:/`, `ipfs:/`, `721${SALT}`);
  const tokenAddress1155 = await createTokenFromFactory(factory1155, `SanityMintable_1155${SALT}`, `SMNTBL_1155${SALT}`, `ipfs:/`, `ipfs:/`, `1155${SALT}`);

  const token721 = await hardhatEthers.getContractAt(
    deploy_meta && !deploy_non_meta ? 'ERC721RaribleMeta' : 'ERC721RaribleMinimal',
    tokenAddress721
  );

  const token1155 = await hardhatEthers.getContractAt(
    deploy_meta && !deploy_non_meta ? 'ERC1155RaribleMeta' : 'ERC1155Rarible',
    tokenAddress1155
  );

  const exchangeContract = await hardhatEthers.getContractAt(
    deploy_meta && !deploy_non_meta ? 'ExchangeMetaV2' : 'ExchangeV2',
    exchangeDeployment.address
  ) as ExchangeV2 | ExchangeMetaV2;

  console.log('Created 721 token at:', tokenAddress721);
  console.log('Created 1155 token at:', tokenAddress1155);

  await token721.setApprovalForAll(exchangeContract.address, true);
  await token1155.setApprovalForAll(exchangeContract.address, true);

  const tokenIdEth = sellerWallet.address + "b00000000000000000000001";
  const tokenIdErc20 = sellerWallet.address + "b00000000000000000000002";

  const buyerWallet = ethers.Wallet.createRandom().connect(hardhatEthers.provider);
  await sellerWallet.sendTransaction({
    to: buyerWallet.address,
    value: ethers.utils.parseEther(TRANSFER_AMOUNT),
  });

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

  const erc20Receipt = await deploy("TestERC20", {
    from: sellerWallet.address,
    proxy: {
      execute: {
        init: {
          methodName: "init",
          args: [],
        },
      },
      proxyContract: "OpenZeppelinTransparentProxy",
    },
    log: true,
  });

  const erc20Contract = await hardhatEthers.getContractAt("TestERC20", erc20Receipt.address);
  await (await erc20Contract.mint(buyerWallet.address, BigNumber.from(PRICE).mul(2))).wait();
  await erc20Contract.connect(buyerWallet).approve(
    transferProxyDeployment.address,
    BigNumber.from(PRICE).mul(2)
  );

  await listBuyWithERC20(
    token721,
    token1155,
    sellerWallet,
    buyerWallet,
    tokenIdErc20,
    PRICE,
    exchangeContract,
    erc20Contract as TestERC20
  );

  const remainingBalance = await buyerWallet.getBalance();
  const returnFundsEstimation = await buyerWallet.estimateGas({
    to: sellerWallet.address,
    value: remainingBalance,
  });

  const gasPrice = await hardhatEthers.provider.getGasPrice();
  let gasPriceMultiplier = 1;
  let success = false;

  while (!success && gasPriceMultiplier <= 10) {
    try {
      const totalReturnAmount = remainingBalance.sub(
        returnFundsEstimation.mul(gasPrice).mul(gasPriceMultiplier)
      );
      const returnFundsTx = await buyerWallet.sendTransaction({
        to: sellerWallet.address,
        value: totalReturnAmount,
      });
      await returnFundsTx.wait();
      success = true;
      console.log('Funds returned to seller wallet!');
    } catch {
      gasPriceMultiplier++;
    }
  }

  if (!success) {
    console.log('Failed to return funds after all attempts');
  }
};

export default func;
func.tags = ['all-with-sanity-check', '006'];
