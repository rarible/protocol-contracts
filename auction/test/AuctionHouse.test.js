const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
//const ExchangeV2 = artifacts.require("ExchangeV2.sol");
//const TestERC20 = artifacts.require("TestERC20.sol");
const TestERC721 = artifacts.require("TestERC721.sol");
const TestERC1155 = artifacts.require("TestERC1155.sol");
//const ERC1155_V2 = artifacts.require("TestERC1155WithRoyaltiesV2.sol");
//const ERC721_V1 = artifacts.require("TestERC721WithRoyaltiesV1.sol");
const TransferProxyTest = artifacts.require("TransferProxyTest.sol");
const ERC20TransferProxyTest = artifacts.require("ERC20TransferProxyTest.sol");
//const LibOrderTest = artifacts.require("LibOrderTest.sol");
//const RaribleTransferManagerTest = artifacts.require("RaribleTransferManagerTest.sol");
const truffleAssert = require('truffle-assertions');
//const TestRoyaltiesRegistry = artifacts.require("TestRoyaltiesRegistry.sol");
const AuctionHouse = artifacts.require("AuctionHouse");

const DAY = 86400;
const WEEK = DAY * 7;
const { Order, Asset, AssetType, sign } = require("../../exchange-v2/test/order");
//const EIP712 = require("../EIP712");
const ZERO = "0x0000000000000000000000000000000000000000";
const { expectThrow, verifyBalanceChange } = require("@daonomic/tests-common");
const { ETH, ERC20, ERC721, ERC1155, enc, id } = require("../../exchange-v2/test/assets.js");

const tests = require("@daonomic/tests-common");
const increaseTime = tests.increaseTime;

contract("Check Auction", accounts => {
    let exchangeV2;
    let transferProxy;
    let erc20TransferProxy;
    let transferManagerTest;
    let t1;
    let t2;
    let libOrder;
    let protocol = accounts[9];
    let community = accounts[8];
    const eth = "0x0000000000000000000000000000000000000000";
    let erc721TokenId0 = 52;
    let erc721TokenId1 = 53;
    let erc1155TokenId1 = 54;
    let erc1155TokenId2 = 55;
    let royaltiesRegistry;
    let auctionHouse;

    beforeEach(async () => {
        transferProxy = await TransferProxyTest.new();
        erc20TransferProxy = await ERC20TransferProxyTest.new();
//        royaltiesRegistry = await TestRoyaltiesRegistry.new();
//        exchangeV2 = await deployProxy(ExchangeV2, [transferProxy.address, erc20TransferProxy.address, 300, community, royaltiesRegistry.address], { initializer: "__ExchangeV2_init" });
//        transferManagerTest = await RaribleTransferManagerTest.new();
//        t1 = await TestERC20.new();
//        t2 = await TestERC20.new();
//        /*ETH*/
//        await exchangeV2.setFeeReceiver(eth, protocol);
//        await exchangeV2.setFeeReceiver(t1.address, protocol);
        /*ERC721 */
        erc721 = await TestERC721.new("Rarible", "RARI", "https://ipfs.rarible.com");
        /*ERC1155*/
        erc1155 = await TestERC1155.new("https://ipfs.rarible.com");
//        /*ERC1155V2*/
//        erc1155_v2 = await ERC1155_V2.new("https://ipfs.rarible.com");
//        erc1155_v2.initialize();
//        /*ERC721_V1 */
//        erc721V1 = await ERC721_V1.new("Rarible", "RARI", "https://ipfs.rarible.com");
//        await erc721V1.initialize();

//        auctionHouse = await deployProxy(AuctionHouse, [transferProxy.address, erc20TransferProxy.address, exchangeV2.address], { initializer: "__AuctionHouse_init" });
        auctionHouse = await deployProxy(AuctionHouse, [transferProxy.address, erc20TransferProxy.address], { initializer: "__AuctionHouse_init" });

    });
    describe("create auction", () => {
//        it("create auction ", async () => {
//            console.log(await auctionHouse.auctions(0))
//        })

        it("Check creation with ERC721, and start auction owner is auctionHouse", async () => {
//        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7)
          await erc721.mint(accounts[1], erc721TokenId1);
          await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
          assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[1]); // after mint owner is accounts[1]
          let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);
          const encoded = enc(accounts[5]);
          let buyAssetType = await AssetType(ERC20, encoded);
          let fees = [[accounts[3], 100], [accounts[4], 300]];
          let dataV1 = await encDataV1([fees, 1000, 500, 18]); //originFees, duration, startTime, buyOutPrice
          let dataV1Type = id("V1");
          let resultStartAuction = await auctionHouse.startAuction( sellAsset, buyAssetType, 0, 1, 9, dataV1Type, dataV1, {from: accounts[1]});
          assert.equal(await erc721.ownerOf(erc721TokenId1), auctionHouse.address); // after mint owner is auctionHouse
        })

        it("Check creation with ERC1155, and start auction owner is auctionHouse", async () => {
          await erc1155.mint(accounts[1], erc1155TokenId1, 7);
          await erc1155.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
          assert.equal(await erc1155.balanceOf(accounts[1], erc1155TokenId1), 7); // after mint owner is accounts[1]
          let sellAsset = await Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7);
          const encoded = enc(accounts[5]);
          let buyAssetType = await AssetType(ERC20, encoded);
          let fees = [[accounts[3], 100], [accounts[4], 300]];
          let dataV1 = await encDataV1([fees, 1000, 500, 18]); //originFees, duration, startTime, buyOutPrice
          let dataV1Type = id("V1");
          let resultStartAuction = await auctionHouse.startAuction( sellAsset, buyAssetType, 0, 1, 9, dataV1Type, dataV1, {from: accounts[1]});
          assert.equal(await erc1155.balanceOf(auctionHouse.address, erc1155TokenId1), 4); // after mint owner is auctionHouse
        })

    });

   describe("bid auction", () => {
//     it("create auction ", async () => {
//         console.log(await auctionHouse.auctions(0))
//     })

     it("Put bid", async () => {
       //auction initialize
       await erc721.mint(accounts[1], erc721TokenId1);
       await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
       let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);
       const encoded = enc(accounts[5]);
       let buyAssetType = await AssetType(ERC20, encoded);
       let auctionFees = [[accounts[3], 100], [accounts[4], 300]];
       let endTime = await Math.floor(Date.now()/1000);
       console.log("endTime:" + endTime);
       let dataV1 = await encDataV1([auctionFees, 1000, endTime, 18]); //originFees, duration, startTime, buyOutPrice

       let dataV1Type = id("V1");
       let resultStartAuction = await auctionHouse.startAuction( sellAsset, buyAssetType, 0, 1, 9, dataV1Type, dataV1, {from: accounts[1]});
       //bid initialize
       let auctionId = 1;
       let bidFees = [[accounts[6], 1500], [accounts[7], 3500]];
       let bidDataV1 = await bidEncDataV1([bidFees]);
       let bidDataV1Type = id("V1");
       let bid = {amount:8, dataType:bidDataV1Type, data:bidDataV1};
       let resultPutBid = await auctionHouse.putBid(auctionId, bid);
     })

    });

    function encDataV1(tuple) {
        return auctionHouse.encode(tuple);
    }

    function bidEncDataV1(tuple) {
        return auctionHouse.encodeBid(tuple);
    }

    async function getSignature(order, signer) {
        return sign(order, signer, exchangeV2.address);
    }

});
