// import { expect } from "chai";
// import { ethers } from "hardhat";
// import { ERC20TransferProxyTest, RaribleTransferManagerTest, TestRoyaltiesRegistry, TransferProxyTest } from "../typechain-types";
// import { ZERO, ORDER_DATA_V2, ORDER_DATA_V3, verifyBalanceChangeReturnTx, ERC721, enc, ETH } from "./utils";
// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// import { Signer } from "zksync-web3";
import { encBigNumber, ERC721, ETH, ZERO, ERC20, ORDER_DATA_V3 } from "@rarible/exchange-v2/test-hardhat/utils";
import { ExchangeMetaV2, ExchangeMetaV2__factory } from "@rarible/exchange-v2";
import { LibOrder } from "@rarible/exchange-v2/typechain-types/contracts/ExchangeV2";
import { signOrderEthers } from "@rarible/exchange-v2/test-hardhat/signOrder";
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ERC721RaribleMinimal, ERC721RaribleMinimal__factory } from "@rarible/tokens";
import { BigNumber, ethers } from "ethers";
import { RariTestERC20__factory } from "../typechain-types";
import { RariTestERC20 } from "../typechain-types";

function getV3Selector(): string {
    // Step 1: Compute the full keccak256 hash of the UTF-8 bytes for "V3".
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("V3")); 
    // Step 2: Slice the first 4 bytes (8 hex characters) after the "0x".
    // This mimics `bytes4(...)` in Solidity.
    const first4Bytes = ethers.utils.hexDataSlice(hash, 0, 4);
    return first4Bytes; // e.g. "0x4ade54ca"
  }
  
  const V3 = getV3Selector();

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // Get signers
    const signers = await hre.ethers.getSigners();
    const signer = signers[0];
    const makerRight = signers[1];
    console.log("signer", signer.address);
    console.log("makerRight", makerRight.address);

    // Example NFT
    const erc721Address = "0x7cA29c59D76E45FdBE5F5E900eFCC8dF37485E31";
    const erc721: ERC721RaribleMinimal = ERC721RaribleMinimal__factory.connect(erc721Address, signer);
    const tokenId = BigNumber.from("48827653089252063377009650346866330927455685249615897861731929327047129694212");
    console.log(`tokenId = ${tokenId.toString()}`);

    // Prepare the exchange contract
    const exchangeDeployment = await hre.deployments.get("ExchangeMetaV2");
    const exchange: ExchangeMetaV2 = ExchangeMetaV2__factory.connect(exchangeDeployment.address, makerRight);

    const erc20Deployment = await hre.deployments.get("RariTestERC20");
    const erc20: RariTestERC20 = RariTestERC20__factory.connect(erc20Deployment.address, makerRight);
    const cost = BigNumber.from("1000000000000000000"); // 10^18

    const txapp =await erc721.setApprovalForAll(exchangeDeployment.address, true, {gasLimit: 8_000_000});
    const status = await txapp.wait();
    const txapproveErc20 = await erc20.connect(makerRight).approve(exchangeDeployment.address, cost, {gasLimit: 8_000_000});
    const status2 = await txapproveErc20.wait();

    console.log("setApprovalForAll 721 =>", txapp.hash, status.status);
    console.log("approve erc20 =>", txapproveErc20.hash, status2.status);
    // Encode V3 struct with no payouts, no origin fees, and isMakeFill = false
    const encodedV3 = ethers.utils.defaultAbiCoder.encode(
        [
        "tuple((address account, uint96 value)[] payouts, (address account, uint96 value)[] originFees, bool isMakeFill)"
        ],
        [
        [
            [], // payouts
            [], // originFees
            false // isMakeFill
        ]
        ]
    );
    
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
          assetClass: ERC20,
          data: erc20Deployment.address,
        },
        value: cost
      },
      salt: 2,
      start: 0,
      end: 0,
      dataType: V3,
      data: encodedV3
    };

    const rightOrder: LibOrder.OrderStruct = {
      maker: makerRight.address,
      makeAsset: {
        assetType: {
          assetClass: ERC20,
          data: erc20Deployment.address,
        },
        value: cost
      },
      taker: ZERO,
      takeAsset: {
        assetType: {
          assetClass: ERC721,
          data: encBigNumber(erc721.address, tokenId),
        },
        value: 1
      },
      salt: 2,
      start: 0,
      end: 0,
      dataType: V3,
      data: encodedV3
    };



    // EIP-712 sign with Ethers
    const leftSig = await signOrderEthers(leftOrder, signer, exchangeDeployment.address);
    const rightSig = await signOrderEthers(rightOrder, makerRight, exchangeDeployment.address);

    const balanceETH = await makerRight.getBalance();
    console.log("balanceETH right", balanceETH.toString());

    // const txCheck = await signer.sendTransaction({ to: exchangeDeployment.address, value: cost, gasLimit: 8_000_000 });
    // console.log("sendTransaction =>", txCheck.hash);

    const balanceRightBefore = await erc20.balanceOf(makerRight.address);
    console.log("balanceRightBefore =>", balanceRightBefore.toString());
    const balanceLeftBefore = await erc20.balanceOf(signer.address);
    console.log("balanceLeftBefore =>", balanceLeftBefore.toString());

    // Now match
    const tx = await exchange.connect(makerRight).matchOrders(leftOrder, leftSig, rightOrder, rightSig, { gasLimit: 8_000_000 });
    console.log("matchOrders =>", tx.hash);

    const balanceRightAfter = await erc20.balanceOf(makerRight.address);
    console.log("balanceRightAfter =>", balanceRightAfter.toString());
    const balanceLeftAfter = await erc20.balanceOf(signer.address);
    console.log("balanceLeftAfter =>", balanceLeftAfter.toString());
};

