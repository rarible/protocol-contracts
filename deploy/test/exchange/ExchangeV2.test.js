const truffleAssert = require('truffle-assertions');

const TestERC20 = artifacts.require("TestERC20.sol");
const TestERC721RoyaltiesV1 = artifacts.require("TestERC721RoyaltiesV1.sol");
const TestERC721RoyaltiesV2 = artifacts.require("TestERC721RoyaltiesV2.sol");
const TestERC1155RoyaltiesV2 = artifacts.require("TestERC1155RoyaltiesV2.sol");

//RARIBLE
const ExchangeV2 = artifacts.require("ExchangeV2.sol");
const RoyaltiesRegistry = artifacts.require("RoyaltiesRegistry.sol");
const TransferProxy = artifacts.require("TransferProxy.sol");
const ERC20TransferProxy = artifacts.require("ERC20TransferProxy.sol");

const RaribleTestHelper = artifacts.require("RaribleTestHelper.sol");

//punk
const CryptoPunksMarket = artifacts.require('CryptoPunksMarket');
const PunkTransferProxy = artifacts.require('PunkTransferProxy');

//Lazy
const ERC721LazyMintTest = artifacts.require("ERC721LazyMintTest.sol");

const { Order, Asset, sign } = require("../../../scripts/order.js");
const ZERO = "0x0000000000000000000000000000000000000000";
const zeroAddress = "0x0000000000000000000000000000000000000000";
const { expectThrow, verifyBalanceChange } = require("@daonomic/tests-common");
const { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, ORDER_DATA_V2, ORDER_DATA_V3_BUY, ORDER_DATA_V3_SELL, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, CRYPTO_PUNKS, COLLECTION, TO_LOCK, LOCK, enc, id } = require("../../../scripts/assets.js");
const MARKET_MARKER_SELL = "0x68619b8adb206de04f676007b2437f99ff6129b672495a6951499c6c56bc2f10";
const MARKET_MARKER_BUY =  "0x68619b8adb206de04f676007b2437f99ff6129b672495a6951499c6c56bc2f11";

