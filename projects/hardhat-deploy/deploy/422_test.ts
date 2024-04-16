import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const { Order, Asset, sign } = require("../../../scripts/order.js");

import { ETH, ERC721, ORDER_DATA_V2 } from "../../../scripts/assets.js";


const ZERO = "0x0000000000000000000000000000000000000000";
const zeroAddress = "0x0000000000000000000000000000000000000000";

/*
  0. deploy TestERC721 and RaribleTestHelper
 1. create an order, get signature.
 2. set signature as constant
 3. execute with different address
*/

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deploy } = hre.deployments;
  const { ethers } = hre;
  const { deployer } = await hre.getNamedAccounts();

  //get Exchange
  const ExchangeV2Addr = (await hre.deployments.get("ExchangeV2")).address;
  const ExchangeV2 = await ethers.getContractFactory("ExchangeV2");
  const exchangeV2 = ExchangeV2.attach(ExchangeV2Addr);
  console.log(exchangeV2.address, "exchangeV2")

  /*
  await deploy("TestERC721", {
    from: deployer,
    log: true,
    autoMine: true,
    args: ["Test", "TST"]
  });

  await deploy("RaribleTestHelper", {
    from: deployer,
    log: true,
    autoMine: true,
  });
  */

  
  const TestERC721Addr = (await hre.deployments.get("TestERC721")).address;
  const TestERC721 = await ethers.getContractFactory("TestERC721");
  const erc721 = TestERC721.attach(TestERC721Addr);
  console.log(erc721.address, "erc721")

  //get TransferProxy addr
  const TransferProxyAddr = (await hre.deployments.get("TransferProxy")).address;
  console.log(TransferProxyAddr, "TransferProxyAddr")

  //deploy TestHelper
  const RaribleTestHelperAddr = (await hre.deployments.get("RaribleTestHelper")).address;
  const RaribleTestHelper = await ethers.getContractFactory("RaribleTestHelper");
  const helper = RaribleTestHelper.attach(RaribleTestHelperAddr);
  console.log(helper.address, "helper")

  //set data
  const user = "0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4";
  const _priceSell = 100;
  const _pricePurchase = 100;
  const salt = 1;
  const nftAmount = 1
  const tokenId = 4;

  //mint token
  //await erc721.mint(user, tokenId);
  //await erc721.setApprovalForAll(TransferProxyAddr, true);
  
  const encDataLeft = await helper.encodeV2([[], [], true]);
  const encDataRight = await helper.encodeV2([[], [], false]);

  const _nftSellAssetData = await encAsset(hre, erc721.address, tokenId);
  const _nftPurchaseAssetData = "0x";
  const left = Order(user, Asset(ERC721, _nftSellAssetData, nftAmount), ZERO, Asset(ETH, _nftPurchaseAssetData, _priceSell), salt, 0, 0, ORDER_DATA_V2, encDataLeft);
  //const signature = await sign(left, user, exchangeV2.address);
  //0xa56e841302ec272ef9da766ad1b3f8c8f43a9d8bd9f69a0371eb9f1d385cf6d93a60015897427b76ba0d24aa969bfb9e95cb4bb1a3dd6531ade0e4720c42e5ff1c
  const signature = "0x5b96f77f236c6803d98340ca2e6efc2c433f319cd8959f103f5f564647158e16522f1598ef5efafa57298b138b3abf4248931ce179b5b9b12951bfeecb4fc38a1b"
  console.log(left)
  console.log("signature =",signature)
  
  const directPurchaseParams = {
    sellOrderMaker: user,
    sellOrderNftAmount: nftAmount,
    nftAssetClass: ERC721,
    nftData: _nftSellAssetData,
    sellOrderPaymentAmount: _priceSell,
    paymentToken: zeroAddress,
    sellOrderSalt: salt,
    sellOrderStart: 0,
    sellOrderEnd: 0,
    sellOrderDataType: ORDER_DATA_V2,
    sellOrderData: encDataLeft,
    sellOrderSignature: signature,
    buyOrderPaymentAmount: _pricePurchase,
    buyOrderNftAmount: nftAmount,
    buyOrderData: encDataRight
  };
  
  const tx = await exchangeV2.directPurchase(directPurchaseParams, { value:200 });
  console.log("tx", tx);

};

function encAsset(hre: HardhatRuntimeEnvironment, token:string, tokenId: any) {
	if (tokenId) {
		return hre.ethers.utils.defaultAbiCoder.encode(["address", "uint256"], [token, tokenId]);
	}
}


export default func;
func.tags = ['test'];
