const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const TestERC20 = artifacts.require("TestERC20.sol");
const TestERC721 = artifacts.require("TestERC721.sol");
const TestERC1155 = artifacts.require("TestERC1155.sol");
const TransferProxyTest = artifacts.require("TransferProxyTest.sol");
const ERC20TransferProxyTest = artifacts.require("ERC20TransferProxyTest.sol");
const TestAuctionHouse = artifacts.require("TestAuctionHouse");
const TestRoyaltiesRegistry = artifacts.require("TestRoyaltiesRegistry");

const truffleAssert = require('truffle-assertions');

const DAY = 86400;
const { Order, Asset, AssetType, sign } = require("../../exchange-v2/test/order");
const { expectThrow, verifyBalanceChange } = require("@daonomic/tests-common");
const { ETH, ERC20, ERC721, ERC1155, enc, id } = require("../../exchange-v2/test/assets.js");

const tests = require("@daonomic/tests-common");
const increaseTime = tests.increaseTime;

contract("Check Auction", accounts => {
  let royaltiesRegistry;
  let transferProxy;
  let erc20TransferProxy;
  let erc721TokenId1 = 53;
  let erc1155TokenId1 = 54;
  let testAuctionHouse;
  let encodedERC20;
  let dataV1Type = id("V1");
  let bidDataV1Type = id("V1");
  let protocol = accounts[9];
  let community = accounts[8];

  beforeEach(async () => {
    transferProxy = await TransferProxyTest.new();
    erc20TransferProxy = await ERC20TransferProxyTest.new();
    erc20Token = await TestERC20.new();
    /*ERC721 */
    erc721 = await TestERC721.new("Rarible", "RARI", "https://ipfs.rarible.com");
    /*ERC1155*/
    erc1155 = await TestERC1155.new("https://ipfs.rarible.com");

    //royaltiesRegistry
    royaltiesRegistry = await TestRoyaltiesRegistry.new()

    /*Auction*/
    testAuctionHouse = await deployProxy(TestAuctionHouse, [transferProxy.address, erc20TransferProxy.address, 300, protocol, royaltiesRegistry.address], { initializer: "__AuctionHouse_init" });
  });

  //nft, erc20 initialize
  async function prepare721_20() {
    await erc721.mint(accounts[1], erc721TokenId1);
    await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });
    await erc20Token.mint(accounts[2], 100);
    await erc20Token.approve(erc20TransferProxy.address, 100, { from: accounts[2] });
    encodedERC20 = enc(erc20Token.address);
  };

  async function prepare721_20value(value) {
    await erc721.mint(accounts[1], erc721TokenId1);
    await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });
    await erc20Token.mint(accounts[2], value);
    await erc20Token.approve(erc20TransferProxy.address, value, { from: accounts[2] });
    encodedERC20 = enc(erc20Token.address);
  };
  async function timeNow() {
    return await testAuctionHouse.timeNow.call();
  }

  describe("test internal functions", () => {
    it("Tets1: No start, No end, duration only", async () => {
      let now = parseInt(await timeNow()); //define start time
      let finish = now + 3600;
      let result = await testAuctionHouse.setTimeRangeTest.call(0, 0, 3600);
      assert.equal(now, result[0]);
      assert.equal(finish, result[1]);
    })
    it("Tets2: Yes start, No End, yes duration ", async () => {
      let now = parseInt(await timeNow()); //define start time
      let duration = 3600;
      now = now + 1000;
      let finish = now + duration;
      let result = await testAuctionHouse.setTimeRangeTest.call(now, 0, duration);
      assert.equal(now, result[0]);
      assert.equal(finish, result[1]);
    })
    it("Tets3: Yes start, No End, No duration, throw ", async () => {
      let now = parseInt(await timeNow()); //define start time
      let duration = 0;
      now = now + 1000;
      let finish = now + duration;
      await expectThrow(
        testAuctionHouse.setTimeRangeTest.call(now, 0, duration)
      );
    })
    it("Tets4: Yes start, yes End, start==end, throw ", async () => {
      let now = parseInt(await timeNow()); //define start time
      let duration = 3600;
      let finish = now;
      await expectThrow(
        testAuctionHouse.setTimeRangeTest.call(now, finish, duration)
      );
    })
    it("Tets5: Yes start, yes End, no duration, ok ", async () => {
      var now = parseInt(await timeNow()); //define start time
      let finish = now + 3600;
      let result = await testAuctionHouse.setTimeRangeTest.call(now, finish, 0);
      assert.equal(now, result[0]);
      assert.equal(finish, result[1]);
    })
    it("Test6: getAuctionByToken works, auctionId iterates", async () => {
      //auction initialize
      const tokenid2 = 123;
      await erc721.mint(accounts[1], erc721TokenId1);
      await erc721.mint(accounts[1], tokenid2);
      await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);
      const encodedEth = enc(accounts[5]);
      let buyAssetType = await AssetType(ETH, encodedEth);
      let auctionFees = [[accounts[3], 1000]];
      let startTime = await timeNow();
      let endTime = startTime + 36000;
      let dataV1 = await encDataV1([[], auctionFees, 1000, startTime, 100]); //originFees, duration, startTime, buyOutPrice

      let dataV1Type = id("V1");
      let resultStartAuction = await testAuctionHouse.startAuction(sellAsset, buyAssetType, endTime, 1, 90, dataV1Type, dataV1, { from: accounts[1] });

      let auctionId;
      truffleAssert.eventEmitted(resultStartAuction, 'AuctionCreated', (ev) => {
        auctionId = ev.id;
        return true;
      });

      assert.equal((await testAuctionHouse.getAuctionByToken(erc721.address, erc721TokenId1)).toString(), auctionId.toString());

      let sellAsset1 = await Asset(ERC721, enc(erc721.address, tokenid2), 1);
      let resultStartAuction1 = await testAuctionHouse.startAuction(sellAsset1, buyAssetType, endTime, 1, 90, dataV1Type, dataV1, { from: accounts[1] });

      let auctionId1;
      truffleAssert.eventEmitted(resultStartAuction1, 'AuctionCreated', (ev) => {
        auctionId1 = ev.id;
        return true;
      });
      assert.equal(auctionId1.toNumber(), auctionId.toNumber() + 1, "auction id iterates")
    })
  });

  describe("create auction", () => {
    it("Check creation with ERC721, and start auction owner is testAuctionHouse", async () => {
      await erc721.mint(accounts[1], erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });

      assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[1]); // after mint owner is accounts[1]
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);
      const encoded = enc(accounts[5]);
      let buyAssetType = await AssetType(ERC20, encoded);
      let fees = [[accounts[3], 100], [accounts[4], 300]];
      let dataV1 = await encDataV1([[], fees, 1000, 500, 18]); //originFees, duration, startTime, buyOutPrice
      let dataV1Type = id("V1");
      let resultStartAuction = await testAuctionHouse.startAuction(sellAsset, buyAssetType, 0, 1, 9, dataV1Type, dataV1, { from: accounts[1] });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after mint owner is testAuctionHouse
    })

    it("Check creation with ERC1155, and start auction owner is testAuctionHouse", async () => {
      await erc1155.mint(accounts[1], erc1155TokenId1, 7);
      await erc1155.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });

      assert.equal(await erc1155.balanceOf(accounts[1], erc1155TokenId1), 7); // after mint owner is accounts[1]
      let sellAsset = await Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7);
      const encoded = enc(accounts[5]);
      let buyAssetType = await AssetType(ERC20, encoded);
      let fees = [[accounts[3], 100], [accounts[4], 300]];
      let dataV1 = await encDataV1([[], fees, 1000, 500, 18]); //originFees, duration, startTime, buyOutPrice
      let dataV1Type = id("V1");
      let resultStartAuction = await testAuctionHouse.startAuction(sellAsset, buyAssetType, 0, 1, 9, dataV1Type, dataV1, { from: accounts[1] });
      assert.equal(await erc1155.balanceOf(testAuctionHouse.address, erc1155TokenId1), 7); // after mint owner is testAuctionHouse
    })

    it("Check creation with ERC20, denied", async () => {
      await erc20Token.mint(accounts[1], 100);
      await erc20Token.approve(erc20TransferProxy.address, 100, { from: accounts[1] });
      const encodedERC20 = enc(erc20Token.address);

      assert.equal(await erc20Token.balanceOf(accounts[1]), 100); // after mint owner is accounts[1]
      let sellAsset = await Asset(ERC20, enc(erc20Token.address), 100);
      const encodedNft = enc(erc721.address, erc721TokenId1);
      let buyAssetType = await AssetType(ERC721, encodedNft);
      let fees = [];
      let dataV1 = await encDataV1([[], fees, 1000, 500, 1]); //originFees, duration, startTime, buyOutPrice
      let dataV1Type = id("V1");
      await expectThrow(
        testAuctionHouse.startAuction(sellAsset, buyAssetType, 0, 1, 1, dataV1Type, dataV1, { from: accounts[1] })
      );
    })

  });

  describe("bid auction", () => {
    it("Tets1: Create auction:721<->20, put bid, walue = 10", async () => {
      //auction initialize
      await erc721.mint(accounts[1], erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });
      await erc20Token.mint(accounts[2], 1000);
      await erc20Token.approve(erc20TransferProxy.address, 1000, { from: accounts[2] });
      const encodedERC20 = enc(erc20Token.address);
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);

      let buyAssetType = await AssetType(ERC20, encodedERC20);
      let auctionFees = [[accounts[3], 100], [accounts[4], 300]];
      let startTime = await timeNow();
      let endTime = startTime + 100;
      let dataV1 = await encDataV1([[], auctionFees, 1000, startTime, 180]); //originFees, duration, startTime, buyOutPrice

      let dataV1Type = id("V1");
      let resultStartAuction = await testAuctionHouse.startAuction(sellAsset, buyAssetType, endTime, 1, 9, dataV1Type, dataV1, { from: accounts[1] });
      //bid initialize
      let auctionId = 1;
      let bidFees = [[accounts[6], 1500], [accounts[7], 3500]];
      let bidDataV1 = await bidEncDataV1([[], bidFees]);
      let bidDataV1Type = id("V1");
      let bid = { amount: 100, dataType: bidDataV1Type, data: bidDataV1 };
      let resultPutBid = await testAuctionHouse.putBid(auctionId, bid, { from: accounts[2] });
      assert.equal((await erc20Token.balanceOf(testAuctionHouse.address)).toString(), "153");
    })

    it("Tets2: Create auction:721<->20, put bid, walue = 10, after that put another bid = 11", async () => {
      //auction initialize
      await erc721.mint(accounts[1], erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });
      await erc20Token.mint(accounts[2], 100);
      await erc20Token.approve(erc20TransferProxy.address, 100, { from: accounts[2] });
      const encodedERC20 = enc(erc20Token.address);
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);

      let buyAssetType = await AssetType(ERC20, encodedERC20);
      let auctionFees = [[accounts[3], 100], [accounts[4], 300]];
      let endTime = await timeNow();
      let dataV1 = await encDataV1([[], auctionFees, 1000, endTime, 28]); //originFees, duration, startTime, buyOutPrice

      let dataV1Type = id("V1");
      let resultStartAuction = await testAuctionHouse.startAuction(sellAsset, buyAssetType, 0, 1, 9, dataV1Type, dataV1, { from: accounts[1] });
      //bid initialize
      let auctionId = 1;
      let bidFees = [[accounts[6], 2000]];
      let bidDataV1 = await bidEncDataV1([[], bidFees]);
      let bidDataV1Type = id("V1");
      let bid = { amount: 10, dataType: bidDataV1Type, data: bidDataV1 };
      let resultPutBid = await testAuctionHouse.putBid(auctionId, bid, { from: accounts[2] });
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 12);

      await erc20Token.mint(accounts[7], 100);
      await erc20Token.approve(erc20TransferProxy.address, 100, { from: accounts[7] });

      bid = { amount: 20, dataType: bidDataV1Type, data: bidDataV1 };
      resultPutBid = await testAuctionHouse.putBid(auctionId, bid, { from: accounts[7] });
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 24);
      assert.equal(await erc20Token.balanceOf(accounts[2]), 100);
      assert.equal(await erc20Token.balanceOf(accounts[7]), 76);
    })

    it("Tets3: Create auction:721<->ETH, put bid, walue = 10", async () => {
      //auction initialize
      await erc721.mint(accounts[1], erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);
      const encodedEth = enc(accounts[5]);
      let buyAssetType = await AssetType(ETH, encodedEth);
      let auctionFees = [[accounts[3], 100], [accounts[4], 300]];
      let endTime = await timeNow();
      let dataV1 = await encDataV1([[], auctionFees, 1000, endTime, 18]); //originFees, duration, startTime, buyOutPrice

      let dataV1Type = id("V1");
      let resultStartAuction = await testAuctionHouse.startAuction(sellAsset, buyAssetType, 0, 1, 9, dataV1Type, dataV1, { from: accounts[1] });
      //bid initialize
      let auctionId = 1;
      let bidFees = [[accounts[6], 1500], [accounts[7], 3500]];
      let bidDataV1 = await bidEncDataV1([[], bidFees]);
      let bidDataV1Type = id("V1");
      let bid = { amount: 10, dataType: bidDataV1Type, data: bidDataV1 };
      await verifyBalanceChange(accounts[2], 14, async () =>
        verifyBalanceChange(testAuctionHouse.address, -14, async () =>
          testAuctionHouse.putBid(auctionId, bid, { from: accounts[2], value: 15, gasPrice: 0 })
        )
      )
    })

    it("Tets4.1: Create auction:721<->ETH no bid, put bid with buyout walue = 10 + royalties", async () => {
      //auction initialize
      await erc721.mint(accounts[1], erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });
      await royaltiesRegistry.setRoyalties(erc721.address, erc721TokenId1, [[community, 1000]])
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);
      const encodedEth = enc(accounts[5]);
      let buyAssetType = await AssetType(ETH, encodedEth);
      let auctionFees = [];
      let endTime = await timeNow();
      let dataV1 = await encDataV1([[], auctionFees, 1000, endTime, 100]); //originFees, duration, startTime, buyOutPrice

      let dataV1Type = id("V1");
      let resultStartAuction = await testAuctionHouse.startAuction(sellAsset, buyAssetType, 0, 1, 90, dataV1Type, dataV1, { from: accounts[1] });
      //bid initialize
      let auctionId = 1;
      let bidFees = [];
      let bidDataV1 = await bidEncDataV1([[], bidFees]);
      let bidDataV1Type = id("V1");
      let bid = { amount: 100, dataType: bidDataV1Type, data: bidDataV1 };
      await verifyBalanceChange(accounts[2], 103, async () =>
        verifyBalanceChange(testAuctionHouse.address, 0, async () =>
          verifyBalanceChange(accounts[1], -87, async () =>
            verifyBalanceChange(protocol, -6, async () =>
              verifyBalanceChange(community, -10, async () =>
                testAuctionHouse.putBid(auctionId, bid, { from: accounts[2], value: 200, gasPrice: 0 })
              )
            )
          )
        )
      )
      assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[2]); // after new owner 721
    })
    it("Tets4.2: Create auction:721<->ETH Yes bid, put bid with outBuy walue = 10", async () => {
      //auction initialize
      await erc721.mint(accounts[1], erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);
      const encodedEth = enc(accounts[5]);
      let buyAssetType = await AssetType(ETH, encodedEth);
      let auctionFees = [];
      let endTime = await timeNow();
      let dataV1 = await encDataV1([[], auctionFees, 1000, endTime, 200]); //originFees, duration, startTime, buyOutPrice

      let dataV1Type = id("V1");
      let resultStartAuction = await testAuctionHouse.startAuction(sellAsset, buyAssetType, 0, 1, 90, dataV1Type, dataV1, { from: accounts[1] });
      //bid initialize
      let auctionId = 1;
      let bidFees = [];
      let bidDataV1 = await bidEncDataV1([[], bidFees]);
      let bidDataV1Type = id("V1");

      let bid = { amount: 100, dataType: bidDataV1Type, data: bidDataV1 };
      await verifyBalanceChange(accounts[2], 103, async () =>
        verifyBalanceChange(testAuctionHouse.address, -103, async () =>
          verifyBalanceChange(accounts[1], 0, async () =>
            verifyBalanceChange(protocol, 0, async () =>
              testAuctionHouse.putBid(auctionId, bid, { from: accounts[2], value: 200, gasPrice: 0 })
            )
          )
        )
      )
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address);

      let outBid = { amount: 200, dataType: bidDataV1Type, data: bidDataV1 };
      await verifyBalanceChange(accounts[3], 206, async () =>
        verifyBalanceChange(testAuctionHouse.address, 103, async () =>
          verifyBalanceChange(accounts[1], -194, async () =>
            verifyBalanceChange(accounts[2], -103, async () =>
              verifyBalanceChange(protocol, -12, async () =>
                testAuctionHouse.putBid(auctionId, outBid, { from: accounts[3], value: 300, gasPrice: 0 })
              )
            )
          )
        )
      )
      assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[3]); // after new owner 721
    })

    it("Tets5: Create auction:721<->ETH, put bid, walue = 10 after put second bid value = 11", async () => {
      //auction initialize
      await erc721.mint(accounts[1], erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);
      const encodedEth = enc(accounts[5]);
      let buyAssetType = await AssetType(ETH, encodedEth);
      let auctionFees = [[accounts[3], 100], [accounts[4], 300]];
      let endTime = await timeNow();
      let dataV1 = await encDataV1([[], auctionFees, 1000, endTime, 18]); //originFees, duration, startTime, buyOutPrice

      let dataV1Type = id("V1");
      let resultStartAuction = await testAuctionHouse.startAuction(sellAsset, buyAssetType, 0, 1, 9, dataV1Type, dataV1, { from: accounts[1] });
      //bid initialize
      let auctionId = 1;
      let bidFees = [[accounts[6], 1500]];
      let bidDataV1 = await bidEncDataV1([[], bidFees]);
      let bidDataV1Type = id("V1");

      let bid = { amount: 10, dataType: bidDataV1Type, data: bidDataV1 };  //amount == 10
      await verifyBalanceChange(accounts[2], 11, async () =>  //accounts[2] balanceChange to 10, because 5 roll back
        verifyBalanceChange(testAuctionHouse.address, -11, async () =>  //to contract
          testAuctionHouse.putBid(auctionId, bid, { from: accounts[2], value: 15, gasPrice: 0 }) //more eth, than need
        )
      )
      bid = { amount: 11, dataType: bidDataV1Type, data: bidDataV1 };
      await verifyBalanceChange(accounts[7], 12, async () =>
        verifyBalanceChange(accounts[2], -11, async () =>
          verifyBalanceChange(testAuctionHouse.address, -1, async () =>
            testAuctionHouse.putBid(auctionId, bid, { from: accounts[7], value: 30, gasPrice: 0 })
          )
        )
      )
    })
    //TODO CHECK 1155<->ETH
  });

  describe("finish auction", () => {
    it("Test1: No bid, try finish auction not start yet, return NFT, ok", async () => {
      await prepare721_20();//nft, erc20 initialize
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);

      let buyAssetType = await AssetType(ERC20, encodedERC20);
      let auctionFees = [];
      let startTime = await timeNow(); //define start time
      startTime = startTime + 100; //auction will start after 100 sec
      let endTime = startTime + 3600;
      let dataV1 = await encDataV1([[], auctionFees, 1000, startTime, 18]); //originFees, duration, startTime, buyOutPrice

      let resultStartAuction = await testAuctionHouse.startAuction(sellAsset, buyAssetType, endTime, 1, 9, dataV1Type, dataV1, { from: accounts[1] });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after mint owner is testAuctionHouse
      let auctionId = 1;
      let resultFinishAuction = await testAuctionHouse.finishAuction(auctionId, { from: accounts[0] });
      assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[1]); // after mint owner is testAuctionHouse
    })

    it("Test2: No bid, try finish auction already finished, return NFT", async () => {
      await prepare721_20();//auction initialize
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);

      let buyAssetType = await AssetType(ERC20, encodedERC20);
      let auctionFees = [[accounts[3], 100]];
      let startTime = await timeNow(); //define start time
      startTime = startTime - 7200; //auction started 2hours ago
      let endTime = startTime + 3600;//auction finished 1hours ago
      let dataV1 = await encDataV1([[], auctionFees, 1000, startTime, 18]); //originFees, duration, startTime, buyOutPrice

      let resultStartAuction = await testAuctionHouse.startAuction(sellAsset, buyAssetType, endTime, 1, 9, dataV1Type, dataV1, { from: accounts[1] });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after mint owner is testAuctionHouse
      let auctionId = 1;
      let resultFinishAuction = await testAuctionHouse.finishAuction(auctionId, { from: accounts[0] });
      assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[1]); // after mint owner is testAuctionHouse
    })

    it("Test3: No bid, try finish auction running now, throw", async () => {
      await prepare721_20();//nft, erc20 initialize
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);

      let buyAssetType = await AssetType(ERC20, encodedERC20);
      let auctionFees = [[accounts[3], 100]];
      let startTime = await timeNow(); //define start time
      startTime = startTime - 120; //auction started 2min ago
      let endTime = startTime + 3600;//auction finished 1hours later
      let dataV1 = await encDataV1([[], auctionFees, 1000, startTime, 18]); //originFees, duration, startTime, buyOutPrice

      let resultStartAuction = await testAuctionHouse.startAuction(sellAsset, buyAssetType, endTime, 1, 9, dataV1Type, dataV1, { from: accounts[1] });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after mint owner is testAuctionHouse
      let auctionId = 1;
      await expectThrow(
        testAuctionHouse.finishAuction(auctionId, { from: accounts[0] })
      );
    })

    it("Test4: Put bid:721<->20, no fee auction, after finish auction, nft goes to buyer", async () => {
      await prepare721_20();//nft, erc20 initialize
      await erc721.setApprovalForAll(accounts[0], true, { from: accounts[1] });
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);

      let buyAssetType = await AssetType(ERC20, encodedERC20);
      let auctionFees = [];
      let startTime = await timeNow(); //define start time
      let endTime = startTime + 60;
      let dataV1 = await encDataV1([[], auctionFees, 1000, startTime, 18]); //originFees, duration, startTime, buyOutPrice

      let resultStartAuction = await testAuctionHouse.startAuction(sellAsset, buyAssetType, endTime, 1, 9, dataV1Type, dataV1, { from: accounts[1] });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after mint owner is testAuctionHouse
      //bid initialize
      let auctionId = 1;
      let bidFees = [[accounts[6], 1500], [accounts[7], 3500]];
      let bidDataV1 = await bidEncDataV1([[], bidFees]);

      let bid = { amount: 10, dataType: bidDataV1Type, data: bidDataV1 };
      let resultPutBid = await testAuctionHouse.putBid(auctionId, bid, { from: accounts[2] });
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 14);
      assert.equal(await erc20Token.balanceOf(accounts[2]), 86);
      await increaseTime(1075); //increase ~18 min
      let resultFinishAuction = await testAuctionHouse.finishAuction(auctionId, { from: accounts[0] });
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 0);
      assert.equal(await erc20Token.balanceOf(accounts[1]), 10);
      assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[2]); // after mint owner is testAuctionHouse
    })

    it("Test5: Put bid:721<->20, with fee, after finish auction, nft goes to buyer", async () => {
      await prepare721_20value(1000);//nft, erc20 initialize
      await erc721.setApprovalForAll(accounts[0], true, { from: accounts[1] });
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);

      let buyAssetType = await AssetType(ERC20, encodedERC20);
      let auctionFees = [[accounts[6], 1000], [accounts[7], 2000]];
      let startTime = await timeNow(); //define start time
      let endTime = startTime + 60;//auction finished 1hours ago
      let dataV1 = await encDataV1([[], auctionFees, 1000, startTime, 500]); //originFees, duration, startTime, buyOutPrice

      let resultStartAuction = await testAuctionHouse.startAuction(sellAsset, buyAssetType, endTime, 10, 90, dataV1Type, dataV1, { from: accounts[1] });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after mint owner is testAuctionHouse
      //bid initialize
      let auctionId = 1;
      let bidFees = [];
      let bidDataV1 = await bidEncDataV1([[], bidFees]);

      let bid = { amount: 100, dataType: bidDataV1Type, data: bidDataV1 };
      let resultPutBid = await testAuctionHouse.putBid(auctionId, bid, { from: accounts[2] });
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 103);
      assert.equal(await erc20Token.balanceOf(accounts[2]), 897);
      await increaseTime(1075); //increase ~18 min
      let resultFinishAuction = await testAuctionHouse.finishAuction(auctionId, { from: accounts[0] });
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 0);
      assert.equal(await erc20Token.balanceOf(protocol), 6);
      assert.equal(await erc20Token.balanceOf(accounts[6]), 10);
      assert.equal(await erc20Token.balanceOf(accounts[7]), 20);
      assert.equal(await erc20Token.balanceOf(accounts[1]), 67);
      assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[2]); // after mint owner is testAuctionHouse
    })

    it("Test6: Put bid:721<->ETH, no fee auction, after finish auction, nft goes to buyer", async () => {
      //auction initialize
      await erc721.mint(accounts[1], erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);
      const encodedEth = enc(testAuctionHouse.address);
      let buyAssetType = await AssetType(ETH, encodedEth);
      let auctionFees = [];
      let startTime = await timeNow();
      let endTime = startTime + 60;//auction finished 1hours ago
      let dataV1 = await encDataV1([[], auctionFees, 1000, startTime, 18]); //originFees, duration, startTime, buyOutPrice

      let resultStartAuction = await testAuctionHouse.startAuction(sellAsset, buyAssetType, endTime, 1, 9, dataV1Type, dataV1, { from: accounts[1] });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address);
      //bid initialize
      let auctionId = 1;
      let bidFees = [];
      let bidDataV1 = await bidEncDataV1([[], bidFees]);
      let bid = { amount: 10, dataType: bidDataV1Type, data: bidDataV1 };
      await verifyBalanceChange(accounts[2], 10, async () =>
        verifyBalanceChange(testAuctionHouse.address, -10, async () =>
          testAuctionHouse.putBid(auctionId, bid, { from: accounts[2], value: 15, gasPrice: 0 })
        )
      )
      await increaseTime(1075);
      await verifyBalanceChange(testAuctionHouse.address, 10, async () =>
        verifyBalanceChange(accounts[1], -10, async () =>
          testAuctionHouse.finishAuction(auctionId, { from: accounts[0] })
        )
      )
      assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[2]);
    })

    it("Test7: Put bid:721<->ETH,  with fee auction, after finish auction, nft goes to buyer", async () => {
      //auction initialize
      await erc721.mint(accounts[1], erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);
      const encodedEth = enc(testAuctionHouse.address);
      let buyAssetType = await AssetType(ETH, encodedEth);
      let auctionFees = [[accounts[6], 1000], [accounts[7], 2000]];
      let startTime = await timeNow();
      let endTime = startTime + 60;//auction finished 1hours ago

      let dataV1 = await encDataV1([[], auctionFees, 1000, startTime, 180]); //originFees, duration, startTime, buyOutPrice

      let resultStartAuction = await testAuctionHouse.startAuction(sellAsset, buyAssetType, endTime, 1, 90, dataV1Type, dataV1, { from: accounts[1] });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address);
      //bid initialize
      let auctionId = 1;
      let bidFees = [];
      let bidDataV1 = await bidEncDataV1([[], bidFees]);
      let bid = { amount: 100, dataType: bidDataV1Type, data: bidDataV1 };
      await verifyBalanceChange(accounts[2], 103, async () =>
        verifyBalanceChange(testAuctionHouse.address, -103, async () =>
          testAuctionHouse.putBid(auctionId, bid, { from: accounts[2], value: 150, gasPrice: 0 })
        )
      )
      await increaseTime(1075);
      await verifyBalanceChange(testAuctionHouse.address, 103, async () =>
        verifyBalanceChange(accounts[1], -67, async () =>
          verifyBalanceChange(accounts[6], -10, async () =>
            verifyBalanceChange(accounts[7], -20, async () =>
              verifyBalanceChange(protocol, -6, async () =>
                testAuctionHouse.finishAuction(auctionId, { from: accounts[0] })
              )
            )
          )
        )
      )
      assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[2]);
    })

    it("Test8: Put bid:721<->1155, with fee auction, after finish auction, nft goes to buyer", async () => {
      //auction initialize
      await erc721.mint(accounts[1], erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });
      await erc1155.mint(accounts[2], erc1155TokenId1, 200);
      await erc1155.setApprovalForAll(transferProxy.address, true, { from: accounts[2] });
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);
      const encoded1155 = enc(erc1155.address, erc1155TokenId1);
      let buyAssetType = await AssetType(ERC1155, encoded1155);
      let auctionFees = [[accounts[6], 1000], [accounts[7], 2000]];
      let startTime = await timeNow();
      let endTime = startTime + 60;//auction finished 1hours ago

      let dataV1 = await encDataV1([[], auctionFees, 1000, startTime, 180]); //originFees, duration, startTime, buyOutPrice

      let resultStartAuction = await testAuctionHouse.startAuction(sellAsset, buyAssetType, endTime, 1, 90, dataV1Type, dataV1, { from: accounts[1] });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address);
      //bid initialize
      let auctionId = 1;
      let bidFees = [];
      let bidDataV1 = await bidEncDataV1([[], bidFees]);
      let bid = { amount: 100, dataType: bidDataV1Type, data: bidDataV1 };
      let resultPutBid = await testAuctionHouse.putBid(auctionId, bid, { from: accounts[2] });
      assert.equal(await erc1155.balanceOf(testAuctionHouse.address, erc1155TokenId1), 103);
      assert.equal(await erc1155.balanceOf(accounts[2], erc1155TokenId1), 97);
      await increaseTime(1075);
      let resultFinishAuction = await testAuctionHouse.finishAuction(auctionId, { from: accounts[0] });
      assert.equal(await erc1155.balanceOf(testAuctionHouse.address, erc1155TokenId1), 0);
      assert.equal(await erc1155.balanceOf(accounts[1], erc1155TokenId1), 67);
      assert.equal(await erc1155.balanceOf(accounts[6], erc1155TokenId1), 10);
      assert.equal(await erc1155.balanceOf(accounts[7], erc1155TokenId1), 20);
      assert.equal(await erc1155.balanceOf(protocol, erc1155TokenId1), 6);
      assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[2]); // after mint owner is testAuctionHouse
    })

    it("Test9: Put bid:1155<->20, with fee bid, after finish auction, 1155 goes to fee-masters and buyer", async () => {
      //auction initialize
      await erc1155.mint(accounts[1], erc1155TokenId1, 100);
      await erc1155.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });
      await erc20Token.mint(accounts[2], 1000);
      await erc20Token.approve(erc20TransferProxy.address, 1000, { from: accounts[2] });

      let sellAsset = await Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100);
      const encodedERC20 = enc(erc20Token.address);
      let buyAssetType = await AssetType(ERC20, encodedERC20);
      let auctionFees = [];
      let startTime = await timeNow();
      let endTime = startTime + 60;//auction finished 1hours ago

      let dataV1 = await encDataV1([[], auctionFees, 1000, startTime, 180]); //originFees, duration, startTime, buyOutPrice

      let resultStartAuction = await testAuctionHouse.startAuction(sellAsset, buyAssetType, endTime, 1, 100, dataV1Type, dataV1, { from: accounts[1] });
      assert.equal(await erc1155.balanceOf(testAuctionHouse.address, erc1155TokenId1), 100);
      //bid initialize
      let auctionId = 1;
      let bidFees = [[accounts[6], 1000], [accounts[7], 2000]];
      let bidDataV1 = await bidEncDataV1([[], bidFees]);
      let bid = { amount: 100, dataType: bidDataV1Type, data: bidDataV1 };
      let resultPutBid = await testAuctionHouse.putBid(auctionId, bid, { from: accounts[2] });
      assert.equal(await erc1155.balanceOf(testAuctionHouse.address, erc1155TokenId1), 100);
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 133);
      assert.equal(await erc20Token.balanceOf(accounts[2]), 867);
      await increaseTime(1075);
      let resultFinishAuction = await testAuctionHouse.finishAuction(auctionId, { from: accounts[0] });
      assert.equal(await erc1155.balanceOf(testAuctionHouse.address, erc1155TokenId1), 0);
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 0);
      assert.equal(await erc1155.balanceOf(accounts[2], erc1155TokenId1), 100);

      assert.equal(await erc20Token.balanceOf(protocol), 6);
      assert.equal(await erc20Token.balanceOf(accounts[1]), 97); 
      assert.equal(await erc20Token.balanceOf(accounts[6]), 10); 
      assert.equal(await erc20Token.balanceOf(accounts[7]), 20); 

    })
  });

  describe("cancel auction", () => {
    it("No bid , after cancel auction return 721", async () => {
      //auction initialize
      await erc721.mint(accounts[1], erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });
      await erc20Token.mint(accounts[2], 100);
      await erc20Token.approve(erc20TransferProxy.address, 100, { from: accounts[2] });
      const encodedERC20 = enc(erc20Token.address);
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);

      let buyAssetType = await AssetType(ERC20, encodedERC20);
      let auctionFees = [[accounts[3], 100]];
      let endTime = await timeNow();
      let dataV1 = await encDataV1([[], auctionFees, 1000, endTime, 18]); //originFees, duration, startTime, buyOutPrice

      let dataV1Type = id("V1");
      let resultStartAuction = await testAuctionHouse.startAuction(sellAsset, buyAssetType, 0, 1, 9, dataV1Type, dataV1, { from: accounts[1] });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after mint owner is testAuctionHouse
      let auctionId = 1;
      let resultFinishAuction = await testAuctionHouse.cancel(auctionId, { from: accounts[1] });
      assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[1]); // after mint owner is testAuctionHouse
    })

    it("Put bid:721<->20, after cancel auction, no changes, because bid already put", async () => {
      //auction initialize
      await erc721.mint(accounts[1], erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });
      await erc721.setApprovalForAll(accounts[0], true, { from: accounts[1] });
      await erc20Token.mint(accounts[2], 100);
      await erc20Token.approve(erc20TransferProxy.address, 100, { from: accounts[2] });
      const encodedERC20 = enc(erc20Token.address);
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);

      let buyAssetType = await AssetType(ERC20, encodedERC20);
      let auctionFees = [[accounts[3], 100], [accounts[4], 300]];
      let endTime = await timeNow();
      let dataV1 = await encDataV1([[], auctionFees, 1000, endTime, 18]); //originFees, duration, startTime, buyOutPrice

      let dataV1Type = id("V1");
      let resultStartAuction = await testAuctionHouse.startAuction(sellAsset, buyAssetType, 0, 1, 9, dataV1Type, dataV1, { from: accounts[1] });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after mint owner is testAuctionHouse
      //bid initialize
      let auctionId = 1;
      let bidFees = [[accounts[6], 1500], [accounts[7], 3500]];
      let bidDataV1 = await bidEncDataV1([[], bidFees]);
      let bidDataV1Type = id("V1");
      let bid = { amount: 10, dataType: bidDataV1Type, data: bidDataV1 };
      let resultPutBid = await testAuctionHouse.putBid(auctionId, bid, { from: accounts[2] });
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 14);
      assert.equal(await erc20Token.balanceOf(accounts[2]), 86);

      let resultFinishAuction = await testAuctionHouse.cancel(auctionId, { from: accounts[1] });
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 14);
      assert.equal(await erc20Token.balanceOf(accounts[1]), 0);
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after mint owner is testAuctionHouse
    })
  });

  describe("buyOut auction", () => {
    it("No bid: 721<->20, buyOut works, good!", async () => {
      //auction initialize
      await erc721.mint(accounts[1], erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });
      await erc20Token.mint(accounts[2], 200);
      await erc20Token.approve(erc20TransferProxy.address, 200, { from: accounts[2] });
      const encodedERC20Local = enc(erc20Token.address);
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);

      let buyAssetType = await AssetType(ERC20, encodedERC20Local);
      let auctionFees = [[accounts[3], 1000]];
      let startTime = await timeNow();
      var localtime = startTime
      startTime = startTime - 60;
      let endTime = startTime + 3600;

      let dataV1 = await encDataV1([[], auctionFees, 1000, 0, 100]); //originFees, duration, startTime, buyOutPrice
      let dataV1Type = id("V1");
      let resultStartAuction = await testAuctionHouse.startAuction(sellAsset, buyAssetType, 0, 1, 90, dataV1Type, dataV1, { from: accounts[1] });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after mint owner is testAuctionHouse

      let auctionId = 1;
      let bidFees = [];
      let bidDataV1 = await bidEncDataV1([[], bidFees]);
      let bidDataV1Type = id("V1");
      let bid = { amount: 100, dataType: bidDataV1Type, data: bidDataV1 };
      let resultFinishAuction = await testAuctionHouse.buyOut(auctionId, bid, { from: accounts[2] });
      assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[2]); // after payOut owner is mr. payOut
      assert.equal(await erc20Token.balanceOf(accounts[1]), 87);
      assert.equal(await erc20Token.balanceOf(accounts[3]), 10);
      assert.equal(await erc20Token.balanceOf(protocol), 6);
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 0);
    })

    it("Put bid:721<->20, buyOut works, good! ", async () => {
      //auction initialize
      await erc721.mint(accounts[1], erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });
      await erc721.setApprovalForAll(accounts[0], true, { from: accounts[1] });
      await erc20Token.mint(accounts[2], 100);
      await erc20Token.approve(erc20TransferProxy.address, 100, { from: accounts[2] });
      const encodedERC20 = enc(erc20Token.address);
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);

      let buyAssetType = await AssetType(ERC20, encodedERC20);
      let auctionFees = [[accounts[3], 1000]];
      let startTime = await timeNow();
      let endTime = startTime + 3600;
      let dataV1 = await encDataV1([[], auctionFees, 1000, startTime, 100]); //originFees, duration, startTime, buyOutPrice

      let dataV1Type = id("V1");
      let resultStartAuction = await testAuctionHouse.startAuction(sellAsset, buyAssetType, endTime, 1, 90, dataV1Type, dataV1, { from: accounts[1] });
      assert.equal(await erc721.ownerOf(erc721TokenId1), testAuctionHouse.address); // after mint owner is testAuctionHouse
      //bid initialize
      let auctionId = 1;
      let bidFees = [];
      let bidDataV1 = await bidEncDataV1([[], bidFees]);
      let bidDataV1Type = id("V1");
      let bid = { amount: 95, dataType: bidDataV1Type, data: bidDataV1 };
      let resultPutBid = await testAuctionHouse.putBid(auctionId, bid, { from: accounts[2] });
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 97);
      assert.equal(await erc20Token.balanceOf(accounts[2]), 3);

      await erc20Token.mint(accounts[4], 1000);
      await erc20Token.approve(erc20TransferProxy.address, 1000, { from: accounts[4] });
      bid = { amount: 100, dataType: bidDataV1Type, data: bidDataV1 };
      let resultPayOutAuction = await testAuctionHouse.buyOut(auctionId, bid, { from: accounts[4] }); //accounts[4] buyOut
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 0);
      assert.equal(await erc20Token.balanceOf(accounts[1]), 87);  //NFTAuctionInitiator get buyOut value - fee protocol - fee
      assert.equal(await erc20Token.balanceOf(accounts[3]), 10);  //to fee
      assert.equal(await erc20Token.balanceOf(protocol), 6);  //to protocol
      assert.equal(await erc20Token.balanceOf(accounts[2]), 100); //first pitBidder, return all ERC20
      assert.equal(await erc20Token.balanceOf(accounts[4]), 897);
      assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[4]); // after mint owner is accounts[4]
      //
    })

    it("No bid:721<->ETH, payOut works, good!", async () => {
      //auction initialize
      await erc721.mint(accounts[1], erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);
      const encodedEth = enc(accounts[5]);
      let buyAssetType = await AssetType(ETH, encodedEth);
      let auctionFees = [[accounts[3], 1000]];
      let startTime = await timeNow();
      let endTime = startTime + 36000;
      let dataV1 = await encDataV1([[], auctionFees, 1000, startTime, 100]); //originFees, duration, startTime, buyOutPrice

      let dataV1Type = id("V1");
      let resultStartAuction = await testAuctionHouse.startAuction(sellAsset, buyAssetType, endTime, 1, 90, dataV1Type, dataV1, { from: accounts[1] });
      //bid initialize
      let auctionId = 1;
      let bidFees = [];
      let bidDataV1 = await bidEncDataV1([[], bidFees]);
      let bidDataV1Type = id("V1");
      let bid = { amount: 100, dataType: bidDataV1Type, data: bidDataV1 };
      await verifyBalanceChange(accounts[2], 103, async () =>
        verifyBalanceChange(accounts[1], -87, async () =>
          verifyBalanceChange(accounts[3], -10, async () =>
            verifyBalanceChange(protocol, -6, async () =>
              testAuctionHouse.buyOut(auctionId, bid, { from: accounts[2], value: 200, gasPrice: 0 })
            )
          )
        )
      )
      assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[2]); // after payOut owner is mr. payOut
    })

  });

  describe("protocol fee", () => {
    it("should correctly work if protocolFee changes", async () => {
      //auction initialize
      await erc721.mint(accounts[1], erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });
      await erc20Token.mint(accounts[2], 100);
      await erc20Token.approve(erc20TransferProxy.address, 100, { from: accounts[2] });
      const encodedERC20 = enc(erc20Token.address);
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);

      let buyAssetType = await AssetType(ERC20, encodedERC20);
      let auctionFees = [[accounts[3], 100], [accounts[4], 300]];
      let endTime = await timeNow();
      let dataV1 = await encDataV1([[], auctionFees, 1000, endTime, 18]); //originFees, duration, startTime, buyOutPrice

      let dataV1Type = id("V1");
      let resultStartAuction = await testAuctionHouse.startAuction(sellAsset, buyAssetType, 0, 1, 9, dataV1Type, dataV1, { from: accounts[1] });
      await testAuctionHouse.setProtocolFee(2000)
      //bid initialize
      let auctionId = 1;
      let bidFees = [[accounts[6], 2000]];
      let bidDataV1 = await bidEncDataV1([[], bidFees]);
      let bidDataV1Type = id("V1");
      let bid = { amount: 10, dataType: bidDataV1Type, data: bidDataV1 };
      let resultPutBid = await testAuctionHouse.putBid(auctionId, bid, { from: accounts[2] });
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 12);

      await erc20Token.mint(accounts[7], 100);
      await erc20Token.approve(erc20TransferProxy.address, 100, { from: accounts[7] });

      bid = { amount: 20, dataType: bidDataV1Type, data: bidDataV1 };
      resultPutBid = await testAuctionHouse.putBid(auctionId, bid, { from: accounts[7] });
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 0);
      assert.equal(await erc20Token.balanceOf(accounts[2]), 100);
      assert.equal(await erc20Token.balanceOf(accounts[6]), 4);
      assert.equal(await erc20Token.balanceOf(accounts[7]), 76);
      assert.equal(await erc20Token.balanceOf(accounts[1]), 19);
      assert.equal(await erc20Token.balanceOf(protocol), 1);
      assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[7]);

      await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[7] });
      await testAuctionHouse.startAuction(sellAsset, buyAssetType, 0, 1, 9, dataV1Type, dataV1, { from: accounts[7] });
      await testAuctionHouse.putBid(2, bid, { from: accounts[2] });
      assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[2]);
      assert.equal(await erc20Token.balanceOf(testAuctionHouse.address), 0);
      assert.equal(await erc20Token.balanceOf(accounts[2]), 72);
      assert.equal(await erc20Token.balanceOf(accounts[7]), 92);
      assert.equal(await erc20Token.balanceOf(accounts[6]), 8);
      assert.equal(await erc20Token.balanceOf(protocol), 9);
    })
  });


  function encDataV1(tuple) {
    return testAuctionHouse.encode(tuple);
  }

  function bidEncDataV1(tuple) {
    return testAuctionHouse.encodeBid(tuple);
  }

});
