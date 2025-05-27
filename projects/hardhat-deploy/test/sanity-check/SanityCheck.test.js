const { deployments, ethers, network } = require('hardhat');
const { BigNumber } = require('ethers');
const { getConfig } = require('../../utils/utils');
const { createTokenFromFactory } = require('@rarible/tokens/sdk/createTokenFromFactory');
const { listBuyWithERC20 } = require('@rarible/exchange-v2/sdk/listBuyERC20');
const { listBuyWithEth } = require('@rarible/exchange-v2/sdk/listBuyETH');

contract("Sanity Check - Token Creation & Buy", () => {
  let sellerWallet, buyerWallet;
  let exchangeContract;
  let token721, token1155;
  let erc20;
  let transferProxy;
  let factory721, factory1155;

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
      factory721,
      `SanityMintable_721${SALT}`,
      `SMNTBL_721${SALT}`,
      `ipfs:/`,
      `ipfs:/`,
      `721${SALT}`
    );

    const tokenAddress1155 = await createTokenFromFactory(
      factory1155,
      `SanityMintable_1155${SALT}`,
      `SMNTBL_1155${SALT}`,
      `ipfs:/`,
      `ipfs:/`,
      `1155${SALT}`
    );

    token721 = await artifacts.require(
      deploy_meta && !deploy_non_meta ? 'ERC721RaribleMeta' : 'ERC721RaribleMinimal'
    ).at(tokenAddress721);

    token1155 = await artifacts.require(
      deploy_meta && !deploy_non_meta ? 'ERC1155RaribleMeta' : 'ERC1155Rarible'
    ).at(tokenAddress1155);

    exchangeContract = await ethers.getContractAt(deploy_meta ? "ExchangeMetaV2" : "ExchangeV2", exchangeDeployment.address, sellerWallet);

    await token721.setApprovalForAll(exchangeContract.address, true, { from: sellerWallet.address });
    await token1155.setApprovalForAll(exchangeContract.address, true, { from: sellerWallet.address });

    console.log("Token721:", token721.address);
    console.log("Token1155:", token1155.address);
    console.log("Buyer address:", buyerWallet.address);
  });

  it("should complete ETH buy flow", async () => {
    const tokenIdEth = sellerWallet.address + "b00000000000000000000001";

    await listBuyWithEth(
      token721,
      token1155,
      sellerWallet,
      buyerWallet,
      tokenIdEth,
      PRICE,
      exchangeContract
    );
  });

  it("should complete ERC20 buy flow", async () => {
    const tokenIdErc20 = sellerWallet.address + "b00000000000000000000002";
    const erc20Deploy = await deployments.deploy("TestERC20", {
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

    erc20 = await ethers.getContractAt("TestERC20", erc20Deploy.address, sellerWallet);
    await erc20.mint(buyerWallet.address, BigNumber.from(PRICE).mul(2).toString());

    await erc20.connect(buyerWallet).approve(transferProxy.address, BigNumber.from(PRICE).mul(2).toString());

    await listBuyWithERC20(
      token721,
      token1155,
      sellerWallet,
      buyerWallet,
      tokenIdErc20,
      PRICE,
      exchangeContract,
      erc20
    );
  });
});
