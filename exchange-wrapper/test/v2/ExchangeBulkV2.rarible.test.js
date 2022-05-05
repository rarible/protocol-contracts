const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const ExchangeBulkV2 = artifacts.require("ExchangeWrapper.sol");
const ExchangeBulkV2Test = artifacts.require("ExchangeBulkV2Test.sol");
const ExchangeV2 = artifacts.require("ExchangeV2Test.sol");
const TestERC20 = artifacts.require("TestERC20.sol");
const TestERC721 = artifacts.require("TestERC721.sol");
const TestERC1155 = artifacts.require("TestERC1155.sol");
const TransferProxyTest = artifacts.require("TransferProxyTest.sol");
const ERC20TransferProxyTest = artifacts.require("ERC20TransferProxyTest.sol");

const TestRoyaltiesRegistry = artifacts.require("TestRoyaltiesRegistry.sol");
const RaribleTransferManagerTest = artifacts.require("RaribleTransferManagerTest.sol");

const WyvernExchangeWithBulkCancellations = artifacts.require("WyvernExchangeWithBulkCancellations");
const TokenTransferProxy = artifacts.require("TokenTransferProxy");
const ProxyRegistry = artifacts.require("ProxyRegistry");
const WyvernTokenTransferProxy = artifacts.require("WyvernTokenTransferProxy");
const MerkleValidator = artifacts.require("MerkleValidator");
const WyvernProxyRegistry = artifacts.require("WyvernProxyRegistry");

const truffleAssert = require('truffle-assertions');
const { Order, OpenSeaOrdersInput, PurchaseData, Asset, sign } = require("../order");
const EIP712 = require("../EIP712");
const { expectThrow, verifyBalanceChange } = require("@daonomic/tests-common");
const { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, ORDER_DATA_V2, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, CRYPTO_PUNKS, COLLECTION, enc, id } = require("../assets");
const InputDataDecoder = require('ethereum-input-data-decoder');
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

