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


  function encDataV1(tuple) {
      return auctionHouse.encode(tuple);
  }

  function bidEncDataV1(tuple) {
      return auctionHouse.encodeBid(tuple);
  }

});
