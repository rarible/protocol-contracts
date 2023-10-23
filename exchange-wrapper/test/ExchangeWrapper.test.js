const { expectThrow } = require("@daonomic/tests-common");
const truffleAssert = require('truffle-assertions');

const ExchangeBulkV2 = artifacts.require("RaribleExchangeWrapper.sol");
const WrapperHelper = artifacts.require("WrapperHelper.sol");

//rarible
const ExchangeV2 = artifacts.require("ExchangeV2.sol");
const TransferProxy = artifacts.require("TransferProxy.sol");
const ERC20TransferProxy = artifacts.require("ERC20TransferProxy.sol");
const RoyaltiesRegistry = artifacts.require("RoyaltiesRegistry.sol");
const RaribleTestHelper = artifacts.require("RaribleTestHelper.sol");

//tokens
const TestERC721 = artifacts.require("TestERC721.sol");
const TestERC1155 = artifacts.require("TestERC1155.sol");
const WETH9 = artifacts.require('WETH9');

//Wyvern
const WyvernExchangeWithBulkCancellations = artifacts.require("WyvernExchangeWithBulkCancellations");
const WyvernTokenTransferProxy = artifacts.require("WyvernTokenTransferProxy");
const MerkleValidator = artifacts.require("MerkleValidator");
const WyvernProxyRegistry = artifacts.require("WyvernProxyRegistry");

//LOOKS RARE
const LooksRareTestHelper = artifacts.require("LooksRareTestHelper.sol");
const LooksRareExchange = artifacts.require("LooksRareExchange.sol");
const LR_currencyManager = artifacts.require("CurrencyManager.sol");
const LR_executionManager = artifacts.require("ExecutionManager.sol")
const LR_royaltyFeeManager =  artifacts.require("RoyaltyFeeManager.sol");
const WETH = artifacts.require("WETH9.sol");
const RoyaltyFeeRegistry = artifacts.require("RoyaltyFeeRegistry.sol");
const TransferSelectorNFT = artifacts.require("TransferSelectorNFT.sol");
const TransferManagerERC721 = artifacts.require("TransferManagerERC721.sol");
const TransferManagerERC1155 = artifacts.require("TransferManagerERC1155.sol");

//SEA PORT
const ConduitController = artifacts.require("ConduitController.sol");
const Seaport = artifacts.require("Seaport.sol");

//X2Y2
const ERC721Delegate = artifacts.require("ERC721Delegate.sol");
const X2Y2_r1 = artifacts.require("X2Y2_r1.sol");
const ERC1155Delegate = artifacts.require("ERC1155Delegate.sol");

//SUDOSWAP
const LSSVMPairEnumerableERC20 = artifacts.require("LSSVMPairEnumerableERC20.sol");
const LSSVMPairEnumerableETH = artifacts.require("LSSVMPairEnumerableETH.sol");
const LSSVMPairMissingEnumerableERC20 = artifacts.require("LSSVMPairMissingEnumerableERC20.sol");
const LSSVMPairMissingEnumerableETH = artifacts.require("LSSVMPairMissingEnumerableETH.sol");
const LSSVMPairFactory = artifacts.require("LSSVMPairFactory.sol");
const LSSVMRouter = artifacts.require("LSSVMRouter.sol");
const LinearCurve = artifacts.require("LinearCurve.sol");
const ExponentialCurve = artifacts.require("ExponentialCurve.sol");

//LOOKSRARE-V2
const LooksRareProtocol = artifacts.require("LooksRareProtocol");
const TransferManager = artifacts.require("TransferManager");
const StrategyCollectionOffer = artifacts.require("StrategyCollectionOffer");

//BLUR
const ExecutionDelegate = artifacts.require("ExecutionDelegate");
const PolicyManager = artifacts.require("PolicyManager");
const StandardPolicyERC721 = artifacts.require("StandardPolicyERC721");
const BlurExchange = artifacts.require("BlurExchange");

const { Order, Asset, sign } = require("../../scripts/order.js");

const { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, ORDER_DATA_V2, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, CRYPTO_PUNKS, COLLECTION, enc, id, ORDER_DATA_V3_SELL } = require("../../scripts/assets");
const { verifyBalanceChangeReturnTx } = require("../../scripts/balance")

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const MARKET_MARKER_SELL = "0x68619b8adb206de04f676007b2437f99ff6129b672495a6951499c6c56bc2f10";

