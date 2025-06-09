import { deployments, ethers, network } from 'hardhat';
import { BigNumber, Contract, Signer } from 'ethers';
import { getConfig } from '../../utils/utils';
import { createTokenFromFactory } from '@rarible/tokens/sdk/createTokenFromFactory';
import { ERC721RaribleFactoryC2, ERC1155RaribleFactoryC2, ExchangeMetaV2, ExchangeV2 } from '../../typechain-types';
import { mintToken } from "@rarible/tokens/sdk/mintToken";
import { createSellOrder } from '@rarible/exchange-v2/sdk/listingUtils';
import { createBuyOrder, matchOrderOnExchange, signOrderWithWallet } from '@rarible/exchange-v2/sdk/listingUtils';
import { ERC1155, ERC20, ERC721, ETH } from '@rarible/exchange-v2/sdk/utils';

describe("Sanity Check - Token Creation & Buy", () => {
  let sellerWallet: Signer, buyerWallet: Signer;
  let exchangeContract: Contract;
  let token721: Contract, token1155: Contract;
  let erc20: Contract;
  let transferProxy: Contract;
  let factory721: Contract, factory1155: Contract;

  const PRICE = "1000";
  const SALT = "0";

  before(async () => {
    const deployed = await deployments.fixture(['all']);
    const signers = await ethers.getSigners();
    sellerWallet = signers[0];
    buyerWallet = signers[1];
    const { deploy_meta, deploy_non_meta } = getConfig(network.name);

    const exchangeDeployment = deployed[deploy_meta ? 'ExchangeMetaV2' : 'ExchangeV2'];
    const factory721Deployment = deployed['ERC721RaribleFactoryC2'];
    const factory1155Deployment = deployed['ERC1155RaribleFactoryC2'];
    const transferProxyDeployment = deployed['ERC20TransferProxy'];

    factory721 = await ethers.getContractAt("ERC721RaribleFactoryC2", factory721Deployment.address, sellerWallet);
    factory1155 = await ethers.getContractAt("ERC1155RaribleFactoryC2", factory1155Deployment.address, sellerWallet);
    transferProxy = await ethers.getContractAt("ERC20TransferProxy", transferProxyDeployment.address, sellerWallet);

    const tokenAddress721 = await createTokenFromFactory(
      factory721 as ERC721RaribleFactoryC2,
      `SanityMintable_721${SALT}`,
      `SMNTBL_721${SALT}`,
      `ipfs:/`,
      `ipfs:/`,
      `721${SALT}`
    );

    const tokenAddress1155 = await createTokenFromFactory(
      factory1155 as ERC1155RaribleFactoryC2,
      `SanityMintable_1155${SALT}`,
      `SMNTBL_1155${SALT}`,
      `ipfs:/`,
      `ipfs:/`,
      `1155${SALT}`
    );

    token721 = await ethers.getContractAt(
      deploy_meta && !deploy_non_meta ? 'ERC721RaribleMeta' : 'ERC721RaribleMinimal',
      tokenAddress721,
      sellerWallet
    );

    token1155 = await ethers.getContractAt(
      deploy_meta && !deploy_non_meta ? 'ERC1155RaribleMeta' : 'ERC1155Rarible',
      tokenAddress1155,
      sellerWallet
    );

    exchangeContract = await ethers.getContractAt(deploy_meta ? "ExchangeMetaV2" : "ExchangeV2", exchangeDeployment.address, sellerWallet);

    await token721.connect(sellerWallet).setApprovalForAll(exchangeContract.address, true);
    await token1155.connect(sellerWallet).setApprovalForAll(exchangeContract.address, true);

    console.log("Token721:", token721.address);
    console.log("Token1155:", token1155.address);
    console.log("Buyer address:", await buyerWallet.getAddress(), "\n");
  });

  it("should complete ERC721 ETH buy flow", async () => {
    const tokenIdEth = (await sellerWallet.getAddress()) + "b00000000000000000000001";

    const sellerAddress = await sellerWallet.getAddress();
    const buyerAddress = await buyerWallet.getAddress();

    await mintToken(token721, tokenIdEth, sellerAddress);
    console.log('Minted 1 token from 721 contract to buy with ETH.');

    const sellOrder721 = createSellOrder(
        token721.address,
        tokenIdEth,
        sellerAddress,
        ETH,
        "0x",
        PRICE,
        ERC721
    );

    const sellSignature = await signOrderWithWallet(sellOrder721, sellerWallet, exchangeContract.address);
    const buyOrder721 = createBuyOrder(sellOrder721, buyerAddress, PRICE);
    const buyerSignature = await signOrderWithWallet(buyOrder721, buyerWallet, exchangeContract.address);

    await matchOrderOnExchange(exchangeContract as ExchangeMetaV2 | ExchangeV2, buyerWallet, sellOrder721, sellSignature, buyOrder721, buyerSignature, PRICE);

    console.log('ETH listing and purchase completed for 721!\n');
  });

  it("should complete ERC1155 ETH buy flow", async () => {
    const tokenIdEth = (await sellerWallet.getAddress()) + "b00000000000000000000001";

    const sellerAddress = await sellerWallet.getAddress();
    const buyerAddress = await buyerWallet.getAddress();

    await mintToken(token1155, tokenIdEth, sellerAddress, { is1155: true });
    console.log('Minted 1 token from 1155 contract to buy with ETH.');

    const sellOrder1155 = createSellOrder(
        token1155.address,
        tokenIdEth,
        sellerAddress,
        ETH,
        "0x",
        PRICE,
        ERC1155
    );

    const sellSignature1155 = await signOrderWithWallet(sellOrder1155, sellerWallet, exchangeContract.address);
    const buyOrder1155 = createBuyOrder(sellOrder1155, buyerAddress, PRICE);
    const buyerSignature1155 = await signOrderWithWallet(buyOrder1155, buyerWallet, exchangeContract.address);

    await matchOrderOnExchange(exchangeContract as ExchangeMetaV2 | ExchangeV2, buyerWallet, sellOrder1155, sellSignature1155, buyOrder1155, buyerSignature1155, PRICE);

    console.log('ETH listing and purchase completed for 1155!\n');
  });

  it("should complete ERC721 ERC20 buy flow", async () => {
    const tokenIdErc20 = (await sellerWallet.getAddress()) + "b00000000000000000000002";
    const erc20Deploy = await deployments.deploy("TestERC20", {
      from: await sellerWallet.getAddress(),
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

    erc20 = await ethers.getContractAt("TestERC20", erc20Deploy.address, sellerWallet);
    await erc20.mint(await buyerWallet.getAddress(), BigNumber.from(PRICE).mul(2).toString());

    await erc20.connect(buyerWallet).approve(transferProxy.address, BigNumber.from(PRICE).mul(2).toString());

    const sellerAddress = await sellerWallet.getAddress();
    const buyerAddress = await buyerWallet.getAddress();

    await mintToken(token721, tokenIdErc20, sellerAddress);

    const sellOrder721 = createSellOrder(
        token721.address,
        tokenIdErc20,
        sellerAddress,
        ERC20,
        erc20.address,
        PRICE,
        ERC721
    );

    const sellSignature721 = await signOrderWithWallet(sellOrder721, sellerWallet, exchangeContract.address);
    const buyOrder721 = createBuyOrder(sellOrder721, buyerAddress, PRICE);
    const buyerSignature721 = await signOrderWithWallet(buyOrder721, buyerWallet, exchangeContract.address);

    await matchOrderOnExchange(exchangeContract as ExchangeMetaV2 | ExchangeV2, buyerWallet, sellOrder721, sellSignature721, buyOrder721, buyerSignature721);

    console.log("ERC20 listing and purchase completed for 721!\n");
  });

  it("should complete ERC1155 ERC20 buy flow", async () => {
    const tokenIdErc20 = (await sellerWallet.getAddress()) + "b00000000000000000000002";
    const erc20Deploy = await deployments.deploy("TestERC20", {
      from: await sellerWallet.getAddress(),
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

    erc20 = await ethers.getContractAt("TestERC20", erc20Deploy.address, sellerWallet);
    await erc20.mint(await buyerWallet.getAddress(), BigNumber.from(PRICE).mul(2).toString());

    await erc20.connect(buyerWallet).approve(transferProxy.address, BigNumber.from(PRICE).mul(2).toString());

    const sellerAddress = await sellerWallet.getAddress();
    const buyerAddress = await buyerWallet.getAddress();

    await mintToken(token1155, tokenIdErc20, sellerAddress, { is1155: true });

    const sellOrder1155 = createSellOrder(
        token1155.address,
        tokenIdErc20,
        sellerAddress,
        ERC20,
        erc20.address,
        PRICE,
        ERC1155
    );

    const sellSignature1155 = await signOrderWithWallet(sellOrder1155, sellerWallet, exchangeContract.address);
    const buyOrder1155 = createBuyOrder(sellOrder1155, buyerAddress, PRICE);
    const buyerSignature1155 = await signOrderWithWallet(buyOrder1155, buyerWallet, exchangeContract.address);

    await matchOrderOnExchange(exchangeContract as ExchangeMetaV2 | ExchangeV2, buyerWallet, sellOrder1155, sellSignature1155, buyOrder1155, buyerSignature1155);

    console.log("ERC20 listing and purchase completed for 1155!\n");
  });
});
