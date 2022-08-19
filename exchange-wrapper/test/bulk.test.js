const ExchangeBulkV2 = artifacts.require("ExchangeWrapper.sol");
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

const { Order, Asset, sign } = require("../../scripts/order.js");
const { expectThrow, verifyBalanceChange } = require("@daonomic/tests-common");
const BN = web3.utils.BN;

const { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, ORDER_DATA_V2, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, CRYPTO_PUNKS, COLLECTION, enc, id, ORDER_DATA_V3_SELL } = require("../../scripts/assets");
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const MARKET_MARKER_SELL = "0x68619b8adb206de04f676007b2437f99ff6129b672495a6951499c6c56bc2f10";

contract("ExchangeBulkV2, sellerFee + buyerFee =  6%,", accounts => {
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
  const zoneAddr = accounts[2];
  const tokenId = 12345;
  /*OpenSeaOrders*/

  const feeRecipienterUP = accounts[6];


  before(async () => {
    helper = await RaribleTestHelper.new();
    wrapperHelper = await WrapperHelper.new();

    transferProxy = await TransferProxy.new()
    await transferProxy.__OperatorRole_init();

    erc20TransferProxy = await ERC20TransferProxy.new()
    await erc20TransferProxy.__OperatorRole_init();

    royaltiesRegistry = await RoyaltiesRegistry.new()
    await royaltiesRegistry.__RoyaltiesRegistry_init()
    
    bulkExchange = await ExchangeBulkV2.deployed();
  })

  beforeEach(async () => {    
    /*ERC721 */
    erc721 = await TestERC721.new("Rarible", "RARI", "https://ipfs.rarible.com");
    /*ERC1155*/
    erc1155 = await TestERC1155.new("https://ipfs.rarible.com");
  });
  
  describe ("batch orders", () => {
    it("batch all cases 5%+10% fees for all (raribleV2, RaribleV3, seaPort, x2y2, looksRare)", async () => {
      const seller = accounts[1];
      const buyer = accounts[2];

      const feeRecipientSecond = accounts[7];

      //making rarible orders
      await deployRarible();
      
      //Rarible V2 order
      await erc721.mint(seller, erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, {from: seller});
      
      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[buyer, 10000]], [], false]);

      const left = Order(seller, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V2, encDataLeft);

      const directPurchaseParams = {
        sellOrderMaker: seller,
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
        sellOrderSignature: await getSignature(left, seller, exchangeV2.address),
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight
      };

      const data = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData = PurchaseData(0, 100, await encodeFees(500, 1000), data);

      //rarible V3 order
      await erc721.mint(seller, erc721TokenId2);
      await erc721.setApprovalForAll(transferProxy.address, true, {from: seller});

      const encDataLeft1 = await encDataV3_SELL([0, 0, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight1 = await encDataV3_BUY([await LibPartToUint(buyer, 10000), 0, 0, MARKET_MARKER_SELL]);

      const left1 = Order(seller, Asset(ERC721, enc(erc721.address, erc721TokenId2), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 2, 0, 0, ORDER_DATA_V3_SELL, encDataLeft1);

      const directPurchaseParams1 = {
        sellOrderMaker: seller,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId2),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO_ADDRESS,
        sellOrderSalt: 2,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V3_SELL,
        sellOrderData: encDataLeft1,
        sellOrderSignature: await getSignature(left1, seller, exchangeV2.address),
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight1
      };

      const data1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams1);
      const tradeData1 = PurchaseData(0, 100, await encodeFees(500, 1000), data1);


      //seaport ORDER
      const conduitController = await ConduitController.new();
      const seaport = await Seaport.new(conduitController.address)
      await bulkExchange.setSeaPort(seaport.address);

      await erc721.mint(seller, tokenId);
      await erc721.setApprovalForAll(seaport.address, true, {from: seller});

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
        identifierOrCriteria: tokenId,
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
      const _recipient = buyer;

      let dataForSeaportWithSelector = await wrapperHelper.getDataSeaPortFulfillAdvancedOrder(_advancedOrder, _criteriaResolvers, _fulfillerConduitKey, _recipient);
      
      const tradeDataSeaPort = PurchaseData(2, 100, await encodeFees(500, 1000), dataForSeaportWithSelector);

      //looksRareOrder
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

      await bulkExchange.setLooksRare(looksRareExchange.address);

      await erc721.mint(seller, erc721TokenId3);
      await erc721.setApprovalForAll(transferManagerERC721.address, true, {from: seller});
      await transferSelectorNFT.addCollectionTransferManager(erc721.address, transferManagerERC721.address);

      const takerBid = {
        isOrderAsk: false,
        taker: bulkExchange.address,
        price: 100,
        tokenId: erc721TokenId3,
        minPercentageToAsk: 8000,
        params: '0x'
      }
      const makerAsk = {
        isOrderAsk: true,
        signer: seller,
        collection: erc721.address,
        price: 100,
        tokenId: erc721TokenId3,
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

      const dataForLooksRare = await wrapperHelper.getDataWrapperMatchAskWithTakerBidUsingETHAndWETH(takerBid, makerAsk, ERC721);
      const tradeDataLooksRare = PurchaseData(4, 100, await encodeFees(500, 1000), dataForLooksRare);

      //x2y2 order

      const x2y2 = await X2Y2_r1.new()
      await x2y2.initialize(120000, weth.address)

      const tokenIdX2Y2 = 12312412523;

      const erc721delegate = await ERC721Delegate.new();
      await erc721delegate.grantRole("0x7630198b183b603be5df16e380207195f2a065102b113930ccb600feaf615331", x2y2.address);
      await x2y2.updateDelegates([erc721delegate.address], [])

      await bulkExchange.setX2Y2(x2y2.address)

      await erc721.mint(seller, tokenIdX2Y2)
      await erc721.setApprovalForAll(erc721delegate.address, true, {from: seller})

      const tokenDataToEncode = [
        {
          token: erc721.address,
          tokenId: tokenIdX2Y2
        }
      ]

      const dataX2y2 = await wrapperHelper.encodeData(tokenDataToEncode)
      const orderItem = {
        price: 100,
        data: dataX2y2
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
            "price": "100",
            "itemHash": itemHash,
            "executionDelegate": erc721delegate.address,
            "dataReplacement": "0x",
            "bidIncentivePct": "0",
            "aucMinIncrementPct": "0",
            "aucIncDurationSecs": "0",
            "fees": []
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

      const tradeDataX2y2 = PurchaseData(3, 100, await encodeFees(500, 1000), await wrapperHelper.encodeX2Y2Call(input))

      const tx = await verifyBalanceChangeReturnTx(buyer, 575, async () =>
        verifyBalanceChangeReturnTx(seller, -400, async () =>
          verifyBalanceChangeReturnTx(feeRecipienterUP, -25, () =>
            verifyBalanceChangeReturnTx(feeRecipientSecond, -50, () =>
              bulkExchange.bulkPurchase([tradeData, tradeData1, tradeDataSeaPort, tradeDataLooksRare, tradeDataX2y2], feeRecipienterUP, feeRecipientSecond, false, { from: buyer, value: 575, gasPrice: 0 })
            )
          )
        )
      );
      await checkExecutions(tx, [true, true, true, true, true])

      assert.equal(await weth.balanceOf(seller), 100);

      assert.equal(await erc721.ownerOf(erc721TokenId1), buyer, "buyer has tokenId1");
      assert.equal(await erc721.ownerOf(erc721TokenId2), buyer, "buyer has tokenId2");
      assert.equal(await erc721.ownerOf(erc721TokenId3), buyer, "buyer has tokenId2");
      assert.equal(await erc721.ownerOf(tokenId), buyer, "buyer has tokenId2");
      assert.equal(await erc721.ownerOf(tokenIdX2Y2), buyer, "buyer has tokenId2");

    })

    it("batch all cases 5%+10% fees for all, 1 request fails ", async () => {
      const seller = accounts[1];
      const buyer = accounts[2];

      const feeRecipientSecond = accounts[7];

      //making rarible orders
      await deployRarible();
      
      //Rarible V2 order
      await erc721.mint(seller, erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, {from: seller});
      
      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[buyer, 10000]], [], false]);

      const left = Order(seller, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V2, encDataLeft);

      const directPurchaseParams = {
        sellOrderMaker: seller,
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
        sellOrderSignature: await getSignature(left, seller, exchangeV2.address),
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight
      };

      const data = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData = PurchaseData(0, 100, await encodeFees(500, 1000), data);

      //rarible V3 order
      await erc721.mint(seller, erc721TokenId2);
      await erc721.setApprovalForAll(transferProxy.address, true, {from: seller});

      const encDataLeft1 = await encDataV3_SELL([0, 0, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight1 = await encDataV3_BUY([await LibPartToUint(buyer, 10000), 0, 0, MARKET_MARKER_SELL]);

      const left1 = Order(seller, Asset(ERC721, enc(erc721.address, erc721TokenId2), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 2, 0, 0, ORDER_DATA_V3_SELL, encDataLeft1);

      const directPurchaseParams1 = {
        sellOrderMaker: seller,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId2),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO_ADDRESS,
        sellOrderSalt: 2,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V3_SELL,
        sellOrderData: encDataLeft1,
        sellOrderSignature: await getSignature(left1, seller, exchangeV2.address),
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight1
      };

      const data1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams1);
      const tradeData1 = PurchaseData(0, 100, await encodeFees(500, 1000), data1);


      //seaport ORDER
      const conduitController = await ConduitController.new();
      const seaport = await Seaport.new(conduitController.address)
      await bulkExchange.setSeaPort(seaport.address);

      await erc721.mint(seller, tokenId);
      await erc721.setApprovalForAll(seaport.address, true, {from: seller});

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
        identifierOrCriteria: tokenId,
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
      const _recipient = buyer;

      let dataForSeaportWithSelector = await wrapperHelper.getDataSeaPortFulfillAdvancedOrder(_advancedOrder, _criteriaResolvers, _fulfillerConduitKey, _recipient);
      
      const tradeDataSeaPort = PurchaseData(2, 100, await encodeFees(500, 1000), dataForSeaportWithSelector);

      //looksRareOrder
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

      await bulkExchange.setLooksRare(looksRareExchange.address);

      await erc721.mint(seller, erc721TokenId3);
      await erc721.setApprovalForAll(transferManagerERC721.address, true, {from: seller});
      await transferSelectorNFT.addCollectionTransferManager(erc721.address, transferManagerERC721.address);

      const takerBid = {
        isOrderAsk: false,
        taker: bulkExchange.address,
        price: 100,
        tokenId: erc721TokenId3,
        minPercentageToAsk: 8000,
        params: '0x'
      }
      const makerAsk = {
        isOrderAsk: true,
        signer: seller,
        collection: erc721.address,
        price: 100,
        tokenId: erc721TokenId3,
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

      const dataForLooksRare = await wrapperHelper.getDataWrapperMatchAskWithTakerBidUsingETHAndWETH(takerBid, makerAsk, ERC721);
      const tradeDataLooksRare = PurchaseData(4, 100, await encodeFees(500, 1000), dataForLooksRare);

      //x2y2 order

      const x2y2 = await X2Y2_r1.new()
      await x2y2.initialize(120000, weth.address)

      const tokenIdX2Y2 = 12312412523;

      const erc721delegate = await ERC721Delegate.new();
      await erc721delegate.grantRole("0x7630198b183b603be5df16e380207195f2a065102b113930ccb600feaf615331", x2y2.address);
      await x2y2.updateDelegates([erc721delegate.address], [])

      await bulkExchange.setX2Y2(x2y2.address)

      await erc721.mint(seller, tokenIdX2Y2)
      await erc721.setApprovalForAll(erc721delegate.address, true, {from: seller})

      const tokenDataToEncode = [
        {
          token: erc721.address,
          tokenId: tokenIdX2Y2
        }
      ]

      const dataX2y2 = await wrapperHelper.encodeData(tokenDataToEncode)
      const orderItem = {
        price: 100,
        data: dataX2y2
      }

      const order = {
        "salt": "216015207580153061888244896739707431392",
        "user": seller,
        "network": "1",//making this order fail
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
            "price": "100",
            "itemHash": itemHash,
            "executionDelegate": erc721delegate.address,
            "dataReplacement": "0x",
            "bidIncentivePct": "0",
            "aucMinIncrementPct": "0",
            "aucIncDurationSecs": "0",
            "fees": []
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

      const tradeDataX2y2 = PurchaseData(3, 100, await encodeFees(500, 1000), await wrapperHelper.encodeX2Y2Call(input))

      //fails with allowFail = false
      await expectThrow(
        bulkExchange.bulkPurchase([tradeData, tradeData1, tradeDataSeaPort, tradeDataLooksRare, tradeDataX2y2], feeRecipienterUP, feeRecipientSecond, false, { from: buyer, value: 575, gasPrice: 0 })
      );

      const tx = await verifyBalanceChangeReturnTx(buyer, 460, async () =>
        verifyBalanceChangeReturnTx(seller, -300, async () =>
          verifyBalanceChangeReturnTx(feeRecipienterUP, -20, () =>
            verifyBalanceChangeReturnTx(feeRecipientSecond, -40, () =>
              bulkExchange.bulkPurchase([tradeData, tradeData1, tradeDataSeaPort, tradeDataLooksRare, tradeDataX2y2], feeRecipienterUP, feeRecipientSecond, true, { from: buyer, value: 575, gasPrice: 0 })
            )
          )
        )
      );

      await checkExecutions(tx, [true, true, true, true, false])

      assert.equal(await weth.balanceOf(seller), 100);

      assert.equal(await erc721.ownerOf(erc721TokenId1), buyer, "buyer has tokenId1");
      assert.equal(await erc721.ownerOf(erc721TokenId2), buyer, "buyer has tokenId2");
      assert.equal(await erc721.ownerOf(erc721TokenId3), buyer, "buyer has tokenId2");
      assert.equal(await erc721.ownerOf(tokenId), buyer, "buyer has tokenId2");
      assert.equal(await erc721.ownerOf(tokenIdX2Y2), seller, "buyer has tokenId2");

    })

    it("batch all cases 5%+10% fees for all, all fail = revert ", async () => {
      const seller = accounts[1];
      const buyer = accounts[2];

      const feeRecipientSecond = accounts[7];

      //making rarible orders
      await deployRarible();
      
      //Rarible V2 order
      await erc721.mint(seller, erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, {from: seller});
      
      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[buyer, 10000]], [], false]);

      const left = Order(seller, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V2, encDataLeft);

      const directPurchaseParams = {
        sellOrderMaker: seller,
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
        sellOrderSignature: "0x00",// making it fail
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight
      };

      const data = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData = PurchaseData(0, 100, await encodeFees(500, 1000), data);

      //rarible V3 order
      await erc721.mint(seller, erc721TokenId2);
      await erc721.setApprovalForAll(transferProxy.address, true, {from: seller});

      const encDataLeft1 = await encDataV3_SELL([0, 0, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight1 = await encDataV3_BUY([await LibPartToUint(buyer, 10000), 0, 0, MARKET_MARKER_SELL]);

      const left1 = Order(seller, Asset(ERC721, enc(erc721.address, erc721TokenId2), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 2, 0, 0, ORDER_DATA_V3_SELL, encDataLeft1);

      const directPurchaseParams1 = {
        sellOrderMaker: seller,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId2),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO_ADDRESS,
        sellOrderSalt: 2,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V3_SELL,
        sellOrderData: encDataLeft1,
        sellOrderSignature: "0x00",// making it fail
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight1
      };

      const data1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams1);
      const tradeData1 = PurchaseData(0, 100, await encodeFees(500, 1000), data1);


      //seaport ORDER
      const conduitController = await ConduitController.new();
      const seaport = await Seaport.new(conduitController.address)
      await bulkExchange.setSeaPort(seaport.address);

      await erc721.mint(seller, tokenId);
      await erc721.setApprovalForAll(seaport.address, true, {from: seller});

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
        identifierOrCriteria: 1124125135,//making it fail
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
      const _recipient = buyer;

      let dataForSeaportWithSelector = await wrapperHelper.getDataSeaPortFulfillAdvancedOrder(_advancedOrder, _criteriaResolvers, _fulfillerConduitKey, _recipient);
      
      const tradeDataSeaPort = PurchaseData(2, 100, await encodeFees(500, 1000), dataForSeaportWithSelector);

      //looksRareOrder
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

      await bulkExchange.setLooksRare(looksRareExchange.address);

      await erc721.mint(seller, erc721TokenId3);
      await erc721.setApprovalForAll(transferManagerERC721.address, true, {from: seller});
      await transferSelectorNFT.addCollectionTransferManager(erc721.address, transferManagerERC721.address);

      const takerBid = {
        isOrderAsk: false,
        taker: bulkExchange.address,
        price: 100,
        tokenId: erc721TokenId3,
        minPercentageToAsk: 8000,
        params: '0x'
      }
      const makerAsk = {
        isOrderAsk: true,
        signer: seller,
        collection: erc721.address,
        price: 100,
        tokenId: 512312512,//making it fail
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

      const dataForLooksRare = await wrapperHelper.getDataWrapperMatchAskWithTakerBidUsingETHAndWETH(takerBid, makerAsk, ERC721);
      const tradeDataLooksRare = PurchaseData(4, 100, await encodeFees(500, 1000), dataForLooksRare);

      //x2y2 order

      const x2y2 = await X2Y2_r1.new()
      await x2y2.initialize(120000, weth.address)

      const tokenIdX2Y2 = 12312412523;

      const erc721delegate = await ERC721Delegate.new();
      await erc721delegate.grantRole("0x7630198b183b603be5df16e380207195f2a065102b113930ccb600feaf615331", x2y2.address);
      await x2y2.updateDelegates([erc721delegate.address], [])

      await bulkExchange.setX2Y2(x2y2.address)

      await erc721.mint(seller, tokenIdX2Y2)
      await erc721.setApprovalForAll(erc721delegate.address, true, {from: seller})

      const tokenDataToEncode = [
        {
          token: erc721.address,
          tokenId: 125231513 //making it fail
        }
      ]

      const dataX2y2 = await wrapperHelper.encodeData(tokenDataToEncode)
      const orderItem = {
        price: 100,
        data: dataX2y2
      }

      const order = {
        "salt": "216015207580153061888244896739707431392",
        "user": seller,
        "network": "1",//making this order fail
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
            "price": "100",
            "itemHash": itemHash,
            "executionDelegate": erc721delegate.address,
            "dataReplacement": "0x",
            "bidIncentivePct": "0",
            "aucMinIncrementPct": "0",
            "aucIncDurationSecs": "0",
            "fees": []
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

      const tradeDataX2y2 = PurchaseData(3, 100, await encodeFees(500, 1000), await wrapperHelper.encodeX2Y2Call(input))

      //fails with allowFail = true
      await expectThrow(
        bulkExchange.bulkPurchase([tradeData, tradeData1, tradeDataSeaPort, tradeDataLooksRare, tradeDataX2y2], feeRecipienterUP, feeRecipientSecond, true, { from: buyer, value: 575, gasPrice: 0 })
      );

      //adding working order 

      const dataNew = await wrapperHelper.getDataDirectPurchase({
        sellOrderMaker: seller,
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
        sellOrderSignature:  await getSignature(left, seller, exchangeV2.address),
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight
      });
      const tradeDataNew = PurchaseData(0, 100, await encodeFees(500, 1000), dataNew);

      const tx = await verifyBalanceChangeReturnTx(buyer, 115, async () =>
        verifyBalanceChangeReturnTx(seller, -100, async () =>
          verifyBalanceChangeReturnTx(feeRecipienterUP, -5, () =>
            verifyBalanceChangeReturnTx(feeRecipientSecond, -10, () =>
              bulkExchange.bulkPurchase([tradeData, tradeData1, tradeDataSeaPort, tradeDataLooksRare, tradeDataX2y2, tradeDataNew], feeRecipienterUP, feeRecipientSecond, true, { from: buyer, value: 575, gasPrice: 0 })
            )
          )
        )
      );
      await checkExecutions(tx, [false, false, false, false, false, true])
    })

    it("batch all cases 5%+10% fees for all except rarible", async () => {
      const seller = accounts[1];
      const buyer = accounts[2];

      const feeRecipientSecond = accounts[7];

      //making rarible orders
      await deployRarible();
      
      //Rarible V2 order
      await erc721.mint(seller, erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, {from: seller});
      
      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[buyer, 10000]], [], false]);

      const left = Order(seller, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V2, encDataLeft);

      const directPurchaseParams = {
        sellOrderMaker: seller,
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
        sellOrderSignature: await getSignature(left, seller, exchangeV2.address),
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight
      };

      const data = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData = PurchaseData(0, 100, 0, data);

      //rarible V3 order
      await erc721.mint(seller, erc721TokenId2);
      await erc721.setApprovalForAll(transferProxy.address, true, {from: seller});

      const encDataLeft1 = await encDataV3_SELL([0, 0, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight1 = await encDataV3_BUY([await LibPartToUint(buyer, 10000), 0, 0, MARKET_MARKER_SELL]);

      const left1 = Order(seller, Asset(ERC721, enc(erc721.address, erc721TokenId2), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 2, 0, 0, ORDER_DATA_V3_SELL, encDataLeft1);

      const directPurchaseParams1 = {
        sellOrderMaker: seller,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId2),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO_ADDRESS,
        sellOrderSalt: 2,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V3_SELL,
        sellOrderData: encDataLeft1,
        sellOrderSignature: await getSignature(left1, seller, exchangeV2.address),
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight1
      };

      const data1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams1);
      const tradeData1 = PurchaseData(0, 100, 0, data1);


      //seaport ORDER
      const conduitController = await ConduitController.new();
      const seaport = await Seaport.new(conduitController.address)
      await bulkExchange.setSeaPort(seaport.address);

      await erc721.mint(seller, tokenId);
      await erc721.setApprovalForAll(seaport.address, true, {from: seller});

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
        identifierOrCriteria: tokenId,
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
      const _recipient = buyer;

      let dataForSeaportWithSelector = await wrapperHelper.getDataSeaPortFulfillAdvancedOrder(_advancedOrder, _criteriaResolvers, _fulfillerConduitKey, _recipient);
      
      const tradeDataSeaPort = PurchaseData(2, 100, await encodeFees(500, 1000), dataForSeaportWithSelector);

      //looksRareOrder
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

      await bulkExchange.setLooksRare(looksRareExchange.address);

      await erc721.mint(seller, erc721TokenId3);
      await erc721.setApprovalForAll(transferManagerERC721.address, true, {from: seller});
      await transferSelectorNFT.addCollectionTransferManager(erc721.address, transferManagerERC721.address);

      const takerBid = {
        isOrderAsk: false,
        taker: bulkExchange.address,
        price: 100,
        tokenId: erc721TokenId3,
        minPercentageToAsk: 8000,
        params: '0x'
      }
      const makerAsk = {
        isOrderAsk: true,
        signer: seller,
        collection: erc721.address,
        price: 100,
        tokenId: erc721TokenId3,
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

      const dataForLooksRare = await wrapperHelper.getDataWrapperMatchAskWithTakerBidUsingETHAndWETH(takerBid, makerAsk, ERC721);
      const tradeDataLooksRare = PurchaseData(4, 100, await encodeFees(500, 1000), dataForLooksRare);

      //x2y2 order

      const x2y2 = await X2Y2_r1.new()
      await x2y2.initialize(120000, weth.address)

      const tokenIdX2Y2 = 12312412523;

      const erc721delegate = await ERC721Delegate.new();
      await erc721delegate.grantRole("0x7630198b183b603be5df16e380207195f2a065102b113930ccb600feaf615331", x2y2.address);
      await x2y2.updateDelegates([erc721delegate.address], [])

      await bulkExchange.setX2Y2(x2y2.address)

      await erc721.mint(seller, tokenIdX2Y2)
      await erc721.setApprovalForAll(erc721delegate.address, true, {from: seller})

      const tokenDataToEncode = [
        {
          token: erc721.address,
          tokenId: tokenIdX2Y2
        }
      ]

      const dataX2y2 = await wrapperHelper.encodeData(tokenDataToEncode)
      const orderItem = {
        price: 100,
        data: dataX2y2
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
            "price": "100",
            "itemHash": itemHash,
            "executionDelegate": erc721delegate.address,
            "dataReplacement": "0x",
            "bidIncentivePct": "0",
            "aucMinIncrementPct": "0",
            "aucIncDurationSecs": "0",
            "fees": []
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

      const tradeDataX2y2 = PurchaseData(3, 100, await encodeFees(500, 1000), await wrapperHelper.encodeX2Y2Call(input))

      const tx = await verifyBalanceChangeReturnTx(buyer, 545, async () =>
        verifyBalanceChangeReturnTx(seller, -400, async () =>
          verifyBalanceChangeReturnTx(feeRecipienterUP, -15, () =>
            verifyBalanceChangeReturnTx(feeRecipientSecond, -30, () =>
              bulkExchange.bulkPurchase([tradeData, tradeData1, tradeDataSeaPort, tradeDataLooksRare, tradeDataX2y2], feeRecipienterUP, feeRecipientSecond, false, { from: buyer, value: 575, gasPrice: 0 })
            )
          )
        )
      );
      await checkExecutions(tx, [true, true, true, true, true])

      assert.equal(await weth.balanceOf(seller), 100);

      assert.equal(await erc721.ownerOf(erc721TokenId1), buyer, "buyer has tokenId1");
      assert.equal(await erc721.ownerOf(erc721TokenId2), buyer, "buyer has tokenId2");
      assert.equal(await erc721.ownerOf(erc721TokenId3), buyer, "buyer has tokenId2");
      assert.equal(await erc721.ownerOf(tokenId), buyer, "buyer has tokenId2");
      assert.equal(await erc721.ownerOf(tokenIdX2Y2), buyer, "buyer has tokenId2");

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

  function PurchaseData(marketId, amount, fees, data) {
    return {marketId, amount, fees, data};
  };

	async function getSignature(order, signer, exchangeContract) {
		return sign(order, signer, exchangeContract);
	}

  function encDataV3_BUY(tuple) {
    return helper.encodeV3_BUY(tuple);
  }

  async function LibPartToUint(account = zeroAddress, value = 0) {
    return await helper.encodeOriginFeeIntoUint(account, value);
  }

  async function encodeFees(first = 0, second = 0) {
    const result = await wrapperHelper.encodeFees(first, second);
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

    await bulkExchange.setExchange(exchangeV2.address)
  }

  async function verifyBalanceChangeReturnTx(account, change, todo) {
    let before = new BN(await web3.eth.getBalance(account));
    const tx = await todo();

    let after = new BN(await web3.eth.getBalance(account));
    let actual = before.sub(after);
    assert.equal(change, actual);

    return tx;
  }

  async function checkExecutions(tx, result) {
    const Execution = await bulkExchange.getPastEvents("Execution", {
      fromBlock: tx.receipt.blockNumber,
      toBlock: tx.receipt.blockNumber
    });
    
    for (const i in Execution) {
      //console.dir(Execution[i], {depth: null})
      assert.equal(Execution[i].args.result, result[i], "execution " + i)
    }
  }

});