export default func;
func.tags = ['run-erc20-orders', '207'];

// hedera testnet
// Token #1, collection: 0x7cA29c59D76E45FdBE5F5E900eFCC8dF37485E31, tokenId: 48827653089252063377009650346866330927455685249615897861731929327047129694209, owner: 0x6Bf378e79F736057f64cD647e7Da99fD76800C9B 1
// Minted tokenId #2, tx: 0xf992a5e00fa269945c0975a373257cf54d9bd14998a61a275d9544d71d9e0375; tokenId: 48827653089252063377009650346866330927455685249615897861731929327047129694210
// Token #2, collection: 0x7cA29c59D76E45FdBE5F5E900eFCC8dF37485E31, tokenId: 48827653089252063377009650346866330927455685249615897861731929327047129694210, owner: 0x6Bf378e79F736057f64cD647e7Da99fD76800C9B 2
// Minted tokenId #3, tx: 0x8b593cc7c079dde649cb8b1a71797463ff4938efe92bc0ec2b6a2ef1d0c1d5d6; tokenId: 48827653089252063377009650346866330927455685249615897861731929327047129694211
// Token #3, collection: 0x7cA29c59D76E45FdBE5F5E900eFCC8dF37485E31, tokenId: 48827653089252063377009650346866330927455685249615897861731929327047129694211, owner: 0x6Bf378e79F736057f64cD647e7Da99fD76800C9B 3
// Minted tokenId #4, tx: 0x9bb79ea356d102d43205e9b375ec910e9f345c09218152c523b15e902a5c86ee; tokenId: 48827653089252063377009650346866330927455685249615897861731929327047129694212
// Token #4, collection: 0x7cA29c59D76E45FdBE5F5E900eFCC8dF37485E31, tokenId: 48827653089252063377009650346866330927455685249615897861731929327047129694212, owner: 0x6Bf378e79F736057f64cD647e7Da99fD76800C9B 4
// Minted tokenId #5, tx: 0x74489eba3705db0eb55bbbe82a2c552c585c52f835e49e2ed82833c1eb9429d8; tokenId: 48827653089252063377009650346866330927455685249615897861731929327047129694213
// Token #5, collection: 0x7cA29c59D76E45FdBE5F5E900eFCC8dF37485E31, tokenId: 48827653089252063377009650346866330927455685249615897861731929327047129694213, owner: 0x6Bf378e79F736057f64cD647e7Da99fD76800C9B 5
//

// collection 721 address: 0x9A4A7c4D3892A3315B4b60f8Dd3202524F10E861
// Minted tokenId #1, tx: 0x7f92a849a24771a3c7ec3b2fe2ac4b82dc509a58c42aa0a25243d18080016d11; tokenId: 113684458893483085791140453563089956290380401423266949679181692179405588135937

// collection 721 address: 0xEF3B71590860B51fb8526708F039062F6Df89cBC
// Minted tokenId #1, tx: 0x6312ca7609748bf8f30a71e3899fb13be0f53c9a83fb8c4feae58068e8edc1ea; tokenId: 113684458893483085791140453563089956290380401423266949679181692179405588135937

// collection 721 address: 0x01d098040404B8F7C28fa73AB27c65eea3d52063
// Minted tokenId #1, tx: 0xaf427431ce1d340e3d32b3e11ee0c6f45c4289c8595b6191f955e9f2527a463a; tokenId: 113684458893483085791140453563089956290380401423266949679181692179405588135937

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


// Minted tokenId #1, tx: 0x86d988fe5901cf06d9441ee4e4cf9109f8399528d2d4c0fa61772d4eaae4b97c; tokenId: 113684458893483085791140453563089956290380401423266949679181692179405588135937
// Token #1, collection: 0x8211FeFB75278227725ca1Ec476413485beF0332, tokenId: 113684458893483085791140453563089956290380401423266949679181692179405588135937, owner: 0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4 1
// Minted tokenId #2, tx: 0x2398122aa7e5c0ca0a5f2829a2603a2ba180639099284a3dcfba995619a359e3; tokenId: 113684458893483085791140453563089956290380401423266949679181692179405588135938
// Token #2, collection: 0x8211FeFB75278227725ca1Ec476413485beF0332, tokenId: 113684458893483085791140453563089956290380401423266949679181692179405588135938, owner: 0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4 2
// Minted tokenId #3, tx: 0x997bea458672cc0a4c4df7d906df05f1e1253ee3bc504bfcae6cb079b0fd2849; tokenId: 113684458893483085791140453563089956290380401423266949679181692179405588135939
// Token #3, collection: 0x8211FeFB75278227725ca1Ec476413485beF0332, tokenId: 113684458893483085791140453563089956290380401423266949679181692179405588135939, owner: 0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4 3
// Minted tokenId #4, tx: 0x6c0c3083985415b87a8fe92f29c4a02eb403da86f0ef28eead731d277c76fc83; tokenId: 113684458893483085791140453563089956290380401423266949679181692179405588135940
// Token #4, collection: 0x8211FeFB75278227725ca1Ec476413485beF0332, tokenId: 113684458893483085791140453563089956290380401423266949679181692179405588135940, owner: 0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4 4