contract("ExchangeV2, sellerFee + buyerFee =  6%,", accounts => {
  let exchangeV2;
  let transferProxy;
  let erc20TransferProxy;
  let helper;

  const makerLeft = accounts[1];
  const makerRight = accounts[2];

  const protocol = accounts[9];
  const community = accounts[8];

  const erc721TokenId1 = 53;
  const erc1155TokenId1 = 54;

  before(async () => {
    //transfer proxes
    transferProxy = await TransferProxy.deployed();
    erc20TransferProxy = await ERC20TransferProxy.deployed();

    //royaltiesRegistry
    royaltiesRegistry = await RoyaltiesRegistry.deployed()

    /*Auction*/
    exchangeV2 = await ExchangeV2.deployed();
    await exchangeV2.setDefaultFeeReceiver(protocol)

    helper = await RaribleTestHelper.new()
  });

  describe("gas estimation direct Purchase/AcceptBid", () => {

    it("Direct buy ERC721_Lazy<->ETH, not same origin, not same royalties V3", async () => {
      const _priceSell = 100;
      const _pricePurchase = 100;
      const salt = 1;
      const nftAmount = 1
      const erc721 = await prepareERC721Lazy();
      const encodedMintData = await erc721.encode([erc721TokenId1, "uri", [], [], []]);

      let addrOriginLeft = await LibPartToUint(accounts[6], 300);
      let addrOriginRight = await LibPartToUint(accounts[5], 300);

      let encDataLeft  = await encDataV3_SELL([0, addrOriginRight, 0, 1000, MARKET_MARKER_SELL]);
      let encDataRight = await encDataV3_BUY([0, addrOriginLeft, 0, MARKET_MARKER_BUY]);

      const _nftPurchaseAssetData = "0x";
      const left = Order(makerLeft, Asset(id("ERC721_LAZY"), encodedMintData, nftAmount), ZERO, Asset(ETH, _nftPurchaseAssetData, _priceSell), salt, 0, 0, ORDER_DATA_V3_SELL, encDataLeft);
      const signature = await getSignature(left, makerLeft);

      var directPurchaseParams = {
        seller: makerLeft,
        nftClass: id("ERC721_LAZY"),
        paymentClass: ETH,
        nftData: encodedMintData,
        paymentData: _nftPurchaseAssetData,
        tokenSellAmount: nftAmount,
        tokenPurchaseAmount: nftAmount,
        priceSell: _priceSell,
        pricePurchase: _pricePurchase,
        salt: salt, signature: signature,
        sellOrderData: encDataLeft,
        purchaseOrderData: encDataRight
      };
      const tx = await exchangeV2.directPurchase(directPurchaseParams, { from: makerRight, value:200 });
      console.log("direct buy ERC721Lazy<->ETH, not same origin, not same royalties V3:", tx.receipt.gasUsed);
    })

    it("Direct buy ERC721<->ETH, not same origin, not same royalties V3", async () => {
      const _priceSell = 100;
      const _pricePurchase = 100;
      const salt = 1;
      const nftAmount = 1
      const erc721 = await prepareERC721(makerLeft);

      let addrOriginLeft = await LibPartToUint(accounts[6], 300);
      let addrOriginRight = await LibPartToUint(accounts[5], 300);

      let encDataLeft  = await encDataV3_SELL([0, addrOriginRight, 0, 1000, MARKET_MARKER_SELL]);
      let encDataRight = await encDataV3_BUY([0, addrOriginLeft, 0, MARKET_MARKER_BUY]);

      const _nftSellAssetData = enc(erc721.address, erc721TokenId1);
      const _nftPurchaseAssetData = "0x";
      const left = Order(makerLeft, Asset(ERC721, _nftSellAssetData, nftAmount), ZERO, Asset(ETH, _nftPurchaseAssetData, _priceSell), salt, 0, 0, ORDER_DATA_V3_SELL, encDataLeft);
      const signature = await getSignature(left, makerLeft);

      var directPurchaseParams = {
        seller: makerLeft,
        nftClass: ERC721,
        paymentClass: ETH,
        nftData: _nftSellAssetData,
        paymentData: _nftPurchaseAssetData,
        tokenSellAmount: nftAmount,
        tokenPurchaseAmount: nftAmount,
        priceSell: _priceSell,
        pricePurchase: _pricePurchase,
        salt: salt, signature: signature,
        sellOrderData: encDataLeft,
        purchaseOrderData: encDataRight
      };
      const tx = await exchangeV2.directPurchase(directPurchaseParams, { from: makerRight, value:200 });
      console.log("direct buy ERC721<->ETH, not same origin, not same royalties V3:", tx.receipt.gasUsed);
    })

    it("Direct accept bid ERC20<->ERC721, not same origin, not same royalties V3", async () => {
      const _priceBid = 100;
      const _priceAccept = 100;
      const salt = 1;
      const _nftBidAmount = 1;
      const _nftAcceptAmount = 1;
      const erc20 = await prepareERC20(makerLeft, 1000);
      const erc721 = await prepareERC721(makerRight);

      let addrOriginLeft = await LibPartToUint(accounts[6], 300);
      let addrOriginRight = await LibPartToUint(accounts[5], 300);

      let encDataLeft = await encDataV3_BUY([0, addrOriginLeft, 0, MARKET_MARKER_BUY]);
      let encDataRight = await encDataV3_SELL([0, addrOriginRight, 0, 1000, MARKET_MARKER_SELL]);

      const _nftAssetData = enc(erc721.address, erc721TokenId1);
      const _paymentAssetData = enc(erc20.address);

      const bidOrder = Order(makerLeft, Asset(ERC20, _paymentAssetData, _priceBid), ZERO, Asset(ERC721, _nftAssetData, _nftBidAmount), 1, 0, 0, ORDER_DATA_V3_BUY, encDataLeft);
      const signature = await getSignature(bidOrder, makerLeft);

      var directAcceptParams = {
        tokenBidAmount: _nftBidAmount,
        tokenAcceptAmount: _nftAcceptAmount,
        buyer: makerLeft,
        nftClass: ERC721,
        nftData: _nftAssetData,
        paymentData: _paymentAssetData,
        bidOrderData: encDataLeft,
        acceptOrderData: encDataRight,
        priceBid: _priceBid,
        priceAccept: _priceAccept,
        salt: salt, signature: signature
      };
      const tx = await exchangeV2.directAcceptBid(directAcceptParams, { from: makerRight });
      console.log("Direct accept bid ERC20<->ERC721, not same origin, not same royalties V3:", tx.receipt.gasUsed);
    })
  });

  describe("balance check direct Purchase/AcceptBid", () => {

    it("Direct Purchase ERC721<->ETH, not same origin, not same royalties V3", async () => {
      const _priceSell = 100;
      const _pricePurchase = 100;
      const salt = 1;
      const nftAmount = 1
      const erc721 = await prepareERC721(makerLeft, erc721TokenId1, [[accounts[7], 100]]); //with royalties

      let addrOriginLeft = await LibPartToUint(accounts[6], 300);
      let addrOriginRight = await LibPartToUint(accounts[5], 300);

      let encDataLeft  = await encDataV3_SELL([0, addrOriginRight, 0, 1000, MARKET_MARKER_SELL]);
      let encDataRight = await encDataV3_BUY([0, addrOriginLeft, 0, MARKET_MARKER_BUY]);

      const left = Order(makerLeft, Asset(ERC721, enc(erc721.address, erc721TokenId1), nftAmount), ZERO, Asset(ETH, "0x", _priceSell), salt, 0, 0, ORDER_DATA_V3_SELL, encDataLeft);
      const signature = await getSignature(left, makerLeft);

      const _nftSellAssetData = enc(erc721.address, erc721TokenId1);
      const _nftPurchaseAssetData = "0x";

      var directPurchaseParams = {
        seller: makerLeft,
        nftClass: ERC721,
        paymentClass: ETH,
        nftData: _nftSellAssetData,
        paymentData: _nftPurchaseAssetData,
        tokenSellAmount: nftAmount,
        tokenPurchaseAmount: nftAmount,
        priceSell: _priceSell,
        pricePurchase: _pricePurchase,
        salt: salt, signature: signature,
        sellOrderData: encDataLeft,
        purchaseOrderData: encDataRight
      };

      assert.equal(await erc721.balanceOf(makerLeft), 1);
      assert.equal(await erc721.balanceOf(makerRight), 0);
      await verifyBalanceChange(makerRight, 100, async () =>
        verifyBalanceChange(makerLeft, -93, async () =>
          verifyBalanceChange(protocol, 0, () =>
            verifyBalanceChange(accounts[6], -3, () =>      //OriginLeft
              verifyBalanceChange(accounts[5], -3, () =>    //OriginRight
                verifyBalanceChange(accounts[7], -1, () =>  //royalties
                  exchangeV2.directPurchase(directPurchaseParams, { from: makerRight, value:200, gasPrice: 0 })
                )
              )
            )
          )
        )
      );
      assert.equal(await erc721.balanceOf(makerLeft), 0);
      assert.equal(await erc721.balanceOf(makerRight), 1);
    })

    it("Direct Purchase ERC721<->ERC20, not same origin, not same royalties V3", async () => {
      const _priceSell = 100;
      const _pricePurchase = 100;
      const salt = 1;
      const nftAmount = 1
      const erc721 = await prepareERC721(makerLeft, erc721TokenId1, [[accounts[7], 100]]); //with royalties
      const erc20 = await prepareERC20(makerRight, 1000);

      let addrOriginLeft = await LibPartToUint(accounts[6], 300);
      let addrOriginRight = await LibPartToUint(accounts[5], 300);

      let encDataLeft  = await encDataV3_SELL([0, addrOriginRight, 0, 1000, MARKET_MARKER_SELL]);
      let encDataRight = await encDataV3_BUY([0, addrOriginLeft, 0, MARKET_MARKER_BUY]);

      const _nftSellAssetData = enc(erc721.address, erc721TokenId1);
      const _nftPurchaseAssetData = enc(erc20.address);

      const left = Order(makerLeft, Asset(ERC721, _nftSellAssetData, nftAmount), ZERO, Asset(ERC20, _nftPurchaseAssetData, _priceSell), salt, 0, 0, ORDER_DATA_V3_SELL, encDataLeft);
      const signature = await getSignature(left, makerLeft);

      var directPurchaseParams = {
        seller: makerLeft,
        nftClass: ERC721,
        paymentClass: ERC20,
        nftData: _nftSellAssetData,
        paymentData: _nftPurchaseAssetData,
        tokenSellAmount: nftAmount,
        tokenPurchaseAmount: nftAmount,
        priceSell: _priceSell,
        pricePurchase: _pricePurchase,
        salt: salt, signature: signature,
        sellOrderData: encDataLeft,
        purchaseOrderData: encDataRight
      };

      assert.equal(await erc721.balanceOf(makerLeft), 1);
      assert.equal(await erc721.balanceOf(makerRight), 0);
      await exchangeV2.directPurchase(directPurchaseParams, { from: makerRight });
      assert.equal(await erc20.balanceOf(makerRight), 900);
      assert.equal(await erc20.balanceOf(makerLeft), 93);
      assert.equal(await erc20.balanceOf(accounts[6]), 3);
      assert.equal(await erc20.balanceOf(accounts[5]), 3);
      assert.equal(await erc20.balanceOf(accounts[7]), 1);
      assert.equal(await erc20.balanceOf(protocol), 0);
      assert.equal(await erc721.balanceOf(makerLeft), 0);
      assert.equal(await erc721.balanceOf(makerRight), 1);
    })

    it("Direct buy ERC1155(all)<->ETH, not same origin, not same royalties V3", async () => {
      const _priceSell = 100;
      const _pricePurchase = 100;
      const salt = 1;
      const nftAmount = 7;
      const nftPurchaseAmount = 7;
      const erc1155 = await prepareERC1155(makerLeft, 10, erc1155TokenId1, [[accounts[7], 100]]);

      let addrOriginLeft = await LibPartToUint(accounts[6], 300);
      let addrOriginRight = await LibPartToUint(accounts[5], 300);

      let encDataLeft  = await encDataV3_SELL([0, addrOriginRight, 0, 1000, MARKET_MARKER_SELL]);
      let encDataRight = await encDataV3_BUY([0, addrOriginLeft, 0, MARKET_MARKER_BUY]);

      const _nftSellAssetData = enc(erc1155.address, erc1155TokenId1);
      const _nftPurchaseAssetData = "0x";

      const left = Order(makerLeft, Asset(ERC1155, _nftSellAssetData, nftAmount), ZERO, Asset(ETH, _nftPurchaseAssetData, _priceSell), salt, 0, 0, ORDER_DATA_V3_SELL, encDataLeft);
      const signature = await getSignature(left, makerLeft);

      var directPurchaseParams = {
        seller: makerLeft,
        nftClass: ERC1155,
        paymentClass: ETH,
        nftData: _nftSellAssetData,
        paymentData: _nftPurchaseAssetData,
        tokenSellAmount: nftAmount,
        tokenPurchaseAmount: nftPurchaseAmount,
        priceSell: _priceSell,
        pricePurchase: _pricePurchase,
        salt: salt, signature: signature,
        sellOrderData: encDataLeft,
        purchaseOrderData: encDataRight
      };

      assert.equal(await erc1155.balanceOf(makerLeft, erc1155TokenId1), 10);
      assert.equal(await erc1155.balanceOf(makerRight, erc1155TokenId1), 0);
      await verifyBalanceChange(makerRight, 100, async () =>
        verifyBalanceChange(makerLeft, -93, async () =>
          verifyBalanceChange(protocol, 0, () =>
            verifyBalanceChange(accounts[6], -3, () =>      //OriginLeft
              verifyBalanceChange(accounts[5], -3, () =>    //OriginRight
                verifyBalanceChange(accounts[7], -1, () =>  //royalties
                  exchangeV2.directPurchase(directPurchaseParams,{ from: makerRight, value:200, gasPrice: 0 })
                )
              )
            )
          )
        )
      );
      assert.equal(await erc1155.balanceOf(makerLeft, erc1155TokenId1), 3);
      assert.equal(await erc1155.balanceOf(makerRight, erc1155TokenId1), 7);
    })

    it("Direct buy ERC1155(partly)<->ERC20, not same origin, not same royalties V3", async () => {
      const _priceSell = 100;
      const _pricePurchase = 50;
      const salt = 1;
      const nftAmount = 4;
      const nftPurchaseAmount = 2;
      const erc1155 = await prepareERC1155(makerLeft, 10, erc1155TokenId1, [[accounts[7], 100]]);
      const erc20 = await prepareERC20(makerRight, 1000);

      let addrOriginLeft = await LibPartToUint(accounts[6], 300);
      let addrOriginRight = await LibPartToUint(accounts[5], 300);

      let encDataLeft  = await encDataV3_SELL([0, addrOriginRight, 0, 1000, MARKET_MARKER_SELL]);
      let encDataRight = await encDataV3_BUY([0, addrOriginLeft, 0, MARKET_MARKER_BUY]);

      const _nftSellAssetData = enc(erc1155.address, erc1155TokenId1);
      const _nftPurchaseAssetData = enc(erc20.address);;

      const left = Order(makerLeft, Asset(ERC1155, _nftSellAssetData, nftAmount), ZERO, Asset(ERC20, _nftPurchaseAssetData, _priceSell), salt, 0, 0, ORDER_DATA_V3_SELL, encDataLeft);
      const signature = await getSignature(left, makerLeft);

      var directPurchaseParams = {
        seller: makerLeft,
        nftClass: ERC1155,
        paymentClass: ERC20,
        nftData: _nftSellAssetData,
        paymentData: _nftPurchaseAssetData,
        tokenSellAmount: nftAmount,
        tokenPurchaseAmount: nftPurchaseAmount,
        priceSell: _priceSell,
        pricePurchase: _pricePurchase,
        salt: salt, signature: signature,
        sellOrderData: encDataLeft,
        purchaseOrderData: encDataRight
      };

      assert.equal(await erc1155.balanceOf(makerLeft, erc1155TokenId1), 10);
      assert.equal(await erc1155.balanceOf(makerRight, erc1155TokenId1), 0);
      await exchangeV2.directPurchase(directPurchaseParams, { from: makerRight });
      assert.equal(await erc20.balanceOf(makerRight), 950);
      assert.equal(await erc20.balanceOf(makerLeft), 48);
      assert.equal(await erc20.balanceOf(accounts[6]), 1);
      assert.equal(await erc20.balanceOf(accounts[5]), 1);
      assert.equal(await erc20.balanceOf(accounts[7]), 0);
      assert.equal(await erc20.balanceOf(protocol), 0);
      assert.equal(await erc1155.balanceOf(makerLeft, erc1155TokenId1), 8);
      assert.equal(await erc1155.balanceOf(makerRight, erc1155TokenId1), 2);
    })

    it("Direct accept bid ERC721<->ERC20, not same origin, not same royalties V3", async () => {
      const _priceBid = 100;
      const _priceAccept = 100;
      const salt = 1;
      const _nftBidAmount = 1;
      const _nftAcceptAmount = 1;
      const erc20 = await prepareERC20(makerLeft, 1000);
      const erc721 = await prepareERC721(makerRight, erc721TokenId1, [[accounts[7], 100]]); //with royalties

      let addrOriginLeft = await LibPartToUint(accounts[6], 300);
      let addrOriginRight = await LibPartToUint(accounts[5], 300);

      let encDataLeft = await encDataV3_BUY([0, addrOriginLeft, 0, MARKET_MARKER_BUY]);
      let encDataRight = await encDataV3_SELL([0, addrOriginRight, 0, 1000, MARKET_MARKER_SELL]);

      const _nftAssetData = enc(erc721.address, erc721TokenId1);
      const _paymentAssetData = enc(erc20.address);

      const left = Order(makerLeft, Asset(ERC20, _paymentAssetData, _priceBid), ZERO, Asset(ERC721, _nftAssetData, _nftBidAmount), 1, 0, 0, ORDER_DATA_V3_BUY, encDataLeft);
      const signature = await getSignature(left, makerLeft);

      var directAcceptParams = {
        tokenBidAmount: _nftBidAmount,
        tokenAcceptAmount: _nftAcceptAmount,
        buyer: makerLeft,
        nftClass: ERC721,
        nftData: _nftAssetData,
        paymentData: _paymentAssetData,
        bidOrderData: encDataLeft,
        acceptOrderData: encDataRight,
        priceBid: _priceBid,
        priceAccept: _priceAccept,
        salt: salt, signature: signature
      };

      assert.equal(await erc721.balanceOf(makerLeft), 0);
      assert.equal(await erc721.balanceOf(makerRight), 1);
      await exchangeV2.directAcceptBid(directAcceptParams, { from: makerRight });
      assert.equal(await erc721.balanceOf(makerLeft), 1);
      assert.equal(await erc721.balanceOf(makerRight), 0);
      assert.equal(await erc20.balanceOf(makerLeft), 900);
      assert.equal(await erc20.balanceOf(makerRight), 93);
      assert.equal(await erc20.balanceOf(accounts[6]), 3);
      assert.equal(await erc20.balanceOf(accounts[5]), 3);
      assert.equal(await erc20.balanceOf(accounts[7]), 1);
      assert.equal(await erc20.balanceOf(protocol), 0);
    })

    it("Direct accept bid ERC20<->ERC1155(all), not same origin, not same royalties V3", async () => {
      const _priceBid = 100;
      const _priceAccept = 100;
      const salt = 1;
      const _nftBidAmount = 7;
      const _nftAcceptAmount = 7;
      const erc20 = await prepareERC20(makerLeft, 1000);
      const erc1155 = await prepareERC1155(makerRight, 10, erc1155TokenId1, [[accounts[7], 100]]);//with royalties

      let addrOriginLeft = await LibPartToUint(accounts[6], 300);
      let addrOriginRight = await LibPartToUint(accounts[5], 300);

      let encDataLeft = await encDataV3_BUY([0, addrOriginLeft, 0, MARKET_MARKER_BUY]);
      let encDataRight = await encDataV3_SELL([0, addrOriginRight, 0, 1000, MARKET_MARKER_SELL]);

      const _nftAssetData = enc(erc1155.address, erc1155TokenId1);
      const _paymentAssetData = enc(erc20.address);

      const left = Order(makerLeft, Asset(ERC20, _paymentAssetData, 100), ZERO, Asset(ERC1155, _nftAssetData, _nftBidAmount), 1, 0, 0, ORDER_DATA_V3_BUY, encDataLeft);
      const signature = await getSignature(left, makerLeft);

      var directAcceptParams = {
        tokenBidAmount: _nftBidAmount,
        tokenAcceptAmount: _nftAcceptAmount,
        buyer: makerLeft,
        nftClass: ERC1155,
        nftData: _nftAssetData,
        paymentData: _paymentAssetData,
        bidOrderData: encDataLeft,
        acceptOrderData: encDataRight,
        priceBid: _priceBid,
        priceAccept: _priceAccept,
        salt: salt, signature: signature
      };
      assert.equal(await erc1155.balanceOf(makerLeft, erc1155TokenId1), 0);
      assert.equal(await erc1155.balanceOf(makerRight, erc1155TokenId1), 10);
      await exchangeV2.directAcceptBid(directAcceptParams,{ from: makerRight });
      assert.equal(await erc1155.balanceOf(makerLeft, erc1155TokenId1), 7);
      assert.equal(await erc1155.balanceOf(makerRight, erc1155TokenId1), 3);
      assert.equal(await erc20.balanceOf(makerLeft), 900);
      assert.equal(await erc20.balanceOf(makerRight), 93);
      assert.equal(await erc20.balanceOf(accounts[6]), 3);
      assert.equal(await erc20.balanceOf(accounts[5]), 3);
      assert.equal(await erc20.balanceOf(accounts[7]), 1);
      assert.equal(await erc20.balanceOf(protocol), 0);
    })

    it("Direct accept bid ERC20<->ERC1155(partly), not same origin, not same royalties V3", async () => {
      const _priceBid = 1000;
      const _priceAccept = 700;
      const salt = 1;
      const _nftBidAmount = 10;
      const _nftAcceptAmount = 7;
      const erc20 = await prepareERC20(makerLeft, 2000);
      const erc1155 = await prepareERC1155(makerRight, 10, erc1155TokenId1, [[accounts[7], 100]]);//with royalties

      let addrOriginLeft = await LibPartToUint(accounts[6], 300);
      let addrOriginRight = await LibPartToUint(accounts[5], 300);

      let encDataLeft = await encDataV3_BUY([0, addrOriginLeft, 0, MARKET_MARKER_SELL]);
      let encDataRight = await encDataV3_SELL([0, addrOriginRight, 0, 1000, MARKET_MARKER_BUY]);

      const _nftAssetData = enc(erc1155.address, erc1155TokenId1);
      const _paymentAssetData = enc(erc20.address);

      const left = Order(makerLeft, Asset(ERC20, _paymentAssetData, _priceBid), ZERO, Asset(ERC1155, _nftAssetData, _nftBidAmount), 1, 0, 0, ORDER_DATA_V3_BUY, encDataLeft);
      const signature = await getSignature(left, makerLeft);

      var directAcceptParams = {
        tokenBidAmount: _nftBidAmount,
        tokenAcceptAmount: _nftAcceptAmount,
        buyer: makerLeft,
        nftClass: ERC1155,
        nftData: _nftAssetData,
        paymentData: _paymentAssetData,
        bidOrderData: encDataLeft,
        acceptOrderData: encDataRight,
        priceBid: _priceBid,
        priceAccept: _priceAccept,
        salt: salt, signature: signature
      };
      assert.equal(await erc1155.balanceOf(makerLeft, erc1155TokenId1), 0);
      assert.equal(await erc1155.balanceOf(makerRight, erc1155TokenId1), 10);
      await exchangeV2.directAcceptBid(directAcceptParams,{ from: makerRight });
      assert.equal(await erc1155.balanceOf(makerLeft, erc1155TokenId1), 7);
      assert.equal(await erc1155.balanceOf(makerRight, erc1155TokenId1), 3);
      assert.equal(await erc20.balanceOf(makerLeft), 1300);
      assert.equal(await erc20.balanceOf(makerRight), 651);
      assert.equal(await erc20.balanceOf(accounts[6]), 21);
      assert.equal(await erc20.balanceOf(accounts[5]), 21);
      assert.equal(await erc20.balanceOf(accounts[7]), 7);
      assert.equal(await erc20.balanceOf(protocol), 0);
    })

  });

  describe("gas estimation", () => {
    it("ERC20<->eth two offChain orders, Logic: Separate RTM vofc ", async () => {
      const erc20 = await prepareERC20(makerRight, 1000);

      const left = Order(makerLeft, Asset(ETH, "0x", 200), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(makerRight, Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");
      const tx = await exchangeV2.matchOrders(left, "0x", right, await getSignature(right, makerRight), { from: makerLeft, value: 300 });
      console.log("ERC20<->eth two offChain orders, with Separate RTM logic gas:", tx.receipt.gasUsed);
    })

    it("ERC20<->ERC1155 not same origin, not same royalties V3", async () => {
      const erc20 = await prepareERC20(makerLeft, 1000)
      const erc1155 = await prepareERC1155(makerRight, 1000, erc1155TokenId1, [[accounts[7], 1000]])

      let addrOriginLeft = await LibPartToUint(accounts[6], 300);
      let addrOriginRight = await LibPartToUint(accounts[5], 300);

      let encDataLeft = await encDataV3_BUY([0, addrOriginLeft, 0, MARKET_MARKER_BUY]);
      let encDataRight = await encDataV3_SELL([0, addrOriginRight, 0, 1000, MARKET_MARKER_SELL]);

      const left = Order(makerLeft, Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7), 1, 0, 0, ORDER_DATA_V3_BUY, encDataLeft);
      const right = Order(makerRight, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, ORDER_DATA_V3_SELL, encDataRight);

      const tx = await exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: makerRight });
      console.log("not same origin, not same royalties (no protocol Fee) V3:", tx.receipt.gasUsed);
    })

    it("ERC721<->ETH, not same origin, not same royalties V3", async () => {
      const price = 100;
      const salt = 1;
      const nftAmount = 1
      const erc721 = await prepareERC721(makerLeft);

      let addrOriginLeft = await LibPartToUint(accounts[6], 300);
      let addrOriginRight = await LibPartToUint(accounts[5], 300);

      let encDataLeft  = await encDataV3_SELL([0, addrOriginRight, 0, 1000, MARKET_MARKER_SELL]);
      let encDataRight = await encDataV3_BUY([0, addrOriginLeft, 0, MARKET_MARKER_BUY]);

      const left = Order(makerLeft, Asset(ERC721, enc(erc721.address, erc721TokenId1), nftAmount), ZERO, Asset(ETH, "0x", price), salt, 0, 0, ORDER_DATA_V3_SELL, encDataLeft);
      const right = Order(makerRight, Asset(ETH, "0x", price), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), nftAmount), 0, 0, 0, ORDER_DATA_V3_BUY, encDataRight);
      const signature = await getSignature(left, makerLeft);

      const tx = await exchangeV2.matchOrders(left, signature, right, "0x", { from: makerRight, value:200 });
      console.log("ERC721<->ETH, not same origin, not same royalties V3:", tx.receipt.gasUsed);
    })

    it("same origin, not same royalties", async () => {
      const erc20 = await prepareERC20(makerLeft, 1000)
      const erc1155 = await prepareERC1155(makerRight, 1000, erc1155TokenId1, [[accounts[6], 1000]])

      let addrOriginLeft = [[accounts[5], 500]];
      let addrOriginRight = [[accounts[5], 500]];

      let encDataLeft = await encDataV1([[[makerLeft, 10000]], addrOriginLeft]);
      let encDataRight = await encDataV1([[[makerRight, 10000]], addrOriginRight]);

      const left = Order(makerLeft, Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
      const right = Order(makerRight, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, ORDER_DATA_V1, encDataRight);

      const tx = await exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: makerRight });
      console.log("same origin, no royalties:", tx.receipt.gasUsed);

    })

    it("same origin, yes royalties", async () => {
      const erc20 = await prepareERC20(makerLeft, 1000)
      const erc1155 = await prepareERC1155(makerRight, 1000, erc1155TokenId1, [[makerRight, 1000]])

      let addrOriginLeft = [[accounts[5], 500]];
      let addrOriginRight = [[accounts[5], 500]];

      let encDataLeft = await encDataV1([[[makerLeft, 10000]], addrOriginLeft]);
      let encDataRight = await encDataV1([[[makerRight, 10000]], addrOriginRight]);

      const left = Order(makerLeft, Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
      const right = Order(makerRight, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, ORDER_DATA_V1, encDataRight);

      const tx = await exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: makerRight });
      console.log("same origin, yes royalties:", tx.receipt.gasUsed);

    })

    it("not same origin, yes royalties", async () => {
      const erc20 = await prepareERC20(makerLeft, 1000)
      const erc1155 = await prepareERC1155(makerRight, 1000, erc1155TokenId1, [[makerRight, 1000]])

      let addrOriginLeft = [[accounts[6], 500]];
      let addrOriginRight = [[accounts[5], 500]];

      let encDataLeft = await encDataV1([[[makerLeft, 10000]], addrOriginLeft]);
      let encDataRight = await encDataV1([[[makerRight, 10000]], addrOriginRight]);

      const left = Order(makerLeft, Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
      const right = Order(makerRight, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, ORDER_DATA_V1, encDataRight);

      const tx = await exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: makerRight });
      console.log("not same origin, yes royalties:", tx.receipt.gasUsed);

    })

    it("not same origin, not same royalties", async () => {
      const erc20 = await prepareERC20(makerLeft, 1000)
      const erc1155 = await prepareERC1155(makerRight, 1000, erc1155TokenId1, [[accounts[7], 1000]])

      let addrOriginLeft = [[accounts[6], 500]];
      let addrOriginRight = [[accounts[5], 500]];

      let encDataLeft = await encDataV1([[[makerLeft, 10000]], addrOriginLeft]);
      let encDataRight = await encDataV1([[[makerRight, 10000]], addrOriginRight]);

      const left = Order(makerLeft, Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
      const right = Order(makerRight, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, ORDER_DATA_V1, encDataRight);

      const tx = await exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: makerRight });
      console.log("not same origin, not same royalties:", tx.receipt.gasUsed);

    })
  })

  describe("matchOrders", () => {
    it("eth orders work, expect throw, not enough eth ", async () => {
      const erc20 = await prepareERC20(makerLeft, 1000)

      const left = Order(makerLeft, Asset(ETH, "0x", 200), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(makerRight, Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");

      await expectThrow(
        exchangeV2.matchOrders(left, "0x", right, await getSignature(right, makerRight), { from: makerLeft, value: 199 })
      );
    })

    it("eth orders work, expect throw, unknown Data type of Order ", async () => {
      const erc20 = await prepareERC20(makerLeft, 1000)

      const left = Order(makerLeft, Asset(ETH, "0x", 200), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(makerRight, Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xfffffffe", "0x");

      await expectThrow(
        exchangeV2.matchOrders(left, "0x", right, await getSignature(right, makerRight), { from: makerLeft, value: 300 })
      );
    })

    it("eth orders work, rest is returned to taker (other side) ", async () => {
      const erc20 = await prepareERC20(makerRight, 1000)

      const left = Order(makerLeft, Asset(ETH, "0x", 200), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(makerRight, Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");

      const signature = await getSignature(right, makerRight);
      await verifyBalanceChange(makerRight, -200, async () =>
        verifyBalanceChange(makerLeft, 200, async () =>
          verifyBalanceChange(protocol, 0, () =>
            exchangeV2.matchOrders(left, "0x", right, signature, { from: makerLeft, value: 300, gasPrice: 0 })
          )
        )
      );
      assert.equal(await erc20.balanceOf(makerLeft), 100);
      assert.equal(await erc20.balanceOf(makerRight), 900);
    })

    it("ERC721 to ETH order maker ETH != who pay, both orders have to be with signature ", async () => {
      const erc721 = await prepareERC721(makerLeft)

      const left = Order(makerLeft, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(makerRight, Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");

      const signatureLeft = await getSignature(left, makerLeft);
      const signatureRight = await getSignature(right, makerRight);

      await verifyBalanceChange(accounts[7], 200, async () =>
        verifyBalanceChange(makerLeft, -200, async () =>
          verifyBalanceChange(protocol, 0, () =>
            exchangeV2.matchOrders(left, signatureLeft, right, signatureRight, { from: accounts[7], value: 200, gasPrice: 0 })
          )
        )
      )
      assert.equal(await erc721.balanceOf(makerLeft), 0);
      assert.equal(await erc721.balanceOf(makerRight), 1);

    })

    it("ERC721 to ETH order maker ETH != who pay, ETH orders have no signature, throw", async () => {
      const erc721 = await prepareERC721(makerLeft)

      const left = Order(makerLeft, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(makerRight, Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");

      await expectThrow(
        exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: accounts[7], value: 300, gasPrice: 0 })
      );
    })

  });

  describe("Do matchOrders(), orders dataType == V1", () => {
    it("From ERC20(100) to ERC20(200) Protocol, Origin fees, no Royalties ", async () => {
      const erc20 = await prepareERC20(makerLeft, 104)
      const t2 = await prepareERC20(makerRight, 200)

      let addrOriginLeft = [[accounts[3], 100]];
      let addrOriginRight = [[accounts[4], 200]];
      let encDataLeft = await encDataV1([[[makerLeft, 10000]], addrOriginLeft]);
      let encDataRight = await encDataV1([[[makerRight, 10000]], addrOriginRight]);
      const left = Order(makerLeft, Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC20, enc(t2.address), 200), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
      const right = Order(makerRight, Asset(ERC20, enc(t2.address), 200), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, ORDER_DATA_V1, encDataRight);

      const signature = await getSignature(left, makerLeft);

      const tx = await exchangeV2.matchOrders(left, signature, right, "0x", { from: makerRight });
      console.log("ERC20 <=> ERC20:", tx.receipt.gasUsed);

      const hashLeft = await helper.hashKey(left)
      const hashRight = await helper.hashKey(right)
      truffleAssert.eventEmitted(tx, 'Match', (ev) => {
        assert.equal(ev.leftHash, hashLeft, "Match left hash")
        assert.equal(ev.rightHash, hashRight, "Match right hash")
        return true;
      });

      assert.equal(await exchangeV2.fills(await helper.hashKey(left)), 200);

      assert.equal(await erc20.balanceOf(makerLeft), 3); //=104 - (100amount + 3byuerFee +1originleft)
      assert.equal(await erc20.balanceOf(makerRight), 98);//=100 - 3sellerFee - 2originRight
      assert.equal(await erc20.balanceOf(accounts[3]), 1);
      assert.equal(await erc20.balanceOf(accounts[4]), 2);
      assert.equal(await t2.balanceOf(makerLeft), 200);
      assert.equal(await t2.balanceOf(makerRight), 0);

    })

    it("From ERC20(10) to ERC20(20) Protocol, no fees because of rounding", async () => {
      const erc20 = await prepareERC20(makerLeft, 10)
      const t2 = await prepareERC20(makerRight, 20)

      let addrOriginLeft = [[accounts[3], 10]];
      let addrOriginRight = [[accounts[4], 20]];
      let encDataLeft = await encDataV1([[[makerLeft, 10000]], addrOriginLeft]);
      let encDataRight = await encDataV1([[[makerRight, 10000]], addrOriginRight]);

      const left = Order(makerLeft, Asset(ERC20, enc(erc20.address), 10), ZERO, Asset(ERC20, enc(t2.address), 20), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
      const right = Order(makerRight, Asset(ERC20, enc(t2.address), 20), ZERO, Asset(ERC20, enc(erc20.address), 10), 1, 0, 0, ORDER_DATA_V1, encDataRight);

      const signature = await getSignature(left, makerLeft);

      await exchangeV2.matchOrders(left, signature, right, "0x", { from: makerRight });

      assert.equal(await exchangeV2.fills(await helper.hashKey(left)), 20);

      assert.equal(await erc20.balanceOf(makerLeft), 0);
      assert.equal(await erc20.balanceOf(makerRight), 10);
      assert.equal(await t2.balanceOf(makerLeft), 20);
      assert.equal(await t2.balanceOf(makerRight), 0);
    })

    it("From ERC721(DataV1) to ERC20(NO DataV1) Protocol, Origin fees, no Royalties ", async () => {
      const erc721 = await prepareERC721(makerLeft)
      const erc20 = await prepareERC20(makerRight, 105)

      let addrOriginLeft = [[accounts[3], 100], [accounts[4], 200]];
      let encDataLeft = await encDataV1([[[makerLeft, 10000]], addrOriginLeft]);

      const left = Order(makerLeft, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
      const right = Order(makerRight, Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");

      const signature = await getSignature(left, makerLeft);

      const tx = await exchangeV2.matchOrders(left, signature, right, "0x", { from: makerRight });
      console.log("ERC20 <=> ERC721:", tx.receipt.gasUsed);

      assert.equal(await exchangeV2.fills(await helper.hashKey(left)), 100);

      assert.equal(await erc20.balanceOf(makerLeft), 97);	//=100 - 2originRight -1originleft
      assert.equal(await erc20.balanceOf(makerRight), 5);		//=105 - (100amount + 3byuerFee )
      assert.equal(await erc20.balanceOf(accounts[3]), 1);
      assert.equal(await erc20.balanceOf(accounts[4]), 2);
      assert.equal(await erc721.balanceOf(makerLeft), 0);
      assert.equal(await erc721.balanceOf(makerRight), 1);
      assert.equal(await erc20.balanceOf(community), 0);
    })

    it("From ERC20(DataV1) to ERC1155(RoyalytiV2, DataV1) Protocol, Origin fees, Royalties ", async () => {
      const erc1155 = await prepareERC1155(makerRight, 10, erc1155TokenId1, [[accounts[6], 1000], [accounts[7], 500]])
      const erc20 = await prepareERC20(makerLeft, 200)

      let addrOriginLeft = [[accounts[3], 300], [accounts[4], 400]];
      let addrOriginRight = [[accounts[5], 500]];

      let encDataLeft = await encDataV1([[[makerLeft, 10000]], addrOriginLeft]);
      let encDataRight = await encDataV1([[[makerRight, 10000]], addrOriginRight]);

      const left = Order(makerLeft, Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
      const right = Order(makerRight, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, ORDER_DATA_V1, encDataRight);

      const signature = await getSignature(left, makerLeft);

      const tx = await exchangeV2.matchOrders(left, signature, right, "0x", { from: makerRight });

      console.log("ERC20 <=> ERC1155:", tx.receipt.gasUsed);

      assert.equal(await exchangeV2.fills(await helper.hashKey(left)), 7);


      assert.equal(await erc20.balanceOf(makerLeft), 93);		//=120 - (100amount + 3byuerFee + 3originLeft + 4originleft)
      assert.equal(await erc20.balanceOf(makerRight), 80);			//=100 - 3sellerFee - (10 +5)Royalties - 5originRight

      assert.equal(await erc20.balanceOf(accounts[3]), 3);			//originleft
      assert.equal(await erc20.balanceOf(accounts[4]), 4);			//originleft
      assert.equal(await erc20.balanceOf(accounts[5]), 5);			//originRight
      assert.equal(await erc20.balanceOf(accounts[6]), 10);		//Royalties
      assert.equal(await erc20.balanceOf(accounts[7]), 5);			//Royalties
      assert.equal(await erc1155.balanceOf(makerLeft, erc1155TokenId1), 7);
      assert.equal(await erc1155.balanceOf(makerRight, erc1155TokenId1), 3);
      assert.equal(await erc20.balanceOf(protocol), 0);
    })

    it("From ERC1155(RoyalytiV2, DataV1) to ERC20(DataV1):Protocol, Origin fees, Royalties ", async () => {
      const erc1155 = await prepareERC1155(makerRight, 10, erc1155TokenId1, [[accounts[6], 1000], [accounts[7], 500]])
      const erc20 = await prepareERC20(makerLeft, 120)

      let addrOriginLeft = [[accounts[3], 300], [accounts[4], 400]];
      let addrOriginRight = [[accounts[5], 500]];

      let encDataLeft = await encDataV1([[[makerRight, 10000]], addrOriginLeft]);
      let encDataRight = await encDataV1([[[makerLeft, 10000]], addrOriginRight]);

      const left = Order(makerLeft, Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7), 1, 0, 0, ORDER_DATA_V1, encDataRight);
      const right = Order(makerRight, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, ORDER_DATA_V1, encDataLeft);

      const signature = await getSignature(left, makerLeft);

      const tx = await exchangeV2.matchOrders(left, signature, right, "0x", { from: makerRight });
      console.log("ERC1155 V1 <=> ERC20 V1:", tx.receipt.gasUsed);

      assert.equal(await exchangeV2.fills(await helper.hashKey(right)), 100);

      assert.equal(await erc20.balanceOf(makerLeft), 15);		//=120 - (100amount + 3byuerFee +5originRight )
      assert.equal(await erc20.balanceOf(makerRight), 78);			//=100 - 3sellerFee - (10 +5)Royalties - (3+4)originLeft

      assert.equal(await erc20.balanceOf(accounts[3]), 3);			//originleft
      assert.equal(await erc20.balanceOf(accounts[4]), 4);			//originleft
      assert.equal(await erc20.balanceOf(accounts[5]), 5);			//originRight
      assert.equal(await erc20.balanceOf(accounts[6]), 10);		//Royalties
      assert.equal(await erc20.balanceOf(accounts[7]), 5);			//Royalties
      assert.equal(await erc1155.balanceOf(makerLeft, erc1155TokenId1), 7);
      assert.equal(await erc1155.balanceOf(makerRight, erc1155TokenId1), 3);
      assert.equal(await erc20.balanceOf(protocol), 0);
    })

    it("From ETH(DataV1) to ERC720(RoyalytiV1, DataV1) Protocol, Origin fees, Royalties", async () => {
      const erc721V1 = await TestERC721RoyaltiesV1.new();
      await erc721V1.initialize();

      await erc721V1.mint(makerLeft, erc721TokenId1, [[accounts[3], 300], [accounts[4], 400]]);
      await erc721V1.setApprovalForAll(transferProxy.address, true, { from: makerLeft });

      let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600]];
      let addrOriginRight = [[accounts[7], 700]];

      let encDataLeft = await encDataV1([[[makerRight, 10000]], addrOriginLeft]);
      let encDataRight = await encDataV1([[[makerLeft, 10000]], addrOriginRight]);

      const left = Order(makerLeft, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
      const right = Order(makerRight, Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);

      const signature = await getSignature(left, makerLeft);

      await verifyBalanceChange(makerRight, 222, async () =>			//200+6buyerFee+ (10+12 origin left) (72back)
        verifyBalanceChange(makerLeft, -172, async () =>				//200 -6seller - (6+8royalties) - 14originright
          verifyBalanceChange(accounts[3], -6, async () =>
            verifyBalanceChange(accounts[4], -8, async () =>
              verifyBalanceChange(accounts[5], -10, async () =>
                verifyBalanceChange(accounts[6], -12, async () =>
                  verifyBalanceChange(accounts[7], -14, async () =>
                    verifyBalanceChange(protocol, 0, () =>
                      exchangeV2.matchOrders(left, signature, right, "0x", { from: makerRight, value: 300, gasPrice: 0 })
                    )
                  )
                )
              )
            )
          )
        )
      )
      assert.equal(await erc721V1.balanceOf(makerLeft), 0);
      assert.equal(await erc721V1.balanceOf(makerRight), 1);
    })

    it("From ETH(DataV1) to ERC720(DataV1) Protocol, Origin fees,  no Royalties", async () => {
      const erc721 = await prepareERC721(makerLeft)

      let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600]];
      let addrOriginRight = [[accounts[7], 700]];

      let encDataLeft = await encDataV1([[[makerRight, 10000]], addrOriginLeft]);
      let encDataRight = await encDataV1([[[makerLeft, 10000]], addrOriginRight]);

      const left = Order(makerLeft, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
      const right = Order(makerRight, Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);

      const signature = await getSignature(left, makerLeft);

      await verifyBalanceChange(makerRight, 222, async () =>			//200+6buyerFee+ (10 +12 origin left) (72back)
        verifyBalanceChange(makerLeft, -186, async () =>				//200 -6seller - 14 originright
          verifyBalanceChange(accounts[5], -10, async () =>
            verifyBalanceChange(accounts[6], -12, async () =>
              verifyBalanceChange(accounts[7], -14, async () =>
                verifyBalanceChange(protocol, 0, () =>
                  exchangeV2.matchOrders(left, signature, right, "0x", { from: makerRight, value: 300, gasPrice: 0 })
                )
              )
            )
          )
        )
      )
      assert.equal(await erc721.balanceOf(makerLeft), 0);
      assert.equal(await erc721.balanceOf(makerRight), 1);
    })

    it("From ETH(DataV1) to ERC720(DataV1) Protocol, Origin fees comes from OrderNFT,  no Royalties", async () => {
      const erc721 = await prepareERC721(makerLeft)

      let addrOriginLeft = [];
      let addrOriginRight = [[accounts[5], 500], [accounts[6], 600], [accounts[7], 700]];

      let encDataLeft = await encDataV1([[[makerRight, 10000]], addrOriginLeft]);
      let encDataRight = await encDataV1([[[makerLeft, 10000]], addrOriginRight]);

      const left = Order(makerLeft, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
      const right = Order(makerRight, Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);

      const signature = await getSignature(left, makerLeft);

      await verifyBalanceChange(makerRight, 200, async () =>			//200+6buyerFee+  (94back)
        verifyBalanceChange(makerLeft, -164, async () =>				//200 -6seller - (10+ 12+ 14) originright
          verifyBalanceChange(accounts[5], -10, async () =>
            verifyBalanceChange(accounts[6], -12, async () =>
              verifyBalanceChange(accounts[7], -14, async () =>
                verifyBalanceChange(protocol, 0, () =>
                  exchangeV2.matchOrders(left, signature, right, "0x", { from: makerRight, value: 300, gasPrice: 0 })
                )
              )
            )
          )
        )
      )
      assert.equal(await erc721.balanceOf(makerLeft), 0);
      assert.equal(await erc721.balanceOf(makerRight), 1);

    })

    it("From ETH(DataV1) to ERC720(DataV1) Protocol, Origin fees comes from OrderETH,  no Royalties", async () => {
      const erc721 = await prepareERC721(makerLeft)

      let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600], [accounts[7], 700]];
      let addrOriginRight = [];

      let encDataLeft = await encDataV1([[[makerRight, 10000]], addrOriginLeft]);
      let encDataRight = await encDataV1([[[makerLeft, 10000]], addrOriginRight]);

      const left = Order(makerLeft, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
      const right = Order(makerRight, Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);

      const signature = await getSignature(left, makerLeft);

      await verifyBalanceChange(makerRight, 236, async () =>			//200+6buyerFee+ (10 +12 +14 origin left) (72back)
        verifyBalanceChange(makerLeft, -200, async () =>				//200 -6seller -
          verifyBalanceChange(accounts[5], -10, async () =>
            verifyBalanceChange(accounts[6], -12, async () =>
              verifyBalanceChange(accounts[7], -14, async () =>
                verifyBalanceChange(protocol, 0, () =>
                  exchangeV2.matchOrders(left, signature, right, "0x", { from: makerRight, value: 300, gasPrice: 0 })
                )
              )
            )
          )
        )
      )
      assert.equal(await erc721.balanceOf(makerLeft), 0);
      assert.equal(await erc721.balanceOf(makerRight), 1);
    })

    it("From ETH(DataV1) to ERC720(DataV1) Protocol, no Royalties, Origin fees comes from OrderETH NB!!! not enough ETH", async () => {
      const erc721 = await prepareERC721(makerLeft)

      let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600], [accounts[7], 1000], [accounts[3], 3000]];
      let addrOriginRight = [];

      let encDataLeft = await encDataV1([[[makerRight, 10000]], addrOriginLeft]);
      let encDataRight = await encDataV1([[[makerLeft, 10000]], addrOriginRight]);

      const left = Order(makerLeft, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
      const right = Order(makerRight, Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);

      await expectThrow(
        exchangeV2.matchOrders(left, "0x", right, await getSignature(right, makerRight), { from: makerLeft, value: 300, gasPrice: 0 })
      );
    })

    it("From ETH(DataV1) to ERC720(DataV1) Protocol, no Royalties, Origin fees comes from OrderNFT NB!!! not enough ETH for lastOrigin and makerLeft!", async () => {
      const erc721 = await prepareERC721(makerLeft)

      let addrOriginLeft = [];
      let addrOriginRight = [[accounts[3], 9000], [accounts[5], 500], [accounts[6], 600], [accounts[7], 700]];

      let encDataLeft = await encDataV1([[[makerRight, 10000]], addrOriginLeft]);
      let encDataRight = await encDataV1([[[makerLeft, 10000]], addrOriginRight]);

      const left = Order(makerLeft, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
      const right = Order(makerRight, Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);

      const signature = await getSignature(right, makerRight)

      await verifyBalanceChange(makerLeft, 200, async () =>			//200+6buyerFee+
        verifyBalanceChange(makerRight, 0, async () =>				//200 -6seller -(180 + 10 + 12(really 10) + 14(really 0) origin left)
          verifyBalanceChange(accounts[3], -180, async () =>
            verifyBalanceChange(accounts[5], -10, async () =>
              verifyBalanceChange(accounts[6], -10, async () =>
                verifyBalanceChange(accounts[7], 0, async () =>
                  verifyBalanceChange(protocol, 0, () =>
                    exchangeV2.matchOrders(left, "0x", right, signature, { from: makerLeft, value: 300, gasPrice: 0 })
                  )
                )
              )
            )
          )
        )
      )
      assert.equal(await erc721.balanceOf(makerLeft), 0);
      assert.equal(await erc721.balanceOf(makerRight), 1);
    })

  })

  describe("Do matchOrders(), orders dataType == V1, MultipleBeneficiary", () => {
    it("From ERC20(100) to ERC20(200) Protocol, Origin fees, no Royalties, payouts: 1)20/80%, 2)50/50%", async () => {
      const erc20 = await prepareERC20(makerLeft, 104)
      const t2 = await prepareERC20(makerRight, 200)

      let addrOriginLeft = [[accounts[3], 100]];
      let addrOriginRight = [[accounts[4], 200]];
      let encDataLeft = await encDataV1([[[makerLeft, 5000], [accounts[5], 5000]], addrOriginLeft]);
      let encDataRight = await encDataV1([[[makerRight, 2000], [accounts[6], 8000]], addrOriginRight]);

      const left = Order(makerLeft, Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC20, enc(t2.address), 200), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
      const right = Order(makerRight, Asset(ERC20, enc(t2.address), 200), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, ORDER_DATA_V1, encDataRight);

      const signature = await getSignature(left, makerLeft)

      const tx = await exchangeV2.matchOrders(left, signature, right, "0x", { from: makerRight });
      console.log("ERC20 <=> ERC20 PAYOUTS:", tx.receipt.gasUsed);

      assert.equal(await exchangeV2.fills(await helper.hashKey(left)), 200);


      assert.equal(await erc20.balanceOf(makerLeft), 3); //=104 - (100amount + 3byuerFee +1originleft)
      assert.equal(await erc20.balanceOf(makerRight), 19);//=(100 - 3sellerFee - 2originRight)*20%
      assert.equal(await erc20.balanceOf(accounts[6]), 79);//=(100 - 3sellerFee - 2originRight)*80%
      assert.equal(await erc20.balanceOf(accounts[3]), 1);
      assert.equal(await erc20.balanceOf(accounts[4]), 2);
      assert.equal(await t2.balanceOf(makerLeft), 100); //50%
      assert.equal(await t2.balanceOf(accounts[5]), 100); //50%
      assert.equal(await t2.balanceOf(makerRight), 0);
    })

    it("From ERC721(DataV1) to ERC20(NO DataV1) Protocol, Origin fees, no Royalties, payouts: 50/50%", async () => {
      const erc20 = await prepareERC20(makerRight, 105)
      const erc721 = await prepareERC721(makerLeft)

      let addrOriginLeft = [[accounts[3], 100], [accounts[4], 100]];
      let encDataLeft = await encDataV1([[[makerLeft, 5000], [accounts[5], 5000]], addrOriginLeft]);
      const left = Order(makerLeft, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
      const right = Order(makerRight, Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");

      const signature = await getSignature(left, makerLeft)

      await exchangeV2.matchOrders(left, signature, right, "0x", { from: makerRight });

      assert.equal(await exchangeV2.fills(await helper.hashKey(left)), 100);

      assert.equal(await erc20.balanceOf(makerLeft), 49);	//=100 - 3sellerFee - 2originRight -1originleft 50%
      assert.equal(await erc20.balanceOf(accounts[5]), 49);	//=100 - 3sellerFee - 2originRight -1originleft 50%
      assert.equal(await erc20.balanceOf(makerRight), 5);		//=105 - (100amount + 3byuerFee )
      assert.equal(await erc20.balanceOf(accounts[3]), 1);
      assert.equal(await erc20.balanceOf(accounts[4]), 1);
      assert.equal(await erc721.balanceOf(makerLeft), 0);
      assert.equal(await erc721.balanceOf(makerRight), 1);
      assert.equal(await erc20.balanceOf(community), 0);
    })

    it("From ERC721(DataV1) to ERC20(NO DataV1) Protocol, Origin fees, no Royalties, payouts: 110%, throw", async () => {
      const erc20 = await prepareERC20(makerRight, 105)
      const erc721 = await prepareERC721(makerLeft)

      let addrOriginLeft = [[accounts[3], 100], [accounts[4], 200]];
      let encDataLeft = await encDataV1([[[makerLeft, 5000], [accounts[5], 6000]], addrOriginLeft]);

      const left = Order(makerLeft, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
      const right = Order(makerRight, Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");

      await expectThrow(
        exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: makerRight })
      );

    })

    it("From ETH(DataV1) to ERC721(DataV1) Protocol, Origin fees,  no Royalties, payouts: 50/50%", async () => {
      const erc721 = await prepareERC721(makerLeft)

      let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600]];
      let addrOriginRight = [[accounts[7], 700]];

      let encDataLeft = await encDataV1([[[makerRight, 10000]], addrOriginLeft]);
      let encDataRight = await encDataV1([[[makerLeft, 5000], [accounts[3], 5000]], addrOriginRight]);

      const left = Order(makerLeft, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
      const right = Order(makerRight, Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);

      const signature = await getSignature(left, makerLeft)

      await verifyBalanceChange(makerRight, 222, async () =>			//200+6buyerFee+ (10 +12 origin left) (72back)
        verifyBalanceChange(accounts[3], -93, async () =>				//200 -6seller - 14 originright *50%
          verifyBalanceChange(makerLeft, -93, async () =>				//200 -6seller - 14 originright *50%
            verifyBalanceChange(accounts[5], -10, async () =>
              verifyBalanceChange(accounts[6], -12, async () =>
                verifyBalanceChange(accounts[7], -14, async () =>
                  verifyBalanceChange(protocol, 0, () =>
                    exchangeV2.matchOrders(left, signature, right, "0x", { from: makerRight, value: 300, gasPrice: 0 })
                  )
                )
              )
            )
          )
        )
      )
      assert.equal(await erc721.balanceOf(makerLeft), 0);
      assert.equal(await erc721.balanceOf(makerRight), 1);
    })

    it("From ETH(DataV1) to ERC721(DataV1) Protocol, Origin fees,  no Royalties, payouts: empy 100% to order.maker", async () => {
      const erc721 = await prepareERC721(makerLeft)

      let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600]];
      let addrOriginRight = [[accounts[7], 700]];

      let encDataLeft = await encDataV1([[[makerRight, 10000]], addrOriginLeft]);
      let encDataRight = await encDataV1([[], addrOriginRight]); //empty payout

      const left = Order(makerLeft, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
      const right = Order(makerRight, Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);

      const signature = await getSignature(left, makerLeft)

      await verifyBalanceChange(makerRight, 222, async () =>			//200+6buyerFee+ (10 +12 origin left) (72back)
        verifyBalanceChange(makerLeft, -186, async () =>				//200 -6seller - 14 originright *100%
          verifyBalanceChange(accounts[5], -10, async () =>
            verifyBalanceChange(accounts[6], -12, async () =>
              verifyBalanceChange(accounts[7], -14, async () =>
                verifyBalanceChange(protocol, 0, () =>
                  exchangeV2.matchOrders(left, signature, right, "0x", { from: makerRight, value: 300, gasPrice: 0 })
                )
              )
            )
          )
        )
      )
      assert.equal(await erc721.balanceOf(makerLeft), 0);
      assert.equal(await erc721.balanceOf(makerRight), 1);
    })

  })

  describe("Exchange with Royalties", () => {
    it("Royalties by owner, token 721 to ETH", async () => {
      const erc721 = await prepareERC721(makerLeft)
      await royaltiesRegistry.setRoyaltiesByToken(erc721.address, [[accounts[3], 500], [accounts[4], 1000]]); //set royalties by token

      let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600]];
      let addrOriginRight = [[accounts[7], 700]];

      let encDataLeft = await encDataV1([[[makerRight, 10000]], addrOriginLeft]);
      let encDataRight = await encDataV1([[[makerLeft, 10000]], addrOriginRight]);

      const left = Order(makerLeft, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
      const right = Order(makerRight, Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);

      const signature = await getSignature(left, makerLeft)

      await verifyBalanceChange(makerRight, 222, async () =>			//200+6buyerFee+ (10 +12 origin left) (72back)
        verifyBalanceChange(makerLeft, -156, async () =>				//200 -6seller - 14 originright
          verifyBalanceChange(accounts[3], -10, async () =>
            verifyBalanceChange(accounts[4], -20, async () =>
              verifyBalanceChange(accounts[5], -10, async () =>
                verifyBalanceChange(accounts[6], -12, async () =>
                  verifyBalanceChange(accounts[7], -14, async () =>
                    verifyBalanceChange(protocol, 0, () =>
                      exchangeV2.matchOrders(left, signature, right, "0x", { from: makerRight, value: 300, gasPrice: 0 })
                    )
                  )
                )
              )
            )
          )
        )
      )
      assert.equal(await erc721.balanceOf(makerLeft), 0);
      assert.equal(await erc721.balanceOf(makerRight), 1);
    })
    it("Royalties by owner, token and tokenId 721 to ETH", async () => {
      const erc721 = await prepareERC721(makerLeft, erc721TokenId1, [[accounts[3], 500], [accounts[4], 1000]])

      let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600]];
      let addrOriginRight = [[accounts[7], 700]];

      let encDataLeft = await encDataV1([[[makerRight, 10000]], addrOriginLeft]);
      let encDataRight = await encDataV1([[[makerLeft, 10000]], addrOriginRight]);

      const left = Order(makerLeft, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
      const right = Order(makerRight, Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);

      const signature = await getSignature(left, makerLeft)

      await verifyBalanceChange(makerRight, 222, async () =>			//200+6buyerFee+ (10 +12 origin left) (72back)
        verifyBalanceChange(makerLeft, -156, async () =>				//200 -6seller - 14 originright
          verifyBalanceChange(accounts[3], -10, async () =>
            verifyBalanceChange(accounts[4], -20, async () =>
              verifyBalanceChange(accounts[5], -10, async () =>
                verifyBalanceChange(accounts[6], -12, async () =>
                  verifyBalanceChange(accounts[7], -14, async () =>
                    verifyBalanceChange(protocol, 0, () =>
                      exchangeV2.matchOrders(left, signature, right, "0x", { from: makerRight, value: 300, gasPrice: 0 })
                    )
                  )
                )
              )
            )
          )
        )
      )
      assert.equal(await erc721.balanceOf(makerLeft), 0);
      assert.equal(await erc721.balanceOf(makerRight), 1);
    })

    it("Royalties by token and tokenId 721v1_OwnableUpgradaeble to ETH", async () => {
      const erc721V1 = await TestERC721RoyaltiesV1.new();
      await erc721V1.initialize();

      await erc721V1.mint(makerLeft, erc721TokenId1, [[accounts[3], 500], [accounts[4], 1000]]);
      await erc721V1.setApprovalForAll(transferProxy.address, true, { from: makerLeft });

      let addrOriginLeft = [[accounts[5], 500]];
      let addrOriginRight = [[accounts[7], 700]];

      let encDataLeft = await encDataV1([[[makerRight, 10000]], addrOriginLeft]);
      let encDataRight = await encDataV1([[[makerLeft, 10000]], addrOriginRight]);

      const left = Order(makerLeft, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
      const right = Order(makerRight, Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);

      const signature = await getSignature(left, makerLeft)

      await verifyBalanceChange(makerRight, 210, async () =>			//200+6buyerFee+ (10  origin left) (72back)
        verifyBalanceChange(makerLeft, -156, async () =>				//200 -6seller - 14 originright
          verifyBalanceChange(accounts[3], -10, async () =>
            verifyBalanceChange(accounts[4], -20, async () =>
              verifyBalanceChange(accounts[5], -10, async () =>
                verifyBalanceChange(accounts[7], -14, async () =>
                  verifyBalanceChange(protocol, 0, () =>
                    exchangeV2.matchOrders(left, signature, right, "0x", { from: makerRight, value: 300, gasPrice: 0 })
                  )
                )
              )
            )
          )
        )
      )
      assert.equal(await erc721V1.balanceOf(makerLeft), 0);
      assert.equal(await erc721V1.balanceOf(makerRight), 1);
    })
  })

  describe("matchOrders, orderType = V2", () => {
    it("should correctly calculate make-side fill for isMakeFill = true ", async () => {
      const buyer1 = accounts[3];

      const erc1155 = await prepareERC1155(makerLeft, 200)

      const encDataLeft = await encDataV2([[], [], true]);
      const encDataRight = await encDataV2([[], [], false]);

      const left = Order(makerLeft, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 200), ZERO, Asset(ETH, "0x", 1000), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const right = Order(makerRight, Asset(ETH, "0x", 500), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), 1, 0, 0, ORDER_DATA_V2, encDataRight);

      await verifyBalanceChange(makerLeft, -500, async () =>
        verifyBalanceChange(makerRight, 500, async () =>
          exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: makerRight, value: 600, gasPrice: 0 })
        )
      )
      assert.equal(await erc1155.balanceOf(makerRight, erc1155TokenId1), 100);
      assert.equal(await erc1155.balanceOf(makerLeft, erc1155TokenId1), 100);

      const leftOrderHash = await helper.hashKey(left);
      const test_hash = await helper.hashV2(makerLeft, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 200), Asset(ETH, "0x", 1000), 1, encDataLeft)
      assert.equal(leftOrderHash, test_hash, "correct hash for V2")
      assert.equal(await exchangeV2.fills(leftOrderHash), 100, "left fill make side")

      const leferc20 = Order(makerLeft, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 200), ZERO, Asset(ETH, "0x", 600), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const righerc20 = Order(buyer1, Asset(ETH, "0x", 300), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), 1, 0, 0, ORDER_DATA_V2, encDataRight);

      await verifyBalanceChange(makerLeft, -300, async () =>
        verifyBalanceChange(buyer1, 300, async () =>
          exchangeV2.matchOrders(leferc20, await getSignature(leferc20, makerLeft), righerc20, "0x", { from: buyer1, value: 600, gasPrice: 0 })
        )
      )
      assert.equal(await exchangeV2.fills(leftOrderHash), 200, "left fill make side 1")
      assert.equal(await erc1155.balanceOf(buyer1, erc1155TokenId1), 100);
      assert.equal(await erc1155.balanceOf(makerLeft, erc1155TokenId1), 0);
    })

    it("should correctly calculate take-side fill for isMakeFill = false ", async () => {
      const buyer1 = accounts[3];

      const erc1155 = await prepareERC1155(makerLeft, 200)

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[], [], false]);

      const left = Order(makerLeft, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 200), ZERO, Asset(ETH, "0x", 1000), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const right = Order(makerRight, Asset(ETH, "0x", 500), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), 1, 0, 0, ORDER_DATA_V2, encDataRight);

      await verifyBalanceChange(makerLeft, -500, async () =>
        verifyBalanceChange(makerRight, 500, async () =>
          exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: makerRight, value: 600, gasPrice: 0 })
        )
      )
      assert.equal(await erc1155.balanceOf(makerRight, erc1155TokenId1), 100);
      assert.equal(await erc1155.balanceOf(makerLeft, erc1155TokenId1), 100);

      const leftOrderHash = await helper.hashKey(left);
      assert.equal(await exchangeV2.fills(leftOrderHash), 500, "left fill make side")

      const leferc20 = Order(makerLeft, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 200), ZERO, Asset(ETH, "0x", 2000), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const righerc20 = Order(buyer1, Asset(ETH, "0x", 1000), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), 1, 0, 0, ORDER_DATA_V2, encDataRight);

      await verifyBalanceChange(makerLeft, -1000, async () =>
        verifyBalanceChange(buyer1, 1000, async () =>
          exchangeV2.matchOrders(leferc20, await getSignature(leferc20, makerLeft), righerc20, "0x", { from: buyer1, value: 1100, gasPrice: 0 })
        )
      )

      assert.equal(await erc1155.balanceOf(buyer1, erc1155TokenId1), 100);
      assert.equal(await erc1155.balanceOf(makerLeft, erc1155TokenId1), 0);
      assert.equal(await exchangeV2.fills(leftOrderHash), 1500, "left fill make side 1")
    })

    it("should correctly calculate make-side fill for isMakeFill = true and LibPartToUints ", async () => {
      const buyer1 = accounts[3];

      const erc1155 = await prepareERC1155(makerLeft, 200)

      const encDataLeft = await encDataV2([[[makerLeft, 10000]], [[accounts[5], 1000]], true]);
      const encDataRight = await encDataV2([[], [], false]);

      const left = Order(makerLeft, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 200), ZERO, Asset(ETH, "0x", 1000), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const right = Order(makerRight, Asset(ETH, "0x", 500), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), 1, 0, 0, ORDER_DATA_V2, encDataRight);

      await verifyBalanceChange(makerLeft, -450, async () =>
        verifyBalanceChange(makerRight, 500, async () =>
          verifyBalanceChange(accounts[5], -50, async () =>
            exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: makerRight, value: 600, gasPrice: 0 })
          )
        )
      )
      assert.equal(await erc1155.balanceOf(makerRight, erc1155TokenId1), 100);
      assert.equal(await erc1155.balanceOf(makerLeft, erc1155TokenId1), 100);

      const leftOrderHash = await helper.hashKey(left);
      const test_hash = await helper.hashV2(makerLeft, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 200), Asset(ETH, "0x", 1000), 1, encDataLeft)
      assert.equal(leftOrderHash, test_hash, "correct hash for V2")
      assert.equal(await exchangeV2.fills(leftOrderHash), 100, "left fill make side")

      const leferc20 = Order(makerLeft, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 200), ZERO, Asset(ETH, "0x", 600), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const righerc20 = Order(buyer1, Asset(ETH, "0x", 300), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), 1, 0, 0, ORDER_DATA_V2, encDataRight);

      await verifyBalanceChange(makerLeft, -270, async () =>
        verifyBalanceChange(buyer1, 300, async () =>
          verifyBalanceChange(accounts[5], -30, async () =>
            exchangeV2.matchOrders(leferc20, await getSignature(leferc20, makerLeft), righerc20, "0x", { from: buyer1, value: 600, gasPrice: 0 })
          )
        )
      )
      assert.equal(await exchangeV2.fills(leftOrderHash), 200, "left fill make side 1")
      assert.equal(await erc1155.balanceOf(buyer1, erc1155TokenId1), 100);
      assert.equal(await erc1155.balanceOf(makerLeft, erc1155TokenId1), 0);
    })
  })

  describe("matchOrders, orderType = V3", () => {
    const originBuyer = accounts[3]
    const originSeller = accounts[4]
    const creator = accounts[5]
    const secondPayoutSeller = accounts[6]
    const originBuyer2 = accounts[6]
    const originSeller2 = accounts[7]

    it("should correctly pay to everyone envloved in a match ", async () => {
      const erc20 = await prepareERC20(makerRight, 1000)
      const erc1155 = await prepareERC1155(makerLeft, 1000)

      let encDataLeft = await encDataV3_BUY([0, await LibPartToUint(originBuyer, 300), 0, MARKET_MARKER_BUY]);
      let encDataRight = await encDataV3_SELL([0, await LibPartToUint(originSeller, 400), 0, 1000, MARKET_MARKER_SELL]);

      await royaltiesRegistry.setRoyaltiesByToken(erc1155.address, [[creator, 1000]]); //set royalties by token

      const left = Order(makerLeft, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 200), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, ORDER_DATA_V3_SELL, encDataRight);
      const right = Order(makerRight, Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 200), 1, 0, 0, ORDER_DATA_V3_BUY, encDataLeft);

      await exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: makerRight });

      assert.equal(await erc1155.balanceOf(makerRight, erc1155TokenId1), 200);
      assert.equal(await erc1155.balanceOf(makerLeft, erc1155TokenId1), 800);

      // 3% to protocol
      assert.equal(await erc20.balanceOf(protocol), 0);
      // 3% to originBuyer
      assert.equal(await erc20.balanceOf(originBuyer), 3);
      // 4% to originSeller
      assert.equal(await erc20.balanceOf(originSeller), 4);
      // 10% to creator as royalties, 80 left
      assert.equal(await erc20.balanceOf(creator), 10);
      // 100% of what's left (80) to makerLeft
      assert.equal(await erc20.balanceOf(makerLeft), 83);

      //checking fills
      // sell-order has make-side fills
      assert.equal(await exchangeV2.fills(await helper.hashKey(right)), 200);
      //buy-order has take-side fills
      assert.equal(await exchangeV2.fills(await helper.hashKey(left)), 200);
    })

    it("should not match when there's a problem with orders' types ", async () => {
      const erc20 = await prepareERC20(makerRight, 1000)
      const erc1155 = await prepareERC1155(makerLeft, 1000)

      let encDataRight = await encDataV3_BUY([0, await LibPartToUint(originBuyer, 300), 0, MARKET_MARKER_BUY]);
      let encDataLeft = await encDataV3_SELL([0, await LibPartToUint(originSeller, 400), 0, 1000, MARKET_MARKER_SELL]);

      let left = Order(makerLeft, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, ORDER_DATA_V3_BUY, encDataRight);
      let right = Order(makerRight, Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), 1, 0, 0, ORDER_DATA_V3_SELL, encDataLeft);

      // wrong => sell order has V3_BUY type and buy order has V3_SELL type
      await truffleAssert.fails(
        exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: makerRight }),
        truffleAssert.ErrorType.REVERT,
        "wrong V3 type2"
      )

      // wrong => sell order has no type (buy order is correct)
      changeOrderData(left, encDataLeft);
      changeOrderData(right, encDataRight);

      changeOrderType(right, ORDER_DATA_V3_BUY);
      changeOrderType(left, "0xffffffff");
      await expectThrow(
        exchangeV2.matchOrders(right, await getSignature(left, makerLeft), right, "0x", { from: makerRight })
      );

      // wrong => sell order has V1 type (buy order is correct)
      changeOrderType(left, ORDER_DATA_V1);
      await expectThrow(
        exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: makerRight })
      );

      // wrong => sell order has V2 type (buy order is correct)
      changeOrderType(left, ORDER_DATA_V2);
      await expectThrow(
        exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: makerRight })
      );

      // wrong => buy order has no type (sell order is coorect)
      changeOrderType(right, "0xffffffff");
      changeOrderType(left, ORDER_DATA_V3_SELL);
      await expectThrow(
        exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: makerRight })
      );

      // wrong => buy order has V1 type (sell order is coorect)
      changeOrderType(right, ORDER_DATA_V1);
      await expectThrow(
        exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: makerRight })
      );

      // wrong => buy order has V2 type (sell order is coorect)
      changeOrderType(right, ORDER_DATA_V2);
      await expectThrow(
        exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: makerRight })
      );

      // make type right
      changeOrderType(right, ORDER_DATA_V3_BUY);
      await exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: makerRight })

    })

    it("should not match when there's a problem with fees sum ", async () => {
      const erc20 = await prepareERC20(makerRight, 1000)
      const erc1155 = await prepareERC1155(makerLeft, 1000)

      let encDataLeft = await encDataV3_SELL([0, await LibPartToUint(originSeller, 400), 0, 1000, MARKET_MARKER_SELL]);
      let encDataRight = await encDataV3_BUY([0, await LibPartToUint(originBuyer, 700), 0, MARKET_MARKER_BUY]);

      let left = Order(makerLeft, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, ORDER_DATA_V3_SELL, encDataLeft);
      let right = Order(makerRight, Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), 1, 0, 0, ORDER_DATA_V3_BUY, encDataRight);

      await expectThrow(
        exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: makerRight })
      );

      changeOrderData(right, await encDataV3_BUY([0, await LibPartToUint(originBuyer, 400), 0, MARKET_MARKER_SELL]))

      await exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: makerRight })

    })


    it("should not match when there's a problem with max fee ", async () => {
      const erc20 = await prepareERC20(makerRight, 1000)
      const erc1155 = await prepareERC1155(makerLeft, 1000)

      let encDataLeft = await encDataV3_SELL([0, await LibPartToUint(originBuyer, 300), 0, 200, MARKET_MARKER_SELL]);
      let encDataRight = await encDataV3_BUY([0, await LibPartToUint(), 0, MARKET_MARKER_BUY]);

      let left = Order(makerLeft, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, ORDER_DATA_V3_SELL, encDataLeft);
      let right = Order(makerRight, Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), 1, 0, 0, ORDER_DATA_V3_BUY, encDataRight);

      // wrong, maxfee = 2%, protocolFee = 3%
      await expectThrow(
        exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: makerRight })
      );

      changeOrderData(left, await encDataV3_SELL([0, await LibPartToUint(), 0, 0, MARKET_MARKER_SELL]))
      await expectThrow(
        exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: makerRight })
      );

      //setting maxFee at 1% works
      changeOrderData(left, await encDataV3_SELL([0, await LibPartToUint(), 0, 100, MARKET_MARKER_SELL]))
      await exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: makerRight })

    })

    it("should work with 2 origin Fees", async () => {
      const erc20 = await prepareERC20(makerLeft, 1000)
      const erc1155 = await prepareERC1155(makerRight, 1000)

      let encDataLeft = await encDataV3_BUY([0, await LibPartToUint(originBuyer, 100), await LibPartToUint(originBuyer2, 200), MARKET_MARKER_BUY]);
      let encDataRight = await encDataV3_SELL([0, await LibPartToUint(originSeller, 300), await LibPartToUint(originSeller2, 400), 1000, MARKET_MARKER_SELL]);

      let left = Order(makerLeft, Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), 1, 0, 0, ORDER_DATA_V3_BUY, encDataLeft);
      let right = Order(makerRight, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, ORDER_DATA_V3_SELL, encDataRight);

      await exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: makerRight })

      // 0% to protocol
      assert.equal(await erc20.balanceOf(protocol), 0);
      // 1% to originBuyer
      assert.equal(await erc20.balanceOf(originBuyer), 1);
      // 2% to originBuyer2
      assert.equal(await erc20.balanceOf(originBuyer2), 2);
      // 3% to originSeller
      assert.equal(await erc20.balanceOf(originSeller), 3);
      // 4% to originSeller2
      assert.equal(await erc20.balanceOf(originSeller2), 4);
      // 100% of what's left to makerRight
      assert.equal(await erc20.balanceOf(makerRight), 90);

    })

    it("should work when using only second origin", async () => {
      const erc20 = await prepareERC20(makerLeft, 1000)
      const erc1155 = await prepareERC1155(makerRight, 1000)

      let encDataLeft = await encDataV3_BUY([0, 0, await LibPartToUint(originBuyer2, 200), MARKET_MARKER_SELL]);
      let encDataRight = await encDataV3_SELL([0, 0, await LibPartToUint(originSeller2, 400), 1000, MARKET_MARKER_SELL]);

      let left = Order(makerLeft, Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), 1, 0, 0, ORDER_DATA_V3_BUY, encDataLeft);
      let right = Order(makerRight, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, ORDER_DATA_V3_SELL, encDataRight);

      await exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: makerRight })

      // 0% to protocol
      assert.equal(await erc20.balanceOf(protocol), 0);
      // 2% to originBuyer2
      assert.equal(await erc20.balanceOf(originBuyer2), 2);
      // 4% to originSeller2
      assert.equal(await erc20.balanceOf(originSeller2), 4);
      // 100% of what's left to makerRight
      assert.equal(await erc20.balanceOf(makerRight), 94);

    })

    function changeOrderData(order, data) {
      order.data = data;
    }

    function changeOrderType(order, type) {
      order.dataType = type;
    }
  })

  describe("integrity", () => {
    it("should match orders with crypto punks", async () => {
      const cryptoPunksMarket = await CryptoPunksMarket.deployed();
      await cryptoPunksMarket.allInitialOwnersAssigned(); //allow test contract work with Punk CONTRACT_OWNER accounts[0]
      const punkIndex = 256;
      await cryptoPunksMarket.getPunk(punkIndex, { from: makerLeft }); //makerLeft - owner punk with punkIndex

      const proxy = await PunkTransferProxy.deployed();

      await cryptoPunksMarket.offerPunkForSaleToAddress(punkIndex, 0, proxy.address, { from: makerLeft }); //makerLeft - wants to sell punk with punkIndex, min price 0 wei

      const encodedMintData = await enc(cryptoPunksMarket.address, punkIndex);;

      const erc20 = await prepareERC20(makerRight, 106);

      const left = Order(makerLeft, Asset((CRYPTO_PUNKS), encodedMintData, 1), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(makerRight, Asset(ERC20, enc(erc20.address), 100), ZERO, Asset((CRYPTO_PUNKS), encodedMintData, 1), 1, 0, 0, "0xffffffff", "0x");

      await exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, await getSignature(right, makerRight));

      assert.equal(await erc20.balanceOf(makerLeft), 100);
      assert.equal(await cryptoPunksMarket.balanceOf(makerLeft), 0);//makerLeft - not owner now
      assert.equal(await cryptoPunksMarket.balanceOf(makerRight), 1);//punk owner - makerRight
    })

    it("should match orders with ERC721 сollections", async () => {
      const erc721 = await prepareERC721(makerLeft)

      const left = Order(makerLeft, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(makerRight, Asset(ETH, "0x", 200), ZERO, Asset(COLLECTION, enc(erc721.address), 1), 1, 0, 0, "0xffffffff", "0x");

      const tx = await exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, await getSignature(right, makerRight), { value: 300 });
      console.log("ETH <=> COLLECTION:", tx.receipt.gasUsed);

      assert.equal(await erc721.balanceOf(makerLeft), 0);
      assert.equal(await erc721.balanceOf(makerRight), 1);
    })

  })

  function encDataV1(tuple) {
    return helper.encode(tuple);
  }

  function encDataV2(tuple) {
    return helper.encodeV2(tuple);
  }

  function encDataV3_BUY(tuple) {
    return helper.encodeV3_BUY(tuple);
  }

  function encDataV3_SELL(tuple) {
    return helper.encodeV3_SELL(tuple);
  }

  async function LibPartToUint(account = zeroAddress, value = 0) {
    return await helper.encodeOriginFeeIntoUint(account, value);
  }

  async function prepareERC20(user, value = 1000) {
    const erc20Token = await TestERC20.new();

    await erc20Token.mint(user, value);
    await erc20Token.approve(erc20TransferProxy.address, value, { from: user });
    return erc20Token;
  }

  async function prepareERC721(user, tokenId = erc721TokenId1, royalties = []) {
    const erc721 = await TestERC721RoyaltiesV2.new();
    await erc721.initialize();

    await erc721.mint(user, tokenId, royalties);
    await erc721.setApprovalForAll(transferProxy.address, true, { from: user });
    return erc721;
  }

  async function prepareERC721Lazy() {
    const erc721Lazy = await ERC721LazyMintTest.new();
    return erc721Lazy;
  }

  async function prepareERC1155(user, value = 100, tokenId = erc1155TokenId1, royalties = []) {
    const erc1155 = await TestERC1155RoyaltiesV2.new();
    await erc1155.initialize();

    await erc1155.mint(user, tokenId, value, royalties);
    await erc1155.setApprovalForAll(transferProxy.address, true, { from: user });
    return erc1155;
  }

  async function getSignature(order, signer) {
		return sign(order, signer, exchangeV2.address);
	}

});
