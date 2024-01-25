const truffleAssert = require('truffle-assertions');
const { deployments } = require('hardhat');

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
//Lazy
const ERC721LazyMintTest = artifacts.require("ERC721LazyMintTest.sol");

const { Order, Asset, sign } = require("../../../../scripts/order.js");
const ZERO = "0x0000000000000000000000000000000000000000";
const zeroAddress = "0x0000000000000000000000000000000000000000";
const { expectThrow } = require("@daonomic/tests-common");
const { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, ORDER_DATA_V2, ORDER_DATA_V3_BUY, ORDER_DATA_V3_SELL, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, CRYPTO_PUNKS, COLLECTION, TO_LOCK, LOCK, enc, id } = require("../../../../scripts/assets.js");
const MARKET_MARKER_SELL = "0x68619b8adb206de04f676007b2437f99ff6129b672495a6951499c6c56bc2f10";
const MARKET_MARKER_BUY = "0x68619b8adb206de04f676007b2437f99ff6129b672495a6951499c6c56bc2f11";

const { verifyBalanceChangeReturnTx } = require("../../../../scripts/balance")

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
    const deployed = await deployments.fixture(['all'])
    //transfer proxes
    transferProxy = await TransferProxy.at(deployed["TransferProxy"].address);
    erc20TransferProxy = await ERC20TransferProxy.at(deployed["ERC20TransferProxy"].address);

    //royaltiesRegistry
    royaltiesRegistry = await RoyaltiesRegistry.at(deployed["RoyaltiesRegistry"].address)

    /*Auction*/
    exchangeV2 = await ExchangeV2.at(deployed["ExchangeV2"].address);

    helper = await RaribleTestHelper.new()
  });

  describe("gas estimation direct Purchase/AcceptBid", () => {

    it("ERC721<->ETH(FREE), not same origin, not same royalties V2", async () => {
      const price = 0;
      const salt = 1;
      const nftAmount = 1
      const erc721 = await prepareERC721(makerLeft);

      let addrOriginLeft = [[accounts[6], 300]];
      let addrOriginRight = [[accounts[5], 300]];

      let encDataLeft = await encDataV2([[], addrOriginLeft, true]);
      let encDataRight = await encDataV2([[], addrOriginRight, false]);

      const left = Order(makerLeft, Asset(ERC721, enc(erc721.address, erc721TokenId1), nftAmount), ZERO, Asset(ETH, "0x", price), salt, 0, 0, ORDER_DATA_V2, encDataLeft);
      const right = Order(makerRight, Asset(ETH, "0x", price), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), nftAmount), 0, 0, 0, ORDER_DATA_V2, encDataRight);
      const signature = await getSignature(left, makerLeft);

      const tx = await exchangeV2.matchOrders(left, signature, right, "0x", { from: makerRight, value: 0 });
      console.log("ERC721<->ETH, not same origin, not same royalties V2:", tx.receipt.gasUsed);
    })

    it("Direct buy ERC721_Lazy<->ETH, not same origin, not same royalties V2", async () => {
      const _priceSell = 100;
      const _pricePurchase = 100;
      const salt = 1;
      const nftAmount = 1
      const erc721 = await prepareERC721Lazy();
      const encodedMintData = await erc721.encode([erc721TokenId1, "uri", [], [], []]);

      let addrOriginLeft = [[accounts[6], 300]];
      let addrOriginRight = [[accounts[5], 300]];

      let encDataLeft = await encDataV2([[], addrOriginLeft, true]);
      let encDataRight = await encDataV2([[], addrOriginRight, false]);

      const _nftPurchaseAssetData = "0x";
      const left = Order(makerLeft, Asset(id("ERC721_LAZY"), encodedMintData, nftAmount), ZERO, Asset(ETH, _nftPurchaseAssetData, _priceSell), salt, 0, 0, ORDER_DATA_V2, encDataLeft);
      const signature = await getSignature(left, makerLeft);

      const directPurchaseParams = {
        sellOrderMaker: makerLeft,
        sellOrderNftAmount: nftAmount,
        nftAssetClass: id("ERC721_LAZY"),
        nftData: encodedMintData,
        sellOrderPaymentAmount: _priceSell,
        paymentToken: zeroAddress,
        sellOrderSalt: salt,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signature,
        buyOrderPaymentAmount: _pricePurchase,
        buyOrderNftAmount: nftAmount,
        buyOrderData: encDataRight
      };

      const tx = await exchangeV2.directPurchase(directPurchaseParams, { from: makerRight, value: 200 });
      console.log("direct buy ERC721Lazy<->ETH, not same origin, not same royalties V2:", tx.receipt.gasUsed);
    })

    it("Direct buy ERC721<->ETH, not same origin, not same royalties V2", async () => {
      const _priceSell = 100;
      const _pricePurchase = 100;
      const salt = 1;
      const nftAmount = 1
      const erc721 = await prepareERC721(makerLeft);

      let addrOriginLeft = [[accounts[6], 300]];
      let addrOriginRight = [[accounts[5], 300]];

      let encDataLeft = await encDataV2([[], addrOriginLeft, true]);;
      let encDataRight = await encDataV2([[], addrOriginRight, false]);;

      const _nftSellAssetData = enc(erc721.address, erc721TokenId1);
      const _nftPurchaseAssetData = "0x";
      const left = Order(makerLeft, Asset(ERC721, _nftSellAssetData, nftAmount), ZERO, Asset(ETH, _nftPurchaseAssetData, _priceSell), salt, 0, 0, ORDER_DATA_V2, encDataLeft);
      const signature = await getSignature(left, makerLeft);

      const directPurchaseParams = {
        sellOrderMaker: makerLeft,
        sellOrderNftAmount: nftAmount,
        nftAssetClass: ERC721,
        nftData: _nftSellAssetData,
        sellOrderPaymentAmount: _priceSell,
        paymentToken: zeroAddress,
        sellOrderSalt: salt,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signature,
        buyOrderPaymentAmount: _pricePurchase,
        buyOrderNftAmount: nftAmount,
        buyOrderData: encDataRight
      };
      const tx = await exchangeV2.directPurchase(directPurchaseParams, { from: makerRight, value: 200 });
      console.log("direct buy ERC721<->ETH, not same origin, not same royalties V2:", tx.receipt.gasUsed);
    })

    it("Direct accept bid ERC20<->ERC721, not same origin, not same royalties V2", async () => {
      const _priceBid = 100;
      const _priceAccept = 100;
      const salt = 1;
      const _nftBidAmount = 1;
      const _nftAcceptAmount = 1;
      const erc20 = await prepareERC20(makerLeft, 1000);
      const erc721 = await prepareERC721(makerRight);

      let addrOriginLeft = [[accounts[6], 300]];
      let addrOriginRight = [[accounts[5], 300]];

      let encDataLeft = await encDataV2([[], addrOriginLeft, true]);
      let encDataRight = await encDataV2([[], addrOriginRight, false]);

      const _nftAssetData = enc(erc721.address, erc721TokenId1);
      const _paymentAssetData = enc(erc20.address);

      const bidOrder = Order(makerLeft, Asset(ERC20, _paymentAssetData, _priceBid), ZERO, Asset(ERC721, _nftAssetData, _nftBidAmount), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const signature = await getSignature(bidOrder, makerLeft);


      const directAcceptParams = {
        bidMaker: makerLeft,
        bidNftAmount: _nftBidAmount,
        nftAssetClass: ERC721,
        nftData: _nftAssetData,
        bidPaymentAmount: _priceBid,
        paymentToken: erc20.address,
        bidSalt: salt,
        bidStart: 0,
        bidEnd: 0,
        bidDataType: ORDER_DATA_V2,
        bidData: encDataLeft,
        bidSignature: signature,
        sellOrderPaymentAmount: _priceAccept,
        sellOrderNftAmount: _nftAcceptAmount,
        sellOrderData: encDataRight
      };

      const tx = await exchangeV2.directAcceptBid(directAcceptParams, { from: makerRight });
      console.log("Direct accept bid ERC20<->ERC721, not same origin, not same royalties V2:", tx.receipt.gasUsed);
    })
  });

  describe("balance check direct Purchase/AcceptBid", () => {

    it("Direct buy ERC1155(all)<->ETH, not same origin, not same royalties V2", async () => {
      const _priceSell = 100;
      const _pricePurchase = 100;
      const salt = 1;
      const nftAmount = 7;
      const nftPurchaseAmount = 7;
      const erc1155 = await prepareERC1155(makerLeft, 10, erc1155TokenId1, [[accounts[7], 100]]);

      let addrOriginLeft = [[accounts[6], 300]];
      let addrOriginRight = [[accounts[5], 300]];

      let encDataLeft = await encDataV2([[], addrOriginLeft, true]);
      let encDataRight = await encDataV2([[], addrOriginRight, false]);

      const _nftSellAssetData = enc(erc1155.address, erc1155TokenId1);
      const _nftPurchaseAssetData = "0x";

      const left = Order(makerLeft, Asset(ERC1155, _nftSellAssetData, nftAmount), ZERO, Asset(ETH, _nftPurchaseAssetData, _priceSell), salt, 0, 0, ORDER_DATA_V2, encDataLeft);
      const signature = await getSignature(left, makerLeft);

      const directPurchaseParams = {
        sellOrderMaker: makerLeft,
        sellOrderNftAmount: nftAmount,
        nftAssetClass: ERC1155,
        nftData: _nftSellAssetData,
        sellOrderPaymentAmount: _priceSell,
        paymentToken: zeroAddress,
        sellOrderSalt: salt,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signature,
        buyOrderPaymentAmount: _pricePurchase,
        buyOrderNftAmount: nftPurchaseAmount,
        buyOrderData: encDataRight
      };

      assert.equal(await erc1155.balanceOf(makerLeft, erc1155TokenId1), 10);
      assert.equal(await erc1155.balanceOf(makerRight, erc1155TokenId1), 0);
      await verifyBalanceChangeReturnTx(web3, makerRight, 103, async () =>
        verifyBalanceChangeReturnTx(web3, makerLeft, -96, async () =>
          verifyBalanceChangeReturnTx(web3, protocol, 0, () =>
            verifyBalanceChangeReturnTx(web3, accounts[6], -3, () =>      //OriginLeft
              verifyBalanceChangeReturnTx(web3, accounts[5], -3, () =>    //OriginRight
                verifyBalanceChangeReturnTx(web3, accounts[7], -1, () =>  //royalties
                  exchangeV2.directPurchase(directPurchaseParams, { from: makerRight, value: 200 })
                )
              )
            )
          )
        )
      );
      assert.equal(await erc1155.balanceOf(makerLeft, erc1155TokenId1), 3);
      assert.equal(await erc1155.balanceOf(makerRight, erc1155TokenId1), 7);
    })

    it("Direct buy ERC1155(partly)<->ERC20, not same origin, not same royalties V2", async () => {
      const _priceSell = 100;
      const _pricePurchase = 50;
      const salt = 1;
      const nftAmount = 4;
      const nftPurchaseAmount = 2;
      const erc1155 = await prepareERC1155(makerLeft, 10, erc1155TokenId1, [[accounts[7], 100]]);
      const erc20 = await prepareERC20(makerRight, 1000);

      let addrOriginLeft = [[accounts[6], 300]];
      let addrOriginRight = [[accounts[5], 300]];

      let encDataLeft = await encDataV2([[], addrOriginLeft, true]);
      let encDataRight = await encDataV2([[], addrOriginRight, false]);

      const _nftSellAssetData = enc(erc1155.address, erc1155TokenId1);
      const _nftPurchaseAssetData = enc(erc20.address);;

      const left = Order(makerLeft, Asset(ERC1155, _nftSellAssetData, nftAmount), ZERO, Asset(ERC20, _nftPurchaseAssetData, _priceSell), salt, 0, 0, ORDER_DATA_V2, encDataLeft);
      const signature = await getSignature(left, makerLeft);

      const directPurchaseParams = {
        sellOrderMaker: makerLeft,
        sellOrderNftAmount: nftAmount,
        nftAssetClass: ERC1155,
        nftData: _nftSellAssetData,
        sellOrderPaymentAmount: _priceSell,
        paymentToken: erc20.address,
        sellOrderSalt: salt,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signature,

        buyOrderPaymentAmount: _pricePurchase,
        buyOrderNftAmount: nftPurchaseAmount,
        buyOrderData: encDataRight
      };

      assert.equal(await erc1155.balanceOf(makerLeft, erc1155TokenId1), 10);
      assert.equal(await erc1155.balanceOf(makerRight, erc1155TokenId1), 0);
      await exchangeV2.directPurchase(directPurchaseParams, { from: makerRight });
      assert.equal(await erc20.balanceOf(makerRight), 949);
      assert.equal(await erc20.balanceOf(makerLeft), 49);
      assert.equal(await erc20.balanceOf(accounts[6]), 1);
      assert.equal(await erc20.balanceOf(accounts[5]), 1);
      assert.equal(await erc20.balanceOf(accounts[7]), 0);
      assert.equal(await erc20.balanceOf(protocol), 0);
      assert.equal(await erc1155.balanceOf(makerLeft, erc1155TokenId1), 8);
      assert.equal(await erc1155.balanceOf(makerRight, erc1155TokenId1), 2);
    })

    it("Direct accept bid ERC721<->ERC20, not same origin, not same royalties V2", async () => {
      const _priceBid = 100;
      const _priceAccept = 100;
      const salt = 1;
      const _nftBidAmount = 1;
      const _nftAcceptAmount = 1;
      const erc20 = await prepareERC20(makerLeft, 1000);
      const erc721 = await prepareERC721(makerRight, erc721TokenId1, [[accounts[7], 100]]); //with royalties

      let addrOriginLeft = [[accounts[6], 300]];
      let addrOriginRight = [[accounts[5], 300]];

      let encDataLeft = await encDataV2([[], addrOriginLeft, true]);
      let encDataRight = await encDataV2([[], addrOriginRight, false]);

      const _nftAssetData = enc(erc721.address, erc721TokenId1);
      const _paymentAssetData = enc(erc20.address);

      const left = Order(makerLeft, Asset(ERC20, _paymentAssetData, _priceBid), ZERO, Asset(ERC721, _nftAssetData, _nftBidAmount), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const signature = await getSignature(left, makerLeft);

      const directAcceptParams = {
        bidMaker: makerLeft,
        bidNftAmount: _nftBidAmount,
        nftAssetClass: ERC721,
        nftData: _nftAssetData,
        bidPaymentAmount: _priceBid,
        paymentToken: erc20.address,
        bidSalt: salt,
        bidStart: 0,
        bidEnd: 0,
        bidDataType: ORDER_DATA_V2,
        bidData: encDataLeft,
        bidSignature: signature,
        sellOrderPaymentAmount: _priceAccept,
        sellOrderNftAmount: _nftAcceptAmount,
        sellOrderData: encDataRight
      };

      assert.equal(await erc721.balanceOf(makerLeft), 0);
      assert.equal(await erc721.balanceOf(makerRight), 1);
      await exchangeV2.directAcceptBid(directAcceptParams, { from: makerRight });
      assert.equal(await erc721.balanceOf(makerLeft), 1);
      assert.equal(await erc721.balanceOf(makerRight), 0);
      assert.equal(await erc20.balanceOf(makerLeft), 897);
      assert.equal(await erc20.balanceOf(makerRight), 96);
      assert.equal(await erc20.balanceOf(accounts[6]), 3);
      assert.equal(await erc20.balanceOf(accounts[5]), 3);
      assert.equal(await erc20.balanceOf(accounts[7]), 1);
      assert.equal(await erc20.balanceOf(protocol), 0);
    })

    it("Direct accept bid ERC20<->ERC1155(all), not same origin, not same royalties V2", async () => {
      const _priceBid = 100;
      const _priceAccept = 100;
      const salt = 1;
      const _nftBidAmount = 7;
      const _nftAcceptAmount = 7;
      const erc20 = await prepareERC20(makerLeft, 1000);
      const erc1155 = await prepareERC1155(makerRight, 10, erc1155TokenId1, [[accounts[7], 100]]);//with royalties

      let addrOriginLeft = [[accounts[6], 300]];
      let addrOriginRight = [[accounts[5], 300]];

      let encDataLeft = await encDataV2([[], addrOriginLeft, false]);
      let encDataRight = await encDataV2([[], addrOriginRight, true]);

      const _nftAssetData = enc(erc1155.address, erc1155TokenId1);
      const _paymentAssetData = enc(erc20.address);

      const left = Order(makerLeft, Asset(ERC20, _paymentAssetData, 100), ZERO, Asset(ERC1155, _nftAssetData, _nftBidAmount), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const signature = await getSignature(left, makerLeft);

      const directAcceptParams = {
        bidMaker: makerLeft,
        bidNftAmount: _nftBidAmount,
        nftAssetClass: ERC1155,
        nftData: _nftAssetData,
        bidPaymentAmount: _priceBid,
        paymentToken: erc20.address,
        bidSalt: salt,
        bidStart: 0,
        bidEnd: 0,
        bidDataType: ORDER_DATA_V2,
        bidData: encDataLeft,
        bidSignature: signature,
        sellOrderPaymentAmount: _priceAccept,
        sellOrderNftAmount: _nftAcceptAmount,
        sellOrderData: encDataRight
      };

      assert.equal(await erc1155.balanceOf(makerLeft, erc1155TokenId1), 0);
      assert.equal(await erc1155.balanceOf(makerRight, erc1155TokenId1), 10);
      await exchangeV2.directAcceptBid(directAcceptParams, { from: makerRight });
      assert.equal(await erc1155.balanceOf(makerLeft, erc1155TokenId1), 7);
      assert.equal(await erc1155.balanceOf(makerRight, erc1155TokenId1), 3);
      assert.equal(await erc20.balanceOf(makerLeft), 897);
      assert.equal(await erc20.balanceOf(makerRight), 96);
      assert.equal(await erc20.balanceOf(accounts[6]), 3);
      assert.equal(await erc20.balanceOf(accounts[5]), 3);
      assert.equal(await erc20.balanceOf(accounts[7]), 1);
      assert.equal(await erc20.balanceOf(protocol), 0);
    })

    it("Direct accept bid ERC20<->ERC1155(partly), not same origin, not same royalties V2", async () => {
      const _priceBid = 1000;
      const _priceAccept = 700;
      const salt = 1;
      const _nftBidAmount = 10;
      const _nftAcceptAmount = 7;
      const erc20 = await prepareERC20(makerLeft, 2000);
      const erc1155 = await prepareERC1155(makerRight, 10, erc1155TokenId1, [[accounts[7], 100]]);//with royalties

      let addrOriginLeft = [[accounts[6], 300]];
      let addrOriginRight = [[accounts[5], 300]];

      let encDataLeft = await encDataV2([[], addrOriginLeft, false]);
      let encDataRight = await encDataV2([[], addrOriginRight, true]);

      const _nftAssetData = enc(erc1155.address, erc1155TokenId1);
      const _paymentAssetData = enc(erc20.address);

      const left = Order(makerLeft, Asset(ERC20, _paymentAssetData, _priceBid), ZERO, Asset(ERC1155, _nftAssetData, _nftBidAmount), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const signature = await getSignature(left, makerLeft);

      const directAcceptParams = {
        bidMaker: makerLeft,
        bidNftAmount: _nftBidAmount,
        nftAssetClass: ERC1155,
        nftData: _nftAssetData,
        bidPaymentAmount: _priceBid,
        paymentToken: erc20.address,
        bidSalt: salt,
        bidStart: 0,
        bidEnd: 0,
        bidDataType: ORDER_DATA_V2,
        bidData: encDataLeft,
        bidSignature: signature,
        sellOrderPaymentAmount: _priceAccept,
        sellOrderNftAmount: _nftAcceptAmount,
        sellOrderData: encDataRight
      };

      assert.equal(await erc1155.balanceOf(makerLeft, erc1155TokenId1), 0);
      assert.equal(await erc1155.balanceOf(makerRight, erc1155TokenId1), 10);
      await exchangeV2.directAcceptBid(directAcceptParams, { from: makerRight });
      assert.equal(await erc1155.balanceOf(makerLeft, erc1155TokenId1), 7);
      assert.equal(await erc1155.balanceOf(makerRight, erc1155TokenId1), 3);
      assert.equal(await erc20.balanceOf(makerLeft), 1279);
      assert.equal(await erc20.balanceOf(makerRight), 672);
      assert.equal(await erc20.balanceOf(accounts[6]), 21);
      assert.equal(await erc20.balanceOf(accounts[5]), 21);
      assert.equal(await erc20.balanceOf(accounts[7]), 7);
      assert.equal(await erc20.balanceOf(protocol), 0);
    })

    it("Direct Purchase ERC721<->ETH, not same origin, not same royalties V2", async () => {
      const _priceSell = 100;
      const _pricePurchase = 100;
      const salt = 1;
      const nftAmount = 1
      const erc721 = await prepareERC721(makerLeft, erc721TokenId1, [[accounts[7], 100]]); //with royalties

      let encDataLeft = await encDataV2([[], [[accounts[6], 300]], true]);
      let encDataRight = await encDataV2([[], [[accounts[5], 300]], false]);

      const left = Order(makerLeft, Asset(ERC721, enc(erc721.address, erc721TokenId1), nftAmount), ZERO, Asset(ETH, "0x", _priceSell), salt, 0, 0, ORDER_DATA_V2, encDataLeft);
      const signature = await getSignature(left, makerLeft);

      const _nftSellAssetData = enc(erc721.address, erc721TokenId1);

      const directPurchaseParams = {
        sellOrderMaker: makerLeft,
        sellOrderNftAmount: nftAmount,
        nftAssetClass: ERC721,
        nftData: _nftSellAssetData,
        sellOrderPaymentAmount: _priceSell,
        paymentToken: zeroAddress,
        sellOrderSalt: salt,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signature,
        buyOrderPaymentAmount: _pricePurchase,
        buyOrderNftAmount: nftAmount,
        buyOrderData: encDataRight
      };

      assert.equal(await erc721.balanceOf(makerLeft), 1);
      assert.equal(await erc721.balanceOf(makerRight), 0);
      await verifyBalanceChangeReturnTx(web3, makerRight, 103, async () =>
        verifyBalanceChangeReturnTx(web3, makerLeft, -96, async () =>
          verifyBalanceChangeReturnTx(web3, protocol, 0, () =>
            verifyBalanceChangeReturnTx(web3, accounts[6], -3, () =>      //OriginLeft
              verifyBalanceChangeReturnTx(web3, accounts[5], -3, () =>    //OriginRight
                verifyBalanceChangeReturnTx(web3, accounts[7], -1, () =>  //royalties
                  exchangeV2.directPurchase(directPurchaseParams, { from: makerRight, value: 200 })
                )
              )
            )
          )
        )
      );
      assert.equal(await erc721.balanceOf(makerLeft), 0);
      assert.equal(await erc721.balanceOf(makerRight), 1);
    })

    it("Direct accept bid ERC721<->ERC20, not same origin, not same royalties V2", async () => {
      const _priceBid = 100;
      const _priceAccept = 100;
      const salt = 1;
      const _nftBidAmount = 1;
      const _nftAcceptAmount = 1;
      const erc20 = await prepareERC20(makerLeft, 1000);
      const erc721 = await prepareERC721(makerRight, erc721TokenId1, [[accounts[7], 100]]); //with royalties

      let encDataLeft = await encDataV2([[], [[accounts[6], 300]], true]);
      let encDataRight = await encDataV2([[], [[accounts[5], 300]], false]);

      const _nftAssetData = enc(erc721.address, erc721TokenId1);
      const _paymentAssetData = enc(erc20.address);

      const left = Order(makerLeft, Asset(ERC20, _paymentAssetData, _priceBid), ZERO, Asset(ERC721, _nftAssetData, _nftBidAmount), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const signature = await getSignature(left, makerLeft);

      const directAcceptParams = {
        bidMaker: makerLeft,
        bidNftAmount: _nftBidAmount,
        nftAssetClass: ERC721,
        nftData: _nftAssetData,
        bidPaymentAmount: _priceBid,
        paymentToken: erc20.address,
        bidSalt: salt,
        bidStart: 0,
        bidEnd: 0,
        bidDataType: ORDER_DATA_V2,
        bidData: encDataLeft,
        bidSignature: signature,
        sellOrderPaymentAmount: _priceAccept,
        sellOrderNftAmount: _nftAcceptAmount,
        sellOrderData: encDataRight
      };

      assert.equal(await erc721.balanceOf(makerLeft), 0);
      assert.equal(await erc721.balanceOf(makerRight), 1);
      await exchangeV2.directAcceptBid(directAcceptParams, { from: makerRight });
      assert.equal(await erc721.balanceOf(makerLeft), 1);
      assert.equal(await erc721.balanceOf(makerRight), 0);
      assert.equal(await erc20.balanceOf(makerLeft), 897);
      assert.equal(await erc20.balanceOf(makerRight), 96);
      assert.equal(await erc20.balanceOf(accounts[6]), 3);
      assert.equal(await erc20.balanceOf(accounts[5]), 3);
      assert.equal(await erc20.balanceOf(accounts[7]), 1);
      assert.equal(await erc20.balanceOf(protocol), 0);
    })

  });

  describe("gas estimation", () => {
    it("ERC20<->eth two offChain orders, Logic: Separate exchangeV2 vofc ", async () => {
      const erc20 = await prepareERC20(makerRight, 1000);

      const left = Order(makerLeft, Asset(ETH, "0x", 200), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(makerRight, Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");
      const tx = await exchangeV2.matchOrders(left, "0x", right, await getSignature(right, makerRight), { from: makerLeft, value: 300 });
      console.log("ERC20<->eth two offChain orders, with Separate exchangeV2 logic gas:", tx.receipt.gasUsed);
    })

    it("ERC20<->ERC1155 not same origin, not same royalties V2", async () => {
      const erc20 = await prepareERC20(makerLeft, 1000)
      const erc1155 = await prepareERC1155(makerRight, 1000, erc1155TokenId1, [[accounts[7], 1000]])

      let addrOriginLeft = [[accounts[6], 300]];
      let addrOriginRight = [[accounts[5], 300]];

      let encDataLeft = await encDataV2([[], addrOriginLeft, false]);
      let encDataRight = await encDataV2([[], addrOriginRight, true]);

      const left = Order(makerLeft, Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const right = Order(makerRight, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, ORDER_DATA_V2, encDataRight);

      const tx = await exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: makerRight });
      console.log("not same origin, not same royalties (no protocol Fee) V2:", tx.receipt.gasUsed);
    })

    it("ERC721<->ETH, not same origin, not same royalties V2", async () => {
      const price = 100;
      const salt = 1;
      const nftAmount = 1
      const erc721 = await prepareERC721(makerLeft);

      let addrOriginLeft = [[accounts[6], 300]];
      let addrOriginRight = [[accounts[5], 300]];

      let encDataLeft = await encDataV2([[], addrOriginLeft, true]);
      let encDataRight = await encDataV2([[], addrOriginRight, false]);

      const left = Order(makerLeft, Asset(ERC721, enc(erc721.address, erc721TokenId1), nftAmount), ZERO, Asset(ETH, "0x", price), salt, 0, 0, ORDER_DATA_V2, encDataLeft);
      const right = Order(makerRight, Asset(ETH, "0x", price), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), nftAmount), 0, 0, 0, ORDER_DATA_V2, encDataRight);
      const signature = await getSignature(left, makerLeft);

      const tx = await exchangeV2.matchOrders(left, signature, right, "0x", { from: makerRight, value: 200 });
      console.log("ERC721<->ETH, not same origin, not same royalties V2:", tx.receipt.gasUsed);
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
      await verifyBalanceChangeReturnTx(web3, makerRight, -200, async () =>
        verifyBalanceChangeReturnTx(web3, makerLeft, 200, async () =>
          verifyBalanceChangeReturnTx(web3, protocol, 0, () =>
            exchangeV2.matchOrders(left, "0x", right, signature, { from: makerLeft, value: 300 })
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

      await verifyBalanceChangeReturnTx(web3, accounts[7], 200, async () =>
        verifyBalanceChangeReturnTx(web3, makerLeft, -200, async () =>
          verifyBalanceChangeReturnTx(web3, protocol, 0, () =>
            exchangeV2.matchOrders(left, signatureLeft, right, signatureRight, { from: accounts[7], value: 200 })
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
        exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: accounts[7], value: 300 })
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

      await verifyBalanceChangeReturnTx(web3, makerRight, 222, async () =>			//200+6buyerFee+ (10+12 origin left) (72back)
        verifyBalanceChangeReturnTx(web3, makerLeft, -172, async () =>				//200 -6seller - (6+8royalties) - 14originright
          verifyBalanceChangeReturnTx(web3, accounts[3], -6, async () =>
            verifyBalanceChangeReturnTx(web3, accounts[4], -8, async () =>
              verifyBalanceChangeReturnTx(web3, accounts[5], -10, async () =>
                verifyBalanceChangeReturnTx(web3, accounts[6], -12, async () =>
                  verifyBalanceChangeReturnTx(web3, accounts[7], -14, async () =>
                    verifyBalanceChangeReturnTx(web3, protocol, 0, () =>
                      exchangeV2.matchOrders(left, signature, right, "0x", { from: makerRight, value: 300 })
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

      await verifyBalanceChangeReturnTx(web3, makerRight, 222, async () =>			//200+6buyerFee+ (10 +12 origin left) (72back)
        verifyBalanceChangeReturnTx(web3, makerLeft, -186, async () =>				//200 -6seller - 14 originright
          verifyBalanceChangeReturnTx(web3, accounts[5], -10, async () =>
            verifyBalanceChangeReturnTx(web3, accounts[6], -12, async () =>
              verifyBalanceChangeReturnTx(web3, accounts[7], -14, async () =>
                verifyBalanceChangeReturnTx(web3, protocol, 0, () =>
                  exchangeV2.matchOrders(left, signature, right, "0x", { from: makerRight, value: 300 })
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

      await verifyBalanceChangeReturnTx(web3, makerRight, 200, async () =>			//200+6buyerFee+  (94back)
        verifyBalanceChangeReturnTx(web3, makerLeft, -164, async () =>				//200 -6seller - (10+ 12+ 14) originright
          verifyBalanceChangeReturnTx(web3, accounts[5], -10, async () =>
            verifyBalanceChangeReturnTx(web3, accounts[6], -12, async () =>
              verifyBalanceChangeReturnTx(web3, accounts[7], -14, async () =>
                verifyBalanceChangeReturnTx(web3, protocol, 0, () =>
                  exchangeV2.matchOrders(left, signature, right, "0x", { from: makerRight, value: 300 })
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

      await verifyBalanceChangeReturnTx(web3, makerRight, 236, async () =>			//200+6buyerFee+ (10 +12 +14 origin left) (72back)
        verifyBalanceChangeReturnTx(web3, makerLeft, -200, async () =>				//200 -6seller -
          verifyBalanceChangeReturnTx(web3, accounts[5], -10, async () =>
            verifyBalanceChangeReturnTx(web3, accounts[6], -12, async () =>
              verifyBalanceChangeReturnTx(web3, accounts[7], -14, async () =>
                verifyBalanceChangeReturnTx(web3, protocol, 0, () =>
                  exchangeV2.matchOrders(left, signature, right, "0x", { from: makerRight, value: 300 })
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
        exchangeV2.matchOrders(left, "0x", right, await getSignature(right, makerRight), { from: makerLeft, value: 300 })
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

      await verifyBalanceChangeReturnTx(web3, makerLeft, 200, async () =>			//200+6buyerFee+
        verifyBalanceChangeReturnTx(web3, makerRight, 0, async () =>				//200 -6seller -(180 + 10 + 12(really 10) + 14(really 0) origin left)
          verifyBalanceChangeReturnTx(web3, accounts[3], -180, async () =>
            verifyBalanceChangeReturnTx(web3, accounts[5], -10, async () =>
              verifyBalanceChangeReturnTx(web3, accounts[6], -10, async () =>
                verifyBalanceChangeReturnTx(web3, accounts[7], 0, async () =>
                  verifyBalanceChangeReturnTx(web3, protocol, 0, () =>
                    exchangeV2.matchOrders(left, "0x", right, signature, { from: makerLeft, value: 300 })
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

      await verifyBalanceChangeReturnTx(web3, makerRight, 222, async () =>			//200+6buyerFee+ (10 +12 origin left) (72back)
        verifyBalanceChangeReturnTx(web3, accounts[3], -93, async () =>				//200 -6seller - 14 originright *50%
          verifyBalanceChangeReturnTx(web3, makerLeft, -93, async () =>				//200 -6seller - 14 originright *50%
            verifyBalanceChangeReturnTx(web3, accounts[5], -10, async () =>
              verifyBalanceChangeReturnTx(web3, accounts[6], -12, async () =>
                verifyBalanceChangeReturnTx(web3, accounts[7], -14, async () =>
                  verifyBalanceChangeReturnTx(web3, protocol, 0, () =>
                    exchangeV2.matchOrders(left, signature, right, "0x", { from: makerRight, value: 300 })
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

      await verifyBalanceChangeReturnTx(web3, makerRight, 222, async () =>			//200+6buyerFee+ (10 +12 origin left) (72back)
        verifyBalanceChangeReturnTx(web3, makerLeft, -186, async () =>				//200 -6seller - 14 originright *100%
          verifyBalanceChangeReturnTx(web3, accounts[5], -10, async () =>
            verifyBalanceChangeReturnTx(web3, accounts[6], -12, async () =>
              verifyBalanceChangeReturnTx(web3, accounts[7], -14, async () =>
                verifyBalanceChangeReturnTx(web3, protocol, 0, () =>
                  exchangeV2.matchOrders(left, signature, right, "0x", { from: makerRight, value: 300 })
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

      await verifyBalanceChangeReturnTx(web3, makerRight, 222, async () =>			//200+6buyerFee+ (10 +12 origin left) (72back)
        verifyBalanceChangeReturnTx(web3, makerLeft, -156, async () =>				//200 -6seller - 14 originright
          verifyBalanceChangeReturnTx(web3, accounts[3], -10, async () =>
            verifyBalanceChangeReturnTx(web3, accounts[4], -20, async () =>
              verifyBalanceChangeReturnTx(web3, accounts[5], -10, async () =>
                verifyBalanceChangeReturnTx(web3, accounts[6], -12, async () =>
                  verifyBalanceChangeReturnTx(web3, accounts[7], -14, async () =>
                    verifyBalanceChangeReturnTx(web3, protocol, 0, () =>
                      exchangeV2.matchOrders(left, signature, right, "0x", { from: makerRight, value: 300 })
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

      await verifyBalanceChangeReturnTx(web3, makerRight, 222, async () =>			//200+6buyerFee+ (10 +12 origin left) (72back)
        verifyBalanceChangeReturnTx(web3, makerLeft, -156, async () =>				//200 -6seller - 14 originright
          verifyBalanceChangeReturnTx(web3, accounts[3], -10, async () =>
            verifyBalanceChangeReturnTx(web3, accounts[4], -20, async () =>
              verifyBalanceChangeReturnTx(web3, accounts[5], -10, async () =>
                verifyBalanceChangeReturnTx(web3, accounts[6], -12, async () =>
                  verifyBalanceChangeReturnTx(web3, accounts[7], -14, async () =>
                    verifyBalanceChangeReturnTx(web3, protocol, 0, () =>
                      exchangeV2.matchOrders(left, signature, right, "0x", { from: makerRight, value: 300 })
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

      await verifyBalanceChangeReturnTx(web3, makerRight, 210, async () =>			//200+6buyerFee+ (10  origin left) (72back)
        verifyBalanceChangeReturnTx(web3, makerLeft, -156, async () =>				//200 -6seller - 14 originright
          verifyBalanceChangeReturnTx(web3, accounts[3], -10, async () =>
            verifyBalanceChangeReturnTx(web3, accounts[4], -20, async () =>
              verifyBalanceChangeReturnTx(web3, accounts[5], -10, async () =>
                verifyBalanceChangeReturnTx(web3, accounts[7], -14, async () =>
                  verifyBalanceChangeReturnTx(web3, protocol, 0, () =>
                    exchangeV2.matchOrders(left, signature, right, "0x", { from: makerRight, value: 300 })
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

      await verifyBalanceChangeReturnTx(web3, makerLeft, -500, async () =>
        verifyBalanceChangeReturnTx(web3, makerRight, 500, async () =>
          exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: makerRight, value: 600 })
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

      await verifyBalanceChangeReturnTx(web3, makerLeft, -300, async () =>
        verifyBalanceChangeReturnTx(web3, buyer1, 300, async () =>
          exchangeV2.matchOrders(leferc20, await getSignature(leferc20, makerLeft), righerc20, "0x", { from: buyer1, value: 600 })
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

      await verifyBalanceChangeReturnTx(web3, makerLeft, -500, async () =>
        verifyBalanceChangeReturnTx(web3, makerRight, 500, async () =>
          exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: makerRight, value: 600 })
        )
      )
      assert.equal(await erc1155.balanceOf(makerRight, erc1155TokenId1), 100);
      assert.equal(await erc1155.balanceOf(makerLeft, erc1155TokenId1), 100);

      const leftOrderHash = await helper.hashKey(left);
      assert.equal(await exchangeV2.fills(leftOrderHash), 500, "left fill make side")

      const leferc20 = Order(makerLeft, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 200), ZERO, Asset(ETH, "0x", 2000), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const righerc20 = Order(buyer1, Asset(ETH, "0x", 1000), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), 1, 0, 0, ORDER_DATA_V2, encDataRight);

      await verifyBalanceChangeReturnTx(web3, makerLeft, -1000, async () =>
        verifyBalanceChangeReturnTx(web3, buyer1, 1000, async () =>
          exchangeV2.matchOrders(leferc20, await getSignature(leferc20, makerLeft), righerc20, "0x", { from: buyer1, value: 1100 })
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

      await verifyBalanceChangeReturnTx(web3, makerLeft, -450, async () =>
        verifyBalanceChangeReturnTx(web3, makerRight, 500, async () =>
          verifyBalanceChangeReturnTx(web3, accounts[5], -50, async () =>
            exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: makerRight, value: 600 })
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

      await verifyBalanceChangeReturnTx(web3, makerLeft, -270, async () =>
        verifyBalanceChangeReturnTx(web3, buyer1, 300, async () =>
          verifyBalanceChangeReturnTx(web3, accounts[5], -30, async () =>
            exchangeV2.matchOrders(leferc20, await getSignature(leferc20, makerLeft), righerc20, "0x", { from: buyer1, value: 600 })
          )
        )
      )
      assert.equal(await exchangeV2.fills(leftOrderHash), 200, "left fill make side 1")
      assert.equal(await erc1155.balanceOf(buyer1, erc1155TokenId1), 100);
      assert.equal(await erc1155.balanceOf(makerLeft, erc1155TokenId1), 0);
    })

    it("should correctly behave if origin fees are too big", async () => {
      const buyer1 = accounts[3];

      const erc1155 = await prepareERC1155(makerLeft, 200)

      const encDataLeft = await encDataV2([[[makerLeft, 10000]], [[accounts[5], 1000]], true]);
      const encDataRight = await encDataV2([[], [[accounts[5], "79228162514264337593543949336"]], false]);

      const left = Order(makerLeft, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 200), ZERO, Asset(ETH, "0x", 1000), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const right = Order(makerRight, Asset(ETH, "0x", 500), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), 1, 0, 0, ORDER_DATA_V2, encDataRight);

      await truffleAssert.fails(
        exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: makerRight, value: "600" }),
        truffleAssert.ErrorType.REVERT,
        "origin fee is too big"
      )
    })
  })

  describe("matchOrders, orderType = V2", () => {
    const originBuyer = accounts[3]
    const originSeller = accounts[4]
    const creator = accounts[5]
    const secondPayoutSeller = accounts[6]
    const originBuyer2 = accounts[6]
    const originSeller2 = accounts[7]

    it("should correctly pay to everyone envloved in a match ", async () => {
      const erc20 = await prepareERC20(makerRight, 1000)
      const erc1155 = await prepareERC1155(makerLeft, 1000)

      let encDataLeft = await encDataV2([[], [[originBuyer, 300]], false]);
      let encDataRight = await encDataV2([[], [[originSeller, 400]], true]);

      await royaltiesRegistry.setRoyaltiesByToken(erc1155.address, [[creator, 1000]]); //set royalties by token

      const left = Order(makerLeft, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 200), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, ORDER_DATA_V2, encDataRight);
      const right = Order(makerRight, Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 200), 1, 0, 0, ORDER_DATA_V2, encDataLeft);

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
      assert.equal(await erc20.balanceOf(makerLeft), 86);

      //checking fills
      // sell-order has make-side fills
      assert.equal(await exchangeV2.fills(await helper.hashKey(right)), 200);
      //buy-order has take-side fills
      assert.equal(await exchangeV2.fills(await helper.hashKey(left)), 200);
    })

    it("should work with 2 origin Fees", async () => {
      const erc20 = await prepareERC20(makerLeft, 1000)
      const erc1155 = await prepareERC1155(makerRight, 1000)

      let encDataLeft = await encDataV2([[], [[originBuyer, 100], [originBuyer2, 200]], false]);
      let encDataRight = await encDataV2([[], [[originSeller, 300], [originSeller2, 400]], true]);

      let left = Order(makerLeft, Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      let right = Order(makerRight, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, ORDER_DATA_V2, encDataRight);

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
      assert.equal(await erc20.balanceOf(makerRight), 93);

    })

    it("should work when using only second origin", async () => {
      const erc20 = await prepareERC20(makerLeft, 1000)
      const erc1155 = await prepareERC1155(makerRight, 1000)

      let encDataLeft = await encDataV2([[], [[originBuyer2, 200]], true]);
      let encDataRight = await encDataV2([[], [[originSeller2, 400]], false]);


      let left = Order(makerLeft, Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      let right = Order(makerRight, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, ORDER_DATA_V2, encDataRight);

      await exchangeV2.matchOrders(left, await getSignature(left, makerLeft), right, "0x", { from: makerRight })

      // 0% to protocol
      assert.equal(await erc20.balanceOf(protocol), 0);
      // 2% to originBuyer2
      assert.equal(await erc20.balanceOf(originBuyer2), 2);
      // 4% to originSeller2
      assert.equal(await erc20.balanceOf(originSeller2), 4);
      // 100% of what's left to makerRight
      assert.equal(await erc20.balanceOf(makerRight), 96);
    })
  })

  describe("protocol fee", () => {
    it("protocol fee should work correctly with V2 orders", async () => {
      await exchangeV2.setAllProtocolFeeData(protocol, 0, 500)

      const fee = (await exchangeV2.protocolFee())

      assert.equal(fee.receiver, protocol)
      assert.equal(fee.buyerAmount, 0)
      assert.equal(fee.sellerAmount, 500)

      const _priceSell = 100;
      const _pricePurchase = 100;
      const salt = 1;
      const nftAmount = 1
      const erc721 = await prepareERC721(makerLeft);

      let addrOriginLeft = [[accounts[6], 300]];
      let addrOriginRight = [[accounts[5], 300]];

      let encDataLeft = await encDataV2([[], addrOriginLeft, true]);
      let encDataRight = await encDataV2([[], addrOriginRight, false]);

      const _nftSellAssetData = enc(erc721.address, erc721TokenId1);
      const _nftPurchaseAssetData = "0x";
      const left = Order(makerLeft, Asset(ERC721, _nftSellAssetData, nftAmount), ZERO, Asset(ETH, _nftPurchaseAssetData, _priceSell), salt, 0, 0, ORDER_DATA_V2, encDataLeft);
      const signature = await getSignature(left, makerLeft);

      const directPurchaseParams = {
        sellOrderMaker: makerLeft,
        sellOrderNftAmount: nftAmount,
        nftAssetClass: ERC721,
        nftData: _nftSellAssetData,
        sellOrderPaymentAmount: _priceSell,
        paymentToken: zeroAddress,
        sellOrderSalt: salt,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signature,
        buyOrderPaymentAmount: _pricePurchase,
        buyOrderNftAmount: nftAmount,
        buyOrderData: encDataRight
      };

      assert.equal(await erc721.balanceOf(makerLeft), 1);
      assert.equal(await erc721.balanceOf(makerRight), 0);
      await verifyBalanceChangeReturnTx(web3, makerRight, 103, async () =>
        verifyBalanceChangeReturnTx(web3, makerLeft, -92, async () =>
          verifyBalanceChangeReturnTx(web3, protocol, -5, () =>
            verifyBalanceChangeReturnTx(web3, accounts[6], -3, () =>      //OriginLeft
              verifyBalanceChangeReturnTx(web3, accounts[5], -3, () =>    //OriginRight
                verifyBalanceChangeReturnTx(web3, accounts[7], 0, () =>  //royalties
                  exchangeV2.directPurchase(directPurchaseParams, { from: makerRight, value: 200 })
                )
              )
            )
          )
        )
      );
      assert.equal(await erc721.balanceOf(makerLeft), 0);
      assert.equal(await erc721.balanceOf(makerRight), 1);
    })

    it("protocol fee should work correctly with V2 orders", async () => {
      await exchangeV2.setAllProtocolFeeData(protocol, 400, 500)
      let fee = (await exchangeV2.protocolFee())

      assert.equal(fee.receiver, protocol)
      assert.equal(fee.buyerAmount, 400)
      assert.equal(fee.sellerAmount, 500)
      const _priceSell = 100;
      const _pricePurchase = 100;
      const salt = 1;
      const nftAmount = 1
      const erc721 = await prepareERC721(makerLeft, erc721TokenId1, [[accounts[7], 100]]); //with royalties

      let encDataLeft = await encDataV2([[], [[accounts[6], 300]], true]);
      let encDataRight = await encDataV2([[], [[accounts[5], 300]], false]);

      const left = Order(makerLeft, Asset(ERC721, enc(erc721.address, erc721TokenId1), nftAmount), ZERO, Asset(ETH, "0x", _priceSell), salt, 0, 0, ORDER_DATA_V2, encDataLeft);
      const signature = await getSignature(left, makerLeft);

      const _nftSellAssetData = enc(erc721.address, erc721TokenId1);

      const directPurchaseParams = {
        sellOrderMaker: makerLeft,
        sellOrderNftAmount: nftAmount,
        nftAssetClass: ERC721,
        nftData: _nftSellAssetData,
        sellOrderPaymentAmount: _priceSell,
        paymentToken: zeroAddress,
        sellOrderSalt: salt,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signature,
        buyOrderPaymentAmount: _pricePurchase,
        buyOrderNftAmount: nftAmount,
        buyOrderData: encDataRight
      };

      assert.equal(await erc721.balanceOf(makerLeft), 1);
      assert.equal(await erc721.balanceOf(makerRight), 0);
      await verifyBalanceChangeReturnTx(web3, makerRight, 107, async () =>
        verifyBalanceChangeReturnTx(web3, makerLeft, -91, async () =>
          verifyBalanceChangeReturnTx(web3, protocol, -9, () =>
            verifyBalanceChangeReturnTx(web3, accounts[6], -3, () =>      //OriginLeft
              verifyBalanceChangeReturnTx(web3, accounts[5], -3, () =>    //OriginRight
                verifyBalanceChangeReturnTx(web3, accounts[7], -1, () =>  //royalties
                  exchangeV2.directPurchase(directPurchaseParams, { from: makerRight, value: 200 })
                )
              )
            )
          )
        )
      );
      assert.equal(await erc721.balanceOf(makerLeft), 0);
      assert.equal(await erc721.balanceOf(makerRight), 1);

      //setting protocol fee
      await exchangeV2.setAllProtocolFeeData(ZERO, 0, 0)
      fee = (await exchangeV2.protocolFee())

      assert.equal(fee.receiver, ZERO)
      assert.equal(fee.buyerAmount, 0)
      assert.equal(fee.sellerAmount, 0)
    })

  })

  describe("integrity", () => {
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
