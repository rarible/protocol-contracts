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
const { Order, OpenSeaOrdersInput, TradeData, Asset, sign } = require("../order");
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
  const feeMethodsSidesKindsHowToCallsMask = [
    1, // FeeMethod{ ProtocolFee, SplitFee }) buy
    0, // SaleKindInterface.Side({ Buy, Sell }) buy
    0, // SaleKindInterface.SaleKind({ FixedPrice, DutchAuction }) buy
    1, // AuthenticatedProxy.HowToCall({ Call, DelegateCall } buy

    1, // FeeMethod({ ProtocolFee, SplitFee }) sell
    1, // SaleKindInterface.Side({ Buy, Sell } sell
    0, // SaleKindInterface.SaleKind({ FixedPrice, DutchAuction } sell
    1  // AuthenticatedProxy.HowToCall({ Call, DelegateCall } sell
  ];

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

	describe("matchOrders Wywern Bulk", () => {

		it("Test bulkTransfer Wyvern (num orders = 3) orders are ready, ERC721<->ETH", async () => {
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
      const tradeData1 = TradeData(1, 100, dataForWyvernCall1);
//		  const left1 = OpenSeaOrdersInput(...matchData);
//		  console.log("order:", left1);

      /*enough ETH for transfer*/
//    	await verifyBalanceChange(buyer, 100, async () =>
//    		verifyBalanceChange(seller1, -90, async () =>
//    			verifyBalanceChange(feeRecipienter, -10, () =>
//    			  bulkExchange._tradeExperiment(dataForWyvernCall, { from: buyer, value: 100, gasPrice: 0 })
//    			)
//    		)
//    	);


//      let tx = await bulkExchange._tradeExperiment(dataForWyvernCall, { from: buyer, value: 100, gasPrice: 0 });
//      let tx = await bulkExchange.bulkWyvernTransfer([tradeData1], { from: buyer, value: 100, gasPrice: 0 });
//      console.log("Bulk2 Wyvern orders, by _tradeExperiment ERC721<->ETH (num = 1), ortders are ready, Gas consumption :", tx.receipt.gasUsed);
//      assert.equal(await erc721.balanceOf(buyer), 1); //transfer all

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
      const tradeData2 = TradeData(1, 100, dataForWyvernCall2); //1 is Wyvern orders, 100 is amount

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
      const tradeData3 = TradeData(1, 100, dataForWyvernCall3);

      let tx = await bulkExchange.bulkTransfer([tradeData1, tradeData2, tradeData3], feesUP, { from: buyer, value: 400, gasPrice: 0 });
      console.log("Bulk2 Wyvern orders, ERC721<->ETH (num = 3), by tradeData, Gas consumption :", tx.receipt.gasUsed);
      assert.equal(await erc721.balanceOf(buyer), 3); //transfer all
    })

		it("Test bulkTransfer with one UP fee, Wyvern (num orders = 1) orders are ready, ERC721<->ETH", async () => {
      const wyvernProtocolFeeAddress = accounts[9];
		  const buyer = accounts[2];
		  const seller1 = accounts[1];
		  const seller2 = accounts[3];
//		  const seller3 = accounts[4];
		  const feeRecipienter = accounts[5];
		  const feeRecipienterUP = accounts[6];
      /*Wyvern*/
      const wyvernProxyRegistry = await WyvernProxyRegistry.new();
      await wyvernProxyRegistry.registerProxy( {from: seller1} );
      await wyvernProxyRegistry.registerProxy( {from: seller2} );
//      await wyvernProxyRegistry.registerProxy( {from: seller3} );

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
//
//      let erc721TokenIdLocal3 = 7;
//		  await erc721.mint(seller3, erc721TokenIdLocal3);
//		  await erc721.setApprovalForAll(await wyvernProxyRegistry.proxies(seller3), true, {from: seller3});

      exchangeV2 = await deployProxy(ExchangeV2, [transferProxy.address, erc20TransferProxy.address, 0, community, royaltiesRegistry.address], { initializer: "__ExchangeV2_init" });
      await exchangeV2.setFeeReceiver(eth, protocol);
      await exchangeV2.setFeeReceiver(t1.address, protocol);

		  bulkExchange = await ExchangeBulkV2.new();
		  await bulkExchange.__ExchangeWrapper_init(openSea.address, exchangeV2.address);


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
      const tradeData1 = TradeData(1, 100, dataForWyvernCall1);
//		  const left1 = OpenSeaOrdersInput(...matchData);
//		  console.log("order:", left1);
      let feesUPFirst = await exchangeBulkV2Test.encodeOriginFeeIntoUint(feeRecipienterUP, 1500); //15%
      let feesUPSecond = await exchangeBulkV2Test.encodeOriginFeeIntoUint(feeRecipienterUP, 1500); //15%
//      let feesUP = [feesUPFirst, feesUPSecond];
      let feesUP = [feesUPFirst];

      /*enough ETH for transfer*/
//    	await verifyBalanceChange(buyer, 115, async () =>
//    		verifyBalanceChange(seller1, -90, async () =>
//    			verifyBalanceChange(feeRecipienter, -10, () =>
//      			verifyBalanceChange(feeRecipienterUP, -15, () =>
//      			  bulkExchange.bulkTransfer2([tradeData1], feesUP, { from: buyer, value: 400, gasPrice: 0 })
//      			)
//    			)
//    		)
//    	);


      let tx = await bulkExchange.bulkTransfer([tradeData1], feesUP, { from: buyer, value: 400, gasPrice: 0 });
      console.log("First buy Wyvern orders, by bulkTransfer2 ERC721<->ETH (num = 1), ortders are ready, Gas consumption :", tx.receipt.gasUsed);
      assert.equal(await erc721.balanceOf(buyer), 1); //transfer all

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
      const tradeData2 = TradeData(1, 100, dataForWyvernCall2); //1 is Wyvern orders, 100 is amount

      tx = await bulkExchange.bulkTransfer([tradeData2], feesUP, { from: buyer, value: 400, gasPrice: 0 });
      console.log("Second buy Wyvern orders, by bulkTransfer ERC721<->ETH (num = 1), ortders are ready, Gas consumption :", tx.receipt.gasUsed);
      assert.equal(await erc721.balanceOf(buyer), 2); //transfer all
    })

		it("Test bulkTransfer Wyvern (num orders = 3) orders are ready, ERC1155<->ETH", async () => {
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
      const tradeData1 = TradeData(1, 100, dataForWyvernCall1);

      /*enough ETH for transfer*/
//    	await verifyBalanceChange(buyer, 100, async () =>
//    		verifyBalanceChange(seller1, -90, async () =>
//    			verifyBalanceChange(feeRecipienter, -10, () =>
//    			  bulkExchange.bulkTransfer([tradeData1], { from: buyer, value: 400, gasPrice: 0 })
//    			)
//    		)
//    	);


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
      const tradeData2 = TradeData(1, 100, dataForWyvernCall2); //1 is Wyvern orders, 100 is amount for 10

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
      const tradeData3 = TradeData(1, 100, dataForWyvernCall3);

      let tx = await bulkExchange.bulkTransfer([tradeData1, tradeData2, tradeData3], feesUP, { from: buyer, value: 400, gasPrice: 0 });

      console.log("Bulk2 Wyvern orders, ERC1155<->ETH (num = 3), by tradeData, Gas consumption :", tx.receipt.gasUsed);
      assert.equal(await testERC1155.balanceOf(seller1, erc1155TokenIdLocal1), 2);
      assert.equal(await testERC1155.balanceOf(seller2, erc1155TokenIdLocal2), 5);
      assert.equal(await testERC1155.balanceOf(seller3, erc1155TokenIdLocal3), 7);
      assert.equal(await testERC1155.balanceOf(buyer, erc1155TokenIdLocal1), 8);
      assert.equal(await testERC1155.balanceOf(buyer, erc1155TokenIdLocal2), 5);
      assert.equal(await testERC1155.balanceOf(buyer, erc1155TokenIdLocal3), 3);
    })
  });

	describe("matchOrders Rarible Bulk", () => {

		it("Test bulkTransfer ExchangeV2 (num orders = 3) orders are ready, ERC721<->ETH", async () => {
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
      const encDataRight = await encDataV2([[[buyer, 10000]], [], false]); //encDataV2(payouts, originFees, isMakeFill)
      const encDataLeft = await encDataV2([[], [], false]);

//		  const left1 = Order(seller1, Asset(ERC721, enc(testERC721.address, erc721TokenId1), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
//		  const left2 = Order(seller2, Asset(ERC721, enc(testERC721.address, erc721TokenId2), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
//		  const left3 = Order(seller3, Asset(ERC721, enc(testERC721.address, erc721TokenId3), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
		  const left1 = Order(seller1, Asset(ERC721, enc(testERC721.address, erc721TokenId1), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, "0xffffffff", "0x");
		  const left2 = Order(seller2, Asset(ERC721, enc(testERC721.address, erc721TokenId2), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, "0xffffffff", "0x");
		  const left3 = Order(seller3, Asset(ERC721, enc(testERC721.address, erc721TokenId3), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, "0xffffffff", "0x");

      let signatureLeft1 = await getSignature(left1, seller1, exchangeV2.address);
		  let signatureLeft2 = await getSignature(left2, seller2, exchangeV2.address);
		  let signatureLeft3 = await getSignature(left3, seller3, exchangeV2.address);
		  /*NB!!! DONT Need to signature buy orders, because ExchangeBulkV2 is  msg.sender == buyOrder.maker*/
//      let signatureRight = "0x";

      let dataForExchCall1 = await exchangeBulkV2Test.getDataExchangeV2SellOrders(left1, signatureLeft1);
      const tradeData1 = TradeData(0, 100, dataForExchCall1); //0 is Exch orders, 100 is amount + 0 protocolFee

      let dataForExchCall2 = await exchangeBulkV2Test.getDataExchangeV2SellOrders(left2, signatureLeft2);
      const tradeData2 = TradeData(0, 100, dataForExchCall2); //0 is Exch orders, 100 is amount + 0 protocolFee

      let dataForExchCall3 = await exchangeBulkV2Test.getDataExchangeV2SellOrders(left3, signatureLeft3);
      const tradeData3 = TradeData(0, 100, dataForExchCall3); //0 is Exch orders, 100 is amount + 0 protocolFee

      let feesUPDetect = await exchangeBulkV2Test.encodeOriginFeeIntoUint(feeRecipienterUP, 1500); //15%
      let feesUP = [feesUPDetect];
//    	await verifyBalanceChange(buyer, 300, async () =>
//    		verifyBalanceChange(seller1, -100, async () =>
//    		  verifyBalanceChange(seller2, -100, async () =>
//    		    verifyBalanceChange(seller3, -100, async () =>
//    			    verifyBalanceChange(protocol, -0, () =>
//    				    bulkExchange.matchBulkExchangeV2([left1, left2, left3], [signatureLeft1, signatureLeft2, signatureLeft3], { from: buyer, value: 400, gasPrice: 0 })
//    				  )
//    				)
//    			)
//    		)
//    	);
      const tx = await bulkExchange.bulkTransfer([tradeData1, tradeData2, tradeData3], feesUP, { from: buyer, value: 400, gasPrice: 0 });
    	console.log("Bulk, by bulkTransfer ERC721<->ETH (num = 3), Gas consumption :",tx.receipt.gasUsed);
    	assert.equal(await testERC721.balanceOf(seller1), 0);
    	assert.equal(await testERC721.balanceOf(accounts[2]), 3); //transfer all
    })

		it("Test bulkTransfer ExchangeV2 (num orders = 3) orders are ready, ERC1155<->ETH", async () => {
		  const buyer = accounts[2];
		  const seller1 = accounts[1];
		  const seller2 = accounts[3];
		  const seller3 = accounts[4];
		  const feeRecipienterUP = accounts[6];
		  await testERC1155.mint(seller1, erc1155TokenId1, 10);
		  await testERC1155.setApprovalForAll(transferProxy.address, true, {from: seller1});
		  await testERC1155.mint(seller2, erc1155TokenId2, 10);
		  await testERC1155.setApprovalForAll(transferProxy.address, true, {from: seller2});
		  await testERC1155.mint(seller3, erc1155TokenId3, 10);
		  await testERC1155.setApprovalForAll(transferProxy.address, true, {from: seller3});

      exchangeV2 = await deployProxy(ExchangeV2, [transferProxy.address, erc20TransferProxy.address, 0, community, royaltiesRegistry.address], { initializer: "__ExchangeV2_init" });
      await exchangeV2.setFeeReceiver(eth, protocol);
      await exchangeV2.setFeeReceiver(t1.address, protocol);

		  bulkExchange = await ExchangeBulkV2.new();
		  await bulkExchange.__ExchangeWrapper_init(ZERO_ADDRESS/*openSea.address*/, exchangeV2.address); //dont need openSea.address, process only exchaneV2 orders

      /*NB!!! set buyer in payouts*/
      const encDataRight = await encDataV2([[[buyer, 10000]], [], false]); //encDataV2(payouts, originFees, isMakeFill)
      const encDataLeft = await encDataV2([[], [], false]);

//		  const left1 = Order(accounts[1], Asset(ERC721, enc(testERC1155.address, erc721TokenId1), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
//		  const left2 = Order(accounts[3], Asset(ERC721, enc(testERC1155.address, erc721TokenId2), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
//		  const left3 = Order(seller3, Asset(ERC721, enc(testERC1155.address, erc721TokenId3), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
		  const left1 = Order(seller1, Asset(ERC1155, enc(testERC1155.address, erc1155TokenId1), 8), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, "0xffffffff", "0x");
		  const left2 = Order(seller2, Asset(ERC1155, enc(testERC1155.address, erc1155TokenId2), 5), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, "0xffffffff", "0x");
		  const left3 = Order(seller3, Asset(ERC1155, enc(testERC1155.address, erc1155TokenId3), 3), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, "0xffffffff", "0x");

      let signatureLeft1 = await getSignature(left1, seller1, exchangeV2.address);
		  let signatureLeft2 = await getSignature(left2, seller2, exchangeV2.address);
		  let signatureLeft3 = await getSignature(left3, seller3, exchangeV2.address);
		  /*NB!!! DONT Need to signature buy orders, because ExchangeBulkV2 is  msg.sender == buyOrder.maker*/
//      let signatureRight = "0x";

      let dataForExchCall1 = await exchangeBulkV2Test.getDataExchangeV2SellOrders(left1, signatureLeft1);
      const tradeData1 = TradeData(0, 100, dataForExchCall1); //0 is Exch orders, 100 is amount + 0 protocolFee

      let dataForExchCall2 = await exchangeBulkV2Test.getDataExchangeV2SellOrders(left2, signatureLeft2);
      const tradeData2 = TradeData(0, 100, dataForExchCall2); //0 is Exch orders, 100 is amount + 0 protocolFee

      let dataForExchCall3 = await exchangeBulkV2Test.getDataExchangeV2SellOrders(left3, signatureLeft3);
      const tradeData3 = TradeData(0, 100, dataForExchCall3); //0 is Exch orders, 100 is amount + 0 protocolFee

      let feesUPDetect = await exchangeBulkV2Test.encodeOriginFeeIntoUint(feeRecipienterUP, 1500); //15%
      let feesUP = [feesUPDetect];
//    	await verifyBalanceChange(buyer, 300, async () =>
//    		verifyBalanceChange(seller1, -100, async () =>
//    		  verifyBalanceChange(seller2, -100, async () =>
//    		    verifyBalanceChange(seller3, -100, async () =>
//    			    verifyBalanceChange(protocol, -0, () =>
//    				    bulkExchange.bulkTransfer([left1, left2, left3], [signatureLeft1, signatureLeft2, signatureLeft3], { from: buyer, value: 400, gasPrice: 0 })
//    				  )
//    				)
//    			)
//    		)
//    	);
      const tx = await bulkExchange.bulkTransfer([tradeData1, tradeData2, tradeData3], feesUP, { from: buyer, value: 400, gasPrice: 0 });
    	console.log("Bulk, by bulkTransfer ERC1155<->ETH (num = 3), Gas consumption :", tx.receipt.gasUsed);
    	assert.equal(await testERC1155.balanceOf(seller1, erc1155TokenId1), 2);
    	assert.equal(await testERC1155.balanceOf(buyer, erc1155TokenId1), 8); //transfer all
    })

  });

describe("matchOrders Wywern single transfer", () => {

		it("Test bulkTransfer Wyvern (num orders = 3) orders are ready, ERC721<->ETH", async () => {
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
      let dataForWyvernCall1 = await exchangeBulkV2Test.getDataWyvernAtomicMatch(buySellOrders1);
      const tradeData1 = TradeData(1, 100, dataForWyvernCall1);

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
      const tradeData2 = TradeData(1, 100, dataForWyvernCall2);

      let feesUPFirst = await exchangeBulkV2Test.encodeOriginFeeIntoUint(feeRecipienterUP, 1500); //15%
      let feesUP = [feesUPFirst];

      /*enough ETH for transfer*/
//    	await verifyBalanceChange(buyer, 115, async () =>
////OR    		verifyBalanceChange(seller1, -90, async () =>
//    		verifyBalanceChange(seller2, -90, async () =>
//    			verifyBalanceChange(feeRecipienter, -10, () =>
//    			  verifyBalanceChange(feeRecipienterUP, -15, () =>
////OR    			    bulkExchange.singleTransferWithFee(1, dataForWyvernCall1, feesUP, { from: buyer, value: 400, gasPrice: 0 })
//    			    bulkExchange.singleTransferWithFeeAndAmount(1, dataForWyvernCall2, 100, feesUP, { from: buyer, value: 400, gasPrice: 0 })
//    			  )
//    			)
//    		)
//    	);


      let tx = await bulkExchange.singleTransfer(tradeData1, feesUP, { from: buyer, value: 400, gasPrice: 0 });
      console.log("Single for Wyvern orders, by singleTransfer WithFee1 ERC721<->ETH (num = 1), ortders are ready, Gas consumption :", tx.receipt.gasUsed);
      assert.equal(await erc721.balanceOf(buyer), 1); //transfer all


      tx = await bulkExchange.singleTransfer(tradeData2, feesUP, { from: buyer, value: 400, gasPrice: 0 });
//OR      tx = await bulkExchange.singleTransferWithFeeAndAmount(1, dataForWyvernCall2, 200, feesUP, { from: buyer, value: 400, gasPrice: 0 });
      console.log("Single for Wyvern orders, by singleTransfer WithFee1 ERC721<->ETH (num = 1), ortders are ready, Gas consumption :", tx.receipt.gasUsed);
      assert.equal(await erc721.balanceOf(buyer), 2); //transfer all
    })

		it("Test bulkTransfer Wyvern (num orders = 3) orders are ready, ERC1155<->ETH", async () => {
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
      const tradeData1 = TradeData(1, 100, dataForWyvernCall1);

      /*enough ETH for transfer*/
//    	await verifyBalanceChange(buyer, 100, async () =>
//    		verifyBalanceChange(seller1, -90, async () =>
//    			verifyBalanceChange(feeRecipienter, -10, () =>
//    			  bulkExchange.bulkTransfer([tradeData1], { from: buyer, value: 400, gasPrice: 0 })
//    			)
//    		)
//    	);


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
      const tradeData2 = TradeData(1, 100, dataForWyvernCall2); //1 is Wyvern orders, 100 is amount for 10

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
      const tradeData3 = TradeData(1, 100, dataForWyvernCall3);

      let tx = await bulkExchange.bulkTransfer([tradeData1, tradeData2, tradeData3], feesUP, { from: buyer, value: 400, gasPrice: 0 });

      console.log("Bulk2 Wyvern orders, ERC1155<->ETH (num = 3), by tradeData, Gas consumption :", tx.receipt.gasUsed);
      assert.equal(await testERC1155.balanceOf(seller1, erc1155TokenIdLocal1), 2);
      assert.equal(await testERC1155.balanceOf(seller2, erc1155TokenIdLocal2), 5);
      assert.equal(await testERC1155.balanceOf(seller3, erc1155TokenIdLocal3), 7);
      assert.equal(await testERC1155.balanceOf(buyer, erc1155TokenIdLocal1), 8);
      assert.equal(await testERC1155.balanceOf(buyer, erc1155TokenIdLocal2), 5);
      assert.equal(await testERC1155.balanceOf(buyer, erc1155TokenIdLocal3), 3);
    })
  });

	function encDataV2(tuple) {
    return raribleTransferManagerTest.encodeV2(tuple);
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
//    const methodSigPart = "0xfb16a595";

//    const calldataBuy = methodSigPart + zeroWord + addrToBytes32No0x(buyer) + addrToBytes32No0x(token) + hexTokenId + merklePart;
    let calldataBuy = await exchangeBulkV2Test.getDataERC721UsingCriteria(ZERO_ADDRESS, buyer, token, tokenId);
    calldataBuy += merklePart;
//    const calldataSell = methodSigPart + addrToBytes32No0x(seller) + zeroWord + addrToBytes32No0x(token) + hexTokenId + merklePart;
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
//    console.log("calldataBuy:", calldataBuy);
    let calldataSell = await exchangeBulkV2Test.getDataERC1155UsingCriteria(seller, ZERO_ADDRESS, token, tokenId, amount);
    calldataSell += merklePart;
//    console.log("calldataSell:", calldataSell);
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
