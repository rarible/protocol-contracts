const ExchangeBulkV2 = artifacts.require("RaribleExchangeWrapper.sol");
const WrapperHelper = artifacts.require("WrapperHelper.sol");
const ExchangeV2 = artifacts.require("ExchangeV2.sol");

const TestERC20 = artifacts.require("TestERC20.sol");
const TestERC721 = artifacts.require("TestERC721.sol");
const TestERC1155 = artifacts.require("TestERC1155.sol");

const TransferProxy = artifacts.require("TransferProxy.sol");
const RaribleTestHelper = artifacts.require("RaribleTestHelper.sol");

const { Order, Asset, sign } = require("../../../scripts/order.js");
const { expectThrow, verifyBalanceChange } = require("@daonomic/tests-common");
const { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, ORDER_DATA_V2, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, CRYPTO_PUNKS, COLLECTION, enc, id } = require("../../../scripts/assets");
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

contract("ExchangeBulkV2, sellerFee + buyerFee =  6%,", accounts => {
  let bulkExchange;
  let exchangeV2;
  let wrapperHelper;
  let transferProxy;
  let helper;
  let erc20;
  let protocol = accounts[9];
  const eth = "0x0000000000000000000000000000000000000000";
  const erc721TokenId1 = 55;
  const erc721TokenId2 = 56;
  const erc721TokenId3 = 57;
  const erc1155TokenId1 = 55;
  const erc1155TokenId2 = 56;
  const erc1155TokenId3 = 57;
  let erc721;
  let erc1155;
  const feeRecipienterUP = accounts[6];

  before(async () => {
    helper = await RaribleTestHelper.new();
    wrapperHelper = await WrapperHelper.new();

    transferProxy = await TransferProxy.deployed();
    
    bulkExchange = await ExchangeBulkV2.deployed();
  })

  beforeEach(async () => {
    /*ERC721 */
    erc721 = await TestERC721.new("Rarible", "RARI", "https://ipfs.rarible.com");
    /*ERC1155*/
    erc1155 = await TestERC1155.new("https://ipfs.rarible.com");
  });

  describe("bulkPurchase Rarible orders", () => {

    it("Test bulkPurchase ExchangeV2 (num orders = 3, type ==V2, V1) orders are ready, ERC721<->ETH", async () => {
      const buyer = accounts[2];
      const seller1 = accounts[1];
      const seller2 = accounts[3];
      const seller3 = accounts[4];
      
      await erc721.mint(seller1, erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, {from: seller1});
      await erc721.mint(seller2, erc721TokenId2);
      await erc721.setApprovalForAll(transferProxy.address, true, {from: seller2});
      await erc721.mint(seller3, erc721TokenId3);
      await erc721.setApprovalForAll(transferProxy.address, true, {from: seller3});

      exchangeV2 = await ExchangeV2.deployed();
      //NB!!! set buyer in payouts
      const encDataLeft = await encDataV2([[], [], false]);
      const encDataLeftV1 = await encDataV1([ [], [] ]);
      const encDataRight = await encDataV2([[[buyer, 10000]], [], false]);
      const encDataRightV1 = await encDataV1([[[buyer, 10000]], []]);

      const left1 = Order(seller1, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const left2 = Order(seller2, Asset(ERC721, enc(erc721.address, erc721TokenId2), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const left3 = Order(seller3, Asset(ERC721, enc(erc721.address, erc721TokenId3), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V1, encDataLeftV1);

      let signatureLeft1 = await getSignature(left1, seller1, exchangeV2.address);
      let signatureLeft2 = await getSignature(left2, seller2, exchangeV2.address);
      let signatureLeft3 = await getSignature(left3, seller3, exchangeV2.address);

      const directPurchaseParams1 = {
        sellOrderMaker: seller1,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId1),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO_ADDRESS,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft1,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight
      };

      let dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams1);
      const tradeData1 = PurchaseData(0, 100, await encodeFees(1500), dataForExchCall1); //0 is Exch orders, 100 is amount + 0 protocolFee

      const directPurchaseParams2 = {
        sellOrderMaker: seller2,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId2),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO_ADDRESS,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft2,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight
      };

      let dataForExchCall2 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams2);
      const tradeData2 = PurchaseData(0, 100, await encodeFees(1500), dataForExchCall2); //0 is Exch orders, 100 is amount + 0 protocolFee

      const directPurchaseParams3 = {
        sellOrderMaker: seller3,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId3),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO_ADDRESS,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V1,
        sellOrderData: encDataLeftV1,
        sellOrderSignature: signatureLeft3,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRightV1
      };

      let dataForExchCall3 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams3);
      const tradeData3 = PurchaseData(0, 100,  await encodeFees(1500), dataForExchCall3); //0 is Exch orders, 100 is amount + 0 protocolFee

    	await verifyBalanceChange(buyer, 345, async () =>
    		verifyBalanceChange(seller1, -100, async () =>
    		  verifyBalanceChange(seller2, -100, async () =>
    		    verifyBalanceChange(seller3, -100, async () =>
    			    verifyBalanceChange(feeRecipienterUP, -45, () =>
    				    bulkExchange.bulkPurchase([tradeData1, tradeData2, tradeData3], feeRecipienterUP, ZERO_ADDRESS, false, { from: buyer, value: 400, gasPrice: 0 })
    				  )
    				)
    			)
    		)
    	);
      assert.equal(await erc721.balanceOf(seller1), 0);
      assert.equal(await erc721.balanceOf(seller2), 0);
      assert.equal(await erc721.balanceOf(seller3), 0);
      assert.equal(await erc721.balanceOf(accounts[2]), 3);
    })

    it("Test bulkPurchase ExchangeV2 (num orders = 3, type ==V2, V1) orders are ready, ERC1155<->ETH", async () => {
      const buyer = accounts[2];
      const seller1 = accounts[1];
      const seller2 = accounts[3];
      const seller3 = accounts[4];
      
      await erc1155.mint(seller1, erc1155TokenId1, 10);
      await erc1155.setApprovalForAll(transferProxy.address, true, {from: seller1});
      await erc1155.mint(seller2, erc1155TokenId2, 10);
      await erc1155.setApprovalForAll(transferProxy.address, true, {from: seller2});
      await erc1155.mint(seller3, erc1155TokenId3, 10);
      await erc1155.setApprovalForAll(transferProxy.address, true, {from: seller3});

      exchangeV2 = await ExchangeV2.deployed();

      //NB!!! set buyer in payouts
      const encDataLeft = await encDataV2([[], [], false]);
      const encDataLeftV1 = await encDataV1([ [], [] ]);
      const encDataRight = await encDataV2([[[buyer, 10000]], [], false]);
      const encDataRightV1 = await encDataV1([[[buyer, 10000]], []]);

      const left1 = Order(seller1, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 10), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const left2 = Order(seller2, Asset(ERC1155, enc(erc1155.address, erc1155TokenId2), 10), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const left3 = Order(seller3, Asset(ERC1155, enc(erc1155.address, erc1155TokenId3), 10), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V1, encDataLeftV1);

      let signatureLeft1 = await getSignature(left1, seller1, exchangeV2.address);
      let signatureLeft2 = await getSignature(left2, seller2, exchangeV2.address);
      let signatureLeft3 = await getSignature(left3, seller3, exchangeV2.address);
      //NB!!! DONT Need to signature buy orders, because ExchangeBulkV2 is  msg.sender == buyOrder.maker

      const directPurchaseParams1 = {
        sellOrderMaker: seller1,
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(erc1155.address, erc1155TokenId1),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO_ADDRESS,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft1,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 6,
        buyOrderData: encDataRight
      };

      let dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams1);
      const tradeData1 = PurchaseData(0, 60, await encodeFees(1500), dataForExchCall1); //0 is Exch orders, 100 is amount + 0 protocolFee

      const directPurchaseParams2 = {
        sellOrderMaker: seller2,
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(erc1155.address, erc1155TokenId2),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO_ADDRESS,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft2,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 8,
        buyOrderData: encDataRight
      };

      let dataForExchCall2 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams2);
      const tradeData2 = PurchaseData(0, 80, await encodeFees(1500), dataForExchCall2); //0 is Exch orders, 100 is amount + 0 protocolFee

      const directPurchaseParams3 = {
        sellOrderMaker: seller3,
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(erc1155.address, erc1155TokenId3),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO_ADDRESS,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V1,
        sellOrderData: encDataLeftV1,
        sellOrderSignature: signatureLeft3,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 10,
        buyOrderData: encDataRightV1
      };

      let dataForExchCall3 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams3);
      const tradeData3 = PurchaseData(0, 100,  await encodeFees(1500), dataForExchCall3); //0 is Exch orders, 100 is amount + 0 protocolFee

    	await verifyBalanceChange(buyer, 276, async () =>
    		verifyBalanceChange(seller1, -60, async () =>
    		  verifyBalanceChange(seller2, -80, async () =>
    		    verifyBalanceChange(seller3, -100, async () =>
    			    verifyBalanceChange(feeRecipienterUP, -36, () =>
    				    bulkExchange.bulkPurchase([tradeData1, tradeData2, tradeData3], feeRecipienterUP, ZERO_ADDRESS, false, { from: buyer, value: 400, gasPrice: 0 })
    				  )
    				)
    			)
    		)
    	);
      assert.equal(await erc1155.balanceOf(seller1, erc1155TokenId1), 4);
      assert.equal(await erc1155.balanceOf(seller2, erc1155TokenId2), 2);
      assert.equal(await erc1155.balanceOf(seller3, erc1155TokenId3), 0);
      assert.equal(await erc1155.balanceOf(accounts[2], erc1155TokenId1), 6);
      assert.equal(await erc1155.balanceOf(accounts[2], erc1155TokenId2), 8);
      assert.equal(await erc1155.balanceOf(accounts[2], erc1155TokenId3), 10);
    })

  });

	function encDataV2(tuple) {
    return helper.encodeV2(tuple);
  }

  function encDataV1(tuple) {
  	return helper.encode(tuple)
  }

  function PurchaseData(marketId, amount, fees, data) {
    return {marketId, amount, fees, data};
  };
	async function getSignature(order, signer, exchangeContract) {
		return sign(order, signer, exchangeContract);
	}

  async function encodeFees(first = 0, second = 0) {
    const result = await wrapperHelper.encodeFees(first, second);
    return result.toString()
  }

});
