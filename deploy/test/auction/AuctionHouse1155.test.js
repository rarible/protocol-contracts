const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const TestERC20 = artifacts.require("TestERC20.sol");
const TestERC1155 = artifacts.require("TestERC1155.sol");

const TransferProxy = artifacts.require("TransferProxy.sol");
const ERC20TransferProxy = artifacts.require("ERC20TransferProxy.sol");
const AuctionHouse1155 = artifacts.require("AuctionHouse1155");
const RoyaltiesRegistry = artifacts.require("RoyaltiesRegistry");

const FaultyBidder = artifacts.require("FaultyBidder");

const AuctionTestHelper = artifacts.require("AuctionTestHelper");

const truffleAssert = require('truffle-assertions');

const { verifyBalanceChange } = require("@daonomic/tests-common");
const { id } = require("../../../scripts/assets.js");

const { increaseTime } = require("@daonomic/tests-common");
const zeroAddress = "0x0000000000000000000000000000000000000000";

contract("AuctionHouse1155", accounts => {
  let royaltiesRegistry;
  let transferProxy;
  let erc20TransferProxy;
  let testAuctionHouse;
  let erc20Token;
  let erc1155;
  let helper;
  let auctionId = 0;

  const erc1155TokenId1 = 54;
  const protocol = accounts[9];
  const community = accounts[8];
  const V1 = id("V1")
  const seller = accounts[1];
  const buyer = accounts[2]

  before(async () => {
    //transfer proxes
    transferProxy = await TransferProxy.deployed();
    erc20TransferProxy = await ERC20TransferProxy.deployed();

    //royaltiesRegistry
    royaltiesRegistry = await RoyaltiesRegistry.deployed()

    /*Auction*/
    testAuctionHouse = await AuctionHouse1155.deployed();

    helper = await AuctionTestHelper.new()
  });

  beforeEach(async () => {
    await testAuctionHouse.changeMinimalDuration(900)
  });

  describe("creation", () => {
    it("duration works correctly", async () => {
      const sellAsset = await prepareERC1155Sell();
      const buyAssetType = await prepareETH();

      let auctionFees = await OriginFee(accounts[3], 100);

      //checking default minimal duration
      assert.equal(await testAuctionHouse.minimalDuration(), 900, "default minimal duration")

      //trying duration = 899 (slightly less than 15 mins)
      let dataV1 = await encDataV1([auctionFees, 899, 0, 100]);
      await truffleAssert.fails(
        testAuctionHouse.startAuction(...sellAsset, buyAssetType, 90, V1, dataV1, { from: seller }),
        truffleAssert.ErrorType.REVERT,
        "incorrect duration"
      )

      //trying duration = 86400001 (slightly more than 1000days)
      dataV1 = await encDataV1([auctionFees, 86400001, 0, 100])
      await truffleAssert.fails(
        testAuctionHouse.startAuction(...sellAsset, buyAssetType, 90, V1, dataV1, { from: seller }),
        truffleAssert.ErrorType.REVERT,
        "incorrect duration"
      )

      //trying maxx duration 86400000
      dataV1 = await encDataV1([auctionFees, 86400000, 0, 100])
      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 90, V1, dataV1, { from: seller })
      const txCancel = await testAuctionHouse.cancel(1, { from: seller });
      console.log("txCancel", txCancel.receipt.gasUsed)

      let auctionId;
      truffleAssert.eventEmitted(txCancel, 'AuctionCancelled', (ev) => {
        auctionId = ev.auctionId;
        return true;
      });
      assert.equal(auctionId, 1, "cancel event correct")

      // changing duration not from owner results in error
      await truffleAssert.fails(
        testAuctionHouse.changeMinimalDuration(0, { from: seller }),
        truffleAssert.ErrorType.REVERT,
        "Ownable: caller is not the owner"
      )

      //changing minimal duration to 0
      const changeDurationTx = await testAuctionHouse.changeMinimalDuration(0)
      truffleAssert.eventEmitted(changeDurationTx, 'MinimalDurationChanged', (ev) => {
        assert.equal(ev.oldValue, 900, "old minimal duration from event")
        assert.equal(ev.newValue, 0, "new minimal duration from event")
        return true;
      });
      assert.equal(await testAuctionHouse.minimalDuration(), 0, "minimal duration changed to 0")

      dataV1 = await encDataV1([auctionFees, 0, 0, 100])
      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 90, V1, dataV1, { from: seller })

    })

  });

  describe("bid/buyout auction", () => {
    it("should create auction:1155<->20, put bid, value = 100, then value = 200", async () => {
      const sellAsset = await prepareERC1155Sell()
      const buyAssetType = await prepareERC20(buyer, 1000)
      let auctionFees = await OriginFee(accounts[3], 400);
      let dataV1 = await encDataV1([auctionFees, 1000, 0, 0]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 9, V1, dataV1, { from: seller });
      //bid initialize
      let auctionId = await getAuctionId();
      let bidFees = await OriginFee(accounts[6], 200);
      let bidDataV1 = await bidEncDataV1([bidFees]);
      //let bid = { amount: 100, dataType: V1, data: bidDataV1 };
      await testAuctionHouse.putBid(auctionId, Bid(100, V1, bidDataV1), { from: buyer });
      assert.equal((await erc20Token.balanceOf(testAuctionHouse.address)).toString(), "100");
      assert.equal(await erc1155.balanceOf(testAuctionHouse.address, erc1155TokenId1), 100);


      await prepareERC20(accounts[3], 1000, false)

      bid = { amount: 200, dataType: V1, data: bidDataV1 };
      const txBid = await testAuctionHouse.putBid(auctionId, bid, { from: accounts[3] });
      console.log("txBid", txBid.receipt.gasUsed)

      let id;
      truffleAssert.eventEmitted(txBid, 'BidPlaced', (ev) => {
        //console.log(ev)
        id = ev.auctionId;
        return true;
      });
      assert.equal(id, auctionId, "id from event")

      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 200);
      assert.equal(await erc20Token.balanceOf(buyer), 1000);
      assert.equal(await erc20Token.balanceOf(accounts[3]), 800);
      assert.equal(await erc1155.balanceOf(testAuctionHouse.address, erc1155TokenId1), 100);

    })

    it("should correctly work if protocolFee changes", async () => {
      const sellAsset = await prepareERC1155Sell();
      const buyAssetType = await prepareERC20()

      assert.equal(await erc1155.balanceOf(seller, erc1155TokenId1), 100);

      let auctionFees = await OriginFee();
      let dataV1 = await encDataV1([auctionFees, 1000, 0, 18]); //originFees, duration, startTime, buyOutPrice

      const txStart = await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 9, V1, dataV1, { from: seller });
      assert.equal(await erc1155.balanceOf(testAuctionHouse.address, erc1155TokenId1), 100); // after mint owner is testAuctionHouse
      console.log("txStart", txStart.receipt.gasUsed)

      let auctionId = await getAuctionId();

      let id;
      truffleAssert.eventEmitted(txStart, 'AuctionCreated', (ev) => {
        id = ev.auctionId;
        return true;
      });
      assert.equal(id, auctionId, "id from event")

      //bid initialize

      let bidFees = await OriginFee(accounts[6], 400);
      let bidDataV1 = await bidEncDataV1([bidFees]);
      let bid = { amount: 10, dataType: V1, data: bidDataV1 };
      await testAuctionHouse.putBid(auctionId, bid, { from: buyer });
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 10);

      await prepareERC20(accounts[7], 100, false)
      bid = { amount: 100, dataType: V1, data: bidDataV1 };
      const txBuyOut = await testAuctionHouse.putBid(auctionId, bid, { from: accounts[7] });
      console.log("txBuyOut", txBuyOut.receipt.gasUsed)

      truffleAssert.eventEmitted(txBuyOut, 'AuctionFinished', (ev) => {
        id = ev.auctionId;
        return true;
      });
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 0);
      assert.equal(await erc20Token.balanceOf(buyer), 100);
      assert.equal(await erc20Token.balanceOf(accounts[6]), 4);
      assert.equal(await erc20Token.balanceOf(accounts[7]), 0);
      assert.equal(await erc20Token.balanceOf(seller), 93);
      assert.equal(await erc20Token.balanceOf(protocol), 3);
      assert.equal(await erc1155.balanceOf(accounts[7], erc1155TokenId1), 100);

      await erc1155.setApprovalForAll(transferProxy.address, true, { from: accounts[7] });
      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 9, V1, dataV1, { from: accounts[7] });
      await erc20Token.approve(erc20TransferProxy.address, 100, { from: buyer });
      await testAuctionHouse.putBid(await getAuctionId(), bid, { from: buyer });
      assert.equal(await erc1155.balanceOf(buyer, erc1155TokenId1), 100);
      assert.equal(await erc1155.balanceOf(buyer, erc1155TokenId1), 100);

      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 0);
      assert.equal(await erc20Token.balanceOf(buyer), 0);
      assert.equal(await erc20Token.balanceOf(accounts[7]), 91);
      assert.equal(await erc20Token.balanceOf(accounts[6]), 8);
      assert.equal(await erc20Token.balanceOf(protocol), 8);
    })

    it("should create auction:1155<->ETH, buyout with value = 100", async () => {
      const sellAsset = await prepareERC1155Sell()
      const buyAssetType = await prepareETH()
      await royaltiesRegistry.setRoyaltiesByToken(erc1155.address, [[community, 1000]])
      let auctionFees = await OriginFee();
      let dataV1 = await encDataV1([auctionFees, 1000, 0, 100]); //originFees, duration, startTime, buyOutPrice
      let auctionId = await getAuctionId() + 1;

      assert.equal(await testAuctionHouse.checkAuctionExistence(auctionId), false, "auction doesn't exist before creation")

      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 90, V1, dataV1, { from: seller });

      assert.equal(await testAuctionHouse.checkAuctionExistence(auctionId), true, "auction exists after creation")

      //bid initialize
      let bidFees = await OriginFee();
      let bidDataV1 = await bidEncDataV1([bidFees]);
      let bid = { amount: 100, dataType: V1, data: bidDataV1 };
      await verifyBalanceChange(buyer, 100, async () =>
        verifyBalanceChange(testAuctionHouse.address, 0, async () =>
          verifyBalanceChange(seller, -87, async () =>
            verifyBalanceChange(protocol, -3, async () =>
              verifyBalanceChange(community, -10, async () =>
                testAuctionHouse.putBid(auctionId, bid, { from: buyer, value: 200, gasPrice: 0 })
              )
            )
          )
        )
      )
      assert.equal(await erc1155.balanceOf(buyer, erc1155TokenId1), 100); // after new owner 1155

      assert.equal(await testAuctionHouse.checkAuctionExistence(auctionId), false, "auction auction doesn't exist after finishing")

    })

    it("No bid: 1155<->20, buyOut works, good!", async () => {
      const sellAsset = await prepareERC1155Sell()
      const buyAssetType = await prepareERC20(buyer, 200)
      let auctionFees = await OriginFee(accounts[3], 700);

      let dataV1 = await encDataV1([auctionFees, 1000, 0, 100]); //originFees, duration, startTime, buyOutPrice
      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 90, V1, dataV1, { from: seller });
      assert.equal(await erc1155.balanceOf(testAuctionHouse.address, erc1155TokenId1), 100); // after mint owner is testAuctionHouse

      let auctionId = await getAuctionId();
      let bidFees = await OriginFee();
      let bidDataV1 = await bidEncDataV1([bidFees]);
      let bid = { amount: 100, dataType: V1, data: bidDataV1 };
      await testAuctionHouse.buyOut(auctionId, bid, { from: buyer });
      assert.equal(await erc1155.balanceOf(buyer, erc1155TokenId1), 100); // after payOut owner is mr. payOut
      assert.equal(await erc20Token.balanceOf(seller), 90);
      assert.equal(await erc20Token.balanceOf(accounts[3]), 7);
      assert.equal(await erc20Token.balanceOf(protocol), 3);
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 0);
    })

    it("Put bid:1155<->20, buyOut works, good! ", async () => {
      const sellAsset = await prepareERC1155Sell()
      const buyAssetType = await prepareERC20()
      let auctionFees = await OriginFee(accounts[3], 700);
      let dataV1 = await encDataV1([auctionFees, 1000, 0, 100]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 90, V1, dataV1, { from: seller });
      assert.equal(await erc1155.balanceOf(testAuctionHouse.address, erc1155TokenId1), 100); // after mint owner is testAuctionHouse
      //bid initialize
      let auctionId = await getAuctionId();
      let bidFees = await OriginFee();
      let bidDataV1 = await bidEncDataV1([bidFees]);
      let bid = { amount: 95, dataType: V1, data: bidDataV1 };
      let resultPutBid = await testAuctionHouse.putBid(auctionId, bid, { from: buyer });
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 95);
      assert.equal(await erc20Token.balanceOf(buyer), 5);

      await prepareERC20(accounts[4], 1000, false)
      bid = { amount: 100, dataType: V1, data: bidDataV1 };
      let resultPayOutAuction = await testAuctionHouse.buyOut(auctionId, bid, { from: accounts[4] }); //accounts[4] buyOut
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 0);
      assert.equal(await erc20Token.balanceOf(seller), 90);  //NFTAuctionInitiator get buyOut value - fee protocol - fee
      assert.equal(await erc20Token.balanceOf(accounts[3]), 7);  //to fee
      assert.equal(await erc20Token.balanceOf(protocol), 3);  //to protocol
      assert.equal(await erc20Token.balanceOf(buyer), 100); //first pitBidder, return all ERC20
      assert.equal(await erc20Token.balanceOf(accounts[4]), 900);
      assert.equal(await erc1155.balanceOf(accounts[4], erc1155TokenId1), 100);
    })

    it("No bid:1155<->ETH, payOut works, good!", async () => {
      const sellAsset = await prepareERC1155Sell()
      const buyAssetType = await prepareETH()
      let auctionFees = await OriginFee(accounts[3], 700);
      let dataV1 = await encDataV1([auctionFees, 1000, 0, 100]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 90, V1, dataV1, { from: seller });
      //bid initialize
      let auctionId = await getAuctionId();
      let bidFees = await OriginFee();
      let bidDataV1 = await bidEncDataV1([bidFees]);
      let bid = { amount: 100, dataType: V1, data: bidDataV1 };
      await verifyBalanceChange(buyer, 100, async () =>
        verifyBalanceChange(seller, -90, async () =>
          verifyBalanceChange(accounts[3], -7, async () =>
            verifyBalanceChange(protocol, -3, async () =>
              testAuctionHouse.buyOut(auctionId, bid, { from: buyer, value: 200, gasPrice: 0 })
            )
          )
        )
      )
      assert.equal(await erc1155.balanceOf(buyer, erc1155TokenId1), 100); // after payOut owner is mr. payOut
    })

    it("should correctly extend time of an auction ", async () => {
      const sellAsset = await prepareERC1155Sell()
      const buyAssetType = await prepareETH()

      const duration = 1000;
      const extension = 900;

      const dataV1 = await encDataV1([await OriginFee(), duration, 0, 100]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 90, V1, dataV1, { from: seller });
      const auctionId = await getAuctionId();
      const bidDataV1 = await bidEncDataV1([await OriginFee()]);
      const bid1 = { amount: 90, dataType: V1, data: bidDataV1 };

      const txBid1 = await helper.putBidTime(testAuctionHouse.address, auctionId, bid1, { from: buyer, value: 90, gasPrice: 0 })

      const BidPlaced1 = await testAuctionHouse.getPastEvents("BidPlaced", {
        fromBlock: txBid1.receipt.blockNumber,
        toBlock: txBid1.receipt.blockNumber
      });
      const endTime1 = BidPlaced1[0].returnValues.endTime;

      let now1;
      truffleAssert.eventEmitted(txBid1, 'timeStamp', (ev) => {
        now1 = ev.time;
        return true;
      });
      assert.equal(endTime1, now1.toNumber() + duration, "endTime set correctly 1")
      await increaseTime(901);

      const helper2 = await AuctionTestHelper.new()
      const bid2 = { amount: 91, dataType: V1, data: bidDataV1 };
      const txBid2 = await helper2.putBidTime(testAuctionHouse.address, auctionId, bid2, { from: accounts[3], value: 91, gasPrice: 0 })
      const BidPlaced2 = await testAuctionHouse.getPastEvents("BidPlaced", {
        fromBlock: txBid2.receipt.blockNumber,
        toBlock: txBid2.receipt.blockNumber
      });
      const endTime2 = BidPlaced2[0].returnValues.endTime;

      let now2;
      truffleAssert.eventEmitted(txBid2, 'timeStamp', (ev) => {
        now2 = ev.time;
        return true;
      });
      assert.equal(endTime2, now2.toNumber() + extension, "endTime set correctly 2")
    })
  })

  describe("finish/cancel auction", () => {
    it("No bid, can't finish auction that is not started, canceled instaed ", async () => {
      const sellAsset = await prepareERC1155Sell()
      const buyAssetType = await prepareERC20()
      let auctionFees = await OriginFee();
      let startTime = await timeNow(); //define start time
      startTime = startTime + 100; //auction will start after 100 sec
      let dataV1 = await encDataV1([auctionFees, 1000, startTime, 18]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 9, V1, dataV1, { from: seller });
      assert.equal(await erc1155.balanceOf(testAuctionHouse.address, erc1155TokenId1), 100); // after start owner is testAuctionHouse
      let auctionId = await getAuctionId();
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
      assert.equal(await erc1155.balanceOf(seller, erc1155TokenId1), 100);

    })

    it("should correctly finish auction with 1 bid and past endTime", async () => {
      const sellAsset = await prepareERC1155Sell()
      const buyAssetType = await prepareERC20()
      let auctionFees = await OriginFee(accounts[3], 100);
      let dataV1 = await encDataV1([auctionFees, 900, 0, 18]); //originFees, duration, startTime, buyOutPrice
      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 9, V1, dataV1, { from: seller });
      assert.equal(await erc1155.balanceOf(testAuctionHouse.address, erc1155TokenId1), 100); // after mint owner is testAuctionHouse
      let auctionId = await getAuctionId();

      let bidDataV1 = await bidEncDataV1([await OriginFee()]);
      let bid = { amount: 10, dataType: V1, data: bidDataV1 };
      await testAuctionHouse.putBid(auctionId, bid, { from: buyer });

      await increaseTime(901); //increase ~18 min

      const txFinish = await testAuctionHouse.finishAuction(auctionId, { from: accounts[0] });
      console.log("txFinish", txFinish.receipt.gasUsed)

      let id;
      truffleAssert.eventEmitted(txFinish, 'AuctionFinished', (ev) => {
        id = ev.auctionId;
        return true;
      });
      assert.equal(id, auctionId, "id from event")
      assert.equal(await erc1155.balanceOf(buyer, erc1155TokenId1), 100); // after mint owner is testAuctionHouse
    })

    it("should correctly finish auction with 1 bid and past endTime, minimal duration = 10", async () => {
      const sellAsset = await prepareERC1155Sell()
      const buyAssetType = await prepareERC20()

      await testAuctionHouse.changeMinimalDuration(10)

      let auctionFees = await OriginFee(accounts[3], 100);
      let dataV1 = await encDataV1([auctionFees, 0, 0, 18]); //originFees, duration, startTime, buyOutPrice

      await truffleAssert.fails(
        testAuctionHouse.startAuction(...sellAsset, buyAssetType, 9, V1, dataV1, { from: seller }),
        truffleAssert.ErrorType.REVERT,
        "incorrect duration"
      )

      dataV1 = await encDataV1([auctionFees, 10, 0, 18]);

      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 9, V1, dataV1, { from: seller });
      assert.equal(await erc1155.balanceOf(testAuctionHouse.address, erc1155TokenId1), 100); // after mint owner is testAuctionHouse
      let auctionId = await getAuctionId();

      let bidDataV1 = await bidEncDataV1([await OriginFee()]);
      let bid = { amount: 10, dataType: V1, data: bidDataV1 };
      let txBid = await testAuctionHouse.putBid(auctionId, bid, { from: buyer });

      let endTime;
      truffleAssert.eventEmitted(txBid, 'BidPlaced', (ev) => {
        endTime = ev.endTime;
        return true;
      });
      let curTime = await timeNow()
      assert.equal(curTime.toNumber() + 10, endTime, "correct endTime")

      await prepareERC20(accounts[3], 100, false)

      await increaseTime(5);

      bid = { amount: 15, dataType: V1, data: bidDataV1 };
      txBid = await testAuctionHouse.putBid(auctionId, bid, { from: accounts[3] });
      truffleAssert.eventEmitted(txBid, 'BidPlaced', (ev) => {
        endTime = ev.endTime;
        return true;
      });
      curTime = await timeNow()
      assert.equal(curTime.toNumber() + 10, endTime, "correct endTime")

      await increaseTime(10);

      const txFinish = await testAuctionHouse.finishAuction(auctionId, { from: accounts[0] });
      let id;
      truffleAssert.eventEmitted(txFinish, 'AuctionFinished', (ev) => {
        id = ev.auctionId;
        return true;
      });
      assert.equal(id, auctionId, "id from event")
      assert.equal(await erc1155.balanceOf(accounts[3], erc1155TokenId1), 100);
    })

    it("should correctly finish auction with 1 bid and past endTime, minimal duration = 0", async () => {
      const sellAsset = await prepareERC1155Sell()
      const buyAssetType = await prepareERC20()

      await testAuctionHouse.changeMinimalDuration(0)

      let auctionFees = await OriginFee(accounts[3], 100);
      let dataV1 = await encDataV1([auctionFees, 0, 0, 18]); //originFees, duration, startTime, buyOutPrice
      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 9, V1, dataV1, { from: seller });
      assert.equal(await erc1155.balanceOf(testAuctionHouse.address, erc1155TokenId1), 100); // after mint owner is testAuctionHouse
      let auctionId = await getAuctionId();

      let bidDataV1 = await bidEncDataV1([await OriginFee()]);
      let bid = { amount: 10, dataType: V1, data: bidDataV1 };
      const txBid = await testAuctionHouse.putBid(auctionId, bid, { from: buyer });

      let endTime;
      truffleAssert.eventEmitted(txBid, 'BidPlaced', (ev) => {
        endTime = ev.endTime;
        return true;
      });
      const curTime = await timeNow()
      assert.equal(curTime.toNumber(), endTime.toNumber(), "correct endTime")

      const txFinish = await testAuctionHouse.finishAuction(auctionId, { from: accounts[0] });
      let id;
      truffleAssert.eventEmitted(txFinish, 'AuctionFinished', (ev) => {
        id = ev.auctionId;
        return true;
      });
      assert.equal(id, auctionId, "id from event")
      assert.equal(await erc1155.balanceOf(buyer, erc1155TokenId1), 100); // after mint owner is testAuctionHouse
    })

    it("1155<->20", async () => {
      const sellAsset = await prepareERC1155Sell()
      const buyAssetType = await prepareERC20()
      let auctionFees = await OriginFee();
      let dataV1 = await encDataV1([auctionFees, 1000, 0, 180]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 9, V1, dataV1, { from: seller });
      assert.equal(await erc1155.balanceOf(testAuctionHouse.address, erc1155TokenId1), 100); // after mint owner is testAuctionHouse
      //bid initialize
      let auctionId = await getAuctionId();
      let bidFees = await OriginFee(accounts[6], 600);
      let bidDataV1 = await bidEncDataV1([bidFees]);

      let bid = { amount: 100, dataType: V1, data: bidDataV1 };
      await testAuctionHouse.putBid(auctionId, bid, { from: buyer });
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 100);
      assert.equal(await erc20Token.balanceOf(buyer), 0);
      await increaseTime(1075); //increase ~18 min
      await testAuctionHouse.finishAuction(auctionId, { from: accounts[0] });
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 0);
      assert.equal(await erc20Token.balanceOf(seller), 91);
      assert.equal(await erc20Token.balanceOf(protocol), 3);
      assert.equal(await erc20Token.balanceOf(accounts[6]), 6);
      assert.equal(await erc1155.balanceOf(buyer, erc1155TokenId1), 100); // after mint owner is testAuctionHouse
    })

    it("1155<->ETH", async () => {
      const sellAsset = await prepareERC1155Sell()
      const buyAssetType = await prepareETH()
      let auctionFees = await OriginFee(accounts[6], 300);

      let dataV1 = await encDataV1([auctionFees, 1000, 0, 180]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 90, V1, dataV1, { from: seller });
      assert.equal(await erc1155.balanceOf(testAuctionHouse.address, erc1155TokenId1), 100);
      //bid initialize
      let auctionId = await getAuctionId();
      let bidFees = await OriginFee();
      let bidDataV1 = await bidEncDataV1([bidFees]);
      let bid = { amount: 100, dataType: V1, data: bidDataV1 };
      await verifyBalanceChange(buyer, 100, async () =>
        verifyBalanceChange(testAuctionHouse.address, -100, async () =>
          testAuctionHouse.putBid(auctionId, bid, { from: buyer, value: 150, gasPrice: 0 })
        )
      )
      await increaseTime(1075);
      await verifyBalanceChange(testAuctionHouse.address, 100, async () =>
        verifyBalanceChange(seller, -94, async () =>
          verifyBalanceChange(accounts[6], -3, async () =>
            verifyBalanceChange(protocol, -3, async () =>
              testAuctionHouse.finishAuction(auctionId, { from: accounts[0] })
            )
          )
        )
      )
      assert.equal(await erc1155.balanceOf(buyer, erc1155TokenId1), 100);
    })

    it("No bid , after cancel auction return 1155", async () => {
      const sellAsset = await prepareERC1155Sell()
      const buyAssetType = await prepareERC20()
      let auctionFees = await OriginFee(accounts[3], 100);
      let dataV1 = await encDataV1([auctionFees, 1000, 0, 18]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 9, V1, dataV1, { from: seller });
      assert.equal(await erc1155.balanceOf(testAuctionHouse.address, erc1155TokenId1), 100); // after mint owner is testAuctionHouse
      let auctionId = await getAuctionId();
      const tx = await testAuctionHouse.cancel(auctionId, { from: seller });
      let id;
      truffleAssert.eventEmitted(tx, 'AuctionCancelled', (ev) => {
        id = ev.auctionId;
        return true;
      });
      assert.equal(id, auctionId, "id canceled")
      assert.equal(await erc1155.balanceOf(seller, erc1155TokenId1), 100); // after mint owner is testAuctionHouse
    })

    it("can't cancel auction with bid", async () => {
      const sellAsset = await prepareERC1155Sell()
      const buyAssetType = await prepareERC20()
      let auctionFees = await OriginFee(accounts[3], 400);
      let dataV1 = await encDataV1([auctionFees, 1000, 0, 18]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 9, V1, dataV1, { from: seller });
      assert.equal(await erc1155.balanceOf(testAuctionHouse.address, erc1155TokenId1), 100); // after mint owner is testAuctionHouse
      //bid initialize
      let auctionId = await getAuctionId();
      let bidFees = await OriginFee(accounts[6], 200);
      let bidDataV1 = await bidEncDataV1([bidFees]);
      let bid = { amount: 10, dataType: V1, data: bidDataV1 };
      await testAuctionHouse.putBid(auctionId, bid, { from: buyer });
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 10);
      assert.equal(await erc20Token.balanceOf(buyer), 90);

      await truffleAssert.fails(
        testAuctionHouse.cancel(auctionId, { from: seller }),
        truffleAssert.ErrorType.REVERT,
        "can't cancel auction with bid"
      )

      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 10);
      assert.equal(await erc20Token.balanceOf(seller), 0);
      assert.equal(await erc1155.balanceOf(testAuctionHouse.address, erc1155TokenId1), 100); // after mint owner is testAuctionHouse
    })

    it("should correctly process case with multiple erc20 auctions", async () => {

      const sellAsset = await prepareERC1155Sell()
      const buyAssetType = await prepareERC20(buyer, 1000)
      let dataV1 = await encDataV1([await OriginFee(), 1000, 0, 0]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 9, V1, dataV1, { from: seller });
      //bid initialize
      const auctionId1 = await getAuctionId();
      let bidDataV1 = await bidEncDataV1([await OriginFee()]);
      let bid = { amount: 100, dataType: V1, data: bidDataV1 };
      await testAuctionHouse.putBid(auctionId1, bid, { from: buyer });

      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 100, "erc20 balance auction");
      assert.equal(await erc1155.balanceOf(testAuctionHouse.address, erc1155TokenId1), 100);

      const seller2 = accounts[5]
      const erc1155TokenId2 = 555;
      const sellAsset2 = await prepareERC1155Sell(seller2, 100, erc1155TokenId2, false)

      const buyer2 = accounts[6]
      const buyAssetType2 = await prepareERC20(buyer2, 1000, false)
      await testAuctionHouse.startAuction(...sellAsset2, buyAssetType2, 9, V1, dataV1, { from: seller2 });

      const auctionId2 = await getAuctionId();

      let bid2 = { amount: 200, dataType: V1, data: bidDataV1 };
      await testAuctionHouse.putBid(auctionId2, bid2, { from: buyer2 });

      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 300, "erc20 balance auction");
      assert.equal(await erc1155.balanceOf(testAuctionHouse.address, erc1155TokenId2), 100);

      await increaseTime(1001);

      await testAuctionHouse.finishAuction(auctionId1, { from: accounts[0] });
      assert.equal(await erc1155.balanceOf(buyer, erc1155TokenId1), 100);
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 200, "erc20 balance auction");
      assert.equal(await erc20Token.balanceOf(seller), 100, "erc20 balance seller");

      await testAuctionHouse.finishAuction(auctionId2, { from: accounts[0] });
      assert.equal(await erc1155.balanceOf(buyer2, erc1155TokenId2), 100);
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 0, "erc20 balance auction");
      assert.equal(await erc20Token.balanceOf(seller2), 200, "erc20 balance seller");
    })
  })

  describe("security", () => {
    it("faulty eth-bidders should be processed correctly", async () => {
      const faultyBidder = await FaultyBidder.new();
      const addressToReturn = accounts[6]

      const sellAsset = await prepareERC1155Sell()
      const buyAssetType = await prepareETH()
      let dataV1 = await encDataV1([await OriginFee(), 1000, 0, 0]); //originFees, duration, startTime, buyOutPrice

      await truffleAssert.fails(
        faultyBidder.withdrawFaultyBid(testAuctionHouse.address, addressToReturn, { from: buyer, gasPrice: 0 }),
        truffleAssert.ErrorType.REVERT,
        "nothing to withdraw"
      )
      await truffleAssert.fails(
        testAuctionHouse.withdrawFaultyBid(addressToReturn, { from: buyer, gasPrice: 0 }),
        truffleAssert.ErrorType.REVERT,
        "nothing to withdraw"
      )

      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 90, V1, dataV1, { from: seller });
      //bid initialize
      let auctionId = await getAuctionId();
      let bidDataV1 = await bidEncDataV1([await OriginFee()]);
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
        testAuctionHouse.withdrawFaultyBid(addressToReturn, { from: buyer, gasPrice: 0 }),
        truffleAssert.ErrorType.REVERT,
        "nothing to withdraw"
      )

      await verifyBalanceChange(addressToReturn, -100, async () =>
        verifyBalanceChange(testAuctionHouse.address, 100, async () =>
          verifyBalanceChange(faultyBidder.address, 0, async () =>
            faultyBidder.withdrawFaultyBid(testAuctionHouse.address, addressToReturn, { from: buyer, gasPrice: 0 })
          )
        )
      )

      await truffleAssert.fails(
        faultyBidder.withdrawFaultyBid(testAuctionHouse.address, addressToReturn, { from: buyer, gasPrice: 0 }),
        truffleAssert.ErrorType.REVERT,
        "nothing to withdraw"
      )
      await truffleAssert.fails(
        testAuctionHouse.withdrawFaultyBid(addressToReturn, { from: buyer, gasPrice: 0 }),
        truffleAssert.ErrorType.REVERT,
        "nothing to withdraw"
      )

    })

    it("MAX_FEE_BASE_POINT works correctly, auctions/bids with bigger fees can't be created", async () => {
      const sellAsset = await prepareERC1155Sell()
      const buyAssetType = await prepareERC20(buyer, 1000)

      //trying to create auction with 10% + 3% fees
      let dataV1 = await encDataV1([await OriginFee(accounts[5], 1000), 1000, 0, 101]); //originFees, duration, startTime, buyOutPrice
      await truffleAssert.fails(
        testAuctionHouse.startAuction(...sellAsset, buyAssetType, 9, V1, dataV1, { from: seller }),
        truffleAssert.ErrorType.REVERT,
        "wrong fees"
      )

      //trying to create auction with 8% + 3% fees
      dataV1 = await encDataV1([await OriginFee(accounts[5], 800), 1000, 0, 101]); //originFees, duration, startTime, buyOutPrice
      await truffleAssert.fails(
        testAuctionHouse.startAuction(...sellAsset, buyAssetType, 9, V1, dataV1, { from: seller }),
        truffleAssert.ErrorType.REVERT,
        "wrong fees"
      )
      
      // creating auction with 8% + 0% fees works
      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 9, V1, dataV1, { from: seller });

      const auctionId1 = await getAuctionId();
      // putting bid with 8% auc fees and 3% bid fees doesn't work
      let bid = { amount: 100, dataType: V1, data: (await bidEncDataV1([await OriginFee(accounts[6], 300)])) };
      await truffleAssert.fails(
        testAuctionHouse.putBid(auctionId1, bid, { from: buyer }),
        truffleAssert.ErrorType.REVERT,
        "wrong fees"
      )

      // putting bid with 8% auc fees and 2% bid fees works
      bid = { amount: 100, dataType: V1, data: (await bidEncDataV1([await OriginFee(accounts[6], 200)])) };
      await testAuctionHouse.putBid(auctionId1, bid, { from: buyer });

      // buyout with 8% + 3% fees doesn't work
      bid = { amount: 120, dataType: V1, data: (await bidEncDataV1([await OriginFee(accounts[6], 300)])) };
      await truffleAssert.fails(
        testAuctionHouse.buyOut(auctionId1, bid, { from: buyer }),
        truffleAssert.ErrorType.REVERT,
        "wrong fees"
      )

      // buyOut with 8% auc fees and 2% bid fees works
      bid = { amount: 120, dataType: V1, data: (await bidEncDataV1([await OriginFee(accounts[6], 200)])) };
      await testAuctionHouse.buyOut(auctionId1, bid, { from: buyer });

      assert.equal(await erc1155.balanceOf(buyer, erc1155TokenId1), 100, "nft went to buyer");
    })

  })

  function encDataV1(tuple) {
    return helper.encode(tuple);
  }

  function bidEncDataV1(tuple) {
    return helper.encodeBid(tuple);
  }

  async function OriginFee(account = zeroAddress, value = 0) {
    return await helper.encodeOriginFeeIntoUint(account, value);
  }

  async function prepareERC1155Sell(user = seller, value = 100, tokenId = erc1155TokenId1, deployNew = true) {
    if (!!deployNew) {
      erc1155 = await TestERC1155.new("https://ipfs.rarible.com");
    }
    await erc1155.mint(user, tokenId, value);
    await erc1155.setApprovalForAll(transferProxy.address, true, { from: user });
    return SellAsset(erc1155.address, value, tokenId)
  }

  async function prepareERC20(user = buyer, value = 100, deployNew = true) {
    if (!!deployNew) {
      erc20Token = await TestERC20.new();
    }
    await erc20Token.mint(user, value);
    await erc20Token.approve(erc20TransferProxy.address, value, { from: user });
    return erc20Token.address;
  }

  function Bid(amount, dataType, data) {
    return { amount, dataType, data }
  }

  function SellAsset(token, value, tokenId) {
    return [token, value, tokenId]
  }

  async function prepareETH() {
    return zeroAddress;
  }

  async function timeNow() {
    return await helper.timeNow.call();
  }

  async function getAuctionId() {
    return (await testAuctionHouse.auctionId()).toNumber() - 1;
  }

});
