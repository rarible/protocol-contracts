import { expect } from "chai";
import { ethers } from "hardhat";
import { ERC20TransferProxyTest, RaribleTransferManagerTest, TestRoyaltiesRegistry, TransferProxyTest } from "../typechain-types";
import { ZERO, ORDER_DATA_V2, ORDER_DATA_V3, verifyBalanceChangeReturnTx, ERC721, enc, ETH } from "./utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Signer } from "zksync-web3";
import { LibOrder } from "../typechain-types/contracts/ExchangeV2";

describe("RaribleTransferManager", () => {
    let transferProxy: TransferProxyTest
    let erc20TransferProxy: ERC20TransferProxyTest
    let rtm: RaribleTransferManagerTest
    let royaltiesRegistry: TestRoyaltiesRegistry
    let protocol: SignerWithAddress
    let accounts: SignerWithAddress[]

    const erc721TokenId0 = 52;
    const erc721TokenId1 = 53;
    const erc1155TokenId1 = 54;
    const erc1155TokenId2 = 55;

    before(async () => {
        [protocol, ...accounts] = await ethers.getSigners()

        transferProxy = await ethers.getContractFactory("TransferProxyTest").then(f => f.deploy())
        erc20TransferProxy = await ethers.getContractFactory("ERC20TransferProxyTest").then(f => f.deploy());
        rtm = await ethers.getContractFactory("RaribleTransferManagerTest").then(f => f.deploy());
        royaltiesRegistry = await ethers.getContractFactory("TestRoyaltiesRegistry").then(f => f.deploy());

        await rtm.init____(transferProxy.address, erc20TransferProxy.address, 0, ZERO, royaltiesRegistry.address);
    });

    it("protocol fee is not paid in V2 order", async () => {
        await checkProtocolFee(ORDER_DATA_V2, ORDER_DATA_V2, 1000, -1000, 0, 1000);
    })

    it("protocol fee is paid for both V3 orders", async () => {
        await checkProtocolFee(ORDER_DATA_V3, ORDER_DATA_V3, 1030, -980, -50, 1030);
    })

    it("protocol fee is paid for V3 sell side", async () => {
        await checkProtocolFee(ORDER_DATA_V3, ORDER_DATA_V2, 1000, -980, -20, 1000);
    })

    it("protocol fee is paid for V3 buy side", async () => {
        await checkProtocolFee(ORDER_DATA_V2, ORDER_DATA_V3, 1030, -1000, -30, 1030);
    })

    async function checkProtocolFee(leftOrderV: string, rightOrderV: string, rightBalanceChange: number, leftBalanceChange: number, protocolChange: number, txValue: number) {
        const makerLeft = accounts[1]
        const makerRight = accounts[2]
        // minting NFT
        const erc721 = await prepareERC721(makerLeft);

        const tx = await rtm.setAllProtocolFeeData(protocol.address, 300, 200)

        const fee = (await rtm.protocolFee())

        expect(fee.receiver).to.eq(protocol.address)
        expect(fee.buyerAmount).to.eq(300)
        expect(fee.sellerAmount).to.eq(200)

        const nftAssetType = {
            assetClass: ERC721,
            data: enc(erc721.address, erc721TokenId1),
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
            maker: makerLeft.address,
            makeAsset: nftAsset,
            taker: ZERO,
            takeAsset: ethAsset,
            salt: 1,
            start: 0,
            end: 0,
            dataType: leftOrderV,
            data: (await rtm.encodeV2({ originFees: [], payouts: [], isMakeFill: true }))
        }

        const right: LibOrder.OrderStruct = {
            maker: makerRight.address,
            makeAsset: ethAsset,
            taker: ZERO,
            takeAsset: nftAsset,
            salt: 1,
            start: 0,
            end: 0,
            dataType: rightOrderV,
            data: (await rtm.encodeV2({ originFees: [], payouts: [], isMakeFill: false }))
        }

        await verifyBalanceChangeReturnTx(ethers, makerRight, rightBalanceChange, () =>
            verifyBalanceChangeReturnTx(ethers, makerLeft, leftBalanceChange, () =>
                verifyBalanceChangeReturnTx(ethers, protocol, protocolChange, () =>
                    rtm.connect(makerRight).doTransfersExternal(left, right, { value: txValue })
                )
            )
        );

        await expect(erc721.ownerOf(erc721TokenId1)).to.eventually.eq(makerRight.address)
    }

    async function prepareERC721(user: SignerWithAddress, tokenId: number = erc721TokenId1, royalties = []) {
        const erc721 = await ethers.getContractFactory("TestERC721RoyaltiesV2").then(f => f.deploy());
        await erc721.initialize();

        await erc721.mint(user.address, tokenId, royalties);
        await erc721.connect(user).setApprovalForAll(transferProxy.address, true);
        return erc721;
    }
})