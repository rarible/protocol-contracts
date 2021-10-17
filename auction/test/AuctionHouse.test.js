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
const eth = "0x0000000000000000000000000000000000000000";
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
    /*Initialize AuctionHouse*/
//    auctionHouse = await deployProxy(AuctionHouse, [transferProxy.address, erc20TransferProxy.address, 300, community], { initializer: "__AuctionHouse_init"});
    auctionHouse = await AuctionHouse.new();
    auctionHouse.__AuctionHouse_init(transferProxy.address, erc20TransferProxy.address, 300, community);
    await auctionHouse.setFeeReceiver(eth, protocol);//
    await auctionHouse.setFeeReceiver(erc20Token.address, protocol);//
    await auctionHouse.setFeeReceiver(erc721.address, protocol);//
    await auctionHouse.setFeeReceiver(erc1155.address, protocol);//
  });

  //nft, erc20 initialize
  async function prepare721_20(){
    await erc721.mint(accounts[1], erc721TokenId1);
    await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
    await erc20Token.mint(accounts[2], 100);
    await erc20Token.approve(erc20TransferProxy.address, 100, { from: accounts[2] });
    encodedERC20 = enc(erc20Token.address);
  };

  async function prepare721_20value(value){
    await erc721.mint(accounts[1], erc721TokenId1);
    await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
    await erc20Token.mint(accounts[2], value);
    await erc20Token.approve(erc20TransferProxy.address, value, { from: accounts[2] });
    encodedERC20 = enc(erc20Token.address);
  };


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
    it("No bid, try finish auction not start yet, return NFT, ok", async () => {
      await prepare721_20();//nft, erc20 initialize
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);

      let buyAssetType = await AssetType(ERC20, encodedERC20);
      let auctionFees = [];
      let startTime = await Math.floor(Date.now()/1000); //define start time
      startTime = startTime + 100; //auction will start after 100 sec
      let endTime = startTime + 3600;
      let dataV1 = await encDataV1([auctionFees, 1000, startTime, 18]); //originFees, duration, startTime, buyOutPrice

      let resultStartAuction = await auctionHouse.startAuction( sellAsset, buyAssetType, endTime, 1, 9, dataV1Type, dataV1, {from: accounts[1]});
      assert.equal(await erc721.ownerOf(erc721TokenId1), auctionHouse.address); // after mint owner is auctionHouse
      let auctionId = 1;
      let resultFinishAuction = await auctionHouse.finishAuction(auctionId, {from: accounts[0]});
      assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[1]); // after mint owner is auctionHouse
    })

    it("No bid, try finish auction already finished, return NFT", async () => {
      await prepare721_20();//auction initialize
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);

      let buyAssetType = await AssetType(ERC20, encodedERC20);
      let auctionFees = [[accounts[3], 100]];
      let startTime = await Math.floor(Date.now()/1000); //define start time
      startTime = startTime - 7200; //auction started 2hours ago
      let endTime = startTime - 3600;//auction finished 1hours ago
      let dataV1 = await encDataV1([auctionFees, 1000, startTime, 18]); //originFees, duration, startTime, buyOutPrice

      let resultStartAuction = await auctionHouse.startAuction( sellAsset, buyAssetType, endTime, 1, 9, dataV1Type, dataV1, {from: accounts[1]});
      assert.equal(await erc721.ownerOf(erc721TokenId1), auctionHouse.address); // after mint owner is auctionHouse
      let auctionId = 1;
      let resultFinishAuction = await auctionHouse.finishAuction(auctionId, {from: accounts[0]});
      assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[1]); // after mint owner is auctionHouse
    })

    it("No bid, try finish auction running now, throw", async () => {
      await prepare721_20();//nft, erc20 initialize
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);

      let buyAssetType = await AssetType(ERC20, encodedERC20);
      let auctionFees = [[accounts[3], 100]];
      let startTime = await Math.floor(Date.now()/1000); //define start time
      startTime = startTime - 120; //auction started 2min ago
      let endTime = startTime + 3600;//auction finished 1hours later
      let dataV1 = await encDataV1([auctionFees, 1000, startTime, 18]); //originFees, duration, startTime, buyOutPrice

      let resultStartAuction = await auctionHouse.startAuction( sellAsset, buyAssetType, endTime, 1, 9, dataV1Type, dataV1, {from: accounts[1]});
      assert.equal(await erc721.ownerOf(erc721TokenId1), auctionHouse.address); // after mint owner is auctionHouse
      let auctionId = 1;
      await expectThrow(
        auctionHouse.finishAuction(auctionId, {from: accounts[0]})
      );
    })

    it("Put bid:721<->20, no fee auction, after finish auction, nft goes to buyer", async () => {
      await prepare721_20();//nft, erc20 initialize
      await erc721.setApprovalForAll(accounts[0], true, {from: accounts[1]});
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);

      let buyAssetType = await AssetType(ERC20, encodedERC20);
      let auctionFees = [];
      let startTime = await Math.floor(Date.now()/1000); //define start time
      let endTime = startTime + 3600;//auction finished 1hours ago
      let dataV1 = await encDataV1([auctionFees, 1000, startTime, 18]); //originFees, duration, startTime, buyOutPrice

      let resultStartAuction = await auctionHouse.startAuction( sellAsset, buyAssetType, endTime, 1, 9, dataV1Type, dataV1, {from: accounts[1]});
      assert.equal(await erc721.ownerOf(erc721TokenId1), auctionHouse.address); // after mint owner is auctionHouse
      //bid initialize
      let auctionId = 1;
      let bidFees = [[accounts[6], 1500], [accounts[7], 3500]];
      let bidDataV1 = await bidEncDataV1([bidFees]);

      let bid = {amount:10, dataType:bidDataV1Type, data:bidDataV1};
      let resultPutBid = await auctionHouse.putBid(auctionId, bid, {from: accounts[2]});
      assert.equal(await erc20Token.balanceOf(auctionHouse.address), 10);
      assert.equal(await erc20Token.balanceOf(accounts[2]), 90);
      await increaseTime(7200);
      let resultFinishAuction = await auctionHouse.finishAuction(auctionId, {from: accounts[0]});
      assert.equal(await erc20Token.balanceOf(auctionHouse.address), 0);
      assert.equal(await erc20Token.balanceOf(accounts[1]), 10);
      assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[2]); // after mint owner is auctionHouse
    })

    it("Put bid:721<->20, with fee, after finish auction, nft goes to buyer", async () => {
      await prepare721_20value(1000);//nft, erc20 initialize
      await erc721.setApprovalForAll(accounts[0], true, {from: accounts[1]});
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);

      let buyAssetType = await AssetType(ERC20, encodedERC20);
      let auctionFees = [[accounts[6], 1000], [accounts[7], 2000]];
      let startTime = await Math.floor(Date.now()/1000); //define start time
      let endTime = startTime + 3600;//auction finished 1hours ago
      let dataV1 = await encDataV1([auctionFees, 1000, startTime, 500]); //originFees, duration, startTime, buyOutPrice

      let resultStartAuction = await auctionHouse.startAuction( sellAsset, buyAssetType, endTime, 10, 90, dataV1Type, dataV1, {from: accounts[1]});
      assert.equal(await erc721.ownerOf(erc721TokenId1), auctionHouse.address); // after mint owner is auctionHouse
      //bid initialize
      let auctionId = 1;
      let bidFees = [];
      let bidDataV1 = await bidEncDataV1([bidFees]);

      let bid = {amount:100, dataType:bidDataV1Type, data:bidDataV1};
      let resultPutBid = await auctionHouse.putBid(auctionId, bid, {from: accounts[2]});
      assert.equal(await erc20Token.balanceOf(auctionHouse.address), 100);
      assert.equal(await erc20Token.balanceOf(accounts[2]), 900);
      await increaseTime(7200);
      let resultFinishAuction = await auctionHouse.finishAuction(auctionId, {from: accounts[0]});
      assert.equal(await erc20Token.balanceOf(auctionHouse.address), 0);
      assert.equal(await erc20Token.balanceOf(protocol), 6);
      assert.equal(await erc20Token.balanceOf(accounts[6]), 10);
      assert.equal(await erc20Token.balanceOf(accounts[7]), 20);
      assert.equal(await erc20Token.balanceOf(accounts[1]), 64);
      assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[2]); // after mint owner is auctionHouse
    })

    it("Put bid:721<->ETH, no fee auction, after finish auction, nft goes to buyer", async () => {
      //auction initialize
      await erc721.mint(accounts[1], erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);
      const encodedEth = enc(auctionHouse.address);
      let buyAssetType = await AssetType(ETH, encodedEth);
      let auctionFees = [];
      let startTime = await Math.floor(Date.now()/1000);
      let endTime = startTime + 3600;
      let dataV1 = await encDataV1([auctionFees, 1000, startTime, 18]); //originFees, duration, startTime, buyOutPrice

      let resultStartAuction = await auctionHouse.startAuction( sellAsset, buyAssetType, endTime, 1, 9, dataV1Type, dataV1, {from: accounts[1]});
      assert.equal(await erc721.ownerOf(erc721TokenId1), auctionHouse.address);
      //bid initialize
      let auctionId = 1;
      let bidFees = [];
      let bidDataV1 = await bidEncDataV1([bidFees]);
      let bid = {amount:10, dataType:bidDataV1Type, data:bidDataV1};
    	await verifyBalanceChange(accounts[2], 10, async () =>
    		verifyBalanceChange(auctionHouse.address, -10, async () =>
         auctionHouse.putBid(auctionId, bid, { from: accounts[2], value: 15, gasPrice: 0 })
    		)
    	)
    	await increaseTime(7200);
    	await verifyBalanceChange(auctionHouse.address, 10, async () =>
        verifyBalanceChange(accounts[1], -10, async () =>
    	    auctionHouse.finishAuction(auctionId, {from: accounts[0]})
    	  )
    	)
    	assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[2]);
    })

    it("Put bid:721<->ETH,  with fee auction, after finish auction, nft goes to buyer", async () => {
      //auction initialize
      await erc721.mint(accounts[1], erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);
      const encodedEth = enc(auctionHouse.address);
      let buyAssetType = await AssetType(ETH, encodedEth);
      let auctionFees = [[accounts[6], 1000], [accounts[7], 2000]];
      let startTime = await Math.floor(Date.now()/1000);
      let endTime = startTime + 3600;
      let dataV1 = await encDataV1([auctionFees, 1000, startTime, 180]); //originFees, duration, startTime, buyOutPrice

      let resultStartAuction = await auctionHouse.startAuction( sellAsset, buyAssetType, endTime, 1, 90, dataV1Type, dataV1, {from: accounts[1]});
      assert.equal(await erc721.ownerOf(erc721TokenId1), auctionHouse.address);
      //bid initialize
      let auctionId = 1;
      let bidFees = [];
      let bidDataV1 = await bidEncDataV1([bidFees]);
      let bid = {amount:100, dataType:bidDataV1Type, data:bidDataV1};
    	await verifyBalanceChange(accounts[2], 100, async () =>
    		verifyBalanceChange(auctionHouse.address, -100, async () =>
         auctionHouse.putBid(auctionId, bid, { from: accounts[2], value: 150, gasPrice: 0 })
    		)
    	)
    	await increaseTime(7200);
    	await verifyBalanceChange(auctionHouse.address, 100, async () =>
        verifyBalanceChange(accounts[1], -64, async () =>
          verifyBalanceChange(accounts[6], -10, async () =>
            verifyBalanceChange(accounts[7], -20, async () =>
              verifyBalanceChange(protocol, -6, async () =>
    	          auctionHouse.finishAuction(auctionId, {from: accounts[0]})
    	        )
    	      )
    	    )
    	  )
    	)
    	assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[2]);
    })

    it("Put bid:721<->1155, with fee auction, after finish auction, nft goes to buyer", async () => {
      //auction initialize
      await erc721.mint(accounts[1], erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
      await erc1155.mint(accounts[2], erc1155TokenId1, 200);
      await erc1155.setApprovalForAll(transferProxy.address, true, {from: accounts[2]});
      let sellAsset = await Asset(ERC721, enc(erc721.address, erc721TokenId1), 1);
      const encoded1155 = enc(erc1155.address, erc1155TokenId1);
      let buyAssetType = await AssetType(ERC1155, encoded1155);
      let auctionFees = [[accounts[6], 1000], [accounts[7], 2000]];
      let startTime = await Math.floor(Date.now()/1000);
      let endTime = startTime + 3600;
      let dataV1 = await encDataV1([auctionFees, 1000, startTime, 180]); //originFees, duration, startTime, buyOutPrice

      let resultStartAuction = await auctionHouse.startAuction( sellAsset, buyAssetType, endTime, 1, 90, dataV1Type, dataV1, {from: accounts[1]});
      assert.equal(await erc721.ownerOf(erc721TokenId1), auctionHouse.address);
      //bid initialize
      let auctionId = 1;
      let bidFees = [];
      let bidDataV1 = await bidEncDataV1([bidFees]);
      let bid = {amount:100, dataType:bidDataV1Type, data:bidDataV1};
      let resultPutBid = await auctionHouse.putBid(auctionId, bid, {from: accounts[2]});
      assert.equal(await erc1155.balanceOf(auctionHouse.address, erc1155TokenId1), 100);
      assert.equal(await erc1155.balanceOf(accounts[2], erc1155TokenId1), 100);
      await increaseTime(7200);
      let resultFinishAuction = await auctionHouse.finishAuction(auctionId, {from: accounts[0]});
      assert.equal(await erc1155.balanceOf(auctionHouse.address, erc1155TokenId1), 0);
      assert.equal(await erc1155.balanceOf(accounts[1], erc1155TokenId1), 64);
      assert.equal(await erc1155.balanceOf(accounts[6], erc1155TokenId1), 10);
      assert.equal(await erc1155.balanceOf(accounts[7], erc1155TokenId1), 20);
      assert.equal(await erc1155.balanceOf(protocol, erc1155TokenId1), 6);
      assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[2]); // after mint owner is auctionHouse
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
