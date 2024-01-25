const { expectThrow, assertEq } = require("@daonomic/tests-common");
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

//SEA PORT
const ConduitController = artifacts.require("ConduitController.sol");
const Seaport = artifacts.require("Seaport.sol");

const { Order, Asset, sign } = require("../../../scripts/order.js");

const { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, ORDER_DATA_V2, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, CRYPTO_PUNKS, COLLECTION, enc, id, ORDER_DATA_V3_SELL } = require("../../../scripts/assets");
const { verifyBalanceChangeReturnTx } = require("../../../scripts/balance")

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const MARKET_MARKER_SELL = "0x68619b8adb206de04f676007b2437f99ff6129b672495a6951499c6c56bc2f10";


contract("RaribleExchangeWrapper WETH purchases", accounts => {
  let bulkExchange;
  let exchangeV2;
  let wrapperHelper;
  let transferProxy;
  let royaltiesRegistry;
  let helper;
  let weth;
  let conduitController;
  let seaport;

  const eth = "0x0000000000000000000000000000000000000000";
  const erc721TokenId1 = 55;
  const erc721TokenId2 = 56;
  const erc721TokenId3 = 57;
  const erc721TokenId4 = 58;
  const erc1155TokenId1 = 55;
  const erc1155TokenId2 = 56;
  const erc1155TokenId3 = 57;
  let erc721;
  let erc1155;
  const tokenId = 12345;
  /*OpenSeaOrders*/
  const feeMethodsSidesKindsHowToCallsMask = [1, 0, 0, 1, 1, 1, 0, 1];

  const royaltyAccount1 = accounts[3];
  const royaltyAccount2 = accounts[4];
  const feeRecipient1 = accounts[5];
  const feeRecipient2 = accounts[6];

  beforeEach(async () => {
    //deploy rarible
    helper = await RaribleTestHelper.new();
    wrapperHelper = await WrapperHelper.new();

    transferProxy = await TransferProxy.new()
    await transferProxy.__OperatorRole_init();

    erc20TransferProxy = await ERC20TransferProxy.new()
    await erc20TransferProxy.__OperatorRole_init();

    royaltiesRegistry = await RoyaltiesRegistry.new()
    await royaltiesRegistry.__RoyaltiesRegistry_init()

    exchangeV2 = await ExchangeV2.new()
    await exchangeV2.__ExchangeV2_init(
      transferProxy.address,
      erc20TransferProxy.address,
      0,
      ZERO_ADDRESS,
      royaltiesRegistry.address
    )

    await transferProxy.addOperator(exchangeV2.address)
    await erc20TransferProxy.addOperator(exchangeV2.address)

    //deploy seaport
    conduitController = await ConduitController.new();
    seaport = await Seaport.new(conduitController.address)

    //deploy weth
    weth = await WETH9.new();

    //deploy wrapper
    bulkExchange = await ExchangeBulkV2.new([ZERO_ADDRESS, exchangeV2.address, seaport.address, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, seaport.address, ZERO_ADDRESS, ZERO_ADDRESS, seaport.address], weth.address, [erc20TransferProxy.address, seaport.address]);
  })

  it("WETH: single purchase from exchangeV2", async () => {
    const buyer = accounts[2];
    const seller = accounts[1];

    const price = 100;

    //prepare WETH
    await prepareWETH(buyer)

    //prepare ERC-721
    erc721 = await TestERC721.new("Rarible", "RARI");
    await erc721.mint(seller, erc721TokenId1);
    await erc721.setApprovalForAll(transferProxy.address, true, { from: seller });

    const encDataLeft = await encDataV2([[], [], true]);
    const encDataRight = await encDataV2([[[buyer, 10000]], [], false]);

    const left1 = Order(seller, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO_ADDRESS, Asset(ERC20, enc(weth.address), price), 1, 0, 0, ORDER_DATA_V2, encDataLeft);

    let signatureLeft1 = await getSignature(left1, seller, exchangeV2.address);

    const directPurchaseParams = {
      sellOrderMaker: seller,
      sellOrderNftAmount: 1,
      nftAssetClass: ERC721,
      nftData: enc(erc721.address, erc721TokenId1),
      sellOrderPaymentAmount: price,
      paymentToken: weth.address,
      sellOrderSalt: 1,
      sellOrderStart: 0,
      sellOrderEnd: 0,
      sellOrderDataType: ORDER_DATA_V2,
      sellOrderData: encDataLeft,
      sellOrderSignature: signatureLeft1,
      buyOrderPaymentAmount: price,
      buyOrderNftAmount: 1,
      buyOrderData: encDataRight
    };

    let dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);

    const tradeData1 = PurchaseData(0, 100, await encodeCurrencyAndDataTypeAndFees(1, 0, 1500, 500), dataForExchCall1); //0 is Exch orders, 100 is amount + 0 protocolFee

    const tx = await bulkExchange.singlePurchase(tradeData1, feeRecipient1, feeRecipient2, { from: buyer })
    console.log("rarible V2 721 1 order 1 comission", tx.receipt.gasUsed)
    assert.equal(await erc721.balanceOf(seller), 0);
    assert.equal(await erc721.balanceOf(buyer), 1);

    assert.equal(await weth.balanceOf(buyer), 880);
    assert.equal(await weth.balanceOf(seller), 100);
    assert.equal(await weth.balanceOf(feeRecipient1), 15);
    assert.equal(await weth.balanceOf(feeRecipient2), 5);

  })

  it("WETH: single purchase from seaport 1.1", async () => {
    const buyer = accounts[2];
    const seller = accounts[1];

    const price = 100;

    //prepare WETH
    await prepareWETH(buyer)

    //prepare ERC-721
    erc721 = await TestERC721.new("Rarible", "RARI");
    await erc721.mint(seller, erc721TokenId1);
    await erc721.setApprovalForAll(seaport.address, true, { from: seller });

    const considerationItemLeft = {
      itemType: 1,
      token: weth.address,
      identifierOrCriteria: 0,
      startAmount: price,
      endAmount: price,
      recipient: seller
    }

    const offerItemLeft = {
      itemType: 2, // 2: ERC721 items
      token: erc721.address,
      identifierOrCriteria: erc721TokenId1,
      startAmount: 1,
      endAmount: 1
    }

    const OrderParametersLeft = {
      offerer: seller,// 0x00
      zone: ZERO_ADDRESS, // 0x20
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
    
    const tradeDataSeaPort = PurchaseData(2, price, await encodeCurrencyAndDataTypeAndFees(1, 0, 1500, 500), dataForSeaportWithSelector);

    const tx = await bulkExchange.singlePurchase(tradeDataSeaPort, feeRecipient1, feeRecipient2, { from: buyer })
    console.log("seaport1.1 V2 721 1 order 1 comission", tx.receipt.gasUsed)
    assert.equal(await erc721.balanceOf(seller), 0);
    assert.equal(await erc721.balanceOf(buyer), 1);

    assert.equal(await weth.balanceOf(buyer), 880);
    assert.equal(await weth.balanceOf(seller), 100);
    assert.equal(await weth.balanceOf(feeRecipient1), 15);
    assert.equal(await weth.balanceOf(feeRecipient2), 5);
    
  })

  it("WETH: single purchase from seaport 1.4", async () => {
    const buyer = accounts[2];
    const seller = accounts[1];

    const price = 100;

    //prepare WETH
    await prepareWETH(buyer)

    //prepare ERC-721
    erc721 = await TestERC721.new("Rarible", "RARI");
    await erc721.mint(seller, erc721TokenId1);
    await erc721.setApprovalForAll(seaport.address, true, { from: seller });

    const considerationItemLeft = {
      itemType: 1,
      token: weth.address,
      identifierOrCriteria: 0,
      startAmount: price,
      endAmount: price,
      recipient: seller
    }

    const offerItemLeft = {
      itemType: 2, // 2: ERC721 items
      token: erc721.address,
      identifierOrCriteria: erc721TokenId1,
      startAmount: 1,
      endAmount: 1
    }

    const OrderParametersLeft = {
      offerer: seller,// 0x00
      zone: ZERO_ADDRESS, // 0x20
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
    
    const tradeDataSeaPort = PurchaseData(6, price, await encodeCurrencyAndDataTypeAndFees(1, 0, 1500, 500), dataForSeaportWithSelector);

    const tx = await bulkExchange.singlePurchase(tradeDataSeaPort, feeRecipient1, feeRecipient2, { from: buyer })
    console.log("seaport1.4 V2 721 1 order 1 comission", tx.receipt.gasUsed)
    assert.equal(await erc721.balanceOf(seller), 0);
    assert.equal(await erc721.balanceOf(buyer), 1);

    assert.equal(await weth.balanceOf(buyer), 880);
    assert.equal(await weth.balanceOf(seller), 100);
    assert.equal(await weth.balanceOf(feeRecipient1), 15);
    assert.equal(await weth.balanceOf(feeRecipient2), 5);
    
  })

  it("WETH: single purchase from seaport 1.4", async () => {
    const buyer = accounts[2];
    const seller = accounts[1];

    const price = 100;

    //prepare WETH
    await prepareWETH(buyer)

    //prepare ERC-721
    erc721 = await TestERC721.new("Rarible", "RARI");
    await erc721.mint(seller, erc721TokenId1);
    await erc721.setApprovalForAll(seaport.address, true, { from: seller });

    const considerationItemLeft = {
      itemType: 1,
      token: weth.address,
      identifierOrCriteria: 0,
      startAmount: price,
      endAmount: price,
      recipient: seller
    }

    const offerItemLeft = {
      itemType: 2, // 2: ERC721 items
      token: erc721.address,
      identifierOrCriteria: erc721TokenId1,
      startAmount: 1,
      endAmount: 1
    }

    const OrderParametersLeft = {
      offerer: seller,// 0x00
      zone: ZERO_ADDRESS, // 0x20
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
    
    const tradeDataSeaPort = PurchaseData(9, price, await encodeCurrencyAndDataTypeAndFees(1, 0, 1500, 500), dataForSeaportWithSelector);

    const tx = await bulkExchange.singlePurchase(tradeDataSeaPort, feeRecipient1, feeRecipient2, { from: buyer })
    console.log("seaport1.4 V2 721 1 order 1 comission", tx.receipt.gasUsed)
    assert.equal(await erc721.balanceOf(seller), 0);
    assert.equal(await erc721.balanceOf(buyer), 1);

    assert.equal(await weth.balanceOf(buyer), 880);
    assert.equal(await weth.balanceOf(seller), 100);
    assert.equal(await weth.balanceOf(feeRecipient1), 15);
    assert.equal(await weth.balanceOf(feeRecipient2), 5);
    
  })

  it("batch order: WETH rarible, WETH seaport + ETH rarible + ETH seaport", async () => {
    const buyer = accounts[2];
    const seller = accounts[1];

    const price = 100;

    //prepare WETH
    await prepareWETH(buyer)

    //prepare ERC-721
    erc721 = await TestERC721.new("Rarible", "RARI");
    await erc721.mint(seller, erc721TokenId1);
    await erc721.setApprovalForAll(seaport.address, true, { from: seller });

    //seaport WETH
    const considerationItemLeft = {
      itemType: 1,
      token: weth.address,
      identifierOrCriteria: 0,
      startAmount: price,
      endAmount: price,
      recipient: seller
    }

    const offerItemLeft = {
      itemType: 2, // 2: ERC721 items
      token: erc721.address,
      identifierOrCriteria: erc721TokenId1,
      startAmount: 1,
      endAmount: 1
    }

    const OrderParametersLeft = {
      offerer: seller,// 0x00
      zone: ZERO_ADDRESS, // 0x20
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
    
    const tradeDataSeaPort1 = PurchaseData(9, price, await encodeCurrencyAndDataTypeAndFees(1, 0, 1500, 500), dataForSeaportWithSelector);

    //rarible WETH
    await erc721.mint(seller, erc721TokenId2);
    await erc721.setApprovalForAll(transferProxy.address, true, { from: seller });

    const encDataLeft = await encDataV2([[], [], true]);
    const encDataRight = await encDataV2([[[buyer, 10000]], [], false]);

    const left1 = Order(seller, Asset(ERC721, enc(erc721.address, erc721TokenId2), 1), ZERO_ADDRESS, Asset(ERC20, enc(weth.address), price), 1, 0, 0, ORDER_DATA_V2, encDataLeft);

    let signatureLeft1 = await getSignature(left1, seller, exchangeV2.address);

    const directPurchaseParams = {
      sellOrderMaker: seller,
      sellOrderNftAmount: 1,
      nftAssetClass: ERC721,
      nftData: enc(erc721.address, erc721TokenId2),
      sellOrderPaymentAmount: price,
      paymentToken: weth.address,
      sellOrderSalt: 1,
      sellOrderStart: 0,
      sellOrderEnd: 0,
      sellOrderDataType: ORDER_DATA_V2,
      sellOrderData: encDataLeft,
      sellOrderSignature: signatureLeft1,
      buyOrderPaymentAmount: price,
      buyOrderNftAmount: 1,
      buyOrderData: encDataRight
    };

    let dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);

    const tradeDataRarible1 = PurchaseData(0, 100, await encodeCurrencyAndDataTypeAndFees(1, 0, 1500, 500), dataForExchCall1); //0 is Exch orders, 100 is amount + 0 protocolFee
    
    //seaport ETH
    await erc721.mint(seller, erc721TokenId3);
    await erc721.setApprovalForAll(seaport.address, true, { from: seller });

    const considerationItemLeft2 = {
      itemType: 0,
      token: ZERO_ADDRESS,
      identifierOrCriteria: 0,
      startAmount: price,
      endAmount: price,
      recipient: seller
    }

    const offerItemLeft2 = {
      itemType: 2, // 2: ERC721 items
      token: erc721.address,
      identifierOrCriteria: erc721TokenId3,
      startAmount: 1,
      endAmount: 1
    }

    const OrderParametersLeft2 = {
      offerer: seller,// 0x00
      zone: ZERO_ADDRESS, // 0x20
      offer: [offerItemLeft2], // 0x40
      consideration: [considerationItemLeft2], // 0x60
      orderType: 0, // 0: no partial fills, anyone can execute
      startTime: 0, //
      endTime: '0xff00000000000000000000000000', // 0xc0
      zoneHash: '0x0000000000000000000000000000000000000000000000000000000000000000', // 0xe0
      salt: '0x9d56bd7c39230517f254b5ce4fd292373648067bd5c6d09accbcb3713f328885', // 0x100
      conduitKey : '0x0000000000000000000000000000000000000000000000000000000000000000', // 0x120
      totalOriginalConsiderationItems: 1 // 0x140
      // offer.length                          // 0x160
    }

    const _advancedOrder2 = {
      parameters: OrderParametersLeft2,
      numerator: 1,
      denominator: 1,
      signature: '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1b',
      extraData: '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1c'
    }

    const _criteriaResolvers2 = [];
    const _fulfillerConduitKey2 = '0x0000000000000000000000000000000000000000000000000000000000000000';
    const _recipient2 = buyer;

    let dataForSeaportWithSelector2 = await wrapperHelper.getDataSeaPortFulfillAdvancedOrder(_advancedOrder2, _criteriaResolvers2, _fulfillerConduitKey2, _recipient2);
    
    const tradeDataSeaPort2 = PurchaseData(9, price, await encodeCurrencyAndDataTypeAndFees(0, 0, 1500, 500), dataForSeaportWithSelector2);

    // rarible ETH
    await erc721.mint(seller, erc721TokenId4);
    await erc721.setApprovalForAll(transferProxy.address, true, { from: seller });

    const left2 = Order(seller, Asset(ERC721, enc(erc721.address, erc721TokenId4), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V2, encDataLeft);

    let signatureLeft2 = await getSignature(left2, seller, exchangeV2.address);

    const directPurchaseParams2 = {
      sellOrderMaker: seller,
      sellOrderNftAmount: 1,
      nftAssetClass: ERC721,
      nftData: enc(erc721.address, erc721TokenId4),
      sellOrderPaymentAmount: price,
      paymentToken: ZERO_ADDRESS,
      sellOrderSalt: 1,
      sellOrderStart: 0,
      sellOrderEnd: 0,
      sellOrderDataType: ORDER_DATA_V2,
      sellOrderData: encDataLeft,
      sellOrderSignature: signatureLeft2,
      buyOrderPaymentAmount: price,
      buyOrderNftAmount: 1,
      buyOrderData: encDataRight
    };

    let dataForExchCall2 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams2);

    const tradeDataRarible2 = PurchaseData(0, 100, await encodeCurrencyAndDataTypeAndFees(0, 0, 1500, 500), dataForExchCall2); //0 is Exch orders, 100 is amount + 0 protocolFee

    await verifyBalanceChangeReturnTx(web3, buyer, 240, async () =>
      verifyBalanceChangeReturnTx(web3, seller, -200, async () =>
        verifyBalanceChangeReturnTx(web3, feeRecipient1, -30, async () =>
          verifyBalanceChangeReturnTx(web3, feeRecipient2, -10, async () =>
            bulkExchange.bulkPurchase([tradeDataSeaPort1, tradeDataRarible1, tradeDataSeaPort2, tradeDataRarible2] , feeRecipient1, feeRecipient2, true, { from: buyer, value: 240 })
          )
        )
      )
    )
    assert.equal(await erc721.balanceOf(seller), 0);
    assert.equal(await erc721.balanceOf(buyer), 4);

    assert.equal(await weth.balanceOf(buyer), 760);
    assert.equal(await weth.balanceOf(seller), 200);
    assert.equal(await weth.balanceOf(feeRecipient1), 30);
    assert.equal(await weth.balanceOf(feeRecipient2), 10);
     
  })

  it("batch order: WETH rarible, WETH seaport (reverted) + ETH rarible + ETH seaport (reverted)", async () => {
    const buyer = accounts[2];
    const seller = accounts[1];

    const price = 100;

    //prepare WETH
    await prepareWETH(buyer)

    //prepare ERC-721
    erc721 = await TestERC721.new("Rarible", "RARI");
    await erc721.mint(seller, erc721TokenId1);
    await erc721.setApprovalForAll(seaport.address, true, { from: seller });

    //seaport WETH
    const considerationItemLeft = {
      itemType: 1,
      token: weth.address,
      identifierOrCriteria: 0,
      startAmount: price,
      endAmount: price,
      recipient: seller
    }

    const offerItemLeft = {
      itemType: 2, // 2: ERC721 items
      token: erc721.address,
      identifierOrCriteria: erc721TokenId1,
      startAmount: 1,
      endAmount: 1
    }

    const OrderParametersLeft = {
      offerer: seller,// 0x00
      zone: ZERO_ADDRESS, // 0x20
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
    
    const tradeDataSeaPort1 = PurchaseData(9, price, await encodeCurrencyAndDataTypeAndFees(1, 0, 1500, 500), "0x");

    //rarible WETH
    await erc721.mint(seller, erc721TokenId2);
    await erc721.setApprovalForAll(transferProxy.address, true, { from: seller });

    const encDataLeft = await encDataV2([[], [], true]);
    const encDataRight = await encDataV2([[[buyer, 10000]], [], false]);

    const left1 = Order(seller, Asset(ERC721, enc(erc721.address, erc721TokenId2), 1), ZERO_ADDRESS, Asset(ERC20, enc(weth.address), price), 1, 0, 0, ORDER_DATA_V2, encDataLeft);

    let signatureLeft1 = await getSignature(left1, seller, exchangeV2.address);

    const directPurchaseParams = {
      sellOrderMaker: seller,
      sellOrderNftAmount: 1,
      nftAssetClass: ERC721,
      nftData: enc(erc721.address, erc721TokenId2),
      sellOrderPaymentAmount: price,
      paymentToken: weth.address,
      sellOrderSalt: 1,
      sellOrderStart: 0,
      sellOrderEnd: 0,
      sellOrderDataType: ORDER_DATA_V2,
      sellOrderData: encDataLeft,
      sellOrderSignature: signatureLeft1,
      buyOrderPaymentAmount: price,
      buyOrderNftAmount: 1,
      buyOrderData: encDataRight
    };

    let dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);

    const tradeDataRarible1 = PurchaseData(0, 100, await encodeCurrencyAndDataTypeAndFees(1, 0, 1500, 500), dataForExchCall1); //0 is Exch orders, 100 is amount + 0 protocolFee
    
    //seaport ETH
    await erc721.mint(seller, erc721TokenId3);
    await erc721.setApprovalForAll(seaport.address, true, { from: seller });

    const considerationItemLeft2 = {
      itemType: 0,
      token: ZERO_ADDRESS,
      identifierOrCriteria: 0,
      startAmount: price,
      endAmount: price,
      recipient: seller
    }

    const offerItemLeft2 = {
      itemType: 2, // 2: ERC721 items
      token: erc721.address,
      identifierOrCriteria: erc721TokenId3,
      startAmount: 1,
      endAmount: 1
    }

    const OrderParametersLeft2 = {
      offerer: seller,// 0x00
      zone: ZERO_ADDRESS, // 0x20
      offer: [offerItemLeft2], // 0x40
      consideration: [considerationItemLeft2], // 0x60
      orderType: 0, // 0: no partial fills, anyone can execute
      startTime: 0, //
      endTime: '0xff00000000000000000000000000', // 0xc0
      zoneHash: '0x0000000000000000000000000000000000000000000000000000000000000000', // 0xe0
      salt: '0x9d56bd7c39230517f254b5ce4fd292373648067bd5c6d09accbcb3713f328885', // 0x100
      conduitKey : '0x0000000000000000000000000000000000000000000000000000000000000000', // 0x120
      totalOriginalConsiderationItems: 1 // 0x140
      // offer.length                          // 0x160
    }

    const _advancedOrder2 = {
      parameters: OrderParametersLeft2,
      numerator: 1,
      denominator: 1,
      signature: '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1b',
      extraData: '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1c'
    }

    const _criteriaResolvers2 = [];
    const _fulfillerConduitKey2 = '0x0000000000000000000000000000000000000000000000000000000000000000';
    const _recipient2 = buyer;

    let dataForSeaportWithSelector2 = await wrapperHelper.getDataSeaPortFulfillAdvancedOrder(_advancedOrder2, _criteriaResolvers2, _fulfillerConduitKey2, _recipient2);
    
    const tradeDataSeaPort2 = PurchaseData(9, price, await encodeCurrencyAndDataTypeAndFees(0, 0, 1500, 500), "0x");

    // rarible ETH
    await erc721.mint(seller, erc721TokenId4);
    await erc721.setApprovalForAll(transferProxy.address, true, { from: seller });

    const left2 = Order(seller, Asset(ERC721, enc(erc721.address, erc721TokenId4), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, ORDER_DATA_V2, encDataLeft);

    let signatureLeft2 = await getSignature(left2, seller, exchangeV2.address);

    const directPurchaseParams2 = {
      sellOrderMaker: seller,
      sellOrderNftAmount: 1,
      nftAssetClass: ERC721,
      nftData: enc(erc721.address, erc721TokenId4),
      sellOrderPaymentAmount: price,
      paymentToken: ZERO_ADDRESS,
      sellOrderSalt: 1,
      sellOrderStart: 0,
      sellOrderEnd: 0,
      sellOrderDataType: ORDER_DATA_V2,
      sellOrderData: encDataLeft,
      sellOrderSignature: signatureLeft2,
      buyOrderPaymentAmount: price,
      buyOrderNftAmount: 1,
      buyOrderData: encDataRight
    };

    let dataForExchCall2 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams2);

    const tradeDataRarible2 = PurchaseData(0, 100, await encodeCurrencyAndDataTypeAndFees(0, 0, 1500, 500), dataForExchCall2); //0 is Exch orders, 100 is amount + 0 protocolFee

    await verifyBalanceChangeReturnTx(web3, buyer, 120, async () =>
      verifyBalanceChangeReturnTx(web3, seller, -100, async () =>
        verifyBalanceChangeReturnTx(web3, feeRecipient1, -15, async () =>
          verifyBalanceChangeReturnTx(web3, feeRecipient2, -5, async () =>
            bulkExchange.bulkPurchase([tradeDataSeaPort1, tradeDataRarible1, tradeDataSeaPort2, tradeDataRarible2] , feeRecipient1, feeRecipient2, true, { from: buyer, value: 240 })
          )
        )
      )
    )
    assert.equal(await erc721.balanceOf(seller), 2);
    assert.equal(await erc721.balanceOf(buyer), 2);

    assert.equal(await weth.balanceOf(buyer), 880);
    assert.equal(await weth.balanceOf(seller), 100);
    assert.equal(await weth.balanceOf(feeRecipient1), 15);
    assert.equal(await weth.balanceOf(feeRecipient2), 5);
     
  })

  async function prepareWETH(user, amount = 1000) {
    //mint weth
    await weth.deposit({ from: user, value: amount });
    assert.equal(await weth.balanceOf(user), amount)

    //approve weth to wrapper
    await weth.approve(bulkExchange.address, amount, { from: user })
    assert.equal(await weth.allowance(user, bulkExchange.address), amount)
  }

  function PurchaseData(marketId, amount, fees, data) {
    return { marketId, amount, fees, data };
  };

  async function getSignature(order, signer, exchangeContract) {
    return sign(order, signer, exchangeContract);
  }

  async function encodeCurrencyAndDataTypeAndFees(currency = 0, dataType = 0, first = 0, second = 0) {
    const result = await wrapperHelper.encodeCurrencyAndDataTypeAndFees(currency, dataType, first, second);
    return result.toString()
  }

  function encDataV2(tuple) {
    return helper.encodeV2(tuple);
  }

  async function encodeBpPlusAccountTest(bp = 0, account = ZERO_ADDRESS) {
    const result = await wrapperHelper.encodeBpPlusAccount(bp, account);
    return result.toString()
  }

})


