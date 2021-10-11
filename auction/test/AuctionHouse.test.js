const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const TestERC20 = artifacts.require("TestERC20.sol");
const TestERC721 = artifacts.require("TestERC721.sol");
const TestERC1155 = artifacts.require("TestERC1155.sol");
const TransferProxyTest = artifacts.require("TransferProxyTest.sol");
const ERC20TransferProxyTest = artifacts.require("ERC20TransferProxyTest.sol");
const truffleAssert = require('truffle-assertions');
const AuctionHouse = artifacts.require("AuctionHouse");

const DAY = 86400;
const WEEK = DAY * 7;
const { Order, Asset, AssetType, sign } = require("../../exchange-v2/test/order");
const ZERO = "0x0000000000000000000000000000000000000000";
const { expectThrow, verifyBalanceChange } = require("@daonomic/tests-common");
const { ETH, ERC20, ERC721, ERC1155, enc, id } = require("../../exchange-v2/test/assets.js");

const tests = require("@daonomic/tests-common");
const increaseTime = tests.increaseTime;

contract("Check Auction", accounts => {
  let transferProxy;
  let erc20TransferProxy;
  let erc721TokenId1 = 53;
  let erc1155TokenId1 = 54;
  let auctionHouse;

  beforeEach(async () => {
    transferProxy = await TransferProxyTest.new();
    erc20TransferProxy = await ERC20TransferProxyTest.new();
    erc20Token = await TestERC20.new();
    /*ERC721 */
    erc721 = await TestERC721.new("Rarible", "RARI", "https://ipfs.rarible.com");
    /*ERC1155*/
    erc1155 = await TestERC1155.new("https://ipfs.rarible.com");

    auctionHouse = await deployProxy(AuctionHouse, [transferProxy.address, erc20TransferProxy.address], { initializer: "__AuctionHouse_init" });

  });

  describe("create auction", () => {
    it("Check creation with ERC721, and start auction owner is auctionHouse", async () => {
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
      assert.equal(await erc1155.balanceOf(auctionHouse.address, erc1155TokenId1), 7); // after mint owner is auctionHouse
    })

    //TODO Check creation with ERC20
  });

  describe("bid auction", () => {
    it("Create auction:721<->20, put bid, walue = 10", async () => {
      //auction initialize
      await erc721.mint(accounts[1], erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
      await erc20Token.mint(accounts[2], 100);
      await erc20Token.approve(erc20TransferProxy.address, 100, { from: accounts[2] });
      const encodedERC20 = enc(erc20Token.address);
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);

      let buyAssetType = await AssetType(ERC20, encodedERC20);
      let auctionFees = [[accounts[3], 100], [accounts[4], 300]];
      let endTime = await Math.floor(Date.now()/1000);
      let dataV1 = await encDataV1([auctionFees, 1000, endTime, 18]); //originFees, duration, startTime, buyOutPrice

      let dataV1Type = id("V1");
      let resultStartAuction = await auctionHouse.startAuction( sellAsset, buyAssetType, 0, 1, 9, dataV1Type, dataV1, {from: accounts[1]});
      //bid initialize
      let auctionId = 1;
      let bidFees = [[accounts[6], 1500], [accounts[7], 3500]];
      let bidDataV1 = await bidEncDataV1([bidFees]);
      let bidDataV1Type = id("V1");
      let bid = {amount:10, dataType:bidDataV1Type, data:bidDataV1};
      let resultPutBid = await auctionHouse.putBid(auctionId, bid, {from: accounts[2]});
      assert.equal(await erc20Token.balanceOf(auctionHouse.address), 10);
    })

    it("Create auction:721<->20, put bid, walue = 10, after that put another bid = 11", async () => {
      //auction initialize
      await erc721.mint(accounts[1], erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
      await erc20Token.mint(accounts[2], 100);
      await erc20Token.approve(erc20TransferProxy.address, 100, { from: accounts[2] });
      const encodedERC20 = enc(erc20Token.address);
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);

      let buyAssetType = await AssetType(ERC20, encodedERC20);
      let auctionFees = [[accounts[3], 100], [accounts[4], 300]];
      let endTime = await Math.floor(Date.now()/1000);
      let dataV1 = await encDataV1([auctionFees, 1000, endTime, 18]); //originFees, duration, startTime, buyOutPrice

      let dataV1Type = id("V1");
      let resultStartAuction = await auctionHouse.startAuction( sellAsset, buyAssetType, 0, 1, 9, dataV1Type, dataV1, {from: accounts[1]});
      //bid initialize
      let auctionId = 1;
      let bidFees = [[accounts[6], 1500]];
      let bidDataV1 = await bidEncDataV1([bidFees]);
      let bidDataV1Type = id("V1");
      let bid = {amount:10, dataType:bidDataV1Type, data:bidDataV1};
      let resultPutBid = await auctionHouse.putBid(auctionId, bid, {from: accounts[2]});
      assert.equal(await erc20Token.balanceOf(auctionHouse.address), 10);

      await erc20Token.mint(accounts[7], 100);
      await erc20Token.approve(erc20TransferProxy.address, 100, { from: accounts[7] });
      bid = {amount:11, dataType:bidDataV1Type, data:bidDataV1};
      resultPutBid = await auctionHouse.putBid(auctionId, bid, {from: accounts[7]});
      assert.equal(await erc20Token.balanceOf(auctionHouse.address), 11);
      assert.equal(await erc20Token.balanceOf(accounts[2]), 100);
      assert.equal(await erc20Token.balanceOf(accounts[7]), 89);
    })

    it("Create auction:721<->ETH, put bid, walue = 10", async () => {
      //auction initialize
      await erc721.mint(accounts[1], erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);
      const encodedEth = enc(accounts[5]);
      let buyAssetType = await AssetType(ETH, encodedEth);
      let auctionFees = [[accounts[3], 100], [accounts[4], 300]];
      let endTime = await Math.floor(Date.now()/1000);
      let dataV1 = await encDataV1([auctionFees, 1000, endTime, 18]); //originFees, duration, startTime, buyOutPrice

      let dataV1Type = id("V1");
      let resultStartAuction = await auctionHouse.startAuction( sellAsset, buyAssetType, 0, 1, 9, dataV1Type, dataV1, {from: accounts[1]});
      //bid initialize
      let auctionId = 1;
      let bidFees = [[accounts[6], 1500], [accounts[7], 3500]];
      let bidDataV1 = await bidEncDataV1([bidFees]);
      let bidDataV1Type = id("V1");
      let bid = {amount:10, dataType:bidDataV1Type, data:bidDataV1};
    	await verifyBalanceChange(accounts[2], 10, async () =>
    	  verifyBalanceChange(auctionHouse.address, -10, async () =>
          auctionHouse.putBid(auctionId, bid, { from: accounts[2], value: 15, gasPrice: 0 })
    	  )
    	)
    })

    it("Create auction:721<->ETH, put bid, walue = 10 after put second bid value = 11", async () => {
      //auction initialize
      await erc721.mint(accounts[1], erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);
      const encodedEth = enc(accounts[5]);
      let buyAssetType = await AssetType(ETH, encodedEth);
      let auctionFees = [[accounts[3], 100], [accounts[4], 300]];
      let endTime = await Math.floor(Date.now()/1000);
      let dataV1 = await encDataV1([auctionFees, 1000, endTime, 18]); //originFees, duration, startTime, buyOutPrice

      let dataV1Type = id("V1");
      let resultStartAuction = await auctionHouse.startAuction( sellAsset, buyAssetType, 0, 1, 9, dataV1Type, dataV1, {from: accounts[1]});
      //bid initialize
      let auctionId = 1;
      let bidFees = [[accounts[6], 1500]];
      let bidDataV1 = await bidEncDataV1([bidFees]);
      let bidDataV1Type = id("V1");

      let bid = {amount:10, dataType:bidDataV1Type, data:bidDataV1};  //amount == 10
    	await verifyBalanceChange(accounts[2], 10, async () =>  //accounts[2] balanceChange to 10, because 5 roll back
    		verifyBalanceChange(auctionHouse.address, -10, async () =>  //to contract
          auctionHouse.putBid(auctionId, bid, { from: accounts[2], value: 15, gasPrice: 0 }) //more eth, than need
    		)
    	)
      bid = {amount:11, dataType:bidDataV1Type, data:bidDataV1};
      await verifyBalanceChange(accounts[7], 11, async () =>
    		verifyBalanceChange(accounts[2], -10, async () =>
    		  verifyBalanceChange(auctionHouse.address, -1, async () =>
            auctionHouse.putBid(auctionId, bid, { from: accounts[7], value: 30, gasPrice: 0 })
          )
    		)
    	)
    })

    //TODO CHECK 1155<->20, 1155<->ETH
  });

  describe("finish auction", () => {
    it("No bid , after finish auction return 721", async () => {
      //auction initialize
      await erc721.mint(accounts[1], erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
      await erc20Token.mint(accounts[2], 100);
      await erc20Token.approve(erc20TransferProxy.address, 100, { from: accounts[2] });
      const encodedERC20 = enc(erc20Token.address);
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);

      let buyAssetType = await AssetType(ERC20, encodedERC20);
      let auctionFees = [[accounts[3], 100]];
      let endTime = await Math.floor(Date.now()/1000);
      let dataV1 = await encDataV1([auctionFees, 1000, endTime, 18]); //originFees, duration, startTime, buyOutPrice

      let dataV1Type = id("V1");
      let resultStartAuction = await auctionHouse.startAuction( sellAsset, buyAssetType, 0, 1, 9, dataV1Type, dataV1, {from: accounts[1]});
      assert.equal(await erc721.ownerOf(erc721TokenId1), auctionHouse.address); // after mint owner is auctionHouse
      let auctionId = 1;
      let resultFinishAuction = await auctionHouse.finishAuction(auctionId, {from: accounts[0]});
      assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[1]); // after mint owner is auctionHouse
    })

    it("Put bid:721<->20, after finish auction", async () => {
      //auction initialize
      await erc721.mint(accounts[1], erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
      await erc721.setApprovalForAll(accounts[0], true, {from: accounts[1]});
      await erc20Token.mint(accounts[2], 100);
      await erc20Token.approve(erc20TransferProxy.address, 100, { from: accounts[2] });
      const encodedERC20 = enc(erc20Token.address);
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);

      let buyAssetType = await AssetType(ERC20, encodedERC20);
      let auctionFees = [[accounts[3], 100], [accounts[4], 300]];
      let endTime = await Math.floor(Date.now()/1000);
      let dataV1 = await encDataV1([auctionFees, 1000, endTime, 18]); //originFees, duration, startTime, buyOutPrice

      let dataV1Type = id("V1");
      let resultStartAuction = await auctionHouse.startAuction( sellAsset, buyAssetType, 0, 1, 9, dataV1Type, dataV1, {from: accounts[1]});
      assert.equal(await erc721.ownerOf(erc721TokenId1), auctionHouse.address); // after mint owner is auctionHouse
      //bid initialize
      let auctionId = 1;
      let bidFees = [[accounts[6], 1500], [accounts[7], 3500]];
      let bidDataV1 = await bidEncDataV1([bidFees]);
      let bidDataV1Type = id("V1");
      let bid = {amount:10, dataType:bidDataV1Type, data:bidDataV1};
      let resultPutBid = await auctionHouse.putBid(auctionId, bid, {from: accounts[2]});
      assert.equal(await erc20Token.balanceOf(auctionHouse.address), 10);
      assert.equal(await erc20Token.balanceOf(accounts[2]), 90);

      let resultFinishAuction = await auctionHouse.finishAuction(auctionId, {from: accounts[0]});
      assert.equal(await erc20Token.balanceOf(auctionHouse.address), 0);
      assert.equal(await erc20Token.balanceOf(accounts[1]), 10);
//      assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[2]); // after mint owner is auctionHouse
      //
    })

//    it("Put bid:721<->ETH", async () => {
//      //auction initialize
//      await erc721.mint(accounts[1], erc721TokenId1);
//      await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
//      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);
//      const encodedEth = enc(accounts[5]);
//      let buyAssetType = await AssetType(ETH, encodedEth);
//      let auctionFees = [[accounts[3], 100], [accounts[4], 300]];
//      let endTime = await Math.floor(Date.now()/1000);
//      let dataV1 = await encDataV1([auctionFees, 1000, endTime, 18]); //originFees, duration, startTime, buyOutPrice
//
//      let dataV1Type = id("V1");
//      let resultStartAuction = await auctionHouse.startAuction( sellAsset, buyAssetType, 0, 1, 9, dataV1Type, dataV1, {from: accounts[1]});
//      //bid initialize
//      let auctionId = 1;
//      let bidFees = [[accounts[6], 1500], [accounts[7], 3500]];
//      let bidDataV1 = await bidEncDataV1([bidFees]);
//      let bidDataV1Type = id("V1");
//      let bid = {amount:10, dataType:bidDataV1Type, data:bidDataV1};
//      auctionHouse.setEthAddress(accounts[5]);
//    	  await verifyBalanceChange(accounts[2], 15, async () =>
//    		verifyBalanceChange(accounts[5], -10, async () =>
//         auctionHouse.putBid(auctionId, bid, { from: accounts[2], value: 15, gasPrice: 0 })
//    		)
//    	)
//    })
  });

  describe("cancel auction", () => {
    it("No bid , after cancel auction return 721", async () => {
      //auction initialize
      await erc721.mint(accounts[1], erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
      await erc20Token.mint(accounts[2], 100);
      await erc20Token.approve(erc20TransferProxy.address, 100, { from: accounts[2] });
      const encodedERC20 = enc(erc20Token.address);
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);

      let buyAssetType = await AssetType(ERC20, encodedERC20);
      let auctionFees = [[accounts[3], 100]];
      let endTime = await Math.floor(Date.now()/1000);
      let dataV1 = await encDataV1([auctionFees, 1000, endTime, 18]); //originFees, duration, startTime, buyOutPrice

      let dataV1Type = id("V1");
      let resultStartAuction = await auctionHouse.startAuction( sellAsset, buyAssetType, 0, 1, 9, dataV1Type, dataV1, {from: accounts[1]});
      assert.equal(await erc721.ownerOf(erc721TokenId1), auctionHouse.address); // after mint owner is auctionHouse
      let auctionId = 1;
      let resultFinishAuction = await auctionHouse.cancel(auctionId, {from: accounts[1]});
      assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[1]); // after mint owner is auctionHouse
    })

    it("Put bid:721<->20, after cancel auction, no changes, because bid already put", async () => {
      //auction initialize
      await erc721.mint(accounts[1], erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
      await erc721.setApprovalForAll(accounts[0], true, {from: accounts[1]});
      await erc20Token.mint(accounts[2], 100);
      await erc20Token.approve(erc20TransferProxy.address, 100, { from: accounts[2] });
      const encodedERC20 = enc(erc20Token.address);
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);

      let buyAssetType = await AssetType(ERC20, encodedERC20);
      let auctionFees = [[accounts[3], 100], [accounts[4], 300]];
      let endTime = await Math.floor(Date.now()/1000);
      let dataV1 = await encDataV1([auctionFees, 1000, endTime, 18]); //originFees, duration, startTime, buyOutPrice

      let dataV1Type = id("V1");
      let resultStartAuction = await auctionHouse.startAuction( sellAsset, buyAssetType, 0, 1, 9, dataV1Type, dataV1, {from: accounts[1]});
      assert.equal(await erc721.ownerOf(erc721TokenId1), auctionHouse.address); // after mint owner is auctionHouse
      //bid initialize
      let auctionId = 1;
      let bidFees = [[accounts[6], 1500], [accounts[7], 3500]];
      let bidDataV1 = await bidEncDataV1([bidFees]);
      let bidDataV1Type = id("V1");
      let bid = {amount:10, dataType:bidDataV1Type, data:bidDataV1};
      let resultPutBid = await auctionHouse.putBid(auctionId, bid, {from: accounts[2]});
      assert.equal(await erc20Token.balanceOf(auctionHouse.address), 10);
      assert.equal(await erc20Token.balanceOf(accounts[2]), 90);

      let resultFinishAuction = await auctionHouse.cancel(auctionId, {from: accounts[1]});
      assert.equal(await erc20Token.balanceOf(auctionHouse.address), 10);
      assert.equal(await erc20Token.balanceOf(accounts[1]), 0);
      assert.equal(await erc721.ownerOf(erc721TokenId1), auctionHouse.address); // after mint owner is auctionHouse
      //
    })
  });

  function encDataV1(tuple) {
      return auctionHouse.encode(tuple);
  }

  function bidEncDataV1(tuple) {
      return auctionHouse.encodeBid(tuple);
  }

  function bidEncDataV1(tuple) {
      return auctionHouse.encodeBid(tuple);
  }

});
