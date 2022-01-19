const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const TestERC20 = artifacts.require("TestERC20.sol");
const TestERC721 = artifacts.require("TestERC721.sol");
const TestERC1155 = artifacts.require("TestERC1155.sol");
const TransferProxyTest = artifacts.require("TransferProxyTest.sol");
const ERC20TransferProxyTest = artifacts.require("ERC20TransferProxyTest.sol");
const TestAuctionHouse = artifacts.require("TestAuctionHouse");
const RaribleTransferManager = artifacts.require("RaribleTransferManager");
const TestRoyaltiesRegistry = artifacts.require("TestRoyaltiesRegistry");
const Wrapper = artifacts.require("Wrapper");
const PartyBidTest = artifacts.require("PartyBidTest");
const FaultyBidder = artifacts.require("FaultyBidder");

const truffleAssert = require('truffle-assertions');

const { Order, Asset, AssetType, sign } = require("../../exchange-v2/test/order");
const { expectThrow, verifyBalanceChange } = require("@daonomic/tests-common");
const { ETH, ERC20, ERC721, ERC1155, enc, id } = require("../../exchange-v2/test/assets.js");

const { increaseTime } = require("@daonomic/tests-common");
const zeroAddress = "0x0000000000000000000000000000000000000000";

contract("AuctionHouse", accounts => {
  let royaltiesRegistry;
  let transferProxy;
  let erc20TransferProxy;
  let testAuctionHouse;
  let erc20Token;
  let erc721;
  let erc1155;
  let transferManager;

  const erc721TokenId1 = 53;
  const erc1155TokenId1 = 54;
  const protocol = accounts[9];
  const community = accounts[8];
  const V1 = id("V1")
  const seller = accounts[1];
  const buyer = accounts[2]

  beforeEach(async () => {
    //transfer proxes
    transferProxy = await TransferProxyTest.new();
    erc20TransferProxy = await ERC20TransferProxyTest.new();

    //royaltiesRegistry
    royaltiesRegistry = await TestRoyaltiesRegistry.new()
    transferManager = await RaribleTransferManager.new();
    await transferManager.__RaribleTransferManager_init(protocol, royaltiesRegistry.address, transferProxy.address, erc20TransferProxy.address);

    /*Auction*/
    testAuctionHouse = await deployProxy(TestAuctionHouse, [transferProxy.address, erc20TransferProxy.address, transferManager.address, 300], { initializer: "__AuctionHouse_init" });
    await transferManager.addOperator(testAuctionHouse.address);
  });

  describe("creation", () => {
    it("duration works correctly", async () => {
      const sellAsset = await prepareERC721();
      const buyAssetType = await prepareETH();

      let auctionFees = [[accounts[3], 1000]];
      //trying duration = 899 (slightly less than 15 mins)
      let dataV1 = await encDataV1([[], auctionFees, 899, 0, 100]);
      await truffleAssert.fails(
        testAuctionHouse.startAuction(sellAsset, buyAssetType, 1, 90, V1, dataV1, { from: seller }),
        truffleAssert.ErrorType.REVERT,
        "incorrect duration"
      )

      //trying duration = 86400001 (slightly more than 1000days)
      dataV1 = await encDataV1([[], auctionFees, 86400001, 0, 100])
      await truffleAssert.fails(
        testAuctionHouse.startAuction(sellAsset, buyAssetType, 1, 90, V1, dataV1, { from: seller }),
        truffleAssert.ErrorType.REVERT,
        "incorrect duration"
      )

      //trying maxx duration 86400000
      dataV1 = await encDataV1([[], auctionFees, 86400000, 0, 100])
      await testAuctionHouse.startAuction(sellAsset, buyAssetType, 1, 90, V1, dataV1, { from: seller })
      const txCancel = await testAuctionHouse.cancel(1, { from: seller });

      let auctionId;
      truffleAssert.eventEmitted(txCancel, 'AuctionCancelled', (ev) => {
        auctionId = ev.auctionId;
        return true;
      });
      assert.equal(auctionId, 1, "cancel event correct")

      dataV1 = await encDataV1([[], auctionFees, 900, 0, 100])
      await testAuctionHouse.startAuction(sellAsset, buyAssetType, 1, 90, V1, dataV1, { from: seller })

    })

    it("getAuctionByToken works, auctionId iterates", async () => {
      const sellAsset = await prepareERC721();
      const buyAssetType = await prepareETH();

      let auctionFees = [[accounts[3], 1000]];
      let dataV1 = await encDataV1([[], auctionFees, 1000, 0, 100]); //originFees, duration, startTime, buyOutPrice

      let resultStartAuction = await testAuctionHouse.startAuction(sellAsset, buyAssetType, 1, 90, V1, dataV1, { from: seller });

      let auctionId;
      truffleAssert.eventEmitted(resultStartAuction, 'AuctionCreated', (ev) => {
        auctionId = ev.auctionId;
        return true;
      });

      assert.equal((await testAuctionHouse.getAuctionByToken(erc721.address, erc721TokenId1)).toString(), auctionId.toString(), "getAuctionByToken works");

      await testAuctionHouse.cancel(auctionId, {from: seller})
      assert.equal((await testAuctionHouse.getAuctionByToken(erc721.address, erc721TokenId1)).toString(), 0, "getAuctionByToken doesn't works after cancel");
      
      const tokenIdNew = 123;
      const sellAsset1 = await prepareERC721(seller, tokenIdNew);
      let resultStartAuction1 = await testAuctionHouse.startAuction(sellAsset1, buyAssetType, 1, 90, V1, dataV1, { from: seller });

      let auctionId1;
      truffleAssert.eventEmitted(resultStartAuction1, 'AuctionCreated', (ev) => {
        auctionId1 = ev.auctionId;
        return true;
      });
      assert.equal(auctionId1.toNumber(), auctionId.toNumber() + 1, "auction id iterates")
      assert.equal((await testAuctionHouse.getAuctionByToken(erc721.address, tokenIdNew)).toString(), auctionId1.toString(), "getAuctionByToken works");

    })

    it("should not create auction to sell ERC20 or ETH", async () => {
      const buyAssetType = await prepareETH()
      let fees = [];
      let dataV1 = await encDataV1([[], fees, 1000, 500, 1]); //originFees, duration, startTime, buyOutPrice
      await expectThrow(
        testAuctionHouse.startAuction(Asset(ERC20, "0x", 100), buyAssetType, 1, 1, V1, dataV1, { from: seller })
      );

      await expectThrow(
        testAuctionHouse.startAuction(Asset(ETH, "0x", 100), buyAssetType, 1, 1, V1, dataV1, { from: seller })
      );
    })

  });

  describe("bid/buyout auction", () => {
    it("should create auction:721<->20, put bid, value = 100, then value = 200", async () => {
      const sellAsset = await prepareERC721()
      const buyAssetType = await prepareERC20(buyer, 1000)
      let auctionFees = [[accounts[3], 100], [accounts[4], 300]];
      let dataV1 = await encDataV1([[], auctionFees, 1000, 0, 0]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(sellAsset, buyAssetType, 1, 9, V1, dataV1, { from: seller });
      //bid initialize
      let auctionId = 1;
      let bidFees = [[accounts[6], 1500], [accounts[7], 3500]];
      let bidDataV1 = await bidEncDataV1([[], bidFees]);
      let bid = { amount: 100, dataType: V1, data: bidDataV1 };
      await testAuctionHouse.putBid(auctionId, bid, { from: buyer });
      assert.equal((await erc20Token.balanceOf(testAuctionHouse.address)).toString(), "153");
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address);

      await prepareERC20(accounts[3], 1000, false)

      bid = { amount: 200, dataType: V1, data: bidDataV1 };
      const txBid = await testAuctionHouse.putBid(auctionId, bid, { from: accounts[3] });
      let id;
      truffleAssert.eventEmitted(txBid, 'BidPlaced', (ev) => {
        id = ev.auctionId;
        return true;
      });
      assert.equal(id, 1, "id from event")

      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 306);
      assert.equal(await erc20Token.balanceOf(buyer), 1000);
      assert.equal(await erc20Token.balanceOf(accounts[3]), 694);
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address);

    })

    it("should correctly work if protocolFee changes", async () => {
      const sellAsset = await prepareERC721();
      const buyAssetType = await prepareERC20()

      assert.equal(await erc721.ownerOf(erc721TokenId1), seller); // after mint owner is testAuctionHouse

      let auctionFees = [[accounts[3], 100], [accounts[4], 300]];
      let dataV1 = await encDataV1([[], auctionFees, 1000, 0, 18]); //originFees, duration, startTime, buyOutPrice

      const txStart = await testAuctionHouse.startAuction(sellAsset, buyAssetType, 1, 9, V1, dataV1, { from: seller });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after mint owner is testAuctionHouse

      let id;
      truffleAssert.eventEmitted(txStart, 'AuctionCreated', (ev) => {
        id = ev.auctionId;
        return true;
      });
      assert.equal(id, 1, "id from event")

      await testAuctionHouse.setProtocolFee(2000)
      //bid initialize
      let auctionId = 1;
      let bidFees = [[accounts[6], 2000]];
      let bidDataV1 = await bidEncDataV1([[], bidFees]);
      let bid = { amount: 10, dataType: V1, data: bidDataV1 };
      await testAuctionHouse.putBid(auctionId, bid, { from: buyer });
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 12);

      await prepareERC20(accounts[7], 100, false)
      bid = { amount: 20, dataType: V1, data: bidDataV1 };
      const txBuyOut = await testAuctionHouse.putBid(auctionId, bid, { from: accounts[7] });
      truffleAssert.eventEmitted(txBuyOut, 'AuctionFinished', (ev) => {
        id = ev.auctionId;
        return true;
      });
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 0);
      assert.equal(await erc20Token.balanceOf(buyer), 100);
      assert.equal(await erc20Token.balanceOf(accounts[6]), 4);
      assert.equal(await erc20Token.balanceOf(accounts[7]), 76);
      assert.equal(await erc20Token.balanceOf(seller), 19);
      assert.equal(await erc20Token.balanceOf(protocol), 1);
      assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[7]);

      await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[7] });
      await testAuctionHouse.startAuction(sellAsset, buyAssetType, 1, 9, V1, dataV1, { from: accounts[7] });
      await testAuctionHouse.putBid(2, bid, { from: buyer });
      assert.equal(await erc721.ownerOf(erc721TokenId1), buyer);
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 0);
      assert.equal(await erc20Token.balanceOf(buyer), 72);
      assert.equal(await erc20Token.balanceOf(accounts[7]), 92);
      assert.equal(await erc20Token.balanceOf(accounts[6]), 8);
      assert.equal(await erc20Token.balanceOf(protocol), 9);
    })

    it("should create auction:721<->ETH, buyout with value = 100", async () => {
      const sellAsset = await prepareERC721()
      const buyAssetType = await prepareETH()
      await royaltiesRegistry.setRoyalties(erc721.address, erc721TokenId1, [[community, 1000]])
      let auctionFees = [];
      let dataV1 = await encDataV1([[], auctionFees, 1000, 0, 100]); //originFees, duration, startTime, buyOutPrice
      let auctionId = 1;

      assert.equal(await testAuctionHouse.checkAuctionExistence(auctionId), false, "auction doesn't exist before creation")

      await testAuctionHouse.startAuction(sellAsset, buyAssetType, 1, 90, V1, dataV1, { from: seller });

      assert.equal(await testAuctionHouse.checkAuctionExistence(auctionId), true, "auction exists after creation")

      //bid initialize
      let bidFees = [];
      let bidDataV1 = await bidEncDataV1([[], bidFees]);
      let bid = { amount: 100, dataType: V1, data: bidDataV1 };
      await verifyBalanceChange(buyer, 103, async () =>
        verifyBalanceChange(testAuctionHouse.address, 0, async () =>
          verifyBalanceChange(seller, -87, async () =>
            verifyBalanceChange(protocol, -6, async () =>
              verifyBalanceChange(community, -10, async () =>
                testAuctionHouse.putBid(auctionId, bid, { from: buyer, value: 200, gasPrice: 0 })
              )
            )
          )
        )
      )
      assert.equal(await erc721.ownerOf(erc721TokenId1), buyer); // after new owner 721
      assert.equal(await testAuctionHouse.checkAuctionExistence(auctionId), false, "auction auction doesn't exist after finishing")

    })

    it("No bid: 721<->20, buyOut works, good!", async () => {
      const sellAsset = await prepareERC721()
      const buyAssetType = await prepareERC20(buyer, 200)
      let auctionFees = [[accounts[3], 1000]];

      let dataV1 = await encDataV1([[], auctionFees, 1000, 0, 100]); //originFees, duration, startTime, buyOutPrice
      await testAuctionHouse.startAuction(sellAsset, buyAssetType, 1, 90, V1, dataV1, { from: seller });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after mint owner is testAuctionHouse

      let auctionId = 1;
      let bidFees = [];
      let bidDataV1 = await bidEncDataV1([[], bidFees]);
      let bid = { amount: 100, dataType: V1, data: bidDataV1 };
      await testAuctionHouse.buyOut(auctionId, bid, { from: buyer });
      assert.equal(await erc721.ownerOf(erc721TokenId1), buyer); // after payOut owner is mr. payOut
      assert.equal(await erc20Token.balanceOf(seller), 87);
      assert.equal(await erc20Token.balanceOf(accounts[3]), 10);
      assert.equal(await erc20Token.balanceOf(protocol), 6);
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 0);
    })

    it("Put bid:721<->20, buyOut works, good! ", async () => {
      const sellAsset = await prepareERC721()
      const buyAssetType = await prepareERC20()
      let auctionFees = [[accounts[3], 1000]];
      let dataV1 = await encDataV1([[], auctionFees, 1000, 0, 100]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(sellAsset, buyAssetType, 1, 90, V1, dataV1, { from: seller });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after mint owner is testAuctionHouse
      //bid initialize
      let auctionId = 1;
      let bidFees = [];
      let bidDataV1 = await bidEncDataV1([[], bidFees]);
      let bid = { amount: 95, dataType: V1, data: bidDataV1 };
      let resultPutBid = await testAuctionHouse.putBid(auctionId, bid, { from: buyer });
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 97);
      assert.equal(await erc20Token.balanceOf(buyer), 3);
      
      await prepareERC20(accounts[4], 1000, false)
      bid = { amount: 100, dataType: V1, data: bidDataV1 };
      let resultPayOutAuction = await testAuctionHouse.buyOut(auctionId, bid, { from: accounts[4] }); //accounts[4] buyOut
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 0);
      assert.equal(await erc20Token.balanceOf(seller), 87);  //NFTAuctionInitiator get buyOut value - fee protocol - fee
      assert.equal(await erc20Token.balanceOf(accounts[3]), 10);  //to fee
      assert.equal(await erc20Token.balanceOf(protocol), 6);  //to protocol
      assert.equal(await erc20Token.balanceOf(buyer), 100); //first pitBidder, return all ERC20
      assert.equal(await erc20Token.balanceOf(accounts[4]), 897);
      assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[4]); // after mint owner is accounts[4]
      //
    })

    it("No bid:721<->ETH, payOut works, good!", async () => {
      const sellAsset = await prepareERC721()
      const buyAssetType = await prepareETH()
      let auctionFees = [[accounts[3], 1000]];
      let dataV1 = await encDataV1([[], auctionFees, 1000, 0, 100]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(sellAsset, buyAssetType, 1, 90, V1, dataV1, { from: seller });
      //bid initialize
      let auctionId = 1;
      let bidFees = [];
      let bidDataV1 = await bidEncDataV1([[], bidFees]);
      let bid = { amount: 100, dataType: V1, data: bidDataV1 };
      await verifyBalanceChange(buyer, 103, async () =>
        verifyBalanceChange(seller, -87, async () =>
          verifyBalanceChange(accounts[3], -10, async () =>
            verifyBalanceChange(protocol, -6, async () =>
              testAuctionHouse.buyOut(auctionId, bid, { from: buyer, value: 200, gasPrice: 0 })
            )
          )
        )
      )
      assert.equal(await erc721.ownerOf(erc721TokenId1), buyer); // after payOut owner is mr. payOut
    })

    it("should correctly extend time of an auction ", async () => {
      const sellAsset = await prepareERC721()
      const buyAssetType = await prepareETH()

      const duration = 1000;
      const extension = 900;

      const dataV1 = await encDataV1([[], [], duration, 0, 100]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.setProtocolFee(0)

      await testAuctionHouse.startAuction(sellAsset, buyAssetType, 1, 90, V1, dataV1, { from: seller });
      const auctionId = 1;
      const bidDataV1 = await bidEncDataV1([[], []]);
      const bid1 = { amount: 90, dataType: V1, data: bidDataV1 };

      const txBid1 = await testAuctionHouse.putBidTime(auctionId, bid1, { from: buyer, value: 90, gasPrice: 0 })
      let endTime1;
      let newbuyer1;
      truffleAssert.eventEmitted(txBid1, 'BidPlaced', (ev) => {
        endTime1 = ev.endTime;
        newbuyer1 = ev.buyer;
        return true;
      });
      let now1;
      truffleAssert.eventEmitted(txBid1, 'timeStamp', (ev) => {
        now1 = ev.time;
        return true;
      });
      assert.equal(endTime1, now1.toNumber() + duration, "endTime set correctly 1")
      assert.equal(newbuyer1, buyer, "correct buyer 1")
      await increaseTime(901);

      const bid2 = { amount: 91, dataType: V1, data: bidDataV1 };
      const txBid2 = await testAuctionHouse.putBidTime(auctionId, bid2, { from: accounts[3], value: 91, gasPrice: 0 })
      let endTime2;
      let newbuyer2;
      truffleAssert.eventEmitted(txBid2, 'BidPlaced', (ev) => {
        endTime2 = ev.endTime;
        newbuyer2 = ev.buyer;
        return true;
      });
      let now2;
      truffleAssert.eventEmitted(txBid2, 'timeStamp', (ev) => {
        now2 = ev.time;
        return true;
      });
      assert.equal(endTime2, now2.toNumber() + extension, "endTime set correctly 2")
      assert.equal(newbuyer2, accounts[3], "correct buyer 2")
    })
  })

  describe("finish/cancel auction", () => {
    it("No bid, can't finish auction that is not started, canceled instaed ", async () => {
      const sellAsset = await prepareERC721()
      const buyAssetType = await prepareERC20()
      let auctionFees = [];
      let startTime = await timeNow(); //define start time
      startTime = startTime + 100; //auction will start after 100 sec
      let dataV1 = await encDataV1([[], auctionFees, 1000, startTime, 18]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(sellAsset, buyAssetType, 1, 9, V1, dataV1, { from: seller });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after start owner is testAuctionHouse
      let auctionId = 1;
      await truffleAssert.fails(
        testAuctionHouse.finishAuction(auctionId, { from: seller }),
        truffleAssert.ErrorType.REVERT,
        "only ended auction with bid can be finished"
      )

      const txCancel = await testAuctionHouse.cancel(auctionId, { from: seller });
      let id;
      truffleAssert.eventEmitted(txCancel, 'AuctionFinished', (ev) => {
        id = ev.auctionId;
        return true;
      });
      assert.equal(id, auctionId, "id from event")
      assert.equal(await erc721.ownerOf(erc721TokenId1), seller);
    })

    it("should correctly finish auction with 1 bid and past endTime", async () => {
      const sellAsset = await prepareERC721()
      const buyAssetType = await prepareERC20()
      let auctionFees = [[accounts[3], 100]];
      let dataV1 = await encDataV1([[], auctionFees, 900, 0, 18]); //originFees, duration, startTime, buyOutPrice
      await testAuctionHouse.startAuction(sellAsset, buyAssetType, 1, 9, V1, dataV1, { from: seller });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after mint owner is testAuctionHouse
      let auctionId = 1;

      let bidDataV1 = await bidEncDataV1([[], []]);
      let bid = { amount: 10, dataType: V1, data: bidDataV1 };
      await testAuctionHouse.putBid(auctionId, bid, { from: buyer });

      await increaseTime(901); //increase ~18 min

      const txFinish = await testAuctionHouse.finishAuction(auctionId, { from: accounts[0] });
      let id;
      truffleAssert.eventEmitted(txFinish, 'AuctionFinished', (ev) => {
        id = ev.auctionId;
        return true;
      });
      assert.equal(id, 1, "id from event")
      assert.equal(await erc721.ownerOf(erc721TokenId1), buyer); // after mint owner is testAuctionHouse
    })

    it("721<->20", async () => {
      const sellAsset = await prepareERC721()
      const buyAssetType = await prepareERC20()
      let auctionFees = [];
      let dataV1 = await encDataV1([[], auctionFees, 1000, 0, 18]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(sellAsset, buyAssetType, 1, 9, V1, dataV1, { from: seller });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after mint owner is testAuctionHouse
      //bid initialize
      let auctionId = 1;
      let bidFees = [[accounts[6], 1500], [accounts[7], 3500]];
      let bidDataV1 = await bidEncDataV1([[], bidFees]);

      let bid = { amount: 10, dataType: V1, data: bidDataV1 };
      await testAuctionHouse.putBid(auctionId, bid, { from: buyer });
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 14);
      assert.equal(await erc20Token.balanceOf(buyer), 86);
      await increaseTime(1075); //increase ~18 min
      await testAuctionHouse.finishAuction(auctionId, { from: accounts[0] });
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 0);
      assert.equal(await erc20Token.balanceOf(seller), 10);
      assert.equal(await erc721.ownerOf(erc721TokenId1), buyer); // after mint owner is testAuctionHouse
    })

    it("721<->1155", async () => {
      const sellAsset = await prepareERC721()
      const buyAssetType = await prepareERC1155Buy(buyer, 200)
      let auctionFees = [[accounts[6], 1000], [accounts[7], 2000]];

      let dataV1 = await encDataV1([[], auctionFees, 1000, 0, 180]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(sellAsset, buyAssetType, 1, 90, V1, dataV1, { from: seller });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address);
      //bid initialize
      let auctionId = 1;
      let bidFees = [];
      let bidDataV1 = await bidEncDataV1([[], bidFees]);
      let bid = { amount: 100, dataType: V1, data: bidDataV1 };
      await testAuctionHouse.putBid(auctionId, bid, { from: buyer });
      assert.equal(await erc1155.balanceOf(testAuctionHouse.address, erc1155TokenId1), 103);
      assert.equal(await erc1155.balanceOf(buyer, erc1155TokenId1), 97);
      await increaseTime(1075);
      await testAuctionHouse.finishAuction(auctionId, { from: accounts[0] });
      assert.equal(await erc1155.balanceOf(testAuctionHouse.address, erc1155TokenId1), 0);
      assert.equal(await erc1155.balanceOf(seller, erc1155TokenId1), 67);
      assert.equal(await erc1155.balanceOf(accounts[6], erc1155TokenId1), 10);
      assert.equal(await erc1155.balanceOf(accounts[7], erc1155TokenId1), 20);
      assert.equal(await erc1155.balanceOf(protocol, erc1155TokenId1), 6);
      assert.equal(await erc721.ownerOf(erc721TokenId1), buyer); // after mint owner is testAuctionHouse
    })

    it("721<->ETH", async () => {
      const sellAsset = await prepareERC721()
      const buyAssetType = await prepareETH()
      let auctionFees = [[accounts[6], 1000], [accounts[7], 2000]];

      let dataV1 = await encDataV1([[], auctionFees, 1000, 0, 180]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(sellAsset, buyAssetType, 1, 90, V1, dataV1, { from: seller });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address);
      //bid initialize
      let auctionId = 1;
      let bidFees = [];
      let bidDataV1 = await bidEncDataV1([[], bidFees]);
      let bid = { amount: 100, dataType: V1, data: bidDataV1 };
      await verifyBalanceChange(buyer, 103, async () =>
        verifyBalanceChange(testAuctionHouse.address, -103, async () =>
          testAuctionHouse.putBid(auctionId, bid, { from: buyer, value: 150, gasPrice: 0 })
        )
      )
      await increaseTime(1075);
      await verifyBalanceChange(testAuctionHouse.address, 103, async () =>
        verifyBalanceChange(seller, -67, async () =>
          verifyBalanceChange(accounts[6], -10, async () =>
            verifyBalanceChange(accounts[7], -20, async () =>
              verifyBalanceChange(protocol, -6, async () =>
                testAuctionHouse.finishAuction(auctionId, { from: accounts[0] })
              )
            )
          )
        )
      )
      assert.equal(await erc721.ownerOf(erc721TokenId1), buyer);
    })

    it("1155<->20", async () => {
      const sellAsset = await prepareERC1155Sell()
      const buyAssetType = await prepareERC20(buyer, 1000)
      let auctionFees = [];

      let dataV1 = await encDataV1([[], auctionFees, 1000, 0, 180]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(sellAsset, buyAssetType, 1, 100, V1, dataV1, { from: seller });
      assert.equal(await erc1155.balanceOf(testAuctionHouse.address, erc1155TokenId1), 100);
      //bid initialize
      let auctionId = 1;
      let bidFees = [[accounts[6], 1000], [accounts[7], 2000]];
      let bidDataV1 = await bidEncDataV1([[], bidFees]);
      let bid = { amount: 100, dataType: V1, data: bidDataV1 };
      await testAuctionHouse.putBid(auctionId, bid, { from: buyer });
      assert.equal(await erc1155.balanceOf(testAuctionHouse.address, erc1155TokenId1), 100);
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 133);
      assert.equal(await erc20Token.balanceOf(buyer), 867);
      await increaseTime(1075);
      await testAuctionHouse.finishAuction(auctionId, { from: accounts[0] });
      assert.equal(await erc1155.balanceOf(testAuctionHouse.address, erc1155TokenId1), 0);
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 0);
      assert.equal(await erc1155.balanceOf(buyer, erc1155TokenId1), 100);

      assert.equal(await erc20Token.balanceOf(protocol), 6);
      assert.equal(await erc20Token.balanceOf(seller), 97);
      assert.equal(await erc20Token.balanceOf(accounts[6]), 10);
      assert.equal(await erc20Token.balanceOf(accounts[7]), 20);

    })

    it("No bid , after cancel auction return 721", async () => {
      const sellAsset = await prepareERC721()
      const buyAssetType = await prepareERC20()
      let auctionFees = [[accounts[3], 100]];
      let dataV1 = await encDataV1([[], auctionFees, 1000, 0, 18]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(sellAsset, buyAssetType, 1, 9, V1, dataV1, { from: seller });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after mint owner is testAuctionHouse
      let auctionId = 1;
      const tx = await testAuctionHouse.cancel(auctionId, { from: seller });
      let id;
      truffleAssert.eventEmitted(tx, 'AuctionCancelled', (ev) => {
        id = ev.auctionId;
        return true;
      });
      assert.equal(id, 1, "id canceled")
      assert.equal(await erc721.ownerOf(erc721TokenId1), seller); // after mint owner is testAuctionHouse
    })

    it("can't cancel auction with bid", async () => {
      const sellAsset = await prepareERC721()
      const buyAssetType = await prepareERC20()
      let auctionFees = [[accounts[3], 100], [accounts[4], 300]];
      let dataV1 = await encDataV1([[], auctionFees, 1000, 0, 18]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(sellAsset, buyAssetType, 1, 9, V1, dataV1, { from: seller });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after mint owner is testAuctionHouse
      //bid initialize
      let auctionId = 1;
      let bidFees = [[accounts[6], 1500], [accounts[7], 3500]];
      let bidDataV1 = await bidEncDataV1([[], bidFees]);
      let bid = { amount: 10, dataType: V1, data: bidDataV1 };
      await testAuctionHouse.putBid(auctionId, bid, { from: buyer });
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 14);
      assert.equal(await erc20Token.balanceOf(buyer), 86);

      await truffleAssert.fails(
        testAuctionHouse.cancel(auctionId, { from: seller }),
        truffleAssert.ErrorType.REVERT,
        "can't cancel auction with bid"
      )

      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 14);
      assert.equal(await erc20Token.balanceOf(seller), 0);
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after mint owner is testAuctionHouse
    })

    it("should correctly process case with multiple erc20 auctions", async () => {
      await testAuctionHouse.setProtocolFee(0)

      const sellAsset = await prepareERC721()
      const buyAssetType = await prepareERC20(buyer, 1000)
      let dataV1 = await encDataV1([[], [], 1000, 0, 0]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(sellAsset, buyAssetType, 1, 9, V1, dataV1, { from: seller });
      //bid initialize
      const auctionId1 = 1;
      let bidDataV1 = await bidEncDataV1([[], []]);
      let bid = { amount: 100, dataType: V1, data: bidDataV1 };
      await testAuctionHouse.putBid(auctionId1, bid, { from: buyer });

      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 100, "erc20 balance auction");
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address, "erc721 balance auction");

      const seller2 = accounts[5]
      const erc721TokenId2 = 555;
      const sellAsset2 = await prepareERC721(seller2, erc721TokenId2, false)
      const auctionId2 = 2;
      const buyer2 = accounts[6]
      const buyAssetType2 = await prepareERC20(buyer2, 1000, false)
      await testAuctionHouse.startAuction(sellAsset2, buyAssetType2, 1, 9, V1, dataV1, { from: seller2 });

      let bid2 = { amount: 200, dataType: V1, data: bidDataV1 };
      await testAuctionHouse.putBid(auctionId2, bid2, { from: buyer2 });

      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 300, "erc20 balance auction");
      assert.equal(await erc721.ownerOf(erc721TokenId2), testAuctionHouse.address, "erc721 balance auction");

      await increaseTime(1001);

      await testAuctionHouse.finishAuction(auctionId1, { from: accounts[0] });
      assert.equal(await erc721.ownerOf(erc721TokenId1), buyer, "erc721 balance buyer");
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 200, "erc20 balance auction");
      assert.equal(await erc20Token.balanceOf(seller), 100, "erc20 balance seller");

      await testAuctionHouse.finishAuction(auctionId2, { from: accounts[0] });
      assert.equal(await erc721.ownerOf(erc721TokenId2), buyer2, "erc721 balance buyer");
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 0, "erc20 balance auction");
      assert.equal(await erc20Token.balanceOf(seller2), 200, "erc20 balance seller");
    })
  })

  describe("wrapper", () => {
    it("wrapper bid and finilize work correctly ", async () => {
      const wrapper = await Wrapper.new(testAuctionHouse.address)
      const sellAsset = await prepareERC721()
      const buyAssetType = await prepareETH()
      const auctionId = 1;
      let dataV1 = await encDataV1([[], [], 1000, 0, 0]);

      await testAuctionHouse.setProtocolFee(0)

      assert.equal(await wrapper.auctionIdMatchesToken(auctionId, erc721.address, erc721TokenId1), false, "auctionIdMatchesToken before creation")
      assert.equal(await wrapper.isFinalized(auctionId), true, "isFinalized before creation")

      await testAuctionHouse.startAuction(sellAsset, buyAssetType, 10, 100, V1, dataV1, { from: seller });

      assert.equal(await wrapper.auctionIdMatchesToken(auctionId, erc721.address, erc721TokenId1), true, "auctionIdMatchesToken after creation")
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address);
      assert.equal(await wrapper.getMinimumBid(auctionId), 100, "get first minimal bid")
      assert.equal(await wrapper.getCurrentHighestBidder(auctionId), zeroAddress, "getCurrentHighestBidder before first bid")
      assert.equal(await wrapper.isFinalized(auctionId), false, "isFinalized after creation")

      //deploy party bid
      const partyBid = await PartyBidTest.new(wrapper.address, erc721.address, erc721TokenId1, auctionId)

      await partyBid.contribute({from: accounts[2], value: 50})
      assert.equal((await web3.eth.getBalance(partyBid.address)).toString(), "50", "balance after 1 contribution")
      
      await partyBid.contribute({from: accounts[3], value: 50})
      assert.equal((await web3.eth.getBalance(partyBid.address)).toString(), "100", "balance after 2 contribution")

      const txBid = await partyBid.bid()
      assert.equal((await web3.eth.getBalance(partyBid.address)).toString(), "0", "party bidbalance after bid contribution")
      assert.equal((await web3.eth.getBalance(testAuctionHouse.address)).toString(), "100", "auction balance after bid contribution")
      assert.equal(await wrapper.getMinimumBid(auctionId), 110, "get second minimal bid")
      assert.equal(await wrapper.getCurrentHighestBidder(auctionId), partyBid.address, "getCurrentHighestBidder after bid")
      assert.equal(await wrapper.isFinalized(auctionId), false, "isFinalized after bid")

      const BidPlaced = (await testAuctionHouse.getPastEvents("BidPlaced", {
        fromBlock: txBid.receipt.blockNumber,
        toBlock: txBid.receipt.blockNumber
      }))[0].args;

      assert.equal(BidPlaced.auctionId.toString(), "1", "correct auctionId")
      assert.equal(BidPlaced.buyer, partyBid.address, "correct buyer")
      assert.equal(BidPlaced.bid.amount, 100, "correct amount")

      await increaseTime(1001);

      const txFin = await partyBid.finalize()

      const AuctionFinished = (await testAuctionHouse.getPastEvents("AuctionFinished", {
        fromBlock: txFin.receipt.blockNumber,
        toBlock: txFin.receipt.blockNumber
      }))[0].args;
      assert.equal(AuctionFinished.auctionId, 1, "auction id")

      assert.equal(await erc721.ownerOf(erc721TokenId1), partyBid.address, "nft goes to partBid");
      assert.equal(await wrapper.auctionIdMatchesToken(auctionId, erc721.address, erc721TokenId1), false, "auctionIdMatchesToken after finilization")
      assert.equal(await wrapper.getCurrentHighestBidder(auctionId), zeroAddress, "getCurrentHighestBidder before after finilization")
      assert.equal(await wrapper.isFinalized(auctionId), true, "isFinalized after finilization")
    })
  })

  describe("security", () => {
    it("faulty eth-bidders should be processed correctly", async () => {
      const faultyBidder = await FaultyBidder.new();
      const addressToReturn = accounts[6]

      await testAuctionHouse.setProtocolFee(0)

      const sellAsset = await prepareERC721()
      const buyAssetType = await prepareETH()
      let dataV1 = await encDataV1([[], [], 1000, 0, 0]); //originFees, duration, startTime, buyOutPrice

      await truffleAssert.fails(
        faultyBidder.withdrawFaultyBid(testAuctionHouse.address, addressToReturn, {from: buyer, gasPrice: 0}),
        truffleAssert.ErrorType.REVERT,
        "nothing to withdraw"
      )
      await truffleAssert.fails(
        testAuctionHouse.withdrawFaultyBid(addressToReturn, {from: buyer, gasPrice: 0}),
        truffleAssert.ErrorType.REVERT,
        "nothing to withdraw"
      )

      await testAuctionHouse.startAuction(sellAsset, buyAssetType, 1, 90, V1, dataV1, { from: seller });
      //bid initialize
      let auctionId = 1;
      let bidDataV1 = await bidEncDataV1([[], []]);
      let bid = { amount: 100, dataType: V1, data: bidDataV1 };
      
      await verifyBalanceChange(buyer, 100, async () =>
        verifyBalanceChange(testAuctionHouse.address, -100, async () =>
          faultyBidder.faultyBid(testAuctionHouse.address, auctionId, bid, { from: buyer, value: 100, gasPrice: 0 })
        )
      )

      const buyer2 = accounts[5]
      bid.amount = 150;

      await verifyBalanceChange(buyer2, 150, async () =>
        verifyBalanceChange(testAuctionHouse.address, -150, async () =>
          verifyBalanceChange(buyer, 0, async () =>
            testAuctionHouse.putBid(auctionId, bid, { from: buyer2, value: 150, gasPrice: 0 })
          )
        )
      )

      await truffleAssert.fails(
        testAuctionHouse.withdrawFaultyBid(addressToReturn, {from: buyer, gasPrice: 0}),
        truffleAssert.ErrorType.REVERT,
        "nothing to withdraw"
      )

      await verifyBalanceChange(addressToReturn, -100, async () =>
        verifyBalanceChange(testAuctionHouse.address, 100, async () =>
          verifyBalanceChange(faultyBidder.address, 0, async () =>
            faultyBidder.withdrawFaultyBid(testAuctionHouse.address, addressToReturn, {from: buyer, gasPrice: 0})
          )
        )
      )
      
      await truffleAssert.fails(
        faultyBidder.withdrawFaultyBid(testAuctionHouse.address, addressToReturn, {from: buyer, gasPrice: 0}),
        truffleAssert.ErrorType.REVERT,
        "nothing to withdraw"
      )
      await truffleAssert.fails(
        testAuctionHouse.withdrawFaultyBid(addressToReturn, {from: buyer, gasPrice: 0}),
        truffleAssert.ErrorType.REVERT,
        "nothing to withdraw"
      )

    })

    it("numerous erc1155 auctions with same id should be processed correctly", async () => {
      await testAuctionHouse.setProtocolFee(0)

      const sellAsset = await prepareERC1155Sell()
      const buyAssetType = await prepareETH()

      let dataV1 = await encDataV1([[], [], 1000, 0, 0]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(sellAsset, buyAssetType, 1, 90, V1, dataV1, { from: seller });

      const seller2 = accounts[3]
      const sellAsset2 = await prepareERC1155Sell(seller2, 100, erc1155TokenId1, false)

      await truffleAssert.fails(
        testAuctionHouse.startAuction(sellAsset2, buyAssetType, 1, 90, V1, dataV1, { from: seller2 }),
        truffleAssert.ErrorType.REVERT,
        "auction already taking place"
      )

      await testAuctionHouse.cancel(1, { from: seller });

      await testAuctionHouse.startAuction(sellAsset2, buyAssetType, 1, 90, V1, dataV1, { from: seller2 })
    })
  })

  function encDataV1(tuple) {
    return testAuctionHouse.encode(tuple);
  }

  function bidEncDataV1(tuple) {
    return testAuctionHouse.encodeBid(tuple);
  }

  async function prepareERC721(user = seller, tokenId = erc721TokenId1, deployNew = true) {
    if (!!deployNew) {
      erc721 = await TestERC721.new("Rarible", "RARI", "https://ipfs.rarible.com");
    }
    await erc721.mint(user, tokenId);
    await erc721.setApprovalForAll(transferProxy.address, true, { from: user });
    return await Asset(ERC721, enc(erc721.address, tokenId), 1);
  }

  async function prepareERC1155Sell(user = seller, value = 100, tokenId = erc1155TokenId1, deployNew = true) {
    if (!!deployNew) {
      erc1155 = await TestERC1155.new("https://ipfs.rarible.com");
    }
    await erc1155.mint(user, tokenId, value);
    await erc1155.setApprovalForAll(transferProxy.address, true, { from: user });
    return await Asset(ERC1155, enc(erc1155.address, tokenId), value)
  }

  async function prepareERC1155Buy(user = buyer, value = 100, tokenId = erc1155TokenId1, deployNew = true) {
    if (!!deployNew) {
      erc1155 = await TestERC1155.new("https://ipfs.rarible.com");
    }
    await erc1155.mint(user, tokenId, value);
    await erc1155.setApprovalForAll(transferProxy.address, true, { from: user });
    return await AssetType(ERC1155, enc(erc1155.address, tokenId))
  }

  async function prepareERC20(user = buyer, value = 100, deployNew = true) {
    if (!!deployNew) {
      erc20Token = await TestERC20.new();
    }
    await erc20Token.mint(user, value);
    await erc20Token.approve(erc20TransferProxy.address, value, { from: user });
    return await AssetType(ERC20, enc(erc20Token.address))
  }

  async function prepareETH() {
    return await AssetType(ETH, "0x");
  }

  async function timeNow() {
    return await testAuctionHouse.timeNow.call();
  }

});
