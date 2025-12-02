// <ai_context> TypeScript tests for RaribleTransferManager. Tests protocol fee settings and payment scenarios for V2/V3 orders using Ethers v6 and modern Hardhat patterns. </ai_context>
import { expect } from "chai";
import { network } from "hardhat";
import type * as ethersTypes from "ethers";

const connection = await network.connect();
const { ethers } = connection;

import {
  type ERC20TransferProxyTest,
  ERC20TransferProxyTest__factory,
  type RaribleTransferManagerTest,
  type TestRoyaltiesRegistry,
  TestRoyaltiesRegistry__factory,
  type TransferProxyTest,
  TransferProxyTest__factory,
  type TestERC721RoyaltiesV2,
  TestERC721RoyaltiesV2__factory,
} from "../types/ethers-contracts";
import { ORDER_DATA_V2, ORDER_DATA_V3, ERC721, ETH, enc } from "@rarible/common-sdk/src/assets";
import { verifyBalanceChangeReturnTx } from "@rarible/common-sdk/src/balance";
import { ZERO_ADDRESS } from "@rarible/common-sdk/src/listing";
import { deployTransparentProxy } from "@rarible/common-sdk/src/deploy";
import type { LibOrder } from "../types/ethers-contracts/contracts/ExchangeV2";
describe("RaribleTransferManager", () => {
    let transferProxy: TransferProxyTest;
    let erc20TransferProxy: ERC20TransferProxyTest;
    let rtm: RaribleTransferManagerTest;
    let royaltiesRegistry: TestRoyaltiesRegistry;
    let protocol: ethersTypes.Signer;
    let accounts: ethersTypes.Signer[];
    let deployer: ethersTypes.Signer;
    const erc721TokenId0 = 52n;
    const erc721TokenId1 = 53n;
    const erc1155TokenId1 = 54n;
    const erc1155TokenId2 = 55n;

    before(async () => {
        const signers = await ethers.getSigners();
        [deployer, protocol, ...accounts] = signers;

        transferProxy = await new TransferProxyTest__factory(deployer).deploy();
        await transferProxy.waitForDeployment();

        erc20TransferProxy = await new ERC20TransferProxyTest__factory(deployer).deploy();
        await erc20TransferProxy.waitForDeployment();

        royaltiesRegistry = await new TestRoyaltiesRegistry__factory(deployer).deploy();
        await royaltiesRegistry.waitForDeployment();

        const { instance: rtmInstance } = await deployTransparentProxy<RaribleTransferManagerTest>(ethers, {
            contractName: "RaribleTransferManagerTest",
            initFunction: "init____",
            initArgs: [
                await transferProxy.getAddress(),
                await erc20TransferProxy.getAddress(),
                0n,
                ZERO_ADDRESS,
                await royaltiesRegistry.getAddress(),
                await deployer.getAddress(),
            ],
            proxyOwner: await deployer.getAddress(),
        });
        rtm = rtmInstance;
    });
    it("should set protocol fee", async () => {
        const receiver = await protocol.getAddress();
        const buyerAmt = 500n;
        const sellerAmt = 400n;
        
        await rtm.connect(deployer).setAllProtocolFeeData(receiver, buyerAmt, sellerAmt);
        
        const fee = await rtm.protocolFee();
        expect(fee.receiver).to.equal(receiver);
        expect(fee.buyerAmount).to.equal(buyerAmt);
        expect(fee.sellerAmount).to.equal(sellerAmt);
    });
    it("protocol fee is not paid in V2 order", async () => {
        await checkProtocolFee(ORDER_DATA_V2, ORDER_DATA_V2, 1000n, -1000n, 0n, 1000n);
    });

    it("protocol fee is paid for both V3 orders", async () => {
        await checkProtocolFee(ORDER_DATA_V3, ORDER_DATA_V3, 1030n, -980n, -50n, 1030n);
    });

    it("protocol fee is paid for V3 sell side", async () => {
        await checkProtocolFee(ORDER_DATA_V3, ORDER_DATA_V2, 1000n, -980n, -20n, 1000n);
    });

    it("protocol fee is paid for V3 buy side", async () => {
        await checkProtocolFee(ORDER_DATA_V2, ORDER_DATA_V3, 1030n, -1000n, -30n, 1030n);
    });
    async function checkProtocolFee(
        leftOrderV: string,
        rightOrderV: string,
        rightBalanceChange: bigint,
        leftBalanceChange: bigint,
        protocolChange: bigint,
        txValue: bigint
    ) {
        const makerLeft = accounts[0];
        const makerRight = accounts[1];

        // Minting NFT
        const erc721 = await prepareERC721(makerLeft);
        
        const protocolAddress = await protocol.getAddress();
        await rtm.setAllProtocolFeeData(protocolAddress, 300n, 200n);
        
        const fee = await rtm.protocolFee();
        expect(fee.receiver).to.equal(protocolAddress);
        expect(fee.buyerAmount).to.equal(300n);
        expect(fee.sellerAmount).to.equal(200n);

        const erc721Address = await erc721.getAddress();
        const nftAssetType = {
            assetClass: ERC721,
            data: enc(erc721Address, erc721TokenId1),
        };
        const nftAsset = {
            assetType: nftAssetType,
            value: 1n,
        };
        const ethAssetType = {
            assetClass: ETH,
            data: "0x",
        };
        const ethAsset = {
            assetType: ethAssetType,
            value: 1000n,
        };

        const makerLeftAddress = await makerLeft.getAddress();
        const makerRightAddress = await makerRight.getAddress();

        const left: LibOrder.OrderStruct = {
            maker: makerLeftAddress,
            makeAsset: nftAsset,
            taker: ZERO_ADDRESS,
            takeAsset: ethAsset,
            salt: 1n,
            start: 0n,
            end: 0n,
            dataType: leftOrderV,
            data: await rtm.encodeV2({ originFees: [], payouts: [], isMakeFill: true }),
        };
        const right: LibOrder.OrderStruct = {
            maker: makerRightAddress,
            makeAsset: ethAsset,
            taker: ZERO_ADDRESS,
            takeAsset: nftAsset,
            salt: 1n,
            start: 0n,
            end: 0n,
            dataType: rightOrderV,
            data: await rtm.encodeV2({ originFees: [], payouts: [], isMakeFill: false }),
        };

        await verifyBalanceChangeReturnTx(ethers.provider, makerRightAddress, rightBalanceChange, () =>
            verifyBalanceChangeReturnTx(ethers.provider, makerLeftAddress, leftBalanceChange, () =>
                verifyBalanceChangeReturnTx(ethers.provider, protocolAddress, protocolChange, () =>
                    rtm.connect(makerRight).doTransfersExternal(left, right, { value: txValue })
                )
            )
        );

        expect(await erc721.ownerOf(erc721TokenId1)).to.equal(makerRightAddress);
    }

    async function prepareERC721(
        user: ethersTypes.Signer,
        tokenId: bigint = erc721TokenId1,
        royalties: { account: string; value: bigint }[] = []
    ): Promise<TestERC721RoyaltiesV2> {
        const erc721 = await new TestERC721RoyaltiesV2__factory(deployer).deploy();
        await erc721.waitForDeployment();
        await erc721.initialize();
        
        const userAddress = await user.getAddress();
        await erc721.mint(userAddress, tokenId, royalties);
        
        const transferProxyAddress = await transferProxy.getAddress();
        await erc721.connect(user).setApprovalForAll(transferProxyAddress, true);
        
        return erc721;
    }
});