contract("RaribleExchangeWrapper signle purchase cases", accounts => {
  let bulkExchange;
  let exchangeV2;
  let wrapperHelper;
  let transferProxy;
  let royaltiesRegistry;
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

  const feeRecipienterUP = accounts[6];
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

    transferProxy = await TransferProxy.new()
    await transferProxy.__OperatorRole_init();

    erc20TransferProxy = await ERC20TransferProxy.new()
    await erc20TransferProxy.__OperatorRole_init();

    royaltiesRegistry = await RoyaltiesRegistry.new()
    await royaltiesRegistry.__RoyaltiesRegistry_init()
    
  })

  beforeEach(async () => {    
    /*ERC721 */
    erc721 = await TestERC721.new("Rarible", "RARI");
    /*ERC1155*/
    erc1155 = await TestERC1155.new();
  });

  describe ("libraries", () => {
    it("pausable", async () => {
      const conduitController = await ConduitController.new();
      const seaport = await Seaport.new(conduitController.address)

      bulkExchange = await ExchangeBulkV2.new([ZERO_ADDRESS, ZERO_ADDRESS, seaport.address, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, seaport.address, ZERO_ADDRESS, ZERO_ADDRESS, seaport.address], ZERO_ADDRESS, []);

      // creating seaport order
      const buyerLocal1 = accounts[2];
      await erc721.mint(seller, tokenId)
      await erc721.setApprovalForAll(seaport.address, true, {from: seller})
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
        token: erc721.address,
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
      const tradeDataSeaPort = PurchaseData(2, 100, 0, dataForSeaportWithSelector);

      //error when called not from owner
      await expectThrow(
        bulkExchange.pause(true, { from: accounts[5]})
      );

      const txPaused = await bulkExchange.pause(true)
      truffleAssert.eventEmitted(txPaused, 'Paused', (ev) => {
        assert.equal(ev.paused, true, "was paused")
        return true;
      });

      assert.equal(await bulkExchange.paused(), true, "is paused")

      //contract is paused
      await expectThrow(
        bulkExchange.singlePurchase(tradeDataSeaPort, ZERO_ADDRESS, ZERO_ADDRESS, {from: buyerLocal1, value: 100})
      );

      const txUnPause = await bulkExchange.pause(false);
      truffleAssert.eventEmitted(txUnPause, 'Paused', (ev) => {
        assert.equal(ev.paused, false, "was paused")
        return true;
      });

      assert.equal(await bulkExchange.paused(), false, "is not paused")

      await bulkExchange.singlePurchase(tradeDataSeaPort, ZERO_ADDRESS, ZERO_ADDRESS, {from: buyerLocal1, value: 100})
      assert.equal(await erc721.balanceOf(seller), 0);
      assert.equal(await erc721.balanceOf(buyerLocal1), 1);
    })
  })


  describe("purcahase Seaport1.1 orders", () => {

    it("wrapper seaport1.1 (fulfillAdvancedOrder through data selector, method fulfillAdvancedOrder) ERC721<->ETH", async () => {
      const conduitController = await ConduitController.new();
      const seaport = await Seaport.new(conduitController.address)

      bulkExchange = await ExchangeBulkV2.new([ZERO_ADDRESS, ZERO_ADDRESS, seaport.address, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, seaport.address, ZERO_ADDRESS, ZERO_ADDRESS, seaport.address], ZERO_ADDRESS, []);

      const buyerLocal1 = accounts[2];
      await erc721.mint(seller, tokenId)
      await erc721.setApprovalForAll(seaport.address, true, {from: seller})
      
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
        token: erc721.address,
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
      const tradeDataSeaPort = PurchaseData(2, 100, 0, dataForSeaportWithSelector);

      const tx = await bulkExchange.singlePurchase(tradeDataSeaPort, ZERO_ADDRESS, ZERO_ADDRESS, {from: buyerLocal1, value: 100})
      console.log("wrapper seaport (fulfillAdvancedOrder() by call : ETH <=> ERC721", tx.receipt.gasUsed)
      assert.equal(await erc721.balanceOf(seller), 0);
      assert.equal(await erc721.balanceOf(buyerLocal1), 1);
    })

    it("wrapper seaport1.1 (fulfillAvalibleAdvancedOrder through data selector, method ) ERC721<->ETH", async () => {
      const conduitController = await ConduitController.new();
      const seaport = await Seaport.new(conduitController.address)

      bulkExchange = await ExchangeBulkV2.new([ZERO_ADDRESS, ZERO_ADDRESS, seaport.address, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, seaport.address, ZERO_ADDRESS, ZERO_ADDRESS, seaport.address], ZERO_ADDRESS, []);

      const buyerLocal1 = accounts[2];
      await erc721.mint(seller, tokenId)
      await erc721.setApprovalForAll(seaport.address, true, {from: seller})

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
        token: erc721.address,
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

      const tradeDataSeaPort = PurchaseData(2, 100, 0, dataForSeaportWithSelector);

      const tx = await bulkExchange.singlePurchase(tradeDataSeaPort, ZERO_ADDRESS, ZERO_ADDRESS, {from: buyerLocal1, value: 100})
      console.log("SEAPORT fulfillAvalibleAdvancedOrder, by wrapper: ETH <=> ERC721", tx.receipt.gasUsed)
      assert.equal(await erc721.balanceOf(seller), 0);
      assert.equal(await erc721.balanceOf(buyerLocal1), 1);
    })
  });

  describe("purcahase Seaport1.4 orders", () => {

    it("wrapper seaport1.4 (fulfillAdvancedOrder through data selector, method fulfillAdvancedOrder) ERC721<->ETH", async () => {
      const conduitController = await ConduitController.new();
      const seaport = await Seaport.new(conduitController.address)

      bulkExchange = await ExchangeBulkV2.new([ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, seaport.address, ZERO_ADDRESS, ZERO_ADDRESS, seaport.address], ZERO_ADDRESS, []);

      const buyerLocal1 = accounts[2];
      await erc721.mint(seller, tokenId)
      await erc721.setApprovalForAll(seaport.address, true, {from: seller})
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
        token: erc721.address,
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
      const tradeDataSeaPort = PurchaseData(6, 100, 0, dataForSeaportWithSelector);

      const tx = await bulkExchange.singlePurchase(tradeDataSeaPort, ZERO_ADDRESS, ZERO_ADDRESS, {from: buyerLocal1, value: 100})
      console.log("wrapper seaport (fulfillAdvancedOrder() by call : ETH <=> ERC721", tx.receipt.gasUsed)
      assert.equal(await erc721.balanceOf(seller), 0);
      assert.equal(await erc721.balanceOf(buyerLocal1), 1);
    })

    it("wrapper seaport1.4 (fulfillAvalibleAdvancedOrder through data selector, method ) ERC721<->ETH", async () => {
      const conduitController = await ConduitController.new();
      const seaport = await Seaport.new(conduitController.address)

      bulkExchange = await ExchangeBulkV2.new([ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, seaport.address, ZERO_ADDRESS, ZERO_ADDRESS, seaport.address], ZERO_ADDRESS, []);

      const buyerLocal1 = accounts[2];
      await erc721.mint(seller, tokenId)
      await erc721.setApprovalForAll(seaport.address, true, {from: seller})

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
        token: erc721.address,
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

      const tradeDataSeaPort = PurchaseData(6, 100, 0, dataForSeaportWithSelector);

      const tx = await bulkExchange.singlePurchase(tradeDataSeaPort, ZERO_ADDRESS, ZERO_ADDRESS, {from: buyerLocal1, value: 100})
      console.log("SEAPORT fulfillAvalibleAdvancedOrder, by wrapper: ETH <=> ERC721", tx.receipt.gasUsed)
      assert.equal(await erc721.balanceOf(seller), 0);
      assert.equal(await erc721.balanceOf(buyerLocal1), 1);
    })
  });

  describe("purcahase Seaport1.5 orders", () => {

    it("wrapper seaport1.5 (fulfillAdvancedOrder through data selector, method fulfillAdvancedOrder) ERC721<->ETH", async () => {
      const conduitController = await ConduitController.new();
      const seaport = await Seaport.new(conduitController.address)

      bulkExchange = await ExchangeBulkV2.new([ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, seaport.address, ZERO_ADDRESS, ZERO_ADDRESS, seaport.address], ZERO_ADDRESS, []);

      const buyerLocal1 = accounts[2];
      await erc721.mint(seller, tokenId)
      await erc721.setApprovalForAll(seaport.address, true, {from: seller})
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
        token: erc721.address,
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
      const tradeDataSeaPort = PurchaseData(9, 100, 0, dataForSeaportWithSelector);

      const tx = await bulkExchange.singlePurchase(tradeDataSeaPort, ZERO_ADDRESS, ZERO_ADDRESS, {from: buyerLocal1, value: 100})
      console.log("wrapper seaport (fulfillAdvancedOrder() by call : ETH <=> ERC721", tx.receipt.gasUsed)
      assert.equal(await erc721.balanceOf(seller), 0);
      assert.equal(await erc721.balanceOf(buyerLocal1), 1);
    })

    it("wrapper seaport1.5 (fulfillAvalibleAdvancedOrder through data selector, method ) ERC721<->ETH", async () => {
      const conduitController = await ConduitController.new();
      const seaport = await Seaport.new(conduitController.address)

      bulkExchange = await ExchangeBulkV2.new([ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, seaport.address, ZERO_ADDRESS, ZERO_ADDRESS, seaport.address], ZERO_ADDRESS, []);

      const buyerLocal1 = accounts[2];
      await erc721.mint(seller, tokenId)
      await erc721.setApprovalForAll(seaport.address, true, {from: seller})

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
        token: erc721.address,
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

      const tradeDataSeaPort = PurchaseData(9, 100, 0, dataForSeaportWithSelector);

      const tx = await bulkExchange.singlePurchase(tradeDataSeaPort, ZERO_ADDRESS, ZERO_ADDRESS, {from: buyerLocal1, value: 100})
      console.log("SEAPORT fulfillAvalibleAdvancedOrder, by wrapper: ETH <=> ERC721", tx.receipt.gasUsed)
      assert.equal(await erc721.balanceOf(seller), 0);
      assert.equal(await erc721.balanceOf(buyerLocal1), 1);
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

      bulkExchange = await ExchangeBulkV2.new([openSea.address, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS], ZERO_ADDRESS, []);

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
      const tradeData1 = PurchaseData(1, 100, await encodeFees(1000,500), dataForWyvernCall1);

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
      const tradeData2 = PurchaseData(1, 100, await encodeFees(1000,500), dataForWyvernCall2); //1 is Wyvern orders, 100 is amount

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
      const tradeData3 = PurchaseData(1, 100, 0, dataForWyvernCall3);

      const feeRecipientSecond = accounts[8]

      await verifyBalanceChangeReturnTx(web3, buyer, 330, async () =>
        verifyBalanceChangeReturnTx(web3, seller1, -90, async () =>
          verifyBalanceChangeReturnTx(web3, seller2, -90, async () =>
            verifyBalanceChangeReturnTx(web3, seller3, -90, async () =>
      	      verifyBalanceChangeReturnTx(web3, feeRecipienter, -30, () =>
      	        verifyBalanceChangeReturnTx(web3, feeRecipienterUP, -20, () =>
                  verifyBalanceChangeReturnTx(web3, feeRecipientSecond, -10, () =>
                    bulkExchange.bulkPurchase([tradeData1, tradeData2, tradeData3], feeRecipienterUP, feeRecipientSecond, false, { from: buyer, value: 400 })
                  )
                )
              )
            )
          )
        )
      );
      assert.equal(await erc721.balanceOf(buyer), 3);
    })

    it("Test bulkPurchase Wyvern (num orders = 3) orders are ready, ERC1155<->ETH", async () => {
      const wyvernProtocolFeeAddress = accounts[9];
      const buyer = accounts[2];
      const seller1 = accounts[1];
      const seller2 = accounts[3];
      const seller3 = accounts[4];
      const feeRecipienter = accounts[5];

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

      bulkExchange = await ExchangeBulkV2.new([openSea.address, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS], ZERO_ADDRESS, []);

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

      const tradeData1 = PurchaseData(1, 100, await encodeFees(500), dataForWyvernCall1);

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
      const tradeData2 = PurchaseData(1, 100, await encodeFees(500), dataForWyvernCall2); //1 is Wyvern orders, 100 is amount for 10

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
      const tradeData3 = PurchaseData(1, 100, await encodeFees(500), dataForWyvernCall3);

      let tx = await bulkExchange.bulkPurchase([tradeData1, tradeData2, tradeData3], feeRecipienterUP, ZERO_ADDRESS, false, { from: buyer, value: 400 });

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

      await deployRarible()

      bulkExchange = await ExchangeBulkV2.new([openSea.address, exchangeV2.address, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS], ZERO_ADDRESS, []);

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
      const tradeData1 = PurchaseData(1, 100, await encodeFees(1500), dataForWyvernCall1);

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[buyer, 10000]], [], false]);

      const left2 = Order(seller2, Asset(ERC1155, enc(erc1155.address, erc1155TokenIdLocal2), 10), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      let signatureLeft2 = await getSignature(left2, seller2, exchangeV2.address);

      const directPurchaseParams = {
        sellOrderMaker: seller2,
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(erc1155.address, erc1155TokenIdLocal2),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO_ADDRESS,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft2,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 5,
        buyOrderData: encDataRight
      };

      let dataForExchCall2 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData2 = PurchaseData(0, 100, await encodeFees(1500), dataForExchCall2); //0 is Exch orders, 100 is amount + 0 protocolFee

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
      const tradeData3 = PurchaseData(1, 100, await encodeFees(1500), dataForWyvernCall3);

      let tx = await bulkExchange.bulkPurchase([tradeData1, tradeData2, tradeData3], feeRecipienterUP, ZERO_ADDRESS, false, { from: buyer, value: 400 });

      console.log("Bulk2 Wyvern and Rarible mixed orders, ERC1155<->ETH (num = 3), by tradeData, Gas consumption :", tx.receipt.gasUsed);
      assert.equal(await erc1155.balanceOf(seller1, erc1155TokenIdLocal1), 2);
      assert.equal(await erc1155.balanceOf(seller2, erc1155TokenIdLocal2), 5);
      assert.equal(await erc1155.balanceOf(seller3, erc1155TokenIdLocal3), 7);
      assert.equal(await erc1155.balanceOf(buyer, erc1155TokenIdLocal1), 8);
      assert.equal(await erc1155.balanceOf(buyer, erc1155TokenIdLocal2), 5);
      assert.equal(await erc1155.balanceOf(buyer, erc1155TokenIdLocal3), 3);
    })
  });

  describe("Rarible orders", () => {

    it("Test V2 order", async () => {
      const buyer = accounts[2];
      const seller1 = accounts[1];

      await erc721.mint(seller1, erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, {from: seller1});

      await deployRarible()
      bulkExchange = await ExchangeBulkV2.new([ZERO_ADDRESS, exchangeV2.address, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS], ZERO_ADDRESS, []);

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[buyer, 10000]], [], false]);

      const left1 = Order(seller1, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V2, encDataLeft);

      let signatureLeft1 = await getSignature(left1, seller1, exchangeV2.address);

      const directPurchaseParams = {
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

      let dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData1 = PurchaseData(0, 100, await encodeFees(0, 1500), dataForExchCall1); //0 is Exch orders, 100 is amount + 0 protocolFee

      const tx = await bulkExchange.singlePurchase(tradeData1, ZERO_ADDRESS, feeRecipienterUP, { from: buyer, value: 400 })
      console.log("rarible V2 721 1 order 1 comission", tx.receipt.gasUsed)
      assert.equal(await erc721.balanceOf(seller1), 0);
      assert.equal(await erc721.balanceOf(buyer), 1);
    })

    it("Test V3 order", async () => {
      const buyer = accounts[2];
      const seller1 = accounts[1];

      await erc721.mint(seller1, erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, {from: seller1});

      await deployRarible()
      bulkExchange = await ExchangeBulkV2.new([ZERO_ADDRESS, exchangeV2.address, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS], ZERO_ADDRESS, []);

      const encDataLeft = await encDataV3_SELL([0, 0, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight = await encDataV3_BUY([await LibPartToUint(buyer, 10000), 0, 0, MARKET_MARKER_SELL]);

      const left1 = Order(seller1, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V3_SELL, encDataLeft);

      let signatureLeft1 = await getSignature(left1, seller1, exchangeV2.address);

      const directPurchaseParams = {
        sellOrderMaker: seller1,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId1),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO_ADDRESS,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V3_SELL,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft1,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight
      };

      let dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData1 = PurchaseData(0, 100, await encodeFees(0, 1500), dataForExchCall1); //0 is Exch orders, 100 is amount + 0 protocolFee

      const tx = await bulkExchange.singlePurchase(tradeData1, ZERO_ADDRESS, feeRecipienterUP, { from: buyer, value: 400 })
      console.log("rarible V3 721 1 order 1 comission", tx.receipt.gasUsed)
      assert.equal(await erc721.balanceOf(seller1), 0);
      assert.equal(await erc721.balanceOf(buyer), 1);
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

      await deployRarible()
      bulkExchange = await ExchangeBulkV2.new([ZERO_ADDRESS, exchangeV2.address, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS], ZERO_ADDRESS, []);

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
        nftData: enc(erc1155.address, erc721TokenId1),
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

    	await verifyBalanceChangeReturnTx(web3, buyer, 276, async () =>
    		verifyBalanceChangeReturnTx(web3, seller1, -60, async () =>
    		  verifyBalanceChangeReturnTx(web3, seller2, -80, async () =>
    		    verifyBalanceChangeReturnTx(web3, seller3, -100, async () =>
    			    verifyBalanceChangeReturnTx(web3, feeRecipienterUP, -36, () =>
    				    bulkExchange.bulkPurchase([tradeData1, tradeData2, tradeData3], feeRecipienterUP, ZERO_ADDRESS, false, { from: buyer, value: 400 })
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

      bulkExchange = await ExchangeBulkV2.new([openSea.address, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS], ZERO_ADDRESS, []);
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
      const tradeData1 = PurchaseData(1, 100, 0, dataForWyvernCall1);

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
      const tradeData2 = PurchaseData(1, 100, await encodeFees(1500), dataForWyvernCall2);

      await verifyBalanceChangeReturnTx(web3, buyer, 115, async () =>
      	verifyBalanceChangeReturnTx(web3, seller2, -90, async () =>
      		verifyBalanceChangeReturnTx(web3, feeRecipienter, -10, () =>
      		  verifyBalanceChangeReturnTx(web3, feeRecipienterUP, -15, () =>
      		    bulkExchange.singlePurchase(tradeData2, feeRecipienterUP, ZERO_ADDRESS, { from: buyer, value: 400 })
      		  )
      		)
      	)
      );
      //exception if wrong method
      await expectThrow(
        bulkExchange.singlePurchase(tradeData1, ZERO_ADDRESS, ZERO_ADDRESS, { from: buyer, value: 400 })
      );
      assert.equal(await erc721.balanceOf(buyer), 1);
    })

		it("Test singlePurchase Wyvern (num orders = 3), ERC1155<->ETH", async () => {
      const wyvernProtocolFeeAddress = accounts[9];
      const buyer = accounts[2];
      const seller1 = accounts[1];
      const feeRecipienter = accounts[5];

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

      bulkExchange = await ExchangeBulkV2.new([openSea.address, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS], ZERO_ADDRESS, []);

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
      const tradeData1 = PurchaseData(1, 100, await encodeFees(1500), dataForWyvernCall1);

      //enough ETH for purchase
      await verifyBalanceChangeReturnTx(web3, buyer, 115, async () =>
      	verifyBalanceChangeReturnTx(web3, seller1, -90, async () =>
      		verifyBalanceChangeReturnTx(web3, feeRecipienter, -10, () =>
      		  verifyBalanceChangeReturnTx(web3, feeRecipienterUP, -15, () =>
      		    bulkExchange.singlePurchase(tradeData1, feeRecipienterUP, ZERO_ADDRESS, { from: buyer, value: 400 })
      		  )
      		)
      	)
      );

      assert.equal(await erc1155.balanceOf(seller1, erc1155TokenIdLocal1), 2);
      assert.equal(await erc1155.balanceOf(buyer, erc1155TokenIdLocal1), 8);

    })
  });

  describe("purcahase LooksRare orders", () => {
    it("wrapper call matchAskWithTakerBidUsingETHAndWETH  ETH<->ERC721, with royalites", async () => {
      const buyerLocal1 = accounts[2];
      const LR_protocolFeeRecipient = accounts[3];
      const lr_currencyManager = await LR_currencyManager.new();
      const lr_executionManager = await LR_executionManager.new();
      const LR_royaltyFeeRegistry = await RoyaltyFeeRegistry.new(9000);
      const lr_royaltyFeeManager = await LR_royaltyFeeManager.new(LR_royaltyFeeRegistry.address);
      const weth = await WETH.new();
      const looksRareExchange = await LooksRareExchange.new(lr_currencyManager.address, lr_executionManager.address, lr_royaltyFeeManager.address, weth.address, LR_protocolFeeRecipient);
      const transferManagerERC721 = await TransferManagerERC721.new(looksRareExchange.address);
      const transferManagerERC1155 = await TransferManagerERC1155.new(looksRareExchange.address);
      const transferSelectorNFT = await TransferSelectorNFT.new(transferManagerERC721.address, transferManagerERC1155.address);// transfer721, transfer1155

      await looksRareExchange.updateTransferSelectorNFT(transferSelectorNFT.address);
      await lr_currencyManager.addCurrency(weth.address);
      const lr_strategy = await LooksRareTestHelper.new(0);
      await lr_executionManager.addStrategy(lr_strategy.address);

      bulkExchange = await ExchangeBulkV2.new([ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, looksRareExchange.address, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS], ZERO_ADDRESS, []);

      await erc721.mint(seller, tokenId)
      await erc721.setApprovalForAll(transferManagerERC721.address, true, {from: seller});
      await transferSelectorNFT.addCollectionTransferManager(erc721.address, transferManagerERC721.address);

      const takerBid = {
        isOrderAsk: false,
        taker: bulkExchange.address,
        price: 10000,
        tokenId: '0x3039',
        minPercentageToAsk: 8000,
        params: '0x'
      }
      const makerAsk = {
        isOrderAsk: true,
        signer: seller,
        collection: erc721.address,
        price: 10000,
        tokenId: '0x3039',
        amount: 1,
        strategy: lr_strategy.address,
        currency: weth.address,
        nonce: 16,
        startTime: 0,
        endTime: '0xff00000000000000000000000000',
        minPercentageToAsk: 8000,
        params: '0x',
        v: 28,
        r: '0x66719130e732d87a2fd63e4b5360f627d013b93a9c6768ab3fa305c178c84388',
        s: '0x6f56a6089adf5af7cc45885d4294ebfd7ea9326a42aa977fc0732677e007cdd3'
      }
      console.log("LooksRare: ETH <=> ERC721")

      assert.equal(await erc721.balanceOf(buyerLocal1), 0);
      let dataForLooksRare = await wrapperHelper.getDataWrapperMatchAskWithTakerBidUsingETHAndWETH(takerBid, makerAsk, ERC721);
      
      //adding royalties 
      const royaltyAccount1 = accounts[4];
      const royaltyAccount2 = accounts[5];
      const additionalRoyalties = [await encodeBpPlusAccountTest(1000, royaltyAccount1), await encodeBpPlusAccountTest(2000, royaltyAccount2)];
      const dataPlusAdditionalRoyaltiesStruct = {
        data: dataForLooksRare,
        additionalRoyalties: additionalRoyalties
      };
      const dataPlusAdditionalRoyalties = await wrapperHelper.encodeDataPlusRoyalties(dataPlusAdditionalRoyaltiesStruct);
      const dataTypePlusFees = await encodeDataTypeAndFees(1);

      const tradeDataSeaPort = PurchaseData(4, 10000, dataTypePlusFees, dataPlusAdditionalRoyalties);

      await verifyBalanceChangeReturnTx(web3, buyerLocal1, 13000, () =>
        verifyBalanceChangeReturnTx(web3, royaltyAccount1, -1000, () =>
          verifyBalanceChangeReturnTx(web3, royaltyAccount2, -2000, () =>
            bulkExchange.singlePurchase(tradeDataSeaPort, ZERO_ADDRESS, ZERO_ADDRESS, {from: buyerLocal1, value: 13000})
          )
        )
      );
      
      assert.equal(await erc721.balanceOf(buyerLocal1), 1);
      assert.equal(await weth.balanceOf(seller), 10000);
    })

    it("wrapper call matchAskWithTakerBidUsingETHAndWETH  ETH<->ERC1155", async () => {
      const buyerLocal1 = accounts[2];
      const LR_protocolFeeRecipient = accounts[3];
      const lr_currencyManager = await LR_currencyManager.new();
      const lr_executionManager = await LR_executionManager.new();
      const LR_royaltyFeeRegistry = await RoyaltyFeeRegistry.new(9000);
      const lr_royaltyFeeManager = await LR_royaltyFeeManager.new(LR_royaltyFeeRegistry.address);
      const weth = await WETH.new();
      const looksRareExchange = await LooksRareExchange.new(lr_currencyManager.address, lr_executionManager.address, lr_royaltyFeeManager.address, weth.address, LR_protocolFeeRecipient);
      const transferManagerERC721 = await TransferManagerERC721.new(looksRareExchange.address);
      const transferManagerERC1155 = await TransferManagerERC1155.new(looksRareExchange.address);
      const transferSelectorNFT = await TransferSelectorNFT.new(transferManagerERC721.address, transferManagerERC1155.address);// transfer721, transfer1155

      await looksRareExchange.updateTransferSelectorNFT(transferSelectorNFT.address);
      await lr_currencyManager.addCurrency(weth.address);
      const lr_strategy = await LooksRareTestHelper.new(0);
      await lr_executionManager.addStrategy(lr_strategy.address);

      bulkExchange = await ExchangeBulkV2.new([ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, looksRareExchange.address, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS], ZERO_ADDRESS, []);

      await erc1155.mint(seller, tokenId, 10)
      await erc1155.setApprovalForAll(transferManagerERC1155.address, true, {from: seller});
      await transferSelectorNFT.addCollectionTransferManager(erc1155.address, transferManagerERC1155.address);

      const takerBid = {
        isOrderAsk: false,
        taker: bulkExchange.address,
        price: 10000,
        tokenId: '0x3039',
        minPercentageToAsk: 8000,
        params: '0x'
      }
      const makerAsk = {
        isOrderAsk: true,
        signer: seller,
        collection: erc1155.address,
        price: 10000,
        tokenId: '0x3039',
        amount: 10,
        strategy: lr_strategy.address,
        currency: weth.address,
        nonce: 16,
        startTime: 0,
        endTime: '0xff00000000000000000000000000',
        minPercentageToAsk: 8000,
        params: '0x',
        v: 28,
        r: '0x66719130e732d87a2fd63e4b5360f627d013b93a9c6768ab3fa305c178c84388',
        s: '0x6f56a6089adf5af7cc45885d4294ebfd7ea9326a42aa977fc0732677e007cdd3'
      }
      console.log("LooksRare: ETH <=> ERC1155")

      assert.equal(await erc1155.balanceOf(buyerLocal1, tokenId), 0);
      let dataForLooksRare = await wrapperHelper.getDataWrapperMatchAskWithTakerBidUsingETHAndWETH(takerBid, makerAsk, ERC1155);
      const tradeDataSeaPort = PurchaseData(4, 10000, 0, dataForLooksRare);

      const tx = await bulkExchange.singlePurchase(tradeDataSeaPort, ZERO_ADDRESS, ZERO_ADDRESS, {from: buyerLocal1, value: 10000})
      console.log("wrapper call LooksRare: ETH <=> ERC1155 = ", tx.receipt.gasUsed)
      assert.equal(await erc1155.balanceOf(buyerLocal1, tokenId), 10);
      assert.equal(await weth.balanceOf(seller), 10000);
    })
  });

  describe ("x2y2", () => {
    it("x2y2 721 single", async () => {
      const seller = accounts[1];
      const buyer = accounts[2];
      const weth = await WETH9.new()

      const x2y2 = await X2Y2_r1.new()
      await x2y2.initialize(120000, weth.address)

      const erc721delegate = await ERC721Delegate.new();
      await erc721delegate.grantRole("0x7630198b183b603be5df16e380207195f2a065102b113930ccb600feaf615331", x2y2.address);
      await x2y2.updateDelegates([erc721delegate.address], [])

      bulkExchange = await ExchangeBulkV2.new([ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, x2y2.address, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS], ZERO_ADDRESS, []);

      await erc721.mint(seller, tokenId)
      await erc721.setApprovalForAll(erc721delegate.address, true, {from: seller})

      const orderItem = await generateItemX2Y2(tokenId, 1000);

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

      const tradeData = PurchaseData(3, 1000, 0, await wrapperHelper.encodeX2Y2Call(input))

      const tx = await bulkExchange.singlePurchase(tradeData, ZERO_ADDRESS, ZERO_ADDRESS, {from: buyer, value: 1000})

      console.log(tx.receipt.gasUsed)
      assert.equal(await erc721.ownerOf(tokenId), buyer, "buyer has tokenId");
    })

    it("x2y2 1155", async () => {
      const seller = accounts[1];
      const buyer = accounts[2];
      const weth = await WETH9.new()

      const x2y2 = await X2Y2_r1.new()
      await x2y2.initialize(120000, weth.address)

      const erc1155delegate = await ERC1155Delegate.new();
      await erc1155delegate.grantRole("0x7630198b183b603be5df16e380207195f2a065102b113930ccb600feaf615331", x2y2.address);
      await x2y2.updateDelegates([erc1155delegate.address], [])

      bulkExchange = await ExchangeBulkV2.new([ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, x2y2.address, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS], ZERO_ADDRESS, []);

      const amount = 5;
      await erc1155.mint(seller, tokenId, amount)
      await erc1155.setApprovalForAll(erc1155delegate.address, true, {from: seller})

      const tokenDataToEncode = [
        {
          token: erc1155.address,
          tokenId: tokenId,
          amount: amount
        }
      ]
  
      const data = await wrapperHelper.encodeData1155(tokenDataToEncode)
      const orderItem = {
        price: 1000,
        data: data
      }
  

      const order = {
        "salt": "216015207580153061888244896739707431392",
        "user": seller,
        "network": "1337",
        "intent": "1",
        "delegateType": "2",
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
            "executionDelegate": erc1155delegate.address,
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

      const tradeData = PurchaseData(3, 1000, 0, await wrapperHelper.encodeX2Y2Call(input))

      const tx = await bulkExchange.singlePurchase(tradeData, ZERO_ADDRESS, ZERO_ADDRESS, {from: buyer, value: 1000})

      console.log(tx.receipt.gasUsed)
      assert.equal(await erc1155.balanceOf(buyer, tokenId), amount, "buyer has tokenId");
    })

    it("x2y2 721 single advanced order", async () => {
      const seller = accounts[1];
      const buyer = accounts[2];
      const weth = await WETH9.new()

      const x2y2 = await X2Y2_r1.new()
      await x2y2.initialize(120000, weth.address)

      const erc721delegate = await ERC721Delegate.new();
      await erc721delegate.grantRole("0x7630198b183b603be5df16e380207195f2a065102b113930ccb600feaf615331", x2y2.address);
      await x2y2.updateDelegates([erc721delegate.address], [])

      bulkExchange = await ExchangeBulkV2.new([ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, x2y2.address, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS], ZERO_ADDRESS, []);

      await erc721.mint(seller, tokenId)
      await erc721.setApprovalForAll(erc721delegate.address, true, {from: seller})

      const orderItem = await generateItemX2Y2(tokenId, 1000);

      const notRealItem0 = await generateItemX2Y2(1234560, 100000);
      const notRealItem2 = await generateItemX2Y2(1234562, 100000);
      const notRealItem3 = await generateItemX2Y2(1234563, 100000);

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
          notRealItem0,
          orderItem,
          notRealItem2,
          notRealItem3
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
            "itemIdx": "1",
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

      const tradeData = PurchaseData(3, 1000, 0, await wrapperHelper.encodeX2Y2Call(input))

      const tx = await bulkExchange.singlePurchase(tradeData, ZERO_ADDRESS, ZERO_ADDRESS, {from: buyer, value: 1000})

      console.log(tx.receipt.gasUsed)
      assert.equal(await erc721.ownerOf(tokenId), buyer, "buyer has tokenId");
    })
  })

  describe ("sudoswap", () => {
    it("sudoswap single", async () => {
      const seller = accounts[1];
      const buyer = accounts[2];

      //Deploy factory
      const factory = await LSSVMPairFactory.deployed()

      //Deploy router
      const router = await LSSVMRouter.deployed()

      //Deploy bonding curves
      const lin = await LinearCurve.deployed();

      await erc721.mint(seller, tokenId)
      await erc721.setApprovalForAll(factory.address, true, {from: seller})

      const inpput = [
        erc721.address,
        lin.address,
        seller,
        1,
        "100",
        0,
        "1000",
        [
          tokenId
        ]
      ]

      const txCreate = await factory.createPairETH(...inpput, {from: seller})

      let pair;
      truffleAssert.eventEmitted(txCreate, 'NewPair', (ev) => {
        pair = ev.poolAddress;
        return true;
      });

      assert.equal(await erc721.ownerOf(tokenId), pair, "pair has token")

      const input = [
        [ {pair: pair, nftIds: [ tokenId ] } ],
        buyer,
        buyer,
        "99999999999999"
      ]
      const tradeData = PurchaseData(5, 1105, 0, await wrapperHelper.encodeSudoSwapCall(...input))

      bulkExchange = await ExchangeBulkV2.new([ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, router.address, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS], ZERO_ADDRESS, []);

      const tx = await bulkExchange.singlePurchase(tradeData, ZERO_ADDRESS, ZERO_ADDRESS, {from: buyer, value: 1105})

      console.log(tx.receipt.gasUsed)
      assert.equal(await erc721.ownerOf(tokenId), buyer, "buyer has tokenId");

    })

    it("sudoswap single plus send royalties", async () => {
      const seller = accounts[1];
      const buyer = accounts[2];
      const royaltyAccount1 = accounts[4];
      const royaltyAccount2 = accounts[5];

      //deploying templates
      const _enumerableETHTemplate = (await LSSVMPairEnumerableETH.new()).address;
      const _missingEnumerableETHTemplate = (await LSSVMPairMissingEnumerableETH.new()).address;
      const _enumerableERC20Template = (await LSSVMPairEnumerableERC20.new()).address
      const _missingEnumerableERC20Template = (await LSSVMPairMissingEnumerableERC20.new()).address;

      const _protocolFeeMultiplier = "5000000000000000";

      //Deploy factory
      const factory = await LSSVMPairFactory.new(_enumerableETHTemplate, _missingEnumerableETHTemplate, _enumerableERC20Template, _missingEnumerableERC20Template, protocol, _protocolFeeMultiplier)

      //Deploy router
      const router = await LSSVMRouter.new(factory.address)

      //Whitelist router in factory
      await factory.setRouterAllowed(router.address, true)

      //Deploy bonding curves
      const exp = await ExponentialCurve.new()
      const lin = await LinearCurve.new();

      // Whitelist bonding curves in factory
      await factory.setBondingCurveAllowed(exp.address, true)
      await factory.setBondingCurveAllowed(lin.address, true)

      await erc721.mint(seller, tokenId)
      await erc721.setApprovalForAll(factory.address, true, {from: seller})

      const inpput = [
        erc721.address,
        lin.address,
        seller,
        1,
        "100",
        0,
        "1000",
        [
          tokenId
        ]
      ]

      const txCreate = await factory.createPairETH(...inpput, {from: seller})

      let pair;
      truffleAssert.eventEmitted(txCreate, 'NewPair', (ev) => {
        pair = ev.poolAddress;
        return true;
      });

      assert.equal(await erc721.ownerOf(tokenId), pair, "pair has token")

      const input = [
        [ {pair: pair, nftIds: [ tokenId ] } ],
        buyer,
        buyer,
        "99999999999999"
      ]
      const dataSudoSwap = await wrapperHelper.encodeSudoSwapCall(...input);
      //2 different royalties recipients
      const additionalRoyalties = [await encodeBpPlusAccountTest(1000, royaltyAccount1), await encodeBpPlusAccountTest(2000, royaltyAccount2)];
      //single royalty recipient
      const dataPlusAdditionalRoyaltiesStruct = {
        data: dataSudoSwap,
        additionalRoyalties: additionalRoyalties
      };
      const dataPlusAdditionalRoyalties = await wrapperHelper.encodeDataPlusRoyalties(dataPlusAdditionalRoyaltiesStruct);

      const tradeData = PurchaseData(5, 1105, await encodeDataTypeAndFees(1, 1000, 0), dataPlusAdditionalRoyalties)

      bulkExchange = await ExchangeBulkV2.new([ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, router.address, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS], ZERO_ADDRESS, []);

      //2 different royalties recipients + return change Back, gas == 160307
      //1 royalties recipients, gas == 144025
      await verifyBalanceChangeReturnTx(web3, buyer, 1546, async () =>
      	verifyBalanceChangeReturnTx(web3, seller, -1100, async () =>
      		verifyBalanceChangeReturnTx(web3, royaltyAccount1, -110, () =>
      		  verifyBalanceChangeReturnTx(web3, royaltyAccount2, -221, () =>
              verifyBalanceChangeReturnTx(web3, feeRecipienterUP, -110, () =>
                verifyBalanceChangeReturnTx(web3, factory.address, -5, () =>
                  verifyBalanceChangeReturnTx(web3, bulkExchange.address, 0, () =>
                    bulkExchange.singlePurchase(tradeData, feeRecipienterUP, ZERO_ADDRESS, {from: buyer, value: 1546})
                  )
                )
              )
      		  )
      		)
      	)
      );
      assert.equal(await erc721.ownerOf(tokenId), buyer, "buyer has tokenId");

    })
  })

  describe ("looksrareV2", () => {
    it("looksrareV2 single", async () => {
      const owner = accounts[0]

      const feeFirst = accounts[6]
      const feeSecond = accounts[7]

      const seller = accounts[1];
      const buyer = accounts[2];
      const protocolFeeRecipient = accounts[8]

      //deploy contracts
      const transferManager = await TransferManager.new(owner);

      const strategyCollectionOffer = await StrategyCollectionOffer.new()

      const weth = await WETH9.new()

      const looksRareProtocol = await LooksRareProtocol.new(owner, protocolFeeRecipient, transferManager.address, weth.address)

      //setup contracts
      await transferManager.allowOperator(looksRareProtocol.address);
      
      await looksRareProtocol.updateCurrencyStatus(ZERO_ADDRESS, true)
      await looksRareProtocol.updateCurrencyStatus(weth.address, true)

      await looksRareProtocol.addStrategy(50, 50, 200, "0x84ad8c47", true, strategyCollectionOffer.address)
      await looksRareProtocol.addStrategy(50, 50, 200, "0x7e897147", true, strategyCollectionOffer.address)
      
      await erc721.mint(seller, tokenId)
      await erc721.setApprovalForAll(transferManager.address, true, {from: seller})
      await transferManager.grantApprovals([looksRareProtocol.address], {from: seller})

      const input = {
        "takerBid": {
          "recipient": buyer,
          "additionalParameters": "0x"
        },
        "makerAsk": {
          "quoteType": "1",
          "globalNonce": "0",
          "subsetNonce": "0",
          "orderNonce": "0",
          "strategyId": "0",
          "collectionType": "0",
          "collection": erc721.address,
          "currency": ZERO_ADDRESS,
          "signer":seller,
          "startTime": "168076455",
          "endTime": "16808792846",
          "price": "1000",
          "itemIds": [
            tokenId
          ],
          "amounts": [
            "1"
          ],
          "additionalParameters": "0x"
        },
        "makerSignature": "0x50d88229949c5884c15f3a71d9127aeb7c9ef9f9b301ce72c6b87076d0a38447335d8f19355f5ec1e9a6063c10ed019234cd8d522839e808d041082dd75c3ee01c",
        "merkleTree": {
          "root": "0x0000000000000000000000000000000000000000000000000000000000000000",
          "proof": []
        },
        "affiliate": ZERO_ADDRESS
      }

      const data = await wrapperHelper.encodeLooksRareV2Call(input.takerBid, input.makerAsk, input.makerSignature, input.merkleTree, input.affiliate)

      const tradeData = PurchaseData(7, 1000, await encodeCurrencyAndDataTypeAndFees(0, 0, 1500, 500), data)
      bulkExchange = await ExchangeBulkV2.new([ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, looksRareProtocol.address, ZERO_ADDRESS, ZERO_ADDRESS], ZERO_ADDRESS, []);

      await verifyBalanceChangeReturnTx(web3, buyer, 1200, async () =>
        verifyBalanceChangeReturnTx(web3, seller, -995, async () =>
          verifyBalanceChangeReturnTx(web3, protocolFeeRecipient, -5, async () =>
            verifyBalanceChangeReturnTx(web3, feeFirst, -150, async () =>
              verifyBalanceChangeReturnTx(web3, feeSecond, -50, async () =>
                bulkExchange.singlePurchase(tradeData, feeFirst, feeSecond, {from: buyer, value: 2000 })
              )
            )
          )
        )
      );

      assert.equal(await erc721.ownerOf(tokenId), buyer, "buyer has tokenId");
      
    })
  })

  describe ("blur", () => {
    it("blur single", async () => {

      const seller = accounts[1];
      const buyer = accounts[2];
      const feeFromSeller = accounts[8]
      const feeFromBuyer = accounts[9]

      const feeFirst = accounts[6]
      const feeSecond = accounts[7]

      //deploy and setup contracts 
      const executionDelegate = await ExecutionDelegate.new()
      const policyManager = await PolicyManager.new()
      const standardPolicyERC721 = await StandardPolicyERC721.new()

      await policyManager.addPolicy(standardPolicyERC721.address)

      const blurExchange = await BlurExchange.new()
      await blurExchange.initialize(executionDelegate.address, policyManager.address, ZERO_ADDRESS, 50)

      await executionDelegate.approveContract(blurExchange.address)
      
      //deploy wrapper
      bulkExchange = await ExchangeBulkV2.new([ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, blurExchange.address, ZERO_ADDRESS], ZERO_ADDRESS, []);

      //mint NFT
      await erc721.mint(seller, tokenId)
      await erc721.setApprovalForAll(executionDelegate.address, true, {from: seller})
      
      const input = {
        "sell": {
          "order": {
            "trader": seller,
            "side": 1,
            "matchingPolicy": standardPolicyERC721.address,
            "collection": erc721.address,
            "tokenId": tokenId,
            "amount": "1",
            "paymentToken": "0x0000000000000000000000000000000000000000",
            "price": 1000,
            "listingTime": "168381879",
            "expirationTime": "16814068278",
            "fees": [
              {
                "rate": 2000,
                "recipient": feeFromSeller
              }
            ],
            "salt": "65994309200663161530037748276946816666",
            "extraParams": "0x01"
          },
          "v": 27,
          "r": "0x5b93882de02b8f11485053f2487586e2dcef8843d1cdf4077caa6da821c2596b",
          "s": "0x0b0460243d87d8e53d85ea1615b200c85bb9a50ad7387e1a8915e5a3c7d631bb",
          "extraSignature": "0x000000000000000000000000000000000000000000000000000000000000001b7fd6e717aed61bfb988ac35b0b07a3c81b2a7834f9314ccd8c9bcf4201d714c35657cd9099297524e93874b62fee5671aaed42d3795a86d6ebe93daf0e7dae9d",
          "signatureVersion": 0,
          "blockNumber": "17038489"
        },
        "buy": {
          "order": {
            "trader": bulkExchange.address,
            "side": 0,
            "matchingPolicy": standardPolicyERC721.address,
            "collection": erc721.address,
            "tokenId": tokenId,
            "amount": "1",
            "paymentToken": "0x0000000000000000000000000000000000000000",
            "price": 1000,
            "listingTime": "168181880",
            "expirationTime": "16813091771",
            "fees": [
            ],
            "salt": "261913853562470622716597177488189472368",
            "extraParams": "0x01"
          },
          "v": 0,
          "r": "0x0000000000000000000000000000000000000000000000000000000000000000",
          "s": "0x0000000000000000000000000000000000000000000000000000000000000000",
          "extraSignature": "0x000000000000000000000000000000000000000000000000000000000000001cd474b10997153521d1b3571c148d6b7d813da537f8b8f9cc0f0959677fca93a30b1ebf4a15c0ed01d692b9dcfef6d251b147b259b20f14d8f383324d35414994",
          "signatureVersion": 0,
          "blockNumber": "17038489"
        }
      }

      const data = await wrapperHelper.encodeBlurData(input.sell, input.buy, ERC721)

      const tradeData = PurchaseData(8, 1000, await encodeCurrencyAndDataTypeAndFees(0, 0, 1500, 500), data)
      
      await verifyBalanceChangeReturnTx(web3, seller, -800, async () =>
        verifyBalanceChangeReturnTx(web3, buyer, 1200, async () =>
          verifyBalanceChangeReturnTx(web3, feeFromBuyer, 0, async () =>
            verifyBalanceChangeReturnTx(web3, feeFromSeller, -200, async () =>
              verifyBalanceChangeReturnTx(web3, feeFirst, -150, async () =>
                verifyBalanceChangeReturnTx(web3, feeSecond, -50, async () =>
                  bulkExchange.singlePurchase(tradeData, feeFirst, feeSecond, {from: buyer, value: 2000 })
                )
              )
            )
          )
        )
      )

      assert.equal(await erc721.ownerOf(tokenId), buyer, "buyer has tokenId");
      
    })
  })

	function encDataV2(tuple) {
    return helper.encodeV2(tuple);
  }

  function encDataV1(tuple) {
  	return helper.encode(tuple)
  }

  function encDataV3_SELL(tuple) {
    return helper.encodeV3_SELL(tuple);
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
  
  function PurchaseData(marketId, amount, fees, data) {
    return {marketId, amount, fees, data};
  };

	async function getSignature(order, signer, exchangeContract) {
		return sign(order, signer, exchangeContract);
	}

  function encDataV3_BUY(tuple) {
    return helper.encodeV3_BUY(tuple);
  }

  async function LibPartToUint(account = ZERO_ADDRESS, value = 0) {
    return await helper.encodeOriginFeeIntoUint(account, value);
  }

  async function encodeFees(first = 0, second = 0) {
    const result = await wrapperHelper.encodeFees(first, second);
    return result.toString()
  }

  async function encodeDataTypeAndFees(dataType = 0, first = 0, second = 0) {
    const result = await wrapperHelper.encodeFeesPlusDataType(dataType, first, second);
    return result.toString()
  }

  async function encodeBpPlusAccountTest(bp = 0, account = ZERO_ADDRESS) {
    const result = await wrapperHelper.encodeBpPlusAccount(bp, account);
    return result.toString()
  }

  async function deployRarible() {
    //deploy exchange

    exchangeV2 = await ExchangeV2.new()
    await exchangeV2.__ExchangeV2_init(
      transferProxy.address,
      erc20TransferProxy.address,
      0,
      protocol,
      royaltiesRegistry.address 
    )

    await transferProxy.addOperator(exchangeV2.address)
    await erc20TransferProxy.addOperator(exchangeV2.address)

  }

  async function generateItemX2Y2(tokenid, price) {
    const tokenDataToEncode = [
      {
        token: erc721.address,
        tokenId: tokenid
      }
    ]

    const data = await wrapperHelper.encodeData(tokenDataToEncode)
    const orderItem = {
      price: price,
      data: data
    }

    return orderItem;
  }

  async function encodeCurrencyAndDataTypeAndFees(currency = 0, dataType = 0, first = 0, second = 0) {
    const result = await wrapperHelper.encodeCurrencyAndDataTypeAndFees(currency, dataType, first, second);
    return result.toString()
  }

});
