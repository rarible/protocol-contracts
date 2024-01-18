//ZORA
const AsksV1_1 = artifacts.require("AsksV1_1.sol");
const OffersV1 = artifacts.require("OffersV1.sol");
const ZoraModuleManager = artifacts.require("ZoraModuleManager.sol");
const ZoraProtocolFeeSettings = artifacts.require("ZoraProtocolFeeSettings.sol");
const ERC20TransferHelper = artifacts.require("ERC20TransferHelper.sol");
const ERC721TransferHelper = artifacts.require("ERC721TransferHelper.sol");
const RoyaltyEngineV1 = artifacts.require("RoyaltyEngineV1.sol");
const RoyaltyRegistry = artifacts.require("RoyaltyRegistry.sol");

//RARIBLE
const ExchangeV2 = artifacts.require("ExchangeV2.sol");
const RoyaltiesRegistry = artifacts.require("RoyaltiesRegistry.sol");
const TransferProxy = artifacts.require("TransferProxy.sol");
const ERC20TransferProxy = artifacts.require("ERC20TransferProxy.sol");
const RaribleTestHelper = artifacts.require("RaribleTestHelper.sol");

//RARIBLE Exchange (november 2021)
const ExchangeV2Old = artifacts.require("ExchangeV2Old.sol");

//OPENSEA
const WyvernExchangeWithBulkCancellations = artifacts.require("WyvernExchangeWithBulkCancellations.sol");
const WyvernTokenTransferProxy = artifacts.require("WyvernTokenTransferProxy.sol");
const MerkleValidator = artifacts.require("MerkleValidator.sol");
const WyvernProxyRegistry = artifacts.require("WyvernProxyRegistry.sol");

//X2Y2
const ERC721Delegate = artifacts.require("ERC721Delegate.sol");
const ERC1155Delegate = artifacts.require("ERC1155Delegate.sol");
const X2Y2_r1 = artifacts.require("X2Y2_r1.sol");
const X2Y2TestHelper = artifacts.require("X2Y2TestHelper.sol");

//TOKENS
const TestERC721 = artifacts.require("TestERC721.sol");
const TestERC1155 = artifacts.require("TestERC1155.sol");
const TestERC20 = artifacts.require("TestERC20.sol");
const WETH9 = artifacts.require('WETH9');

//SEA PORT
const ConduitController = artifacts.require("ConduitController.sol");
const Seaport = artifacts.require("Seaport.sol");

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

const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const truffleAssert = require('truffle-assertions');

// UTILS
const { Order, Asset, sign } = require("../../scripts/order.js");

const BN = web3.utils.BN;
const { verifyBalanceChangeReturnTx } = require("../../scripts/balance")

const zeroAddress = "0x0000000000000000000000000000000000000000";
const MARKET_MARKER_SELL = "0x68619b8adb206de04f676007b2437f99ff6129b672495a6951499c6c56bc2f13";
const MARKET_MARKER_BUY =  "0x68619b8adb206de04f676007b2437f99ff6129b672495a6951499c6c56bc2f14";

const { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, ORDER_DATA_V2, ORDER_DATA_V3_BUY, ORDER_DATA_V3_SELL, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, CRYPTO_PUNKS, COLLECTION, TO_LOCK, LOCK, enc, id } = require("../../scripts/assets.js");

