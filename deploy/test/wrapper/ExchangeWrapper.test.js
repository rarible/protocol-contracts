const ExchangeBulkV2 = artifacts.require("ExchangeWrapper.sol");
const WrapperHelper = artifacts.require("WrapperHelper.sol");
const ExchangeV2 = artifacts.require("ExchangeV2.sol");

const TestERC20 = artifacts.require("TestERC20.sol");
const TestERC721 = artifacts.require("TestERC721.sol");
const TestERC1155 = artifacts.require("TestERC1155.sol");
const WETH9 = artifacts.require('WETH9');

const TransferProxy = artifacts.require("TransferProxy.sol");
const ERC20TransferProxy = artifacts.require("ERC20TransferProxy.sol");

const RoyaltiesRegistry = artifacts.require("RoyaltiesRegistry.sol");
const RaribleTestHelper = artifacts.require("RaribleTestHelper.sol");

//Wyvern
const WyvernExchangeWithBulkCancellations = artifacts.require("WyvernExchangeWithBulkCancellations");
const WyvernTokenTransferProxy = artifacts.require("WyvernTokenTransferProxy");
const MerkleValidator = artifacts.require("MerkleValidator");
const WyvernProxyRegistry = artifacts.require("WyvernProxyRegistry");

//SEA PORT
const ConduitController = artifacts.require("ConduitController.sol");
const Seaport = artifacts.require("Seaport.sol");

