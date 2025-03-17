// import { expect } from "chai";
// import { ethers } from "hardhat";
// import { ERC20TransferProxyTest, RaribleTransferManagerTest, TestRoyaltiesRegistry, TransferProxyTest } from "../typechain-types";
// import { ZERO, ORDER_DATA_V2, ORDER_DATA_V3, verifyBalanceChangeReturnTx, ERC721, enc, ETH } from "./utils";
// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// import { Signer } from "zksync-web3";
import { encBigNumber, ERC721, ETH, ZERO, ORDER_DATA_V3 } from "@rarible/exchange-v2/test-hardhat/utils";
import { ExchangeMetaV2, ExchangeMetaV2__factory } from "@rarible/exchange-v2";
import { LibOrder } from "@rarible/exchange-v2/typechain-types/contracts/ExchangeV2";
import { signOrderEthers } from "@rarible/exchange-v2/test-hardhat/signOrder";
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ERC721RaribleMinimal, ERC721RaribleMinimal__factory } from "@rarible/tokens";
import { BigNumber } from "ethers";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // Get signers
    const signers = await hre.ethers.getSigners();
    const signer = signers[0];
    const makerRight = signers[1];

    // Example NFT
    const erc721Address = "0x6a3FB32D86A6510A7C719E55998F08fbe22C4fce";
    const erc721: ERC721RaribleMinimal = ERC721RaribleMinimal__factory.connect(erc721Address, signer);
    const tokenId = BigNumber.from("48827653089252063377009650346866330927455685249615897861731929327047129694209");
    console.log(`tokenId = ${tokenId.toString()}`);

    // Build orders
    const leftOrder: LibOrder.OrderStruct = {
      maker: signer.address,
      makeAsset: {
        assetType: {
          assetClass: ERC721,
          data: encBigNumber(erc721.address, tokenId),
        },
        value: 1
      },
      taker: ZERO,
      takeAsset: {
        assetType: {
          assetClass: ETH,
          data: "0x",
        },
        value: 1000
      },
      salt: 1,
      start: 0,
      end: 0,
      dataType: ORDER_DATA_V3,
      data: "0x"
    };

    const rightOrder: LibOrder.OrderStruct = {
      maker: makerRight.address,
      makeAsset: {
        assetType: {
          assetClass: ETH,
          data: "0x"
        },
        value: 1000
      },
      taker: ZERO,
      takeAsset: {
        assetType: {
          assetClass: ERC721,
          data: encBigNumber(erc721.address, tokenId),
        },
        value: 1
      },
      salt: 1,
      start: 0,
      end: 0,
      dataType: ORDER_DATA_V3,
      data: "0x"
    };

    // Prepare the exchange contract
    const exchangeDeployment = await hre.deployments.get("ExchangeMetaV2");
    const exchange: ExchangeMetaV2 = ExchangeMetaV2__factory.connect(exchangeDeployment.address, signer);

    // EIP-712 sign with Ethers
    const leftSig = await signOrderEthers(leftOrder, signer, exchangeDeployment.address);
    const rightSig = await signOrderEthers(rightOrder, makerRight, exchangeDeployment.address);

    // Now match
    const tx = await exchange.matchOrders(leftOrder, leftSig, rightOrder, rightSig, { gasLimit: 4_000_000 });
    console.log("matchOrders =>", tx.hash);
};

export default func;
func.tags = ['run-orders', '204'];


// collection 721 address: 0x6a3FB32D86A6510A7C719E55998F08fbe22C4fce
// Minted tokenId #1, tx: 0x0e12b99dcaebb2f8e947c246167449353feae6841dcfb80ba8052266ae10438c; tokenId: 48827653089252063377009650346866330927455685249615897861731929327047129694209
// Token #1, collection: 0x6a3FB32D86A6510A7C719E55998F08fbe22C4fce, tokenId: 48827653089252063377009650346866330927455685249615897861731929327047129694209, owner: 0x6Bf378e79F736057f64cD647e7Da99fD76800C9B 1
// Minted tokenId #2, tx: 0x651a098aa04a4372bc6e35aee205b919e32c95a196dfb960f8688527e23d289c; tokenId: 48827653089252063377009650346866330927455685249615897861731929327047129694210
// Token #2, collection: 0x6a3FB32D86A6510A7C719E55998F08fbe22C4fce, tokenId: 48827653089252063377009650346866330927455685249615897861731929327047129694210, owner: 0x6Bf378e79F736057f64cD647e7Da99fD76800C9B 2
// Minted tokenId #3, tx: 0xf00b2b125b59b9e3ad05cca3380e0d810e638c0054616971bd1e6e14da715a28; tokenId: 48827653089252063377009650346866330927455685249615897861731929327047129694211
// Token #3, collection: 0x6a3FB32D86A6510A7C719E55998F08fbe22C4fce, tokenId: 48827653089252063377009650346866330927455685249615897861731929327047129694211, owner: 0x6Bf378e79F736057f64cD647e7Da99fD76800C9B 3
// Minted tokenId #4, tx: 0xb52a15ef5817177f1462dd879095de8f9bdd5d019d6d84343db6963bd6b3f7c8; tokenId: 48827653089252063377009650346866330927455685249615897861731929327047129694212
// Token #4, collection: 0x6a3FB32D86A6510A7C719E55998F08fbe22C4fce, tokenId: 48827653089252063377009650346866330927455685249615897861731929327047129694212, owner: 0x6Bf378e79F736057f64cD647e7Da99fD76800C9B 4
// Minted tokenId #5, tx: 0x0dae9393486334d76c8069f2c53213dbd62015094f8e90d5873568b16faad7a2; tokenId: 48827653089252063377009650346866330927455685249615897861731929327047129694213
// Token #5, collection: 0x6a3FB32D86A6510A7C719E55998F08fbe22C4fce, tokenId: 48827653089252063377009650346866330927455685249615897861731929327047129694213, owner: 0x6Bf378e79F736057f64cD647e7Da99fD76800C9B 5
