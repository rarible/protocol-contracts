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
import { LibOrderDataV3, LibOrderDataV3__factory } from "@rarible/exchange-v2/typechain-types";

const v3SELL = "0x2fa3cfd3"
const v3BUY = "0x1b18cdf6"

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
    const tokenId = BigNumber.from("48827653089252063377009650346866330927455685249615897861731929327047129694213");
    console.log(`tokenId = ${tokenId.toString()}`);

    // Prepare the exchange contract
    const exchangeDeployment = await hre.deployments.get("ExchangeMetaV2");
    const exchange: ExchangeMetaV2 = ExchangeMetaV2__factory.connect(exchangeDeployment.address, makerRight);

    const txapp =await erc721.setApprovalForAll(exchangeDeployment.address, true, {gasLimit: 8_000_000});
    const status = await txapp.wait();
    console.log("setApprovalForAll =>", txapp.hash, status.status);
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
    const cost = BigNumber.from(10_000_000_000).mul(100000000);

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
        value: cost
      },
      salt: 1,
      start: 0,
      end: 0,
      dataType: V3,
      data: encodedV3
    };

    const rightOrder: LibOrder.OrderStruct = {
      maker: makerRight.address,
      makeAsset: {
        assetType: {
          assetClass: ETH,
          data: "0x"
        },
        value: cost // min 10_000_000_000
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
      dataType: V3,
      data: encodedV3
    };



    // EIP-712 sign with Ethers
    const leftSig = await signOrderEthers(leftOrder, signer, exchangeDeployment.address);
    const rightSig = await signOrderEthers(rightOrder, makerRight, exchangeDeployment.address);

    const balanceETH = await makerRight.getBalance();
    console.log("balanceETH right", balanceETH.toString());

    const txCheck = await signer.sendTransaction({ to: exchangeDeployment.address, value: cost, gasLimit: 8_000_000 });
    console.log("sendTransaction =>", txCheck.hash);

    // Now match
    const tx = await exchange.connect(makerRight).matchOrders(leftOrder, leftSig, rightOrder, rightSig, { gasLimit: 8_000_000, value: cost });
    console.log("matchOrders =>", tx.hash);
};

export default func;
func.tags = ['run-orders-exchange-wrapper', '206'];