contract("Test gas usage for marketplaces", accounts => {

  const registrar = accounts[0]
  const seller = accounts[1];

  const buyer = accounts[4];
  const protocol = accounts[9];

  const protocolFeeBP = 300;

  const tokenId  = 12345;
  const tokenId1 = 123456;
  const tokenId2 = 1234567;
  const tokenId3 = 12345678;

  let testHelper;

  const price = 1000;
  
  before(async () => {
    testHelper = await RaribleTestHelper.new()
  });
  
  it("zora ETH asks", async () => {
    const ZPFS = await ZoraProtocolFeeSettings.new();
    const ZMM = await ZoraModuleManager.new(registrar, ZPFS.address);
    const erc20TransferHelper = await ERC20TransferHelper.new(ZMM.address);
    const erc721TransferHelper = await ERC721TransferHelper.new(ZMM.address);

    // Init V3
    await ZPFS.init(ZMM.address, zeroAddress);

    // Deploy mocks
    const royaltyRegistry = await RoyaltyRegistry.new();
    await royaltyRegistry.initialize()
    const royaltyEngine = await RoyaltyEngineV1.new();
    await royaltyEngine.initialize(royaltyRegistry.address)

    const token = await TestERC721.new();
    const erc20 = await TestERC20.new();

    // Deploy Asks v1.1
    const asks = await AsksV1_1.new(erc20TransferHelper.address, erc721TransferHelper.address, royaltyEngine.address, ZPFS.address, erc20.address);
    await ZMM.registerModule(asks.address)
    await ZMM.setApprovalForModule(asks.address, true, {from: seller})
    await ZMM.setApprovalForModule(asks.address, true, {from: buyer})
    await ZPFS.setFeeParams(asks.address, protocol, protocolFeeBP)
    
    console.log("ASKS ETH:")
    //TEST CASE 1: ask ETH <=> ERC721
    //minting token
    await token.mint(seller, tokenId)
    await token.setApprovalForAll(erc721TransferHelper.address, true, {from: seller})

    const createAsk = await asks.createAsk(token.address, tokenId, 1000, zeroAddress, seller, 1000, {from: seller})
    console.log("ZORA: list ask", createAsk.receipt.gasUsed)

    const cancelAsk = await asks.cancelAsk(token.address, tokenId, {from: seller})
    console.log("ZORA: cancel ask", cancelAsk.receipt.gasUsed)

    await asks.createAsk(token.address, tokenId, 1000, zeroAddress, seller, 1000, {from: seller})

    const fillAsk = await asks.fillAsk(token.address, tokenId, zeroAddress, 1000, zeroAddress, {from: buyer, value: 1000})
    console.log("ZORA: buy ETH <=> ERC721",fillAsk.receipt.gasUsed)
    assert.equal(await token.ownerOf(tokenId), buyer, "buyer has token")

    // TEST CASE 2: ask ERC20 <=> ERC721
    // minting second token
    await token.mint(seller, tokenId1)
    await token.setApprovalForAll(erc721TransferHelper.address, true, {from: seller})

    //CREATING ASK
    await asks.createAsk(token.address, tokenId1, 1000, zeroAddress, seller, 1000, {from: seller})

    const fillAsk1 = await asks.fillAsk(token.address, tokenId1, zeroAddress, 1000, zeroAddress, {from: buyer, value: 1000})
    console.log("ZORA: buy ETH <=> ERC721 (second token in collection)",fillAsk1.receipt.gasUsed)
  })
  
  it("zora ETH offers", async () => {
    const ZPFS = await ZoraProtocolFeeSettings.new();
    const ZMM = await ZoraModuleManager.new(registrar, ZPFS.address);
    const erc20TransferHelper = await ERC20TransferHelper.new(ZMM.address);
    const erc721TransferHelper = await ERC721TransferHelper.new(ZMM.address);

    // Init V3
    await ZPFS.init(ZMM.address, zeroAddress);

    // Deploy mocks
    const royaltyRegistry = await RoyaltyRegistry.new();
    await royaltyRegistry.initialize()
    const royaltyEngine = await RoyaltyEngineV1.new();
    await royaltyEngine.initialize(royaltyRegistry.address)

    const token = await TestERC721.new();
    const erc20 = await TestERC20.new();
    
    const offers = await OffersV1.new(erc20TransferHelper.address, erc721TransferHelper.address, royaltyEngine.address, ZPFS.address, erc20.address);
    await ZMM.registerModule(offers.address)
    await ZMM.setApprovalForModule(offers.address, true, {from: seller})
    await ZMM.setApprovalForModule(offers.address, true, {from: buyer})
    await ZPFS.setFeeParams(offers.address, protocol, protocolFeeBP)

    console.log("OFFERS ETH:")
    // TEST-CASE 3: offer ETH <=> ERC721
    await token.mint(seller, tokenId2)
    await token.setApprovalForAll(erc721TransferHelper.address, true, {from: seller})

    const createOffer = await offers.createOffer(token.address, tokenId2, zeroAddress, 1000, 1000, {from: buyer, value: 1000})
    console.log("ZORA: list offer (bid)", createOffer.receipt.gasUsed)

    const cancelOffer = await offers.cancelOffer(token.address, tokenId2, 1, {from: buyer})
    console.log("ZORA: cancel offer (bid)", cancelOffer.receipt.gasUsed)

    await offers.createOffer(token.address, tokenId2, zeroAddress, 1000, 1000, {from: buyer, value: 1000})

    const fillOffer = await offers.fillOffer(token.address, tokenId2, 2, zeroAddress, 1000, zeroAddress, {from: seller})
    console.log("ZORA: accept bid ETH <=> ERC721", fillOffer.receipt.gasUsed)
    assert.equal(await token.ownerOf(tokenId2), buyer, "buyer has token")

    // TEST-CASE 4: offer ERC20 <=> ERC721
    await token.mint(seller, tokenId3)
    await token.setApprovalForAll(erc721TransferHelper.address, true, {from: seller})

    await offers.createOffer(token.address, tokenId3, zeroAddress, 1000, 1000, {from: buyer, value: 1000})

    const fillOffer1 = await offers.fillOffer(token.address, tokenId3, 3, zeroAddress, 1000, zeroAddress, {from: seller})
    console.log("ZORA: accept bid ETH <=> ERC721 (second token in collection)", fillOffer1.receipt.gasUsed)
    assert.equal(await token.ownerOf(tokenId3), buyer, "buyer has token")
  })

  it("zora ERC20 asks", async () => {
    const ZPFS = await ZoraProtocolFeeSettings.new();
    const ZMM = await ZoraModuleManager.new(registrar, ZPFS.address);
    const erc20TransferHelper = await ERC20TransferHelper.new(ZMM.address);
    const erc721TransferHelper = await ERC721TransferHelper.new(ZMM.address);

    // Init V3
    await ZPFS.init(ZMM.address, zeroAddress);

    // Deploy mocks
    const royaltyRegistry = await RoyaltyRegistry.new();
    await royaltyRegistry.initialize()
    const royaltyEngine = await RoyaltyEngineV1.new();
    await royaltyEngine.initialize(royaltyRegistry.address)

    const token = await TestERC721.new();
    const erc20 = await TestERC20.new();

    // Deploy Asks v1.1
    const asks = await AsksV1_1.new(erc20TransferHelper.address, erc721TransferHelper.address, royaltyEngine.address, ZPFS.address, erc20.address);
    await ZMM.registerModule(asks.address)
    await ZMM.setApprovalForModule(asks.address, true, {from: seller})
    await ZMM.setApprovalForModule(asks.address, true, {from: buyer})
    await ZPFS.setFeeParams(asks.address, protocol, protocolFeeBP)

    console.log("ASKS ERC20:")
    //TEST CASE 1: ask ERC20 <=> ERC721
    //minting token
    await token.mint(seller, tokenId)
    await token.setApprovalForAll(erc721TransferHelper.address, true, {from: seller})

    // getting ERC20
    await erc20.mint(buyer, 1000)
    await erc20.approve(erc20TransferHelper.address, 1000, {from: buyer})
    assert.equal(await erc20.balanceOf(buyer), 1000, "erc20 deposit")

    const createAsk = await asks.createAsk(token.address, tokenId, 1000, erc20.address, seller, 1000, {from: seller})
    console.log("ZORA: list ask", createAsk.receipt.gasUsed)

    const cancelAsk = await asks.cancelAsk(token.address, tokenId, {from: seller})
    console.log("ZORA: cancel ask", cancelAsk.receipt.gasUsed)

    await asks.createAsk(token.address, tokenId, 1000, erc20.address, seller, 1000, {from: seller})

    const fillAsk = await asks.fillAsk(token.address, tokenId, erc20.address, 1000, zeroAddress, {from: buyer})
    console.log("ZORA: buy ERC20 <=> ERC721",fillAsk.receipt.gasUsed)
    assert.equal(await token.ownerOf(tokenId), buyer, "buyer has token1");
    assert.equal(await erc20.balanceOf(buyer), 0, "erc20 buyer");
    assert.equal(await erc20.balanceOf(protocol), 30, "protocol")
    assert.equal(await erc20.balanceOf(seller), 970, "seller")
    
    // TEST CASE 2: ask ERC20 <=> ERC721
    // minting second token
    await token.mint(seller, tokenId1)
    await token.setApprovalForAll(erc721TransferHelper.address, true, {from: seller})
    
    // getting ERC20
    await erc20.mint(buyer, 1000)
    await erc20.approve(erc20TransferHelper.address, 1000, {from: buyer})
    assert.equal(await erc20.balanceOf(buyer), 1000, "erc20 deposit")

    //CREATING ASK
    await asks.createAsk(token.address, tokenId1, 1000, erc20.address, seller, 1000, {from: seller})

    const fillAsk1 = await asks.fillAsk(token.address, tokenId1, erc20.address, 1000, zeroAddress, {from: buyer})
    console.log("ZORA: buy ERC20 <=> ERC721 (second token in collection)",fillAsk1.receipt.gasUsed)
    assert.equal(await token.ownerOf(tokenId1), buyer, "buyer has token1");
    assert.equal(await erc20.balanceOf(buyer), 0, "erc20 buyer");
    assert.equal(await erc20.balanceOf(protocol), 60, "protocol")
    assert.equal(await erc20.balanceOf(seller), 1940, "seller")
  })

  it("zora ERC20 offers", async () => {
    const ZPFS = await ZoraProtocolFeeSettings.new();
    const ZMM = await ZoraModuleManager.new(registrar, ZPFS.address);
    const erc20TransferHelper = await ERC20TransferHelper.new(ZMM.address);
    const erc721TransferHelper = await ERC721TransferHelper.new(ZMM.address);

    // Init V3
    await ZPFS.init(ZMM.address, zeroAddress);

    // Deploy mocks
    const royaltyRegistry = await RoyaltyRegistry.new();
    await royaltyRegistry.initialize()
    const royaltyEngine = await RoyaltyEngineV1.new();
    await royaltyEngine.initialize(royaltyRegistry.address)

    const token = await TestERC721.new();
    const erc20 = await TestERC20.new();

    const offers = await OffersV1.new(erc20TransferHelper.address, erc721TransferHelper.address, royaltyEngine.address, ZPFS.address, erc20.address);
    await ZMM.registerModule(offers.address)
    await ZMM.setApprovalForModule(offers.address, true, {from: seller})
    await ZMM.setApprovalForModule(offers.address, true, {from: buyer})
    await ZPFS.setFeeParams(offers.address, protocol, protocolFeeBP)

    console.log("OFFERS ERC20:")
    // TEST-CASE 3: offer ERC20 <=> ERC721
    await token.mint(seller, tokenId2)
    await token.setApprovalForAll(erc721TransferHelper.address, true, {from: seller})

    // getting ERC20
    await erc20.mint(buyer, 1000)
    await erc20.approve(erc20TransferHelper.address, 1000, {from: buyer})
    assert.equal(await erc20.balanceOf(buyer), 1000, "erc20 deposit")

    const createOffer = await offers.createOffer(token.address, tokenId2, erc20.address, 1000, 1000, {from: buyer})
    console.log("ZORA: list offer (bid)", createOffer.receipt.gasUsed)

    const cancelOffer = await offers.cancelOffer(token.address, tokenId2, 1, {from: buyer})
    console.log("ZORA: cancel offer (bid)", cancelOffer.receipt.gasUsed)

    await erc20.approve(erc20TransferHelper.address, 1000, {from: buyer})

    await offers.createOffer(token.address, tokenId2, erc20.address, 1000, 1000, {from: buyer})

    const fillOffer = await offers.fillOffer(token.address, tokenId2, 2, erc20.address, 1000, zeroAddress, {from: seller})
    console.log("ZORA: accept bid ERC20 <=> ERC721", fillOffer.receipt.gasUsed)
    assert.equal(await token.ownerOf(tokenId2), buyer, "buyer has token")

    // TEST-CASE 4: offer ERC20 <=> ERC721
    await token.mint(seller, tokenId3)
    await token.setApprovalForAll(erc721TransferHelper.address, true, {from: seller})

    // getting ERC20
    await erc20.mint(buyer, 1000)
    await erc20.approve(erc20TransferHelper.address, 2000, {from: buyer})
    assert.equal(await erc20.balanceOf(buyer), 1000, "erc20 deposit")

    await offers.createOffer(token.address, tokenId3, erc20.address, 1000, 1000, {from: buyer})

    const fillOffer1 = await offers.fillOffer(token.address, tokenId3, 3, erc20.address, 1000, zeroAddress, {from: seller})
    console.log("ZORA: accept bid ERC20 <=> ERC721 (second token in collection)", fillOffer1.receipt.gasUsed)
    assert.equal(await token.ownerOf(tokenId3), buyer, "buyer has token")
  })

  it("rarible ETH", async () => {
		const exchangeV2 = await ExchangeV2.new();
		const transferProxy = await TransferProxy.new();
    await transferProxy.__TransferProxy_init()
    await transferProxy.addOperator(exchangeV2.address)
		const erc20TransferProxy = await ERC20TransferProxy.new();
    await erc20TransferProxy.__ERC20TransferProxy_init();
    await erc20TransferProxy.addOperator(exchangeV2.address)
		const royaltiesRegistry = await RoyaltiesRegistry.new();
    await exchangeV2.__ExchangeV2_init(transferProxy.address, erc20TransferProxy.address, 0, protocol, royaltiesRegistry.address);

    const token = await TestERC721.new();

    //TEST-CASE 1: ETH <=> ERC721
    await token.mint(seller, tokenId)
    await token.setApprovalForAll(transferProxy.address, true, {from: seller})

    let encDataLeft = await encDataV3_BUY([ 0, await LibPartToUint(protocol, protocolFeeBP), 0, MARKET_MARKER_BUY ]);
		let encDataRight = await encDataV3_SELL([ 0, await LibPartToUint(), 0, 1000, MARKET_MARKER_SELL ]);

		const right = Order(seller, Asset(ERC721, enc( token.address, tokenId), 1), zeroAddress, Asset(ETH, "0x", price), 1, 0, 0, ORDER_DATA_V3_SELL, encDataRight);
    
    const signature1 = await getSignature(exchangeV2, right, seller);

    const directBuyParams1 = {
      sellOrderMaker: seller,
      sellOrderNftAmount: 1,
      nftAssetClass: ERC721,
      nftData: enc( token.address, tokenId),
      sellOrderPaymentAmount: price,
      paymentToken: zeroAddress,
      sellOrderSalt: 1,
      sellOrderStart: 0,
      sellOrderEnd: 0,
      sellOrderDataType: ORDER_DATA_V3_SELL,
      sellOrderData: encDataRight,
      sellOrderSignature: signature1,
      buyOrderPaymentAmount: price,
      buyOrderNftAmount: 1,
      buyOrderData: encDataLeft
    };
    const matchTx1 = await exchangeV2.directPurchase(directBuyParams1, { from: buyer, value: price });
    console.log("RARIBLE: match ETH <=> ERC721", matchTx1.receipt.gasUsed)

    const tokenid1 = "1235112312"

    //TEST-CASE 2: ETH <=> ERC721
    await token.mint(seller, tokenid1)
    await token.setApprovalForAll(transferProxy.address, true, {from: seller})

		const right1 = Order(seller, Asset(ERC721, enc( token.address, tokenid1), 1), zeroAddress, Asset(ETH, "0x", price), 2, 0, 0, ORDER_DATA_V3_SELL, encDataRight);
    
    const signature2 = await getSignature(exchangeV2, right1, seller);

    const directBuyParams2 = {
      sellOrderMaker: seller,
      sellOrderNftAmount: 1,
      nftAssetClass: ERC721,
      nftData: enc( token.address, tokenid1),
      sellOrderPaymentAmount: price,
      paymentToken: zeroAddress,
      sellOrderSalt: 2,
      sellOrderStart: 0,
      sellOrderEnd: 0,
      sellOrderDataType: ORDER_DATA_V3_SELL,
      sellOrderData: encDataRight,
      sellOrderSignature: signature2,
      buyOrderPaymentAmount: price,
      buyOrderNftAmount: 1,
      buyOrderData: encDataLeft
    };

    const matchTx2 = await exchangeV2.directPurchase(directBuyParams2, { from: buyer, value: price });
    console.log("RARIBLE: match ETH <=> ERC721 (second token of collection)", matchTx2.receipt.gasUsed)

    const cancelTx1 = await exchangeV2.cancel(right, {from: seller})
    console.log("RARIBLE: cancel ETH order", cancelTx1.receipt.gasUsed)
  })

  it("rarible ERC-20", async () => {
		const exchangeV2 = await ExchangeV2.new();
		const transferProxy = await TransferProxy.new();
    await transferProxy.__TransferProxy_init()
    await transferProxy.addOperator(exchangeV2.address)
		const erc20TransferProxy = await ERC20TransferProxy.new();
    await erc20TransferProxy.__ERC20TransferProxy_init();
    await erc20TransferProxy.addOperator(exchangeV2.address)
		const royaltiesRegistry = await RoyaltiesRegistry.new();
    await exchangeV2.__ExchangeV2_init(transferProxy.address, erc20TransferProxy.address, protocolFeeBP, protocol, royaltiesRegistry.address);

    const token = await TestERC721.new();
    const erc20 = await TestERC20.new();

    //TEST-CASE 1: ERC20 <=> ERC721
    await token.mint(seller, tokenId)
    await token.setApprovalForAll(transferProxy.address, true, {from: seller})

    await erc20.mint(buyer, price)
    await erc20.approve(erc20TransferProxy.address, price, {from: buyer})
    assert.equal(await erc20.balanceOf(buyer), price, "erc20 deposit")

    let encDataLeft = await encDataV3_BUY([ 0, await LibPartToUint(protocol, protocolFeeBP), 0, MARKET_MARKER_BUY]);
		let encDataRight = await encDataV3_SELL([ 0, await LibPartToUint(), 0, 1000, MARKET_MARKER_SELL]);

    const left = Order(buyer, Asset(ERC20, enc(erc20.address), price), zeroAddress, Asset(ERC721, enc( token.address, tokenId), 1), 1, 0, 0, ORDER_DATA_V3_BUY, encDataLeft);
    
    const signature = await getSignature(exchangeV2, left, buyer);

    const directAcceptParams = {
      bidMaker: buyer,
      bidNftAmount: 1,
      nftAssetClass: ERC721,
      nftData: enc( token.address, tokenId),
      bidPaymentAmount: price,
      paymentToken: erc20.address,
      bidSalt: 1,
      bidStart: 0,
      bidEnd: 0,
      bidDataType: ORDER_DATA_V3_BUY,
      bidData: encDataLeft,
      bidSignature: signature,
      sellOrderPaymentAmount: price,
      sellOrderNftAmount: 1,
      sellOrderData: encDataRight
    };

    const matchTx1 = await exchangeV2.directAcceptBid(directAcceptParams, { from: seller });

    console.log("RARIBLE: match ERC20 <=> ERC721", matchTx1.receipt.gasUsed)

    assert.equal(await token.ownerOf(tokenId), buyer, "buyer has token1");
    assert.equal(await erc20.balanceOf(buyer), 0, "erc20 buyer");
    assert.equal(await erc20.balanceOf(protocol), 30, "protocol")
    assert.equal(await erc20.balanceOf(seller), 970, "seller")

    const tokenid1 = "1235112312"

    //TEST-CASE 2: ERC20 <=> ERC721
    await token.mint(seller, tokenid1)
    await token.setApprovalForAll(transferProxy.address, true, {from: seller})

    await erc20.mint(buyer, price)
    await erc20.approve(erc20TransferProxy.address, price, {from: buyer})
    assert.equal(await erc20.balanceOf(buyer), price, "erc20 deposit")

    const left1 = Order(buyer, Asset(ERC20, enc(erc20.address), price), zeroAddress, Asset(ERC721, enc( token.address, tokenid1), 1), 2, 0, 0, ORDER_DATA_V3_BUY, encDataLeft);
    
    const signature1 = await getSignature(exchangeV2, left1, buyer);
  
    const directAcceptParams1 = {
      bidMaker: buyer,
      bidNftAmount: 1,
      nftAssetClass: ERC721,
      nftData: enc( token.address, tokenid1),
      bidPaymentAmount: price,
      paymentToken: erc20.address,
      bidSalt: 2,
      bidStart: 0,
      bidEnd: 0,
      bidDataType: ORDER_DATA_V3_BUY,
      bidData: encDataLeft,
      bidSignature: signature1,
      sellOrderPaymentAmount: price,
      sellOrderNftAmount: 1,
      sellOrderData: encDataRight
    };
    
    const matchTx2 = await exchangeV2.directAcceptBid(directAcceptParams1, { from: seller });
    console.log("RARIBLE: match ERC20 <=> ERC721 (second token of collection)", matchTx2.receipt.gasUsed)

    const cancelTx1 = await exchangeV2.cancel(left, {from: buyer})
    console.log("RARIBLE: cancel ERC-20 order", cancelTx1.receipt.gasUsed)

    assert.equal(await token.ownerOf(tokenid1), buyer, "buyer has token1");
    assert.equal(await erc20.balanceOf(buyer), 0, "erc20 buyer");
    assert.equal(await erc20.balanceOf(protocol), 60, "protocol")
    assert.equal(await erc20.balanceOf(seller), 1940, "seller")
  })

  it("OLD rarible ETH", async () => {
		const exchangeV2 = await ExchangeV2Old.new();
		const transferProxy = await TransferProxy.new();
    await transferProxy.__TransferProxy_init()
    await transferProxy.addOperator(exchangeV2.address)
		const erc20TransferProxy = await ERC20TransferProxy.new();
    await erc20TransferProxy.__ERC20TransferProxy_init();
    await erc20TransferProxy.addOperator(exchangeV2.address)
		const royaltiesRegistry = await RoyaltiesRegistry.new();
    await exchangeV2.__ExchangeV2_init(transferProxy.address, erc20TransferProxy.address, protocolFeeBP, protocol, royaltiesRegistry.address);

    const token = await TestERC721.new();

    //TEST-CASE 1: ETH <=> ERC721
    await token.mint(seller, tokenId)
    await token.setApprovalForAll(transferProxy.address, true, {from: seller})

    let encDataLeft = await encDataV2([[], [], true]);
    let encDataRight = await encDataV2([[], [], false]);

    const left = Order(buyer, Asset(ETH, "0x", 1000), zeroAddress, Asset(ERC721, enc( token.address, tokenId), 1), 0, 0, 0, ORDER_DATA_V2, encDataLeft);
		const right = Order(seller, Asset(ERC721, enc( token.address, tokenId), 1), zeroAddress, Asset(ETH, "0x", 1000), 1, 0, 0, ORDER_DATA_V2, encDataRight);
    
    console.log("OLD RARIBLE: match ETH <=> ERC721")
    await verifyBalanceChangeReturnTx(web3, buyer, 1030, async () =>
      verifyBalanceChangeReturnTx(web3, protocol, -60, async () =>
        verifyBalanceChangeReturnTx(web3, seller, -970, async () =>
          exchangeV2.matchOrders(left, "0x", right, await getSignature(exchangeV2, right, seller), { from: buyer, value: 1030})
        )
      )
    )
    console.log()

    const tokenid1 = "1235112312"

    //TEST-CASE 2: ETH <=> ERC721
    await token.mint(seller, tokenid1)
    await token.setApprovalForAll(transferProxy.address, true, {from: seller})

    const left1 = Order(buyer, Asset(ETH, "0x", 1000), zeroAddress, Asset(ERC721, enc( token.address, tokenid1), 1), 0, 0, 0, ORDER_DATA_V2, encDataLeft);
		const right1 = Order(seller, Asset(ERC721, enc( token.address, tokenid1), 1), zeroAddress, Asset(ETH, "0x", 1000), 2, 0, 0, ORDER_DATA_V2, encDataRight);
    
    console.log("OLD RARIBLE: match ETH <=> ERC721 (second token of collection)")
    await verifyBalanceChangeReturnTx(web3, buyer, 1030, async () =>
      verifyBalanceChangeReturnTx(web3, protocol, -60, async () =>
        verifyBalanceChangeReturnTx(web3, seller, -970, async () =>
          exchangeV2.matchOrders(left1, "0x", right1, await getSignature(exchangeV2, right1, seller), { from: buyer, value: 1100})
        )
      )
    )
    console.log()

    const cancelTx1 = await exchangeV2.cancel(right, {from: seller})
    console.log("OLD RARIBLE: cancel ETH order", cancelTx1.receipt.gasUsed)
  })

  it("OLD rarible ERC-20", async () => {
		const exchangeV2 = await ExchangeV2Old.new();
		const transferProxy = await TransferProxy.new();
    await transferProxy.__TransferProxy_init()
    await transferProxy.addOperator(exchangeV2.address)
		const erc20TransferProxy = await ERC20TransferProxy.new();
    await erc20TransferProxy.__ERC20TransferProxy_init();
    await erc20TransferProxy.addOperator(exchangeV2.address)
		const royaltiesRegistry = await RoyaltiesRegistry.new();
    await exchangeV2.__ExchangeV2_init(transferProxy.address, erc20TransferProxy.address, protocolFeeBP, protocol, royaltiesRegistry.address);

    const token = await TestERC721.new();
    const erc20 = await TestERC20.new();

    //TEST-CASE 1: ERC20 <=> ERC721
    await token.mint(seller, tokenId)
    await token.setApprovalForAll(transferProxy.address, true, {from: seller})

    await erc20.mint(buyer, 1030)
    await erc20.approve(erc20TransferProxy.address, 1030, {from: buyer})
    assert.equal(await erc20.balanceOf(buyer), 1030, "erc20 deposit")

    let encDataLeft = await encDataV2([[], [], true]);
    let encDataRight = await encDataV2([[], [], false]);

    const left = Order(buyer, Asset(ERC20, enc(erc20.address), 1000), zeroAddress, Asset(ERC721, enc( token.address, tokenId), 1), 0, 0, 0, ORDER_DATA_V2, encDataLeft);
		const right = Order(seller, Asset(ERC721, enc( token.address, tokenId), 1), zeroAddress, Asset(ERC20, enc(erc20.address), 1000), 1, 0, 0, ORDER_DATA_V2, encDataRight);
    
    const matchTx1 = await exchangeV2.matchOrders(left, "0x", right, await getSignature(exchangeV2, right, seller), { from: buyer});
    console.log("OLD RARIBLE: match ERC20 <=> ERC721", matchTx1.receipt.gasUsed)

    const tokenid1 = "1235112312"

    //TEST-CASE 2: ERC20 <=> ERC721
    await token.mint(seller, tokenid1)
    await token.setApprovalForAll(transferProxy.address, true, {from: seller})

    await erc20.mint(buyer, 1030)
    await erc20.approve(erc20TransferProxy.address, 1030, {from: buyer})
    assert.equal(await erc20.balanceOf(buyer), 1030, "erc20 deposit")

    const left1 = Order(buyer, Asset(ERC20, enc(erc20.address), 1000), zeroAddress, Asset(ERC721, enc( token.address, tokenid1), 1), 0, 0, 0, ORDER_DATA_V2, encDataLeft);
		const right1 = Order(seller, Asset(ERC721, enc( token.address, tokenid1), 1), zeroAddress, Asset(ERC20, enc(erc20.address), 1000), 2, 0, 0, ORDER_DATA_V2, encDataRight);
    
    const matchTx2 = await exchangeV2.matchOrders(left1, "0x", right1, await getSignature(exchangeV2, right1, seller), { from: buyer});
    console.log("OLD RARIBLE: match ERC20 <=> ERC721 (second token of collection)", matchTx2.receipt.gasUsed)

    const cancelTx1 = await exchangeV2.cancel(right, {from: seller})
    console.log("OLD RARIBLE: cancel ERC-20 order", cancelTx1.receipt.gasUsed)

    assert.equal(await token.ownerOf(tokenid1), buyer, "buyer has token1");
    assert.equal(await erc20.balanceOf(buyer), 0, "erc20 buyer");
    assert.equal(await erc20.balanceOf(protocol), 120, "protocol")
    assert.equal(await erc20.balanceOf(seller), 1940, "seller")
  })

  it("openSea ETH", async () => {
    const token = await TestERC721.new();
    const erc20 = await TestERC20.new();

    const wyvernProxyRegistry = await WyvernProxyRegistry.new();
    await wyvernProxyRegistry.registerProxy( {from: seller});
    
    const tokenTransferProxy = await WyvernTokenTransferProxy.new(wyvernProxyRegistry.address);
     
    const openSea = await WyvernExchangeWithBulkCancellations.new(wyvernProxyRegistry.address, tokenTransferProxy.address, erc20.address, protocol, {gas: 6000000})
    await wyvernProxyRegistry.endGrantAuthentication(openSea.address)

    const merkleValidator = await MerkleValidator.new()

    const tokenId = "75613545885676541905391001206491807325218654950449380199280837289294958690904";
     
    await token.mint(seller, tokenId)
    await token.setApprovalForAll(await wyvernProxyRegistry.proxies(seller), true, {from: seller})

    const matchData = (await getOpenSeaMatchDataMerkleValidator(
      openSea.address,
      buyer,
      seller,
      merkleValidator.address,
      protocol,
      "1000",
      token.address,
      zeroAddress
    ))

    const txMatch = await openSea.atomicMatch_(...matchData, {from:buyer, gas: 500000, value: 1000})

    console.log("OPENSEA: ETH <=> ERC721", txMatch.receipt.gasUsed)
  })

  it("openSea ERC20", async () => {
    const token = await TestERC721.new();
    const erc20 = await TestERC20.new();

    const wyvernProxyRegistry = await WyvernProxyRegistry.new();
    await wyvernProxyRegistry.registerProxy( {from: seller});
    
    const tokenTransferProxy = await WyvernTokenTransferProxy.new(wyvernProxyRegistry.address);
     
    const openSea = await WyvernExchangeWithBulkCancellations.new(wyvernProxyRegistry.address, tokenTransferProxy.address, erc20.address, protocol, {gas: 6000000})
    await wyvernProxyRegistry.endGrantAuthentication(openSea.address)

    const merkleValidator = await MerkleValidator.new()

    const tokenId = "75613545885676541905391001206491807325218654950449380199280837289294958690904";
     
    await token.mint(seller, tokenId)
    await token.setApprovalForAll(await wyvernProxyRegistry.proxies(seller), true, {from: seller})

    await erc20.approve(tokenTransferProxy.address, 100, {from: seller})

    await erc20.mint(buyer, 1000)
    await erc20.approve(tokenTransferProxy.address, 1000, {from: buyer})
    
    const matchData = (await getOpenSeaMatchDataMerkleValidator(
      openSea.address,
      buyer,
      seller,
      merkleValidator.address,
      protocol,
      "1000",
      token.address,
      erc20.address
    ))

    const txMatch = await openSea.atomicMatch_(...matchData, {from:buyer, gas: 500000})

    console.log("OPENSEA: ERC20 <=> ERC721", txMatch.receipt.gasUsed)
    
    assert.equal(await token.ownerOf(tokenId), buyer, "buyer has token1");
    assert.equal(await erc20.balanceOf(buyer), 0, "erc20 buyer");
    assert.equal(await erc20.balanceOf(protocol), 100, "protocol")
    assert.equal(await erc20.balanceOf(seller), 900, "seller")
    
    const orderToCancel = await getOpenSeaOrder(
      openSea.address,
      buyer,
      seller,
      merkleValidator.address,
      protocol,
      "100000",
      token.address,
      erc20.address
    )

    const txCancel = await openSea.cancelOrder_(...orderToCancel, {from: buyer})
    console.log("OPENSEA: cancel 1 order", txCancel.receipt.gasUsed)

    const txCancelBulk = await openSea.incrementNonce({from: buyer})
    console.log("OPENSEA: bulk cancel (increment nonce)", txCancelBulk.receipt.gasUsed)
  })

  it("seaport ETH", async () => {
    const conduitController = await ConduitController.new();
    const seaport = await Seaport.new(conduitController.address)
  
    const token = await TestERC721.new();
    await token.mint(seller, tokenId)
    await token.setApprovalForAll(seaport.address, true, {from: seller})

    const basicOrder = {
      offerer: seller,
      zone: '0x89cEC4f36A0DDFb65Ca35b4Ec6021E8a0772B39d',
      basicOrderType: 0,
      offerToken: token.address,
      offerIdentifier: '0x3039',
      offerAmount: '0x01',
      considerationToken: '0x0000000000000000000000000000000000000000',
      considerationIdentifier: '0x00',
      considerationAmount: '0x64',
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
          amount: '0xa',
          //recipient: '0x6ef1ff55b97d3FfDD8E2C125874296587907C0fc'
          recipient: protocol
        }
      ]
    }
    console.log("SEAPORT: ETH <=> ERC721")
    await verifyBalanceChangeReturnTx(web3, buyer, 110, async () =>
      verifyBalanceChangeReturnTx(web3, protocol, -10, async () =>
        verifyBalanceChangeReturnTx(web3, seller, -100, async () =>
          seaport.fulfillBasicOrder(basicOrder, {from: buyer, value: "110"})
        )
      )
    )
    console.log()
  })

  it("seaport ERC-20", async () => {
    const conduitController = await ConduitController.new();
    const seaport = await Seaport.new(conduitController.address)
  
    const token = await TestERC721.new();
    await token.mint(seller, tokenId)
    await token.setApprovalForAll(seaport.address, true, {from: seller})

    const erc20 = await TestERC20.new();
    await erc20.mint(buyer, 110)
    await erc20.approve(seaport.address, 110, {from: buyer})

    const basicOrder = {
      offerer: seller,
      zone: '0x89cEC4f36A0DDFb65Ca35b4Ec6021E8a0772B39d',
      basicOrderType: 8,
      offerToken: token.address,
      offerIdentifier: '0x3039',
      offerAmount: '0x01',
      considerationToken: erc20.address,
      considerationIdentifier: '0x00',
      considerationAmount: '0x64',
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
          amount: '0xa',
          recipient: protocol
        }
      ]
    }
  
    const tx = await seaport.fulfillBasicOrder(basicOrder, {from: buyer})
    console.log("SEAPORT: ERC20 <=> ERC721", tx.receipt.gasUsed)

    assert.equal(await token.ownerOf(tokenId), buyer, "buyer has tokenId");
    assert.equal(await erc20.balanceOf(buyer), 0, "erc20 buyer");
    assert.equal(await erc20.balanceOf(protocol), 10, "protocol")
    assert.equal(await erc20.balanceOf(seller), 100, "seller")
  })

  it("x2y2 erc-721 ETH", async () => {

    const x2y2helper = await X2Y2TestHelper.new()
    const weth = await WETH9.new()

    const x2y2 = await X2Y2_r1.new()
    await x2y2.initialize(120000, weth.address)

    //doesn't work?
    //const x2y2 = await deployProxy(X2Y2_r1, [120000, weth.address], { initializer: "initialize" });

    await weth.deposit({value: 100, from: buyer})
    await weth.approve(x2y2.address, 100, {from: buyer})
    
    const erc721delegate = await ERC721Delegate.new();
    await erc721delegate.grantRole("0x7630198b183b603be5df16e380207195f2a065102b113930ccb600feaf615331", x2y2.address);
    await x2y2.updateDelegates([erc721delegate.address], [])

    const token = await TestERC721.new();
    await token.mint(seller, tokenId)
    await token.setApprovalForAll(erc721delegate.address, true, {from: seller})
    const tokenDataToEncode = [
      {
        token: token.address,
        tokenId: tokenId
      }
    ]
    const data = await x2y2helper.encodeData(tokenDataToEncode)

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

    const itemHash = await x2y2helper.hashItem(order, orderItem)

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
        "amountToEth": "100",
        "amountToWeth": "0",
        "user": buyer,
        "canFail": false
      },
      "r": "0xc0f030ffba87896654c2981bda9c5ef0849c33a2b637fea7a777c8019ca13427",
      "s": "0x26b893c0b10eb13815aae1e899ecb02dd1b2ed1995c21e4f1eb745e14f49f51f",
      "v": 28
    }

    const tx = await x2y2.run(input, {from: buyer, value: 900})

    console.log("X2Y2: ETH <=> ERC721", tx.receipt.gasUsed)
    assert.equal(await token.ownerOf(tokenId), buyer, "buyer has tokenId");
  })

  it("x2y2 erc-1155 ETH", async () => {

    const x2y2helper = await X2Y2TestHelper.new()
    const weth = await WETH9.new()

    const x2y2 = await X2Y2_r1.new()
    await x2y2.initialize(120000, weth.address)

    await weth.deposit({value: 100, from: buyer})
    await weth.approve(x2y2.address, 100, {from: buyer})
    
    const erc1155delegate = await ERC1155Delegate.new();
    await erc1155delegate.grantRole("0x7630198b183b603be5df16e380207195f2a065102b113930ccb600feaf615331", x2y2.address);
    await x2y2.updateDelegates([erc1155delegate.address], [])

    const token = await TestERC1155.new();
    const amount = 5;
    await token.mint(seller, tokenId, amount)
    await token.setApprovalForAll(erc1155delegate.address, true, {from: seller})

    const tokenDataToEncode = [
      {
        token: token.address,
        tokenId: tokenId,
        amount: amount
      }
    ]
    const data = await x2y2helper.encodeData1155(tokenDataToEncode)

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

    const itemHash = await x2y2helper.hashItem(order, orderItem)

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
        "amountToEth": "100",
        "amountToWeth": "0",
        "user": buyer,
        "canFail": false
      },
      "r": "0xc0f030ffba87896654c2981bda9c5ef0849c33a2b637fea7a777c8019ca13427",
      "s": "0x26b893c0b10eb13815aae1e899ecb02dd1b2ed1995c21e4f1eb745e14f49f51f",
      "v": 28
    }

    const tx = await x2y2.run(input, {from: buyer, value: 900})

    console.log("X2Y2: ETH <=> ERC1155", tx.receipt.gasUsed)
    assert.equal(await token.balanceOf(buyer, tokenId), amount, "buyer has tokenId");
  })
  
  it("sudoswap ETH", async () => {

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
    
    const token = await TestERC721.new();

    await token.mint(seller, tokenId)
    await token.setApprovalForAll(factory.address, true, {from: seller})

    const nftGetter = accounts[5];

    const inpput = [
      token.address,
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

    assert.equal(await token.ownerOf(tokenId), pair, "pair has token")

    const Pair = await LSSVMPairMissingEnumerableETH.at(pair)
    //console.log(await Pair.getBuyNFTQuote(1))
    console.log("SUDOSWAP: ETH <=> ERC721")
    await verifyBalanceChangeReturnTx(web3, seller, -1100, async () =>
      verifyBalanceChangeReturnTx(web3, factory.address, -5, async () =>
        verifyBalanceChangeReturnTx(web3, buyer, 1105, async () =>
          router.swapETHForSpecificNFTs( [ {pair: pair, nftIds: [ tokenId ] } ], buyer, nftGetter, "99999999999999", { from: buyer, value: 1105} )
        )
      )
    )
    assert.equal(await token.ownerOf(tokenId), nftGetter, "pair has token")
  })

  it("looksrare V2 ETH", async () => {

    const seller = accounts[4];
    const nftGetter = accounts[5];
    const buyer = accounts[6]
    
    const owner = accounts[0]
    const protocolFeeRecipient = accounts[8]

    //deploy contracts
    const transferManager = await TransferManager.new(owner);

    const strategyCollectionOffer = await StrategyCollectionOffer.new()

    const weth = await WETH9.new()

    const looksRareProtocol = await LooksRareProtocol.new(owner, protocolFeeRecipient, transferManager.address, weth.address)

    //setup contracts
    await transferManager.allowOperator(looksRareProtocol.address);
    
    await looksRareProtocol.updateCurrencyStatus(zeroAddress, true)
    await looksRareProtocol.updateCurrencyStatus(weth.address, true)

    await looksRareProtocol.addStrategy(50, 50, 200, "0x84ad8c47", true, strategyCollectionOffer.address)
    await looksRareProtocol.addStrategy(50, 50, 200, "0x7e897147", true, strategyCollectionOffer.address)

    //mint NFT
    const token = await TestERC721.new();
    await token.mint(seller, tokenId)
    await token.setApprovalForAll(transferManager.address, true, {from: seller})
    await transferManager.grantApprovals([looksRareProtocol.address], {from: seller})

    //sale 1
    const data1 = {
      "takerBid": {
        "recipient": nftGetter,
        "additionalParameters": "0x"
      },
      "makerAsk": {
        "quoteType": "1",
        "globalNonce": "0",
        "subsetNonce": "0",
        "orderNonce": "0",
        "strategyId": "0",
        "collectionType": "0",
        "collection": token.address,
        "currency": zeroAddress,
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
      "affiliate": zeroAddress
    }

    await verifyBalanceChangeReturnTx(web3, seller, -995, async () =>
      verifyBalanceChangeReturnTx(web3, buyer, 1001, async () =>
        verifyBalanceChangeReturnTx(web3, protocolFeeRecipient, -5, async () =>
          looksRareProtocol.executeTakerBid(data1.takerBid, data1.makerAsk, data1.makerSignature, data1.merkleTree, data1.affiliate, {from: buyer, value: 2000} )
        )
      )
    )

    assert.equal(await token.ownerOf(tokenId), nftGetter, "getter has token")

    //sale 2
    await token.setApprovalForAll(transferManager.address, true, {from: nftGetter})
    await transferManager.grantApprovals([looksRareProtocol.address], {from: nftGetter})

    const data2 = {
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
        "collection": token.address,
        "currency": zeroAddress,
        "signer":nftGetter,
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
      "affiliate": zeroAddress
    }

    await verifyBalanceChangeReturnTx(web3, nftGetter, -995, async () =>
      verifyBalanceChangeReturnTx(web3, buyer, 1000, async () =>
        verifyBalanceChangeReturnTx(web3, protocolFeeRecipient, -5, async () =>
          looksRareProtocol.executeTakerBid(data2.takerBid, data2.makerAsk, data2.makerSignature, data2.merkleTree, data2.affiliate, {from: buyer, value: 2000} )
        )
      )
    )

    assert.equal(await token.ownerOf(tokenId), buyer, "getter has token")
  })


it("blur V2 ETH", async () => {

  const seller = accounts[4];
  const nftGetter = accounts[5];
  const buyer = accounts[6]
  
  const feeFromSeller = accounts[8]
  const feeFromBuyer = accounts[9]
  //deploy and setup contracts
  const executionDelegate = await ExecutionDelegate.new()
  const policyManager = await PolicyManager.new()
  const standardPolicyERC721 = await StandardPolicyERC721.new()

  await policyManager.addPolicy(standardPolicyERC721.address)

  const blurExchange = await BlurExchange.new()
  await blurExchange.initialize(executionDelegate.address, policyManager.address, zeroAddress, 50)

  await executionDelegate.approveContract(blurExchange.address)

  //mint NFT
  const token = await TestERC721.new();
  await token.mint(seller, tokenId)
  await token.setApprovalForAll(executionDelegate.address, true, {from: seller})

  const input = {
    "sell": {
      "order": {
        "trader": seller,
        "side": 1,
        "matchingPolicy": standardPolicyERC721.address,
        "collection": token.address,
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
        "trader": buyer,
        "side": 0,
        "matchingPolicy": standardPolicyERC721.address,
        "collection": token.address,
        "tokenId": tokenId,
        "amount": "1",
        "paymentToken": "0x0000000000000000000000000000000000000000",
        "price": 1000,
        "listingTime": "168181880",
        "expirationTime": "16813091771",
        "fees": [
          {
            "rate": 1000,
            "recipient": feeFromBuyer
          }
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

  await verifyBalanceChangeReturnTx(web3, seller, -800, async () =>
    verifyBalanceChangeReturnTx(web3, buyer, 1100, async () =>
      verifyBalanceChangeReturnTx(web3, feeFromBuyer, -100, async () =>
        verifyBalanceChangeReturnTx(web3, feeFromSeller, -200, async () =>
          blurExchange.execute(input.sell, input.buy, {from: buyer, value: 2000} )
        )
      )
    )
  )

  assert.equal(await token.ownerOf(tokenId), buyer, "getter has token")

})

  async function getOpenSeaMatchDataMerkleValidator(
    exchange, 
    buyer, 
    seller, 
    merkleValidatorAddr,
    protocol,
    basePrice,
    token,
    paymentToken
    ) {
    
    const addr = [
      exchange, // exchange buy
      buyer, // maker buy
      seller, // taker buy
      zeroAddress, // feeRecipient buy
      merkleValidatorAddr, // target buy (MerkleValidator)
      zeroAddress, // staticTarget buy
      paymentToken, // paymentToken buy (ETH)

      exchange, // exchange sell
      seller, // maker sell
      zeroAddress, // taker sell
      protocol, // feeRecipient sell (originFee )
      merkleValidatorAddr, // target sell (MerkleValidator)
      zeroAddress, // staticTarget sell
      paymentToken // paymentToken sell (ETH)

    ]

    const now = Math.floor(Date.now() / 1000)
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
    ]

    const feeMethodsSidesKindsHowToCalls = [
      1, // FeeMethod{ ProtocolFee, SplitFee }) buy
      0, // SaleKindInterface.Side({ Buy, Sell }) buy
      0, // SaleKindInterface.SaleKind({ FixedPrice, DutchAuction }) buy
      1, // AuthenticatedProxy.HowToCall({ Call, DelegateCall } buy

      1, // FeeMethod({ ProtocolFee, SplitFee }) sell
      1, // SaleKindInterface.Side({ Buy, Sell } sell
      0, // SaleKindInterface.SaleKind({ FixedPrice, DutchAuction } sell
      1  // AuthenticatedProxy.HowToCall({ Call, DelegateCall } sell
    ]

    const zeroWord = "0000000000000000000000000000000000000000000000000000000000000000";

    // constant tokenId !!!
    const hexTokenId = "a72bc016be8f075fdf24964fd62c422101574bb4000000000000020000000258"

    const merklePart = "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000"
    const methodSigPart = "0xfb16a595"

    const calldataBuy = methodSigPart + zeroWord + addrToBytes32No0x(buyer) + addrToBytes32No0x(token) + hexTokenId + merklePart;
    const calldataSell = methodSigPart + addrToBytes32No0x(seller) + zeroWord + addrToBytes32No0x(token) + hexTokenId + merklePart;

    const replacementPatternBuy =  "0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
    const replacementPatternSell = "0x000000000000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
    
    const staticExtradataBuy = "0x"
    const staticExtradataSell = "0x"

    const vs = [
      27, // sig v buy
      27 // sig v sell
    ]
    const rssMetadata = [
      "0x" + zeroWord, // sig r buy
      "0x" + zeroWord, // sig s buy
      "0x" + zeroWord, // sig r sell
      "0x" + zeroWord, // sig s sell
      "0x" + zeroWord  // metadata
    ]

    return [
      addr, 
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

  async function getOpenSeaOrder(
    exchange, 
    buyer, 
    seller, 
    merkleValidatorAddr,
    feeRecipient,
    basePrice,
    token,
    paymentToken
  ) {

    const addr = [
      exchange, // exchange 
      buyer, // maker 
      seller, // taker 
      feeRecipient, // feeRecipient 
      merkleValidatorAddr, // target  (MerkleValidator)
      zeroAddress, // staticTarget 
      paymentToken, // paymentToken  
    ]

    const now = Math.floor(Date.now() / 1000)
    const listingTime = now - 60*60;
    const expirationTime = now + 60*60;

    const uints = [
      "1000", //makerRelayerFee  (originFee)
      "0", // takerRelayerFee 
      "0", // makerProtocolFee 
      "0", // takerProtocolFee 
      basePrice, // basePrice 
      "0", // extra 
      listingTime, // listingTime 
      expirationTime, // expirationTime 
      "0", // salt 
    ]

    const feeMethod = 1;
    const side = 0;
    const saleKind = 0;
    const howToCall = 1;

    const zeroWord = "0000000000000000000000000000000000000000000000000000000000000000";

    // constant tokenId !!!
    const hexTokenId = "a72bc016be8f075fdf24964fd62c422101574bb4000000000000020000000258"


    const merklePart = "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000"
    const methodSigPart = "0xfb16a595"

    const calldata = methodSigPart + zeroWord + addrToBytes32No0x(buyer) + addrToBytes32No0x(token) + hexTokenId + merklePart;

    const replacementPattern =  "0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
    
    const staticExtradata = "0x"

    const v = 27;
    const r = "0x" + zeroWord // sig r 
    const s = "0x" + zeroWord // sig s 

    return [
      addr, 
      uints, 
      feeMethod, 
      side,
      saleKind,
      howToCall,
      calldata,
      replacementPattern,
      staticExtradata,
      v,
      r,
      s
    ];
  }

  function addrToBytes32No0x(addr) {
    return "000000000000000000000000" + addr.substring(2)
  }

  function encDataV2(tuple) {
    return testHelper.encodeV2(tuple);
  }

  function encDataV3_BUY(tuple) {
    return testHelper.encodeV3_BUY(tuple);
  }

  function encDataV3_SELL(tuple) {
    return testHelper.encodeV3_SELL(tuple);
  }

  async function LibPartToUint(account = zeroAddress, value = 0) {
    return await testHelper.encodeOriginFeeIntoUint(account, value);
  }

  async function getSignature(exchangeV2, order, signer) {
		return sign(order, signer, exchangeV2.address);
	}

});
