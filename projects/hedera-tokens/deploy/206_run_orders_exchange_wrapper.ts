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
    const erc721Address = "0x000000000000000000000000000000000057C327";
    const erc721: ERC721RaribleMinimal = ERC721RaribleMinimal__factory.connect(erc721Address, signer);
    const tokenId = BigNumber.from("1");
    console.log(`tokenId = ${tokenId.toString()}`);

    // Prepare the exchange contract
    const exchangeDeployment = await hre.deployments.get("ExchangeMetaV2");
    const exchange: ExchangeMetaV2 = ExchangeMetaV2__factory.connect(exchangeDeployment.address, makerRight);

    const txapp = await erc721.setApprovalForAll(exchangeDeployment.address, true, {gasLimit: 8_000_000});
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
    // hedera cost caluculation -- rpc receives 10^10 more than the cost
    // min 10_000_000_000
    // cost 1 HBAR
    const cost = BigNumber.from(10e8);
    const chainId = await hre.ethers.provider.getNetwork().then(network => network.chainId);
    let costRpc = cost;
    if (chainId === 296 || chainId === 295) {
        costRpc = BigNumber.from("1000000000000000000"); // 10^18
    }
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

    // Now match
    const tx = await exchange.connect(makerRight).matchOrders(leftOrder, leftSig, rightOrder, rightSig, { gasLimit: 8_000_000, value: costRpc });
    console.log("matchOrders =>", tx.hash);
};

export default func;
func.tags = ['run-orders-exchange-wrapper', '206'];


// Token created at address 0x000000000000000000000000000000000057C327
// vfadeev@Mac hedera-tokens % npx hardhat mintNFT --collection-address 0x000000000000000000000000000000000057C327 --network testnet
// Using deployer address: 0x6Bf378e79F736057f64cD647e7Da99fD76800C9B
// Mint tx hash 0xaf8ec2a829198da75443611e08eb8561650c89be05672e333627123bd07de1a8
// vfadeev@Mac hedera-tokens % npx hardhat mintNFT --collection-address 0x000000000000000000000000000000000057C327 --network testnet
// Using deployer address: 0x6Bf378e79F736057f64cD647e7Da99fD76800C9B
// Mint tx hash 0xe87b4bae1f94c2266f2ddc88cde29a354b13b22732b5146fa0e2f42b3aad2444
// vfadeev@Mac hedera-tokens % npx hardhat mintNFT --collection-address 0x000000000000000000000000000000000057C327 --network testnet
// Using deployer address: 0x6Bf378e79F736057f64cD647e7Da99fD76800C9B
// Mint tx hash 0xf3ec83f1abfffd8184a3b1cc8e5e6c1293aa2e4daa5dd00179d3715da4d7af65
// vfadeev@Mac hedera-tokens % npx hardhat mintNFT --collection-address 0x000000000000000000000000000000000057C327 --network testnet
// Using deployer address: 0x6Bf378e79F736057f64cD647e7Da99fD76800C9B
// Mint tx hash 0x579e94b77ff471a19ac30a29a478900a3154c9171febe95b81edf647f84e7d94