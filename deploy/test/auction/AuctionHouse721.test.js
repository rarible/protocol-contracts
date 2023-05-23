const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const TestERC20 = artifacts.require("TestERC20.sol");
const TestERC721 = artifacts.require("TestERC721.sol");
const TransferProxy = artifacts.require("TransferProxy.sol");
const ERC20TransferProxy = artifacts.require("ERC20TransferProxy.sol");
const AuctionHouse721 = artifacts.require("AuctionHouse721");
const RoyaltiesRegistry = artifacts.require("RoyaltiesRegistry");

const Wrapper = artifacts.require("Wrapper");
const PartyBidTest = artifacts.require("PartyBidTest");
const FaultyBidder = artifacts.require("FaultyBidder");

const AuctionTestHelper = artifacts.require("AuctionTestHelper");

const truffleAssert = require('truffle-assertions');

const { verifyBalanceChangeReturnTx } = require("../../../scripts/balance")
const { id } = require("../../../scripts/assets.js");

const { increaseTime } = require("@daonomic/tests-common");
const zeroAddress = "0x0000000000000000000000000000000000000000";

contract("AuctionHouse721", accounts => {
  let royaltiesRegistry;
  let transferProxy;
  let erc20TransferProxy;
  let testAuctionHouse;
  let erc20Token;
  let erc721;
  let helper;

  const erc721TokenId1 = 53;
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
    testAuctionHouse = await AuctionHouse721.deployed();

    helper = await AuctionTestHelper.new()
  });

  beforeEach(async () => {
    await testAuctionHouse.changeMinimalDuration(900)
  });

  describe("creation", () => {
    it("duration works correctly", async () => {
      const sellAsset = await prepareERC721();
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
      console.log("txCancel topic", txCancel.receipt.gasUsed)

      const AuctionCancelled = await testAuctionHouse.getPastEvents("AuctionCancelled", {
        fromBlock: txCancel.receipt.blockNumber,
        toBlock: txCancel.receipt.blockNumber
      });
      console.log("AuctionCancelled", AuctionCancelled[0].raw.topics)

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

    it("getAuctionByToken works, auctionId iterates", async () => {
      const sellAsset = await prepareERC721();
      const buyAssetType = await prepareETH();

      let auctionFees = await OriginFee(accounts[3], 700);
      let dataV1 = await encDataV1([auctionFees, 1000, 0, 100]); //originFees, duration, startTime, buyOutPrice

      let resultStartAuction = await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 90, V1, dataV1, { from: seller });

      let auctionId;
      truffleAssert.eventEmitted(resultStartAuction, 'AuctionCreated', (ev) => {
        auctionId = ev.auctionId;
        return true;
      });

      assert.equal((await testAuctionHouse.getAuctionByToken(erc721.address, erc721TokenId1)).toString(), auctionId.toString(), "getAuctionByToken works");

      await testAuctionHouse.cancel(auctionId, { from: seller })
      assert.equal((await testAuctionHouse.getAuctionByToken(erc721.address, erc721TokenId1)).toString(), 0, "getAuctionByToken doesn't works after cancel");

      const tokenIdNew = 123;
      const sellAsset1 = await prepareERC721(seller, tokenIdNew);
      let resultStartAuction1 = await testAuctionHouse.startAuction(...sellAsset1, buyAssetType, 90, V1, dataV1, { from: seller });

      let auctionId1;
      truffleAssert.eventEmitted(resultStartAuction1, 'AuctionCreated', (ev) => {
        auctionId1 = ev.auctionId;
        return true;
      });
      assert.equal(auctionId1.toNumber(), auctionId.toNumber() + 1, "auction id iterates")
      assert.equal((await testAuctionHouse.getAuctionByToken(erc721.address, tokenIdNew)).toString(), auctionId1.toString(), "getAuctionByToken works");

    })

    //todo: do we need such tests?
    /*
    it("should not create auction to sell ERC20 or ETH", async () => {
      const buyAssetType = await prepareETH()
      let fees = await OriginFee();
      let dataV1 = await encDataV1([ fees, 1000, 500, 1]); //originFees, duration, startTime, buyOutPrice
      await expectThrow(
        testAuctionHouse.startAuction(Asset(ERC20, "0x", 100), buyAssetType, 1, V1, dataV1, { from: seller })
      );

      await expectThrow(
        testAuctionHouse.startAuction(Asset(ETH, "0x", 100), buyAssetType, 1, V1, dataV1, { from: seller })
      );
    })
    */

  });

  describe("bid/buyout auction", () => {
    it("should create auction:721<->20, put bid, value = 100, then value = 200", async () => {
      const sellAsset = await prepareERC721()
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
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address);

      await prepareERC20(accounts[3], 1000, false)

      bid = { amount: 200, dataType: V1, data: bidDataV1 };
      const txBid = await testAuctionHouse.putBid(auctionId, bid, { from: accounts[3] });
      console.log("txBid", txBid.receipt.gasUsed)
      const BidPlaced = await testAuctionHouse.getPastEvents("BidPlaced", {
        fromBlock: txBid.receipt.blockNumber,
        toBlock: txBid.receipt.blockNumber
      });
      console.log("BidPlaced topic", BidPlaced[0].raw.topics)

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
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address);

    })

    it("should correctly work if protocolFee changes", async () => {
      const sellAsset = await prepareERC721();
      const buyAssetType = await prepareERC20()

      assert.equal(await erc721.ownerOf(erc721TokenId1), seller); // after mint owner is testAuctionHouse

      let auctionFees = await OriginFee();
      let dataV1 = await encDataV1([auctionFees, 1000, 0, 18]); //originFees, duration, startTime, buyOutPrice

      const txStart = await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 9, V1, dataV1, { from: seller });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after mint owner is testAuctionHouse
      console.log("txStart", txStart.receipt.gasUsed)

      const AuctionCreated = await testAuctionHouse.getPastEvents("AuctionCreated", {
        fromBlock: txStart.receipt.blockNumber,
        toBlock: txStart.receipt.blockNumber
      });
      console.log("AuctionCreated topic", AuctionCreated[0].raw.topics)

      let id;
      truffleAssert.eventEmitted(txStart, 'AuctionCreated', (ev) => {
        id = ev.auctionId;
        return true;
      });
      assert.equal(id, await getAuctionId(), "id from event")

      //bid initialize
      let auctionId = await getAuctionId();
      let bidFees = await OriginFee(accounts[6], 400);
      let bidDataV1 = await bidEncDataV1([bidFees]);
      let bid = { amount: 10, dataType: V1, data: bidDataV1 };
      await testAuctionHouse.putBid(auctionId, bid, { from: buyer });
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 10);

      await prepareERC20(accounts[7], 100, false)
      bid = { amount: 100, dataType: V1, data: bidDataV1 };
      const txBuyOut = await testAuctionHouse.putBid(auctionId, bid, { from: accounts[7] });
      console.log("txBuyOut", txBuyOut.receipt.gasUsed)

      const AuctionBuyOut = await testAuctionHouse.getPastEvents("AuctionBuyOut", {
        fromBlock: txBuyOut.receipt.blockNumber,
        toBlock: txBuyOut.receipt.blockNumber
      });
      console.log("AuctionBuyOut topic", AuctionBuyOut[0].raw.topics)

      truffleAssert.eventEmitted(txBuyOut, 'AuctionFinished', (ev) => {
        id = ev.auctionId;
        return true;
      });
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 0);
      assert.equal(await erc20Token.balanceOf(buyer), 100);
      assert.equal(await erc20Token.balanceOf(accounts[6]), 4);
      assert.equal(await erc20Token.balanceOf(accounts[7]), 0);
      assert.equal(await erc20Token.balanceOf(seller), 96);
      assert.equal(await erc20Token.balanceOf(protocol), 0);
      assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[7]);

      await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[7] });
      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 9, V1, dataV1, { from: accounts[7] });
      await erc20Token.approve(erc20TransferProxy.address, 100, { from: buyer });
      await testAuctionHouse.putBid(await getAuctionId(), bid, { from: buyer });
      assert.equal(await erc721.ownerOf(erc721TokenId1), buyer);
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 0);
      assert.equal(await erc20Token.balanceOf(buyer), 0);
      assert.equal(await erc20Token.balanceOf(accounts[7]), 96);
      assert.equal(await erc20Token.balanceOf(accounts[6]), 8);
      assert.equal(await erc20Token.balanceOf(protocol), 0);
    })

    it("should create auction:721<->ETH, buyout with value = 100", async () => {
      const sellAsset = await prepareERC721()
      const buyAssetType = await prepareETH()
      await royaltiesRegistry.setRoyaltiesByToken(erc721.address, [[community, 1000]])
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
      await verifyBalanceChangeReturnTx(web3, buyer, 100, async () =>
        verifyBalanceChangeReturnTx(web3, testAuctionHouse.address, 0, async () =>
          verifyBalanceChangeReturnTx(web3, seller, -90, async () =>
            verifyBalanceChangeReturnTx(web3, protocol, 0, async () =>
              verifyBalanceChangeReturnTx(web3, community, -10, async () =>
                testAuctionHouse.putBid(auctionId, bid, { from: buyer, value: 200 })
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
      let auctionFees = await OriginFee(accounts[3], 700);

      let dataV1 = await encDataV1([auctionFees, 1000, 0, 100]); //originFees, duration, startTime, buyOutPrice
      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 90, V1, dataV1, { from: seller });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after mint owner is testAuctionHouse

      let auctionId = await getAuctionId();
      let bidFees = await OriginFee();
      let bidDataV1 = await bidEncDataV1([bidFees]);
      let bid = { amount: 100, dataType: V1, data: bidDataV1 };
      await testAuctionHouse.buyOut(auctionId, bid, { from: buyer });
      assert.equal(await erc721.ownerOf(erc721TokenId1), buyer); // after payOut owner is mr. payOut
      assert.equal(await erc20Token.balanceOf(seller), 93);
      assert.equal(await erc20Token.balanceOf(accounts[3]), 7);
      assert.equal(await erc20Token.balanceOf(protocol), 0);
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 0);
    })

    it("Put bid:721<->20, buyOut works, good! ", async () => {
      const sellAsset = await prepareERC721()
      const buyAssetType = await prepareERC20()
      let auctionFees = await OriginFee(accounts[3], 700);
      let dataV1 = await encDataV1([auctionFees, 1000, 0, 100]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 90, V1, dataV1, { from: seller });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after mint owner is testAuctionHouse
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
      assert.equal(await erc20Token.balanceOf(seller), 93);  //NFTAuctionInitiator get buyOut value - fee protocol - fee
      assert.equal(await erc20Token.balanceOf(accounts[3]), 7);  //to fee
      assert.equal(await erc20Token.balanceOf(protocol), 0);  //to protocol
      assert.equal(await erc20Token.balanceOf(buyer), 100); //first pitBidder, return all ERC20
      assert.equal(await erc20Token.balanceOf(accounts[4]), 900);
      assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[4]); // after mint owner is accounts[4]
      //
    })

    it("No bid:721<->ETH, payOut works, good!", async () => {
      const sellAsset = await prepareERC721()
      const buyAssetType = await prepareETH()
      let auctionFees = await OriginFee(accounts[3], 700);
      let dataV1 = await encDataV1([auctionFees, 1000, 0, 100]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 90, V1, dataV1, { from: seller });
      //bid initialize
      let auctionId = await getAuctionId();
      let bidFees = await OriginFee();
      let bidDataV1 = await bidEncDataV1([bidFees]);
      let bid = { amount: 100, dataType: V1, data: bidDataV1 };
      await verifyBalanceChangeReturnTx(web3, buyer, 100, async () =>
        verifyBalanceChangeReturnTx(web3, seller, -93, async () =>
          verifyBalanceChangeReturnTx(web3, accounts[3], -7, async () =>
            verifyBalanceChangeReturnTx(web3, protocol, 0, async () =>
              testAuctionHouse.buyOut(auctionId, bid, { from: buyer, value: 200 })
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

      const dataV1 = await encDataV1([await OriginFee(), duration, 0, 100]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 90, V1, dataV1, { from: seller });
      const auctionId = await getAuctionId();
      const bidDataV1 = await bidEncDataV1([await OriginFee()]);
      const bid1 = { amount: 90, dataType: V1, data: bidDataV1 };

      const txBid1 = await helper.putBidTime(testAuctionHouse.address, auctionId, bid1, { from: buyer, value: 90 })

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
      const txBid2 = await helper2.putBidTime(testAuctionHouse.address, auctionId, bid2, { from: accounts[3], value: 91 })
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
      const sellAsset = await prepareERC721()
      const buyAssetType = await prepareERC20()
      let auctionFees = await OriginFee();
      let startTime = await timeNow(); //define start time
      startTime = startTime + 100; //auction will start after 100 sec
      let dataV1 = await encDataV1([auctionFees, 1000, startTime, 18]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 9, V1, dataV1, { from: seller });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after start owner is testAuctionHouse
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
      assert.equal(await erc721.ownerOf(erc721TokenId1), seller);
    })

    it("should correctly finish auction with 1 bid and past endTime", async () => {
      const sellAsset = await prepareERC721()
      const buyAssetType = await prepareERC20()
      let auctionFees = await OriginFee(accounts[3], 100);
      let dataV1 = await encDataV1([auctionFees, 900, 0, 18]); //originFees, duration, startTime, buyOutPrice
      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 9, V1, dataV1, { from: seller });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after mint owner is testAuctionHouse
      let auctionId = await getAuctionId();

      let bidDataV1 = await bidEncDataV1([await OriginFee()]);
      let bid = { amount: 10, dataType: V1, data: bidDataV1 };
      await testAuctionHouse.putBid(auctionId, bid, { from: buyer });

      await increaseTime(901); //increase ~18 min

      const txFinish = await testAuctionHouse.finishAuction(auctionId, { from: accounts[0] });
      console.log("txFinish", txFinish.receipt.gasUsed)

      const AuctionFinished = await testAuctionHouse.getPastEvents("AuctionFinished", {
        fromBlock: txFinish.receipt.blockNumber,
        toBlock: txFinish.receipt.blockNumber
      });
      console.log("AuctionFinished topic", AuctionFinished[0].raw.topics)

      let id;
      truffleAssert.eventEmitted(txFinish, 'AuctionFinished', (ev) => {
        id = ev.auctionId;
        return true;
      });
      assert.equal(id, auctionId, "id from event")
      assert.equal(await erc721.ownerOf(erc721TokenId1), buyer); // after mint owner is testAuctionHouse
    })

    it("should correctly finish auction with 1 bid and past endTime, minimal duration = 10", async () => {
      const sellAsset = await prepareERC721()
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
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after mint owner is testAuctionHouse
      let auctionId = await getAuctionId();

      let bidDataV1 = await bidEncDataV1([await OriginFee()]);
      let bid = { amount: 10, dataType: V1, data: bidDataV1 };
      let txBid = await testAuctionHouse.putBid(auctionId, bid, { from: buyer });

      let endTime;
      truffleAssert.eventEmitted(txBid, 'BidPlaced', (ev) => {
        endTime = ev.endTime;
        return true;
      });
      let curTime = await helper.timeNow()
      assert.equal(curTime.toNumber() + 10, endTime, "correct endTime")

      await prepareERC20(accounts[3], 100, false)

      await increaseTime(5);

      bid = { amount: 15, dataType: V1, data: bidDataV1 };
      txBid = await testAuctionHouse.putBid(auctionId, bid, { from: accounts[3] });
      truffleAssert.eventEmitted(txBid, 'BidPlaced', (ev) => {
        endTime = ev.endTime;
        return true;
      });
      curTime = await helper.timeNow()
      assert.equal(curTime.toNumber() + 10, endTime, "correct endTime")

      await increaseTime(10);

      const txFinish = await testAuctionHouse.finishAuction(auctionId, { from: accounts[0] });
      let id;
      truffleAssert.eventEmitted(txFinish, 'AuctionFinished', (ev) => {
        id = ev.auctionId;
        return true;
      });
      assert.equal(id, auctionId, "id from event")
      assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[3]); // after mint owner is testAuctionHouse
    })

    it("should correctly finish auction with 1 bid and past endTime, minimal duration = 0", async () => {
      const sellAsset = await prepareERC721()
      const buyAssetType = await prepareERC20()

      await testAuctionHouse.changeMinimalDuration(0)

      let auctionFees = await OriginFee(accounts[3], 100);
      let dataV1 = await encDataV1([auctionFees, 0, 0, 18]); //originFees, duration, startTime, buyOutPrice
      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 9, V1, dataV1, { from: seller });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after mint owner is testAuctionHouse
      let auctionId = await getAuctionId();

      let bidDataV1 = await bidEncDataV1([await OriginFee()]);
      let bid = { amount: 10, dataType: V1, data: bidDataV1 };
      const txBid = await testAuctionHouse.putBid(auctionId, bid, { from: buyer });

      let endTime;
      truffleAssert.eventEmitted(txBid, 'BidPlaced', (ev) => {
        endTime = ev.endTime;
        return true;
      });
      const curTime = await helper.timeNow()
      assert.equal(curTime.toNumber(), endTime.toNumber(), "correct endTime")

      const txFinish = await testAuctionHouse.finishAuction(auctionId, { from: accounts[0] });
      let id;
      truffleAssert.eventEmitted(txFinish, 'AuctionFinished', (ev) => {
        id = ev.auctionId;
        return true;
      });
      assert.equal(id, auctionId, "id from event")
      assert.equal(await erc721.ownerOf(erc721TokenId1), buyer); // after mint owner is testAuctionHouse
    })

    it("721<->20", async () => {
      const sellAsset = await prepareERC721()
      const buyAssetType = await prepareERC20()
      let auctionFees = await OriginFee();
      let dataV1 = await encDataV1([auctionFees, 1000, 0, 180]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 9, V1, dataV1, { from: seller });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after mint owner is testAuctionHouse
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
      assert.equal(await erc20Token.balanceOf(seller), 94);
      assert.equal(await erc20Token.balanceOf(protocol), 0);
      assert.equal(await erc20Token.balanceOf(accounts[6]), 6);
      assert.equal(await erc721.ownerOf(erc721TokenId1), buyer); // after mint owner is testAuctionHouse
    })

    it("721<->ETH", async () => {
      const sellAsset = await prepareERC721()
      const buyAssetType = await prepareETH()
      let auctionFees = await OriginFee(accounts[6], 300);

      let dataV1 = await encDataV1([auctionFees, 1000, 0, 180]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 90, V1, dataV1, { from: seller });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address);
      //bid initialize
      let auctionId = await getAuctionId();
      let bidFees = await OriginFee();
      let bidDataV1 = await bidEncDataV1([bidFees]);
      let bid = { amount: 100, dataType: V1, data: bidDataV1 };
      await verifyBalanceChangeReturnTx(web3, buyer, 100, async () =>
        verifyBalanceChangeReturnTx(web3, testAuctionHouse.address, -100, async () =>
          testAuctionHouse.putBid(auctionId, bid, { from: buyer, value: 150 })
        )
      )
      await increaseTime(1075);
      await verifyBalanceChangeReturnTx(web3, testAuctionHouse.address, 100, async () =>
        verifyBalanceChangeReturnTx(web3, seller, -97, async () =>
          verifyBalanceChangeReturnTx(web3, accounts[6], -3, async () =>
            verifyBalanceChangeReturnTx(web3, protocol, 0, async () =>
              testAuctionHouse.finishAuction(auctionId, { from: accounts[0] })
            )
          )
        )
      )
      assert.equal(await erc721.ownerOf(erc721TokenId1), buyer);
    })

    it("No bid , after cancel auction return 721", async () => {
      const sellAsset = await prepareERC721()
      const buyAssetType = await prepareERC20()
      let auctionFees = await OriginFee(accounts[3], 100);
      let dataV1 = await encDataV1([auctionFees, 1000, 0, 18]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 9, V1, dataV1, { from: seller });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after mint owner is testAuctionHouse
      let auctionId = await getAuctionId();
      const tx = await testAuctionHouse.cancel(auctionId, { from: seller });
      let id;
      truffleAssert.eventEmitted(tx, 'AuctionCancelled', (ev) => {
        id = ev.auctionId;
        return true;
      });
      assert.equal(id, auctionId, "id canceled")
      assert.equal(await erc721.ownerOf(erc721TokenId1), seller); // after mint owner is testAuctionHouse
    })

    it("can't cancel auction with bid", async () => {
      const sellAsset = await prepareERC721()
      const buyAssetType = await prepareERC20()
      let auctionFees = await OriginFee(accounts[3], 400);
      let dataV1 = await encDataV1([auctionFees, 1000, 0, 18]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 9, V1, dataV1, { from: seller });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after mint owner is testAuctionHouse
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
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after mint owner is testAuctionHouse
    })

    it("should correctly process case with multiple erc20 auctions", async () => {
      const sellAsset = await prepareERC721()
      const buyAssetType = await prepareERC20(buyer, 1000)
      let dataV1 = await encDataV1([await OriginFee(), 1000, 0, 0]); //originFees, duration, startTime, buyOutPrice

      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 9, V1, dataV1, { from: seller });
      //bid initialize
      const auctionId1 = await getAuctionId();
      let bidDataV1 = await bidEncDataV1([await OriginFee()]);
      let bid = { amount: 100, dataType: V1, data: bidDataV1 };
      await testAuctionHouse.putBid(auctionId1, bid, { from: buyer });

      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 100, "erc20 balance auction");
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address, "erc721 balance auction");

      const seller2 = accounts[5]
      const erc721TokenId2 = 555;
      const sellAsset2 = await prepareERC721(seller2, erc721TokenId2, false)
      const buyer2 = accounts[6]
      const buyAssetType2 = await prepareERC20(buyer2, 1000, false)
      await testAuctionHouse.startAuction(...sellAsset2, buyAssetType2, 9, V1, dataV1, { from: seller2 });
      const auctionId2 = await getAuctionId();
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
      const auctionId = await getAuctionId() + 1;
      let dataV1 = await encDataV1([await OriginFee(), 1000, 0, 0]);
      assert.equal(await wrapper.auctionIdMatchesToken(auctionId, erc721.address, erc721TokenId1), false, "auctionIdMatchesToken before creation")
      assert.equal(await wrapper.isFinalized(auctionId), true, "isFinalized before creation")

      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 100, V1, dataV1, { from: seller });

      assert.equal(await wrapper.auctionIdMatchesToken(auctionId, erc721.address, erc721TokenId1), true, "auctionIdMatchesToken after creation")
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address);
      assert.equal(await wrapper.getMinimumBid(auctionId), 100, "get first minimal bid")
      assert.equal(await wrapper.getCurrentHighestBidder(auctionId), zeroAddress, "getCurrentHighestBidder before first bid")
      assert.equal(await wrapper.isFinalized(auctionId), false, "isFinalized after creation")

      //deploy party bid
      const partyBid = await PartyBidTest.new(wrapper.address, erc721.address, erc721TokenId1, auctionId)

      await partyBid.contribute({ from: accounts[2], value: 50 })
      assert.equal((await web3.eth.getBalance(partyBid.address)).toString(), "50", "balance after 1 contribution")

      await partyBid.contribute({ from: accounts[3], value: 50 })
      assert.equal((await web3.eth.getBalance(partyBid.address)).toString(), "100", "balance after 2 contribution")

      const balanceOld = (await web3.eth.getBalance(testAuctionHouse.address))

      const txBid = await partyBid.bid()
      assert.equal((await web3.eth.getBalance(partyBid.address)).toString(), "0", "party bidbalance after bid contribution")

      assert.equal((await web3.eth.getBalance(testAuctionHouse.address)) - balanceOld, 100, "auction balance after bid contribution")
      assert.equal(await wrapper.getMinimumBid(auctionId), 101, "get second minimal bid")
      assert.equal(await wrapper.getCurrentHighestBidder(auctionId), partyBid.address, "getCurrentHighestBidder after bid")
      assert.equal(await wrapper.isFinalized(auctionId), false, "isFinalized after bid")

      const BidPlaced = (await testAuctionHouse.getPastEvents("BidPlaced", {
        fromBlock: txBid.receipt.blockNumber,
        toBlock: txBid.receipt.blockNumber
      }))[0].args;

      assert.equal(BidPlaced.auctionId, auctionId, "correct auctionId")

      await increaseTime(1001);

      const txFin = await partyBid.finalize()

      const AuctionFinished = (await testAuctionHouse.getPastEvents("AuctionFinished", {
        fromBlock: txFin.receipt.blockNumber,
        toBlock: txFin.receipt.blockNumber
      }))[0].args;
      assert.equal(AuctionFinished.auctionId, auctionId, "auction id")

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
      const sellAsset = await prepareERC721()
      const buyAssetType = await prepareETH()
      let dataV1 = await encDataV1([await OriginFee(), 1000, 0, 0]); //originFees, duration, startTime, buyOutPrice

      await truffleAssert.fails(
        faultyBidder.withdrawFaultyBid(testAuctionHouse.address, addressToReturn, { from: buyer }),
        truffleAssert.ErrorType.REVERT,
        "nothing to withdraw"
      )
      await truffleAssert.fails(
        testAuctionHouse.withdrawFaultyBid(addressToReturn, { from: buyer }),
        truffleAssert.ErrorType.REVERT,
        "nothing to withdraw"
      )

      await testAuctionHouse.startAuction(...sellAsset, buyAssetType, 90, V1, dataV1, { from: seller });
      //bid initialize
      let auctionId = await getAuctionId();
      let bidDataV1 = await bidEncDataV1([await OriginFee()]);
      let bid = { amount: 100, dataType: V1, data: bidDataV1 };

      await verifyBalanceChangeReturnTx(web3, buyer, 100, async () =>
        verifyBalanceChangeReturnTx(web3, testAuctionHouse.address, -100, async () =>
          faultyBidder.faultyBid(testAuctionHouse.address, auctionId, bid, { from: buyer, value: 100 })
        )
      )

      const buyer2 = accounts[5]
      bid.amount = 150;

      await verifyBalanceChangeReturnTx(web3, buyer2, 150, async () =>
        verifyBalanceChangeReturnTx(web3, testAuctionHouse.address, -150, async () =>
          verifyBalanceChangeReturnTx(web3, buyer, 0, async () =>
            testAuctionHouse.putBid(auctionId, bid, { from: buyer2, value: 150 })
          )
        )
      )

      await truffleAssert.fails(
        testAuctionHouse.withdrawFaultyBid(addressToReturn, { from: buyer }),
        truffleAssert.ErrorType.REVERT,
        "nothing to withdraw"
      )

      await verifyBalanceChangeReturnTx(web3, addressToReturn, -100, async () =>
        verifyBalanceChangeReturnTx(web3, testAuctionHouse.address, 100, async () =>
          verifyBalanceChangeReturnTx(web3, faultyBidder.address, 0, async () =>
            faultyBidder.withdrawFaultyBid(testAuctionHouse.address, addressToReturn, { from: buyer })
          )
        )
      )

      await truffleAssert.fails(
        faultyBidder.withdrawFaultyBid(testAuctionHouse.address, addressToReturn, { from: buyer }),
        truffleAssert.ErrorType.REVERT,
        "nothing to withdraw"
      )
      await truffleAssert.fails(
        testAuctionHouse.withdrawFaultyBid(addressToReturn, { from: buyer }),
        truffleAssert.ErrorType.REVERT,
        "nothing to withdraw"
      )

    })

    it("MAX_FEE_BASE_POINT works correctly, auctions/bids with bigger fees can't be created", async () => {
      const sellAsset = await prepareERC721()
      const buyAssetType = await prepareERC20(buyer, 1000)

      //trying to create auction with 10% + 3% fees
      let dataV1 = await encDataV1([await OriginFee(accounts[5], 1300), 1000, 0, 101]); //originFees, duration, startTime, buyOutPrice
      await truffleAssert.fails(
        testAuctionHouse.startAuction(...sellAsset, buyAssetType, 9, V1, dataV1, { from: seller }),
        truffleAssert.ErrorType.REVERT,
        "wrong fees"
      )

      //trying to create auction with 8% + 3% fees
      dataV1 = await encDataV1([await OriginFee(accounts[5], 1100), 1000, 0, 101]); //originFees, duration, startTime, buyOutPrice
      await truffleAssert.fails(
        testAuctionHouse.startAuction(...sellAsset, buyAssetType, 9, V1, dataV1, { from: seller }),
        truffleAssert.ErrorType.REVERT,
        "wrong fees"
      )

      dataV1 = await encDataV1([await OriginFee(accounts[5], 800), 1000, 0, 101]); //originFees, duration, startTime, buyOutPrice
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

      assert.equal(await erc721.ownerOf(erc721TokenId1), buyer, "nft went to buyer");
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

  async function prepareERC721(user = seller, tokenId = erc721TokenId1, deployNew = true) {
    if (!!deployNew) {
      erc721 = await TestERC721.new("https://ipfs.rarible.com");
    }
    await erc721.mint(user, tokenId);
    await erc721.setApprovalForAll(transferProxy.address, true, { from: user });
    return SellAsset(erc721.address, tokenId);
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

  function SellAsset(token, tokenId) {
    return [token, tokenId]
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
