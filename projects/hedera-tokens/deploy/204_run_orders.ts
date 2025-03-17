// import { expect } from "chai";
// import { ethers } from "hardhat";
// import { ERC20TransferProxyTest, RaribleTransferManagerTest, TestRoyaltiesRegistry, TransferProxyTest } from "../typechain-types";
// import { ZERO, ORDER_DATA_V2, ORDER_DATA_V3, verifyBalanceChangeReturnTx, ERC721, enc, ETH } from "./utils";
// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// import { Signer } from "zksync-web3";
import { LibAsset, enc, ERC721, ETH, encBigNumber, ZERO, ORDER_DATA_V3 } from "@rarible/exchange-v2";
import { ExchangeMetaV2, ExchangeMetaV2__factory } from "@rarible/exchange-v2";
import { LibOrder } from "@rarible/exchange-v2/typechain-types/contracts/ExchangeV2";
import { signOrder, signOrderEthers } from "@rarible/exchange-v2/test-hardhat/signOrder";
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ERC721RaribleFactoryC2, ERC721RaribleFactoryC2__factory } from "@rarible/tokens";
import { ERC721RaribleMinimal, ERC721RaribleMinimal__factory } from "@rarible/tokens";
import { ethers, BigNumber } from 'ethers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deploy } = hre.deployments;
    const { deployer } = await hre.getNamedAccounts();
    const provider = hre.ethers.getDefaultProvider();
    const [signer, makerRight] = await hre.ethers.getSigners();

    const erc721Address = "0x6a3FB32D86A6510A7C719E55998F08fbe22C4fce";
    const erc721: ERC721RaribleMinimal = ERC721RaribleMinimal__factory.connect(erc721Address, signer);
    const erc721TokenId1 = BigNumber.from("48827653089252063377009650346866330927455685249615897861731929327047129694209");
    const owner = await erc721.ownerOf(erc721TokenId1);
    console.log(`Token #1, collection: ${erc721Address}, tokenId: ${erc721TokenId1}, owner: ${owner} ${await erc721.balanceOf(owner)}`);

    const nftAssetType = {
        assetClass: ERC721,
        data: encBigNumber(erc721.address, erc721TokenId1),
    }
    const nftAsset = {
        assetType: nftAssetType,
        value: 1
    }
    const ethAssetType = {
        assetClass: ETH,
        data: "0x",
    }
    const ethAsset = {
        assetType: ethAssetType,
        value: 1000
    }
    const left: LibOrder.OrderStruct = {
        maker: signer.address,
        makeAsset: nftAsset,
        taker: ZERO,
        takeAsset: ethAsset,
        salt: 1,
        start: 0,
        end: 0,
        dataType: ORDER_DATA_V3,
        data: "0x"
    }

    const right: LibOrder.OrderStruct = {
        maker: makerRight.address,
        makeAsset: ethAsset,
        taker: ZERO,
        takeAsset: nftAsset,
        salt: 1,
        start: 0,
        end: 0,
        dataType: ORDER_DATA_V3,
        data: "0x"
    }

    let exchangeContractName: string = "ExchangeMetaV2";
    const exchangeAddress = (await hre.deployments.get(exchangeContractName)).address
    const exchange: ExchangeMetaV2 = ExchangeMetaV2__factory.connect(exchangeAddress, signer);
    const leftSig = await signOrderEthers(left, signer, exchangeAddress);
    const rightSig = await signOrderEthers(right, makerRight, exchangeAddress);
    const tx = await exchange.matchOrders(left, leftSig, right, rightSig);
    console.log(`Match orders tx: ${tx.hash}`);

    // const right = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");
    // const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");

    
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