//X2Y2
const ERC721Delegate = artifacts.require("ERC721Delegate.sol");
const X2Y2_r1 = artifacts.require("X2Y2_r1.sol");

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
  let seller = accounts[1];
  const zoneAddr = accounts[2];
  const tokenId = 12345;
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
    helper = await RaribleTestHelper.new();
    wrapperHelper = await WrapperHelper.new();

    transferProxy = await TransferProxy.deployed();
    
    bulkExchange = await ExchangeBulkV2.deployed();
  })

  beforeEach(async () => {
    /*ERC20 */
    erc20 = await TestERC20.new();
    /*ERC721 */
    erc721 = await TestERC721.new("Rarible", "RARI", "https://ipfs.rarible.com");
    /*ERC1155*/
    erc1155 = await TestERC1155.new("https://ipfs.rarible.com");
  });
  
  describe("purcahase Seaport orders", () => {
    it("wrapper call SeaPortBasic ERC721<->ETH", async () => {
      const conduitController = await ConduitController.new();
      const seaport = await Seaport.new(conduitController.address)

      await bulkExchange.setSeaPort(seaport.address);

      const buyerLocal1 = accounts[2];
      const token = await TestERC721.new();
      await token.mint(seller, tokenId)
      await token.setApprovalForAll(seaport.address, true, {from: seller})

      const basicOrder = {
        offerer: seller,
        zone: zoneAddr,
        basicOrderType: 0,
        offerToken: token.address,
        offerIdentifier: '0x3039',
        offerAmount: '0x01',
        considerationToken: '0x0000000000000000000000000000000000000000',
        considerationIdentifier: '0x00',
        considerationAmount: '1000',
        startTime: 0,
        endTime: '0xff00000000000000000000000000',
        zoneHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        salt: '0x9d56bd7c39230517f254b5ce4fd292373648067bd5c6d09accbcb3713f328885',
        totalOriginalAdditionalRecipients: '0x01',
        signature: '0x41651a6ed862341d20819a3c8a326b43c3fbc8f8dd9a0cde3b292c61665e8ed46592c083bb29f6f9dc68df824d02bbc9bc752b68081c95866d7d654659b3580f1b',
        offererConduitKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
        fulfillerConduitKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
        additionalRecipients: [
          {
            amount: '100',
            recipient: '0x6ef1ff55b97d3FfDD8E2C125874296587907C0fc'
          }
        ]
      }
        let dataForSeaport = await wrapperHelper.getDataSeaPortBasic(basicOrder, ERC721);
        const tradeDataSeaPort = PurchaseData(3, 1100, dataForSeaport);
        let feesUP = [];

        const tx = await bulkExchange.singlePurchase(tradeDataSeaPort, feesUP, {from: buyerLocal1, value: 2000})
        console.log("wrapper call SeaPortBasic: ETH <=> ERC721", tx.receipt.gasUsed)
        assert.equal(await token.balanceOf(seller), 0);
        assert.equal(await token.balanceOf(buyerLocal1), 1);
      })

    it("wrapper seaport (fulfillAdvancedOrder through data selector, method fulfillAdvancedOrder) ERC721<->ETH", async () => {
      const conduitController = await ConduitController.new();
      const seaport = await Seaport.new(conduitController.address)
      const thirdPartAccount = accounts[3];
      
      await bulkExchange.setSeaPort(seaport.address);

      const buyerLocal1 = accounts[2];
      const token = await TestERC721.new();
      await token.mint(seller, tokenId)
      await token.setApprovalForAll(seaport.address, true, {from: seller})
      const considerationItemLeft = {
        itemType: 0,
        token: '0x0000000000000000000000000000000000000000',
        identifierOrCriteria: 0,
        startAmount: 100,
        endAmount: 100,
        recipient: seller
      }

      const offerItemLeft = {
        itemType: 2, // 2: ERC721 items
        token: token.address,
        identifierOrCriteria: '0x3039',
        startAmount: 1,
        endAmount: 1
      }

      const OrderParametersLeft = {
        offerer: seller,// 0x00
        zone: zoneAddr, // 0x20
        offer: [offerItemLeft], // 0x40
        consideration: [considerationItemLeft], // 0x60
        orderType: 0, // 0: no partial fills, anyone can execute
        startTime: 0, //
        endTime: '0xff00000000000000000000000000', // 0xc0
        zoneHash: '0x0000000000000000000000000000000000000000000000000000000000000000', // 0xe0
        salt: '0x9d56bd7c39230517f254b5ce4fd292373648067bd5c6d09accbcb3713f328885', // 0x100
        conduitKey : '0x0000000000000000000000000000000000000000000000000000000000000000', // 0x120
        totalOriginalConsiderationItems: 1 // 0x140
        // offer.length                          // 0x160
      }

      const _advancedOrder = {
        parameters: OrderParametersLeft,
        numerator: 1,
        denominator: 1,
        signature: '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1b',
        extraData: '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1c'
      }

      const _criteriaResolvers = [];
      const _fulfillerConduitKey = '0x0000000000000000000000000000000000000000000000000000000000000000';
      const _recipient = buyerLocal1;

      let dataForSeaportWithSelector = await wrapperHelper.getDataSeaPortFulfillAdvancedOrder(_advancedOrder, _criteriaResolvers, _fulfillerConduitKey, _recipient);
      const tradeDataSeaPort = PurchaseData(2, 100, dataForSeaportWithSelector);
      let feesUP = [];

      const tx = await bulkExchange.singlePurchase(tradeDataSeaPort, feesUP, {from: buyerLocal1, value: 100})
      console.log("wrapper seaport (fulfillAdvancedOrder() by call : ETH <=> ERC721", tx.receipt.gasUsed)
      assert.equal(await token.balanceOf(seller), 0);
      assert.equal(await token.balanceOf(buyerLocal1), 1);
    })

    it("wrapper seaport (fulfillAvalibleAdvancedOrder through data selector, method ) ERC721<->ETH", async () => {
      const conduitController = await ConduitController.new();
      const seaport = await Seaport.new(conduitController.address)
      const thirdPartAccount = accounts[3];
      await bulkExchange.setSeaPort(seaport.address);

      const buyerLocal1 = accounts[2];
      const token = await TestERC721.new();
      await token.mint(seller, tokenId)
      await token.setApprovalForAll(seaport.address, true, {from: seller})

      const considerationItemLeft = {
        itemType: 0,
        token: '0x0000000000000000000000000000000000000000',
        identifierOrCriteria: 0,
        startAmount: 100,
        endAmount: 100,
        recipient: seller
      }

      const offerItemLeft = {
        itemType: 2, // 2: ERC721 items
        token: token.address,
        identifierOrCriteria: '0x3039',
        startAmount: 1,
        endAmount: 1
      }

      const OrderParametersLeft = {
        offerer: seller,// 0x00
        zone: zoneAddr, // 0x20
        offer: [offerItemLeft], // 0x40
        consideration: [considerationItemLeft], // 0x60
        orderType: 0, // 0: no partial fills, anyone can execute
        startTime: 0, //
        endTime: '0xff00000000000000000000000000', // 0xc0
        zoneHash: '0x0000000000000000000000000000000000000000000000000000000000000000', // 0xe0
        salt: '0x9d56bd7c39230517f254b5ce4fd292373648067bd5c6d09accbcb3713f328885', // 0x100
        conduitKey : '0x0000000000000000000000000000000000000000000000000000000000000000', // 0x120
        totalOriginalConsiderationItems: 1 // 0x140
        // offer.length                          // 0x160
      }

      const _advancedOrder = {
        parameters: OrderParametersLeft,
        numerator: 1,
        denominator: 1,
        signature: '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1b',
        extraData: '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1c'
      }

      const _advancedOrders = [_advancedOrder];
      const _criteriaResolvers = [];
      const _fulfillerConduitKey = '0x0000000000000000000000000000000000000000000000000000000000000000';
      const _recipient = buyerLocal1;
      const _maximumFulfilled = 1;

      const offerFulfillments = [
        [ { orderIndex: 0, itemIndex: 0 } ]
      ]

      const considerationFulfillments = [
        [ { orderIndex: 0, itemIndex: 0 } ]
      ]

      let dataForSeaportWithSelector = await wrapperHelper.getDataSeaPortFulfillAvailableAdvancedOrders(
        _advancedOrders,
        _criteriaResolvers,
        offerFulfillments,
        considerationFulfillments,
        _fulfillerConduitKey,
        _recipient,
        _maximumFulfilled);

      const tradeDataSeaPort = PurchaseData(2, 100, dataForSeaportWithSelector);
      let feesUP = [];

      const tx = await bulkExchange.singlePurchase(tradeDataSeaPort, feesUP, {from: buyerLocal1, value: 100})
      console.log("SEAPORT fulfillAvalibleAdvancedOrder, by wrapper: ETH <=> ERC721", tx.receipt.gasUsed)
      assert.equal(await token.balanceOf(seller), 0);
      assert.equal(await token.balanceOf(buyerLocal1), 1);
    })
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
      //Wyvern
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

      exchangeV2 = await ExchangeV2.deployed();
      await exchangeV2.setProtocolFee(300);

      await exchangeV2.setFeeReceiver(eth, protocol);
      await exchangeV2.setFeeReceiver(erc20.address, protocol);

      await bulkExchange.setWyvern(openSea.address)

      let feesUPDetect = await wrapperHelper.encodeOriginFeeIntoUint(feeRecipienterUP, 1500); //15%
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
      let dataForWyvernCall1 = await wrapperHelper.getDataWyvernAtomicMatch(buySellOrders1);
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
      let dataForWyvernCall2 = await wrapperHelper.getDataWyvernAtomicMatch(buySellOrders2);
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
      let dataForWyvernCall3 = await wrapperHelper.getDataWyvernAtomicMatch(buySellOrders3);
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
      const wyvernProxyRegistry = await WyvernProxyRegistry.new();
      await wyvernProxyRegistry.registerProxy( {from: seller1} );
      await wyvernProxyRegistry.registerProxy( {from: seller2} );
      await wyvernProxyRegistry.registerProxy( {from: seller3} );

      const tokenTransferProxy = await WyvernTokenTransferProxy.new(wyvernProxyRegistry.address);

      const openSea = await WyvernExchangeWithBulkCancellations.new(wyvernProxyRegistry.address, tokenTransferProxy.address, ZERO_ADDRESS, wyvernProtocolFeeAddress, {gas: 6000000});
      await wyvernProxyRegistry.endGrantAuthentication(openSea.address);

      const merkleValidator = await MerkleValidator.new();

      const erc1155TokenIdLocal1 = 5;
      await erc1155.mint(seller1, erc1155TokenIdLocal1, 10);
      await erc1155.setApprovalForAll(await wyvernProxyRegistry.proxies(seller1), true, {from: seller1});

      const erc1155TokenIdLocal2 = 6;
      await erc1155.mint(seller2, erc1155TokenIdLocal2, 10);
      await erc1155.setApprovalForAll(await wyvernProxyRegistry.proxies(seller2), true, {from: seller2});

      const erc1155TokenIdLocal3 = 7;
      await erc1155.mint(seller3, erc1155TokenIdLocal3, 10);
      await erc1155.setApprovalForAll(await wyvernProxyRegistry.proxies(seller3), true, {from: seller3});

      exchangeV2 = await ExchangeV2.deployed();
      await exchangeV2.setProtocolFee(300);

      await exchangeV2.setFeeReceiver(eth, protocol);
      await exchangeV2.setFeeReceiver(erc20.address, protocol);

      await bulkExchange.setWyvern(openSea.address)

      let feesUPDetect = await wrapperHelper.encodeOriginFeeIntoUint(feeRecipienterUP, 1500); //15%
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
        erc1155.address,
        ZERO_ADDRESS,
        8,
        feeMethodsSidesKindsHowToCallsMask
      ))

      const buySellOrders1 = OpenSeaOrdersInput(...matchData);
      let dataForWyvernCall1 = await wrapperHelper.getDataWyvernAtomicMatch(buySellOrders1);
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
        erc1155.address,
        ZERO_ADDRESS,
        5,
        feeMethodsSidesKindsHowToCallsMask
      ))
      const buySellOrders2 = OpenSeaOrdersInput(...matchData2);
      let dataForWyvernCall2 = await wrapperHelper.getDataWyvernAtomicMatch(buySellOrders2);
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
        erc1155.address,
        ZERO_ADDRESS,
        3,
        feeMethodsSidesKindsHowToCallsMask
      ))
      const buySellOrders3 = OpenSeaOrdersInput(...matchData3);
      let dataForWyvernCall3 = await wrapperHelper.getDataWyvernAtomicMatch(buySellOrders3);
      const tradeData3 = PurchaseData(1, 100, dataForWyvernCall3);

      let tx = await bulkExchange.bulkPurchase([tradeData1, tradeData2, tradeData3], feesUP, { from: buyer, value: 400, gasPrice: 0 });

      console.log("Bulk2 Wyvern orders, ERC1155<->ETH (num = 3), by tradeData, Gas consumption :", tx.receipt.gasUsed);
      assert.equal(await erc1155.balanceOf(seller1, erc1155TokenIdLocal1), 2);
      assert.equal(await erc1155.balanceOf(seller2, erc1155TokenIdLocal2), 5);
      assert.equal(await erc1155.balanceOf(seller3, erc1155TokenIdLocal3), 7);
      assert.equal(await erc1155.balanceOf(buyer, erc1155TokenIdLocal1), 8);
      assert.equal(await erc1155.balanceOf(buyer, erc1155TokenIdLocal2), 5);
      assert.equal(await erc1155.balanceOf(buyer, erc1155TokenIdLocal3), 3);
    })

    it("Test bulkPurchase Wyvern and Rarible mixed (num orders = 3) orders are ready, ERC1155<->ETH", async () => {
      const wyvernProtocolFeeAddress = accounts[9];
      const buyer = accounts[2];
      const seller1 = accounts[1];
      const seller2 = accounts[3];
      const seller3 = accounts[4];
      const feeRecipienter = accounts[5];
      const feeRecipienterUP = accounts[6];
      const wyvernProxyRegistry = await WyvernProxyRegistry.new();
      await wyvernProxyRegistry.registerProxy( {from: seller1} );
      await wyvernProxyRegistry.registerProxy( {from: seller2} );
      await wyvernProxyRegistry.registerProxy( {from: seller3} );

      const tokenTransferProxy = await WyvernTokenTransferProxy.new(wyvernProxyRegistry.address);

      const openSea = await WyvernExchangeWithBulkCancellations.new(wyvernProxyRegistry.address, tokenTransferProxy.address, ZERO_ADDRESS, wyvernProtocolFeeAddress, {gas: 6000000});
      await wyvernProxyRegistry.endGrantAuthentication(openSea.address);

      const merkleValidator = await MerkleValidator.new();

      const erc1155TokenIdLocal1 = 5;
      await erc1155.mint(seller1, erc1155TokenIdLocal1, 10);
      await erc1155.setApprovalForAll(await wyvernProxyRegistry.proxies(seller1), true, {from: seller1});

      const erc1155TokenIdLocal2 = 6;
      await erc1155.mint(seller2, erc1155TokenIdLocal2, 10);
      await erc1155.setApprovalForAll(transferProxy.address, true, {from: seller2});

      const erc1155TokenIdLocal3 = 7;
      await erc1155.mint(seller3, erc1155TokenIdLocal3, 10);
      await erc1155.setApprovalForAll(await wyvernProxyRegistry.proxies(seller3), true, {from: seller3});

      exchangeV2 = await ExchangeV2.deployed();
      await exchangeV2.setProtocolFee(300);

      await exchangeV2.setFeeReceiver(eth, protocol);
      await exchangeV2.setFeeReceiver(erc20.address, protocol);

      await bulkExchange.setWyvern(openSea.address)

      let feesUPDetect = await wrapperHelper.encodeOriginFeeIntoUint(feeRecipienterUP, 1500); //15%
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
        erc1155.address,
        ZERO_ADDRESS,
        8,
        feeMethodsSidesKindsHowToCallsMask
      ))

      const buySellOrders1 = OpenSeaOrdersInput(...matchData);
      let dataForWyvernCall1 = await wrapperHelper.getDataWyvernAtomicMatch(buySellOrders1);
      const tradeData1 = PurchaseData(1, 100, dataForWyvernCall1);

      const encDataLeft = await encDataV2([[], [], false]);
      const left2 = Order(seller2, Asset(ERC1155, enc(erc1155.address, erc1155TokenIdLocal2), 10), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      let signatureLeft2 = await getSignature(left2, seller2, exchangeV2.address);
      let dataForExchCall2 = await wrapperHelper.getDataExchangeV2SellOrders(left2, signatureLeft2, 5);
      const tradeData2 = PurchaseData(0, 100, dataForExchCall2); //0 is Exch orders, 100 is amount + 0 protocolFee

      const matchData3 = (await getOpenSeaMatchDataMerkleValidator1155(
        openSea.address,
        bulkExchange.address,
        buyer,
        seller3,
        merkleValidator.address,
        feeRecipienter,
        100,
        erc1155TokenIdLocal3,
        erc1155.address,
        ZERO_ADDRESS,
        3,
        feeMethodsSidesKindsHowToCallsMask
      ))
      const buySellOrders3 = OpenSeaOrdersInput(...matchData3);
      let dataForWyvernCall3 = await wrapperHelper.getDataWyvernAtomicMatch(buySellOrders3);
      const tradeData3 = PurchaseData(1, 100, dataForWyvernCall3);

      let tx = await bulkExchange.bulkPurchase([tradeData1, tradeData2, tradeData3], feesUP, { from: buyer, value: 400, gasPrice: 0 });

      console.log("Bulk2 Wyvern and Rarible mixed orders, ERC1155<->ETH (num = 3), by tradeData, Gas consumption :", tx.receipt.gasUsed);
      assert.equal(await erc1155.balanceOf(seller1, erc1155TokenIdLocal1), 2);
      assert.equal(await erc1155.balanceOf(seller2, erc1155TokenIdLocal2), 5);
      assert.equal(await erc1155.balanceOf(seller3, erc1155TokenIdLocal3), 7);
      assert.equal(await erc1155.balanceOf(buyer, erc1155TokenIdLocal1), 8);
      assert.equal(await erc1155.balanceOf(buyer, erc1155TokenIdLocal2), 5);
      assert.equal(await erc1155.balanceOf(buyer, erc1155TokenIdLocal3), 3);
    })
  });

  describe("bulkPurchase Rarible orders", () => {

    it("Test bulkPurchase ExchangeV2 (num orders = 3, type ==V2, V1) orders are ready, ERC721<->ETH", async () => {
      const buyer = accounts[2];
      const seller1 = accounts[1];
      const seller2 = accounts[3];
      const seller3 = accounts[4];
      const feeRecipienterUP = accounts[6];
      await erc721.mint(seller1, erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, {from: seller1});
      await erc721.mint(seller2, erc721TokenId2);
      await erc721.setApprovalForAll(transferProxy.address, true, {from: seller2});
      await erc721.mint(seller3, erc721TokenId3);
      await erc721.setApprovalForAll(transferProxy.address, true, {from: seller3});

      exchangeV2 = await ExchangeV2.deployed();
      await exchangeV2.setProtocolFee(300);

      await exchangeV2.setFeeReceiver(eth, protocol);
      await exchangeV2.setFeeReceiver(erc20.address, protocol);

      //NB!!! set buyer in payouts
      const encDataLeft = await encDataV2([[], [], false]);
      const encDataLeftV1 = await encDataV1([ [], [] ]);

      const left1 = Order(seller1, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const left2 = Order(seller2, Asset(ERC721, enc(erc721.address, erc721TokenId2), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const left3 = Order(seller3, Asset(ERC721, enc(erc721.address, erc721TokenId3), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V1, encDataLeftV1);

      let signatureLeft1 = await getSignature(left1, seller1, exchangeV2.address);
      let signatureLeft2 = await getSignature(left2, seller2, exchangeV2.address);
      let signatureLeft3 = await getSignature(left3, seller3, exchangeV2.address);
      //NB!!! DONT Need to signature buy orders, because ExchangeBulkV2 is  msg.sender == buyOrder.maker

      let dataForExchCall1 = await wrapperHelper.getDataExchangeV2SellOrders(left1, signatureLeft1, 1);
      const tradeData1 = PurchaseData(0, 100, dataForExchCall1); //0 is Exch orders, 100 is amount + 0 protocolFee

      let dataForExchCall2 = await wrapperHelper.getDataExchangeV2SellOrders(left2, signatureLeft2, 1);
      const tradeData2 = PurchaseData(0, 100, dataForExchCall2); //0 is Exch orders, 100 is amount + 0 protocolFee

      let dataForExchCall3 = await wrapperHelper.getDataExchangeV2SellOrders(left3, signatureLeft3, 1);
      const tradeData3 = PurchaseData(0, 100, dataForExchCall3); //0 is Exch orders, 100 is amount + 0 protocolFee

      let feesUPDetect = await wrapperHelper.encodeOriginFeeIntoUint(feeRecipienterUP, 1500); //15%
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
      const feeRecipienterUP = accounts[6];
      await erc1155.mint(seller1, erc1155TokenId1, 10);
      await erc1155.setApprovalForAll(transferProxy.address, true, {from: seller1});
      await erc1155.mint(seller2, erc1155TokenId2, 10);
      await erc1155.setApprovalForAll(transferProxy.address, true, {from: seller2});
      await erc1155.mint(seller3, erc1155TokenId3, 10);
      await erc1155.setApprovalForAll(transferProxy.address, true, {from: seller3});

      exchangeV2 = await ExchangeV2.deployed();
      await exchangeV2.setProtocolFee(300);

      await exchangeV2.setFeeReceiver(eth, protocol);
      await exchangeV2.setFeeReceiver(erc20.address, protocol);

      //NB!!! set buyer in payouts
      const encDataLeft = await encDataV2([[], [], false]);
      const encDataLeftV1 = await encDataV1([ [], [] ]);

      const left1 = Order(seller1, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 10), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const left2 = Order(seller2, Asset(ERC1155, enc(erc1155.address, erc1155TokenId2), 10), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const left3 = Order(seller3, Asset(ERC1155, enc(erc1155.address, erc1155TokenId3), 10), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V1, encDataLeftV1);

      let signatureLeft1 = await getSignature(left1, seller1, exchangeV2.address);
      let signatureLeft2 = await getSignature(left2, seller2, exchangeV2.address);
      let signatureLeft3 = await getSignature(left3, seller3, exchangeV2.address);
      //NB!!! DONT Need to signature buy orders, because ExchangeBulkV2 is  msg.sender == buyOrder.maker

      let dataForExchCall1 = await wrapperHelper.getDataExchangeV2SellOrders(left1, signatureLeft1, 6);
      const tradeData1 = PurchaseData(0, 100, dataForExchCall1); //0 is Exch orders, 100 is amount + 0 protocolFee

      let dataForExchCall2 = await wrapperHelper.getDataExchangeV2SellOrders(left2, signatureLeft2, 8);
      const tradeData2 = PurchaseData(0, 100, dataForExchCall2); //0 is Exch orders, 100 is amount + 0 protocolFee

      let dataForExchCall3 = await wrapperHelper.getDataExchangeV2SellOrders(left3, signatureLeft3, 10);
      const tradeData3 = PurchaseData(0, 100, dataForExchCall3); //0 is Exch orders, 100 is amount + 0 protocolFee

      let feesUPDetect = await wrapperHelper.encodeOriginFeeIntoUint(feeRecipienterUP, 1500); //15%
      let feesUP = [feesUPDetect];
    	await verifyBalanceChange(buyer, 276, async () =>
    		verifyBalanceChange(seller1, -60, async () =>
    		  verifyBalanceChange(seller2, -80, async () =>
    		    verifyBalanceChange(seller3, -100, async () =>
    			    verifyBalanceChange(feeRecipienterUP, -36, () =>
    				    bulkExchange.bulkPurchase([tradeData1, tradeData2, tradeData3], feesUP, { from: buyer, value: 400, gasPrice: 0 })
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

  describe("singlePurchase Wywern order", () => {
    it("Test singlePurchase Wyvern (num orders = 1), ERC721<->ETH", async () => {
      const wyvernProtocolFeeAddress = accounts[9];
      const buyer = accounts[2];
      const seller1 = accounts[1];
      const seller2 = accounts[3];
      const feeRecipienter = accounts[5];
      const feeRecipienterUP = accounts[6];
      //Wyvern
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

      exchangeV2 = await ExchangeV2.deployed();
      await exchangeV2.setProtocolFee(300);

      await exchangeV2.setFeeReceiver(eth, protocol);
      await exchangeV2.setFeeReceiver(erc20.address, protocol);

      await bulkExchange.setWyvern(openSea.address)

      //for first order
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
      let dataForWyvernCall1 = await wrapperHelper.getDataWyvernAtomicMatchWithError(buySellOrders1);
      const tradeData1 = PurchaseData(1, 100, dataForWyvernCall1);

      //for second order
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
      let dataForWyvernCall2 = await wrapperHelper.getDataWyvernAtomicMatch(buySellOrders2);
      const tradeData2 = PurchaseData(1, 100, dataForWyvernCall2);

      let feesUPFirst = await wrapperHelper.encodeOriginFeeIntoUint(feeRecipienterUP, 1500); //15%
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
      //exception if wrong method
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
      //Wyvern
      const wyvernProxyRegistry = await WyvernProxyRegistry.new();
      await wyvernProxyRegistry.registerProxy( {from: seller1} );

      const tokenTransferProxy = await WyvernTokenTransferProxy.new(wyvernProxyRegistry.address);

      const openSea = await WyvernExchangeWithBulkCancellations.new(wyvernProxyRegistry.address, tokenTransferProxy.address, ZERO_ADDRESS, wyvernProtocolFeeAddress, {gas: 6000000});
      await wyvernProxyRegistry.endGrantAuthentication(openSea.address);

      const merkleValidator = await MerkleValidator.new();

      const erc1155TokenIdLocal1 = 5;
      await erc1155.mint(seller1, erc1155TokenIdLocal1, 10);
      await erc1155.setApprovalForAll(await wyvernProxyRegistry.proxies(seller1), true, {from: seller1});

      exchangeV2 = await ExchangeV2.deployed();
      await exchangeV2.setProtocolFee(300);

      await exchangeV2.setFeeReceiver(eth, protocol);
      await exchangeV2.setFeeReceiver(erc20.address, protocol);

      await bulkExchange.setWyvern(openSea.address)

      let feesUPFirst = await wrapperHelper.encodeOriginFeeIntoUint(feeRecipienterUP, 1500); //15%
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
        erc1155.address,
        ZERO_ADDRESS,
        8,
        feeMethodsSidesKindsHowToCallsMask
      ))

      const buySellOrders1 = OpenSeaOrdersInput(...matchData);
      let dataForWyvernCall1 = await wrapperHelper.getDataWyvernAtomicMatch(buySellOrders1);
      const tradeData1 = PurchaseData(1, 100, dataForWyvernCall1);

      //enough ETH for purchase
      await verifyBalanceChange(buyer, 115, async () =>
      	verifyBalanceChange(seller1, -90, async () =>
      		verifyBalanceChange(feeRecipienter, -10, () =>
      		  verifyBalanceChange(feeRecipienterUP, -15, () =>
      		    bulkExchange.singlePurchase(tradeData1, feesUP, { from: buyer, value: 400, gasPrice: 0 })
      		  )
      		)
      	)
      );

      assert.equal(await erc1155.balanceOf(seller1, erc1155TokenIdLocal1), 2);
      assert.equal(await erc1155.balanceOf(buyer, erc1155TokenIdLocal1), 8);

    })
  });
  
  describe ("x2y2", () => {
    it("x2y2 single", async () => {
      const seller = accounts[1];
      const buyer = accounts[2];
      const weth = await WETH9.new()

      const x2y2 = await X2Y2_r1.new()
      await x2y2.initialize(120000, weth.address)

      const erc721delegate = await ERC721Delegate.new();
      await erc721delegate.grantRole("0x7630198b183b603be5df16e380207195f2a065102b113930ccb600feaf615331", x2y2.address);
      await x2y2.updateDelegates([erc721delegate.address], [])

      await bulkExchange.setX2Y2(x2y2.address)

      await erc721.mint(seller, tokenId)
      await erc721.setApprovalForAll(erc721delegate.address, true, {from: seller})

      const tokenDataToEncode = [
        {
          token: erc721.address,
          tokenId: tokenId
        }
      ]

      const data = await wrapperHelper.encodeData(tokenDataToEncode)
      const orderItem = {
        price: 1000,
        data: data
      }

      const order = {
        "salt": "216015207580153061888244896739707431392",
        "user": seller,
        "network": "1337",
        "intent": "1",
        "delegateType": "1",
        "deadline": "1758351144",
        "currency": "0x0000000000000000000000000000000000000000",
        "dataMask": "0x",
        "items": [
          orderItem
        ],
        "r": "0x280849c314a4d9b00804aba77c3434754166aea1a4973f4ec1e89d22f4bd335c",
        "s": "0x0b9902ec5b79551d583e82b732cff01ec28fb8831587f8fe4f2e8249f7f4f49e",
        "v": 27,
        "signVersion": 1
      }
  
      const itemHash = await wrapperHelper.hashItem(order, orderItem)
      
      const input = 
      {
        "orders": [
          order
        ],
        "details": [
          {
            "op": 1,
            "orderIdx": "0",
            "itemIdx": "0",
            "price": "1000",
            "itemHash": itemHash,
            "executionDelegate": erc721delegate.address,
            "dataReplacement": "0x",
            "bidIncentivePct": "0",
            "aucMinIncrementPct": "0",
            "aucIncDurationSecs": "0",
            "fees": [
              {
                "percentage": "5000",
                "to": "0xd823c605807cc5e6bd6fc0d7e4eea50d3e2d66cd"
              }
            ]
          }
        ],
        "shared": {
          "salt": "427525989460197",
          "deadline": "1758363251",
          "amountToEth": "0",
          "amountToWeth": "0",
          "user": bulkExchange.address,
          "canFail": false
        },
        "r": "0xc0f030ffba87896654c2981bda9c5ef0849c33a2b637fea7a777c8019ca13427",
        "s": "0x26b893c0b10eb13815aae1e899ecb02dd1b2ed1995c21e4f1eb745e14f49f51f",
        "v": 28
      }

      const tradeData = PurchaseData(4, 1000, await wrapperHelper.encodeX2Y2Call(input))

      const tx = await bulkExchange.singlePurchase(tradeData, [], {from: buyer, value: 1000})

      console.log(tx.receipt.gasUsed)
      assert.equal(await erc721.ownerOf(tokenId), buyer, "buyer has tokenId");
    })
  })

	function encDataV2(tuple) {
    return helper.encodeV2(tuple);
  }

  function encDataV1(tuple) {
  	return helper.encode(tuple)
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
    let calldataBuy = await wrapperHelper.getDataERC721UsingCriteria(ZERO_ADDRESS, buyer, token, tokenId);
    calldataBuy += merklePart;

    let calldataSell = await wrapperHelper.getDataERC721UsingCriteria(seller, ZERO_ADDRESS, token, tokenId);
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

    let calldataBuy = await wrapperHelper.getDataERC1155UsingCriteria(ZERO_ADDRESS, buyer, token, tokenId, amount);
    calldataBuy += merklePart;
    let calldataSell = await wrapperHelper.getDataERC1155UsingCriteria(seller, ZERO_ADDRESS, token, tokenId, amount);
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

  function OpenSeaOrdersInput(
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
    rssMetadata) {
    return {
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
      rssMetadata };
  }
  
  function PurchaseData(marketId, amount, data) {return {marketId, amount, data};};
	async function getSignature(order, signer, exchangeContract) {
		return sign(order, signer, exchangeContract);
	}

});