contract("ExchangeBulkV2, sellerFee + buyerFee =  6%,", accounts => {
  let bulkExchange;
  let exchangeV2;
  let exchangeBulkV2Test;
  let transferProxy;
  let erc20TransferProxy;
  let royaltiesRegistry;
  let raribleTransferManagerTest;
  let t1;
  let protocol = accounts[9];
  let community = accounts[8];
  const eth = "0x0000000000000000000000000000000000000000";
  let erc721TokenId1 = 55;
  let erc721TokenId2 = 56;
  let erc721TokenId3 = 57;
  let erc1155TokenId1 = 55;
  let erc1155TokenId2 = 56;
  let erc1155TokenId3 = 57;
  let wyvernExchangeWithBulkCancellations;
  let proxyRegistry;
  let tokenTransferProxy;
  let testERC20;
  let testERC721;
  let testERC1155;
  /*OpenSeaOrders*/
  const feeMethodsSidesKindsHowToCallsMask = [1, 0, 0, 1, 1, 1, 0, 1];
  /* FeeMethod{ ProtocolFee, SplitFee }) buy
   SaleKindInterface.Side({ Buy, Sell }) buy
   SaleKindInterface.SaleKind({ FixedPrice, DutchAuction }) buy
   AuthenticatedProxy.HowToCall({ Call, DelegateCall } buy
   FeeMethod({ ProtocolFee, SplitFee }) sell
   SaleKindInterface.Side({ Buy, Sell } sell
   SaleKindInterface.SaleKind({ FixedPrice, DutchAuction } sell
   AuthenticatedProxy.HowToCall({ Call, DelegateCall } sell
  */

  before(async () => {
    raribleTransferManagerTest = await RaribleTransferManagerTest.new();
  })

  beforeEach(async () => {
    transferProxy = await TransferProxyTest.new();
    erc20TransferProxy = await ERC20TransferProxyTest.new();
    royaltiesRegistry = await TestRoyaltiesRegistry.new();
    /*ERC20 */
    t1 = await TestERC20.new();
    /*ERC721 */
    erc721 = await TestERC721.new("Rarible", "RARI", "https://ipfs.rarible.com");
    testERC721 = await TestERC721.new("Rarible", "RARI", "https://ipfs.rarible.com");
    /*ERC1155*/
    testERC1155 = await TestERC1155.new("https://ipfs.rarible.com");
    /*generating orders*/
    exchangeBulkV2Test = await ExchangeBulkV2Test.new();
  });

  describe("purcahase Wywern orders", () => {
    it("Test bulkPurchase Wyvern (num orders = 3), 1 UpFee recipient, ERC721<->ETH", async () => {
      const wyvernProtocolFeeAddress = accounts[9];
      const buyer = accounts[2];
      const seller1 = accounts[1];
      const seller2 = accounts[3];
      const seller3 = accounts[4];
      const feeRecipienter = accounts[5];
      const feeRecipienterUP = accounts[6];
      /*Wyvern*/
      const wyvernProxyRegistry = await WyvernProxyRegistry.new();
      await wyvernProxyRegistry.registerProxy( {from: seller1} );
      await wyvernProxyRegistry.registerProxy( {from: seller2} );
      await wyvernProxyRegistry.registerProxy( {from: seller3} );

      const tokenTransferProxy = await WyvernTokenTransferProxy.new(wyvernProxyRegistry.address);

      const openSea = await WyvernExchangeWithBulkCancellations.new(wyvernProxyRegistry.address, tokenTransferProxy.address, ZERO_ADDRESS, wyvernProtocolFeeAddress, {gas: 6000000});
      await wyvernProxyRegistry.endGrantAuthentication(openSea.address);

      const merkleValidator = await MerkleValidator.new();

      let erc721TokenIdLocal = 5;
      await erc721.mint(seller1, erc721TokenIdLocal);
      await erc721.setApprovalForAll(await wyvernProxyRegistry.proxies(seller1), true, {from: seller1});

      let erc721TokenIdLocal2 = 6;
      await erc721.mint(seller2, erc721TokenIdLocal2);
      await erc721.setApprovalForAll(await wyvernProxyRegistry.proxies(seller2), true, {from: seller2});

      let erc721TokenIdLocal3 = 7;
      await erc721.mint(seller3, erc721TokenIdLocal3);
      await erc721.setApprovalForAll(await wyvernProxyRegistry.proxies(seller3), true, {from: seller3});

      exchangeV2 = await deployProxy(ExchangeV2, [transferProxy.address, erc20TransferProxy.address, 300, community, royaltiesRegistry.address], { initializer: "__ExchangeV2_init" });
      await exchangeV2.setFeeReceiver(eth, protocol);
      await exchangeV2.setFeeReceiver(t1.address, protocol);

      bulkExchange = await ExchangeBulkV2.new();
      await bulkExchange.__ExchangeWrapper_init(openSea.address, exchangeV2.address);

      let feesUPDetect = await exchangeBulkV2Test.encodeOriginFeeIntoUint(feeRecipienterUP, 1500); //15%
      let feesUP = [feesUPDetect];

      const matchData = (await getOpenSeaMatchDataMerkleValidator(
        openSea.address,
        bulkExchange.address,
        buyer,
        seller1,
        merkleValidator.address,
        feeRecipienter,
        100,
        erc721TokenIdLocal,
        erc721.address,
        ZERO_ADDRESS,
        feeMethodsSidesKindsHowToCallsMask
      ))

      const buySellOrders1 = OpenSeaOrdersInput(...matchData);
      let dataForWyvernCall1 = await exchangeBulkV2Test.getDataWyvernAtomicMatch(buySellOrders1);
      const tradeData1 = PurchaseData(1, 100, dataForWyvernCall1);

      const matchData2 = (await getOpenSeaMatchDataMerkleValidator(
        openSea.address,
        bulkExchange.address,
        buyer,
        seller2,
        merkleValidator.address,
        feeRecipienter,
        100,
        erc721TokenIdLocal2,
        erc721.address,
        ZERO_ADDRESS,
        feeMethodsSidesKindsHowToCallsMask
      ))
      const buySellOrders2 = OpenSeaOrdersInput(...matchData2);
      let dataForWyvernCall2 = await exchangeBulkV2Test.getDataWyvernAtomicMatch(buySellOrders2);
      const tradeData2 = PurchaseData(1, 100, dataForWyvernCall2); //1 is Wyvern orders, 100 is amount

      const matchData3 = (await getOpenSeaMatchDataMerkleValidator(
        openSea.address,
        bulkExchange.address,
        buyer,
        seller3,
        merkleValidator.address,
        feeRecipienter,
        100,
        erc721TokenIdLocal3,
        erc721.address,
        ZERO_ADDRESS,
        feeMethodsSidesKindsHowToCallsMask
      ))
      const buySellOrders3 = OpenSeaOrdersInput(...matchData3);
      let dataForWyvernCall3 = await exchangeBulkV2Test.getDataWyvernAtomicMatch(buySellOrders3);
      const tradeData3 = PurchaseData(1, 100, dataForWyvernCall3);

      await verifyBalanceChange(buyer, 345, async () =>
        verifyBalanceChange(seller1, -90, async () =>
          verifyBalanceChange(seller2, -90, async () =>
            verifyBalanceChange(seller3, -90, async () =>
      	      verifyBalanceChange(feeRecipienter, -30, () =>
      	        verifyBalanceChange(feeRecipienterUP, -45, () =>
                  bulkExchange.bulkPurchase([tradeData1, tradeData2, tradeData3], feesUP, { from: buyer, value: 400, gasPrice: 0 })
                )
              )
            )
          )
        )
      );
/*need to estimate gas consumption*/
//      let tx = await bulkExchange.bulkPurchase([tradeData1, tradeData2, tradeData3], feesUP, { from: buyer, value: 400, gasPrice: 0 });
//      console.log("Bulk2 Wyvern orders, ERC721<->ETH (num = 3), by tradeData, Gas consumption :", tx.receipt.gasUsed);
      assert.equal(await erc721.balanceOf(buyer), 3);
    })

    it("Test bulkPurchase Wyvern (num orders = 3) orders are ready, ERC1155<->ETH", async () => {
      const wyvernProtocolFeeAddress = accounts[9];
      const buyer = accounts[2];
      const seller1 = accounts[1];
      const seller2 = accounts[3];
      const seller3 = accounts[4];
      const feeRecipienter = accounts[5];
      const feeRecipienterUP = accounts[6];
      /*Wyvern*/
      const wyvernProxyRegistry = await WyvernProxyRegistry.new();
      await wyvernProxyRegistry.registerProxy( {from: seller1} );
      await wyvernProxyRegistry.registerProxy( {from: seller2} );
      await wyvernProxyRegistry.registerProxy( {from: seller3} );

      const tokenTransferProxy = await WyvernTokenTransferProxy.new(wyvernProxyRegistry.address);

      const openSea = await WyvernExchangeWithBulkCancellations.new(wyvernProxyRegistry.address, tokenTransferProxy.address, ZERO_ADDRESS, wyvernProtocolFeeAddress, {gas: 6000000});
      await wyvernProxyRegistry.endGrantAuthentication(openSea.address);

      const merkleValidator = await MerkleValidator.new();

      const erc1155TokenIdLocal1 = 5;
      await testERC1155.mint(seller1, erc1155TokenIdLocal1, 10);
      await testERC1155.setApprovalForAll(await wyvernProxyRegistry.proxies(seller1), true, {from: seller1});

      const erc1155TokenIdLocal2 = 6;
      await testERC1155.mint(seller2, erc1155TokenIdLocal2, 10);
      await testERC1155.setApprovalForAll(await wyvernProxyRegistry.proxies(seller2), true, {from: seller2});

      const erc1155TokenIdLocal3 = 7;
      await testERC1155.mint(seller3, erc1155TokenIdLocal3, 10);
      await testERC1155.setApprovalForAll(await wyvernProxyRegistry.proxies(seller3), true, {from: seller3});

      exchangeV2 = await deployProxy(ExchangeV2, [transferProxy.address, erc20TransferProxy.address, 300, community, royaltiesRegistry.address], { initializer: "__ExchangeV2_init" });
      await exchangeV2.setFeeReceiver(eth, protocol);
      await exchangeV2.setFeeReceiver(t1.address, protocol);

      bulkExchange = await ExchangeBulkV2.new();
      await bulkExchange.__ExchangeWrapper_init(openSea.address, exchangeV2.address);

      let feesUPDetect = await exchangeBulkV2Test.encodeOriginFeeIntoUint(feeRecipienterUP, 1500); //15%
      let feesUP = [feesUPDetect];

      const matchData = (await getOpenSeaMatchDataMerkleValidator1155(
        openSea.address,
        bulkExchange.address,
        buyer,
        seller1,
        merkleValidator.address,
        feeRecipienter,
        100,
        erc1155TokenIdLocal1,
        testERC1155.address,
        ZERO_ADDRESS,
        8,
        feeMethodsSidesKindsHowToCallsMask
      ))

      const buySellOrders1 = OpenSeaOrdersInput(...matchData);
      let dataForWyvernCall1 = await exchangeBulkV2Test.getDataWyvernAtomicMatch(buySellOrders1);
      const tradeData1 = PurchaseData(1, 100, dataForWyvernCall1);

      const matchData2 = (await getOpenSeaMatchDataMerkleValidator1155(
        openSea.address,
        bulkExchange.address,
        buyer,
        seller2,
        merkleValidator.address,
        feeRecipienter,
        100,
        erc1155TokenIdLocal2,
        testERC1155.address,
        ZERO_ADDRESS,
        5,
        feeMethodsSidesKindsHowToCallsMask
      ))
      const buySellOrders2 = OpenSeaOrdersInput(...matchData2);
      let dataForWyvernCall2 = await exchangeBulkV2Test.getDataWyvernAtomicMatch(buySellOrders2);
      const tradeData2 = PurchaseData(1, 100, dataForWyvernCall2); //1 is Wyvern orders, 100 is amount for 10

      const matchData3 = (await getOpenSeaMatchDataMerkleValidator1155(
        openSea.address,
        bulkExchange.address,
        buyer,
        seller3,
        merkleValidator.address,
        feeRecipienter,
        100,
        erc1155TokenIdLocal3,
        testERC1155.address,
        ZERO_ADDRESS,
        3,
        feeMethodsSidesKindsHowToCallsMask
      ))
      const buySellOrders3 = OpenSeaOrdersInput(...matchData3);
      let dataForWyvernCall3 = await exchangeBulkV2Test.getDataWyvernAtomicMatch(buySellOrders3);
      const tradeData3 = PurchaseData(1, 100, dataForWyvernCall3);

      let tx = await bulkExchange.bulkPurchase([tradeData1, tradeData2, tradeData3], feesUP, { from: buyer, value: 400, gasPrice: 0 });

      console.log("Bulk2 Wyvern orders, ERC1155<->ETH (num = 3), by tradeData, Gas consumption :", tx.receipt.gasUsed);
      assert.equal(await testERC1155.balanceOf(seller1, erc1155TokenIdLocal1), 2);
      assert.equal(await testERC1155.balanceOf(seller2, erc1155TokenIdLocal2), 5);
      assert.equal(await testERC1155.balanceOf(seller3, erc1155TokenIdLocal3), 7);
      assert.equal(await testERC1155.balanceOf(buyer, erc1155TokenIdLocal1), 8);
      assert.equal(await testERC1155.balanceOf(buyer, erc1155TokenIdLocal2), 5);
      assert.equal(await testERC1155.balanceOf(buyer, erc1155TokenIdLocal3), 3);
    })
  });

  describe("bulkPurchase Rarible orders", () => {

    it("Test bulkPurchase ExchangeV2 (num orders = 3, type ==V2, V1) orders are ready, ERC721<->ETH", async () => {
      const buyer = accounts[2];
      const seller1 = accounts[1];
      const seller2 = accounts[3];
      const seller3 = accounts[4];
      const feeRecipienterUP = accounts[6];
      await testERC721.mint(seller1, erc721TokenId1);
      await testERC721.setApprovalForAll(transferProxy.address, true, {from: seller1});
      await testERC721.mint(seller2, erc721TokenId2);
      await testERC721.setApprovalForAll(transferProxy.address, true, {from: seller2});
      await testERC721.mint(seller3, erc721TokenId3);
      await testERC721.setApprovalForAll(transferProxy.address, true, {from: seller3});

      exchangeV2 = await deployProxy(ExchangeV2, [transferProxy.address, erc20TransferProxy.address, 0, community, royaltiesRegistry.address], { initializer: "__ExchangeV2_init" });
      await exchangeV2.setFeeReceiver(eth, protocol);
      await exchangeV2.setFeeReceiver(t1.address, protocol);

      bulkExchange = await ExchangeBulkV2.new();
      await bulkExchange.__ExchangeWrapper_init(ZERO_ADDRESS/*openSea.address*/, exchangeV2.address); //don`t need openSea.address, process only exchaneV2 orders

      /*NB!!! set buyer in payouts*/
      const encDataLeft = await encDataV2([[], [], false]);
      const encDataLeftV1 = await encDataV1([ [], [] ]);

      const left1 = Order(seller1, Asset(ERC721, enc(testERC721.address, erc721TokenId1), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const left2 = Order(seller2, Asset(ERC721, enc(testERC721.address, erc721TokenId2), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const left3 = Order(seller3, Asset(ERC721, enc(testERC721.address, erc721TokenId3), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V1, encDataLeftV1);

      let signatureLeft1 = await getSignature(left1, seller1, exchangeV2.address);
      let signatureLeft2 = await getSignature(left2, seller2, exchangeV2.address);
      let signatureLeft3 = await getSignature(left3, seller3, exchangeV2.address);
      /*NB!!! DONT Need to signature buy orders, because ExchangeBulkV2 is  msg.sender == buyOrder.maker*/

      let dataForExchCall1 = await exchangeBulkV2Test.getDataExchangeV2SellOrders(left1, signatureLeft1);
      const tradeData1 = PurchaseData(0, 100, dataForExchCall1); //0 is Exch orders, 100 is amount + 0 protocolFee

      let dataForExchCall2 = await exchangeBulkV2Test.getDataExchangeV2SellOrders(left2, signatureLeft2);
      const tradeData2 = PurchaseData(0, 100, dataForExchCall2); //0 is Exch orders, 100 is amount + 0 protocolFee

      let dataForExchCall3 = await exchangeBulkV2Test.getDataExchangeV2SellOrders(left3, signatureLeft3);
      const tradeData3 = PurchaseData(0, 100, dataForExchCall3); //0 is Exch orders, 100 is amount + 0 protocolFee

      let feesUPDetect = await exchangeBulkV2Test.encodeOriginFeeIntoUint(feeRecipienterUP, 1500); //15%
      let feesUP = [feesUPDetect];
    	await verifyBalanceChange(buyer, 345, async () =>
    		verifyBalanceChange(seller1, -100, async () =>
    		  verifyBalanceChange(seller2, -100, async () =>
    		    verifyBalanceChange(seller3, -100, async () =>
    			    verifyBalanceChange(feeRecipienterUP, -45, () =>
    				    bulkExchange.bulkPurchase([tradeData1, tradeData2, tradeData3], feesUP, { from: buyer, value: 400, gasPrice: 0 })
    				  )
    				)
    			)
    		)
    	);
//      const tx = await bulkExchange.bulkPurchase([tradeData1, tradeData2, tradeData3], feesUP, { from: buyer, value: 400, gasPrice: 0 });
//      console.log("Bulk, by bulkPurchase ERC721<->ETH (num = 3), Gas consumption :",tx.receipt.gasUsed);
      assert.equal(await testERC721.balanceOf(seller1), 0);
      assert.equal(await testERC721.balanceOf(seller2), 0);
      assert.equal(await testERC721.balanceOf(seller3), 0);
      assert.equal(await testERC721.balanceOf(accounts[2]), 3);
    })

  });

  describe("singlePurchase Wywern order", () => {
    it("Test singlePurchase Wyvern (num orders = 1), ERC721<->ETH", async () => {
      const wyvernProtocolFeeAddress = accounts[9];
      const buyer = accounts[2];
      const seller1 = accounts[1];
      const seller2 = accounts[3];
      const feeRecipienter = accounts[5];
      const feeRecipienterUP = accounts[6];
      /*Wyvern*/
      const wyvernProxyRegistry = await WyvernProxyRegistry.new();
      await wyvernProxyRegistry.registerProxy( {from: seller1} );
      await wyvernProxyRegistry.registerProxy( {from: seller2} );

      const tokenTransferProxy = await WyvernTokenTransferProxy.new(wyvernProxyRegistry.address);

      const openSea = await WyvernExchangeWithBulkCancellations.new(wyvernProxyRegistry.address, tokenTransferProxy.address, ZERO_ADDRESS, wyvernProtocolFeeAddress, {gas: 6000000});
      await wyvernProxyRegistry.endGrantAuthentication(openSea.address);

      const merkleValidator = await MerkleValidator.new();

      let erc721TokenIdLocal = 5;
      await erc721.mint(seller1, erc721TokenIdLocal);
      await erc721.setApprovalForAll(await wyvernProxyRegistry.proxies(seller1), true, {from: seller1});

      let erc721TokenIdLocal2 = 6;
      await erc721.mint(seller2, erc721TokenIdLocal2);
      await erc721.setApprovalForAll(await wyvernProxyRegistry.proxies(seller2), true, {from: seller2});

      exchangeV2 = await deployProxy(ExchangeV2, [transferProxy.address, erc20TransferProxy.address, 0, community, royaltiesRegistry.address], { initializer: "__ExchangeV2_init" });
      await exchangeV2.setFeeReceiver(eth, protocol);
      await exchangeV2.setFeeReceiver(t1.address, protocol);

      bulkExchange = await ExchangeBulkV2.new();
      await bulkExchange.__ExchangeWrapper_init(openSea.address, exchangeV2.address);

      /*for first order*/
      const matchData = (await getOpenSeaMatchDataMerkleValidator(
        openSea.address,
        bulkExchange.address,
        buyer,
        seller1,
        merkleValidator.address,
        feeRecipienter,
        100,
        erc721TokenIdLocal,
        erc721.address,
        ZERO_ADDRESS,
        feeMethodsSidesKindsHowToCallsMask
      ))
      const buySellOrders1 = OpenSeaOrdersInput(...matchData);
      let dataForWyvernCall1 = await exchangeBulkV2Test.getDataWyvernAtomicMatchWithError(buySellOrders1);
      const tradeData1 = PurchaseData(1, 100, dataForWyvernCall1);

      /*for second order*/
      const matchData2 = (await getOpenSeaMatchDataMerkleValidator(
        openSea.address,
        bulkExchange.address,
        buyer,
        seller2,
        merkleValidator.address,
        feeRecipienter,
        100,
        erc721TokenIdLocal2,
        erc721.address,
        ZERO_ADDRESS,
        feeMethodsSidesKindsHowToCallsMask
      ))
		  const buySellOrders2 = OpenSeaOrdersInput(...matchData2);
      let dataForWyvernCall2 = await exchangeBulkV2Test.getDataWyvernAtomicMatch(buySellOrders2);
      const tradeData2 = PurchaseData(1, 100, dataForWyvernCall2);

      let feesUPFirst = await exchangeBulkV2Test.encodeOriginFeeIntoUint(feeRecipienterUP, 1500); //15%
      let feesUP = [feesUPFirst];

      await verifyBalanceChange(buyer, 115, async () =>
      	verifyBalanceChange(seller2, -90, async () =>
      		verifyBalanceChange(feeRecipienter, -10, () =>
      		  verifyBalanceChange(feeRecipienterUP, -15, () =>
      		    bulkExchange.singlePurchase(tradeData2, feesUP, { from: buyer, value: 400, gasPrice: 0 })
      		  )
      		)
      	)
      );
      /*exception if wrong method*/
      await expectThrow(
        bulkExchange.singlePurchase(tradeData1, feesUP, { from: buyer, value: 400, gasPrice: 0 })
      );
      assert.equal(await erc721.balanceOf(buyer), 1);
    })

		it("Test singlePurchase Wyvern (num orders = 3), ERC1155<->ETH", async () => {
      const wyvernProtocolFeeAddress = accounts[9];
      const buyer = accounts[2];
      const seller1 = accounts[1];
      const feeRecipienter = accounts[5];
      const feeRecipienterUP = accounts[6];
      /*Wyvern*/
      const wyvernProxyRegistry = await WyvernProxyRegistry.new();
      await wyvernProxyRegistry.registerProxy( {from: seller1} );

      const tokenTransferProxy = await WyvernTokenTransferProxy.new(wyvernProxyRegistry.address);

      const openSea = await WyvernExchangeWithBulkCancellations.new(wyvernProxyRegistry.address, tokenTransferProxy.address, ZERO_ADDRESS, wyvernProtocolFeeAddress, {gas: 6000000});
      await wyvernProxyRegistry.endGrantAuthentication(openSea.address);

      const merkleValidator = await MerkleValidator.new();

      const erc1155TokenIdLocal1 = 5;
      await testERC1155.mint(seller1, erc1155TokenIdLocal1, 10);
      await testERC1155.setApprovalForAll(await wyvernProxyRegistry.proxies(seller1), true, {from: seller1});

      exchangeV2 = await deployProxy(ExchangeV2, [transferProxy.address, erc20TransferProxy.address, 300, community, royaltiesRegistry.address], { initializer: "__ExchangeV2_init" });
      await exchangeV2.setFeeReceiver(eth, protocol);
      await exchangeV2.setFeeReceiver(t1.address, protocol);

      bulkExchange = await ExchangeBulkV2.new();
      await bulkExchange.__ExchangeWrapper_init(openSea.address, exchangeV2.address);

      let feesUPFirst = await exchangeBulkV2Test.encodeOriginFeeIntoUint(feeRecipienterUP, 1500); //15%
      let feesUP = [feesUPFirst];

      const matchData = (await getOpenSeaMatchDataMerkleValidator1155(
        openSea.address,
        bulkExchange.address,
        buyer,
        seller1,
        merkleValidator.address,
        feeRecipienter,
        100,
        erc1155TokenIdLocal1,
        testERC1155.address,
        ZERO_ADDRESS,
        8,
        feeMethodsSidesKindsHowToCallsMask
      ))

      const buySellOrders1 = OpenSeaOrdersInput(...matchData);
      let dataForWyvernCall1 = await exchangeBulkV2Test.getDataWyvernAtomicMatch(buySellOrders1);
      const tradeData1 = PurchaseData(1, 100, dataForWyvernCall1);

      /*enough ETH for purchase*/
      await verifyBalanceChange(buyer, 115, async () =>
      	verifyBalanceChange(seller1, -90, async () =>
      		verifyBalanceChange(feeRecipienter, -10, () =>
      		  verifyBalanceChange(feeRecipienterUP, -15, () =>
      		    bulkExchange.singlePurchase(tradeData1, feesUP, { from: buyer, value: 400, gasPrice: 0 })
      		  )
      		)
      	)
      );

      assert.equal(await testERC1155.balanceOf(seller1, erc1155TokenIdLocal1), 2);
      assert.equal(await testERC1155.balanceOf(buyer, erc1155TokenIdLocal1), 8);

    })
  });

	function encDataV2(tuple) {
    return raribleTransferManagerTest.encodeV2(tuple);
  }

  function encDataV1(tuple) {
  	return raribleTransferManagerTest.encode(tuple)
  }

  async function getOpenSeaMatchDataMerkleValidator(
    exchange,
    bulk,
    buyer,
    seller,
    merkleValidatorAddr,
    protocol,
    basePrice,
    tokenId,
    token,
    paymentToken,
    maskHowToCall
    ) {

    const addrs = [
      exchange, // exchange buy
      bulk, // maker buy, contract bulk
      seller, // taker buy
      "0x0000000000000000000000000000000000000000", // feeRecipient buy
      merkleValidatorAddr, // target buy (MerkleValidator)
      "0x0000000000000000000000000000000000000000", // staticTarget buy
      paymentToken, // paymentToken buy (ETH)

      exchange, // exchange sell
      seller, // maker sell
      "0x0000000000000000000000000000000000000000", // taker sell
      protocol, // feeRecipient sell (originFee )
      merkleValidatorAddr, // target sell (MerkleValidator)
      "0x0000000000000000000000000000000000000000", // staticTarget sell
      paymentToken // paymentToken sell (ETH)
    ];

    const now = Math.floor(Date.now() / 1000);
    const listingTime = now - 60*60;
    const expirationTime = now + 60*60;

    const uints = [
      "1000", //makerRelayerFee buy (originFee)
      "0", // takerRelayerFee buy
      "0", // makerProtocolFee buy
      "0", // takerProtocolFee buy
      basePrice, // basePrice buy
      "0", // extra buy
      listingTime, // listingTime buy
      expirationTime, // expirationTime buy
      "0", // salt buy

      "1000", //makerRelayerFee sell (originFee)
      "0", // takerRelayerFee sell
      "0", // makerProtocolFee sell
      "0", // takerProtocolFee sell
      basePrice, // basePrice sell
      "0", // extra sell
      listingTime, // listingTime sell
      expirationTime, // expirationTime sell
      "0", // salt sell
    ];

    const feeMethodsSidesKindsHowToCalls = maskHowToCall;

    const zeroWord = "0000000000000000000000000000000000000000000000000000000000000000";

    // constant tokenId !!!
    const hexTokenId = tokenId;

    const merklePart = "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000";
    let calldataBuy = await exchangeBulkV2Test.getDataERC721UsingCriteria(ZERO_ADDRESS, buyer, token, tokenId);
    calldataBuy += merklePart;

    let calldataSell = await exchangeBulkV2Test.getDataERC721UsingCriteria(seller, ZERO_ADDRESS, token, tokenId);
    calldataSell += merklePart;

    const replacementPatternBuy =  "0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
    const replacementPatternSell = "0x000000000000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

    const staticExtradataBuy = "0x";
    const staticExtradataSell = "0x";

    const vs = [
      27, // sig v buy
      27 // sig v sell
    ];
    const rssMetadata = [
      "0x" + zeroWord, // sig r buy
      "0x" + zeroWord, // sig s buy
      "0x" + zeroWord, // sig r sell
      "0x" + zeroWord, // sig s sell
      "0x" + zeroWord  // metadata
    ];

    return [
      addrs,
      uints,
      feeMethodsSidesKindsHowToCalls,
      calldataBuy,
      calldataSell,
      replacementPatternBuy,
      replacementPatternSell,
      staticExtradataBuy,
      staticExtradataSell,
      vs,
      rssMetadata
    ];
  }

  async function getOpenSeaMatchDataMerkleValidator1155(
    exchange,
    bulk,
    buyer,
    seller,
    merkleValidatorAddr,
    protocol,
    basePrice,
    tokenId,
    token,
    paymentToken,
    amount,
    maskHowToCall
    ) {

    const addrs = [
      exchange, // exchange buy
      bulk, // maker buy, contract bulk
      seller, // taker buy
      "0x0000000000000000000000000000000000000000", // feeRecipient buy
      merkleValidatorAddr, // target buy (MerkleValidator)
      "0x0000000000000000000000000000000000000000", // staticTarget buy
      paymentToken, // paymentToken buy (ETH)

      exchange, // exchange sell
      seller, // maker sell
      "0x0000000000000000000000000000000000000000", // taker sell
      protocol, // feeRecipient sell (originFee )
      merkleValidatorAddr, // target sell (MerkleValidator)
      "0x0000000000000000000000000000000000000000", // staticTarget sell
      paymentToken // paymentToken sell (ETH)
    ];

    const now = Math.floor(Date.now() / 1000);
    const listingTime = now - 60 * 60;
    const expirationTime = now + 60 * 60;

    const uints = [
      "1000", //makerRelayerFee buy (originFee)
      "0", // takerRelayerFee buy
      "0", // makerProtocolFee buy
      "0", // takerProtocolFee buy
      basePrice, // basePrice buy
      "0", // extra buy
      listingTime, // listingTime buy
      expirationTime, // expirationTime buy
      "0", // salt buy

      "1000", //makerRelayerFee sell (originFee)
      "0", // takerRelayerFee sell
      "0", // makerProtocolFee sell
      "0", // takerProtocolFee sell
      basePrice, // basePrice sell
      "0", // extra sell
      listingTime, // listingTime sell
      expirationTime, // expirationTime sell
      "0", // salt sell
    ];

    const zeroWord = "0000000000000000000000000000000000000000000000000000000000000000";
    const merklePart = "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000000";

    let calldataBuy = await exchangeBulkV2Test.getDataERC1155UsingCriteria(ZERO_ADDRESS, buyer, token, tokenId, amount);
    calldataBuy += merklePart;
    let calldataSell = await exchangeBulkV2Test.getDataERC1155UsingCriteria(seller, ZERO_ADDRESS, token, tokenId, amount);
    calldataSell += merklePart;
    const replacementPatternBuy =  "0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
    const replacementPatternSell = "0x000000000000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

    const staticExtradataBuy = "0x";
    const staticExtradataSell = "0x";
    const feeMethodsSidesKindsHowToCalls = maskHowToCall;
    const vs = [
      27, // sig v buy
      27 // sig v sell
    ];
    const rssMetadata = [
      "0x" + zeroWord, // sig r buy
      "0x" + zeroWord, // sig s buy
      "0x" + zeroWord, // sig r sell
      "0x" + zeroWord, // sig s sell
      "0x" + zeroWord  // metadata
    ];

    return [
      addrs,
      uints,
      feeMethodsSidesKindsHowToCalls,
      calldataBuy,
      calldataSell,
      replacementPatternBuy,
      replacementPatternSell,
      staticExtradataBuy,
      staticExtradataSell,
      vs,
      rssMetadata
    ];
  }

  function addrToBytes32No0x(addr) {
    return "000000000000000000000000" + addr.substring(2)
  }

	async function getSignature(order, signer, exchangeContract) {
		return sign(order, signer, exchangeContract);
	}
});
