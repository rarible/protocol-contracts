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

//OPENSEA
const WyvernExchangeWithBulkCancellations = artifacts.require("WyvernExchangeWithBulkCancellations.sol");
const WyvernTokenTransferProxy = artifacts.require("WyvernTokenTransferProxy.sol");
const MerkleValidator = artifacts.require("MerkleValidator.sol");
const WyvernProxyRegistry = artifacts.require("WyvernProxyRegistry.sol");

//TOKENS
const TestERC721 = artifacts.require("TestERC721.sol");
const TestERC20 = artifacts.require("TestERC20.sol");

// UTILS
const { Order, Asset, sign } = require("../../scripts/order.js");

const zeroAddress = "0x0000000000000000000000000000000000000000";

const { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, ORDER_DATA_V2, ORDER_DATA_V3_BUY, ORDER_DATA_V3_SELL, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, CRYPTO_PUNKS, COLLECTION, TO_LOCK, LOCK, enc, id } = require("../../scripts/assets.js");

contract("Test gas usage", accounts => {

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
    await exchangeV2.__ExchangeV2_init(transferProxy.address, erc20TransferProxy.address, protocolFeeBP, protocol, royaltiesRegistry.address);

    const token = await TestERC721.new();
    const erc20 = await TestERC20.new();

    await exchangeV2.setFeeReceiver(zeroAddress, protocol);
    await exchangeV2.setFeeReceiver(erc20.address, protocol);

    //TEST-CASE 1: ETH <=> ERC721
    await token.mint(seller, tokenId)
    await token.setApprovalForAll(transferProxy.address, true, {from: seller})

    let encDataLeft = await encDataV3_BUY([ await Payouts([[buyer, 10000]]), await OriginFee() ]);
		let encDataRight = await encDataV3_SELL([ await Payouts([[seller, 10000]]), await OriginFee(), 1000 ]);

    const left = Order(buyer, Asset(ETH, "0x", 1000), zeroAddress, Asset(ERC721, enc( token.address, tokenId), 1), 1, 0, 0, ORDER_DATA_V3_BUY, encDataLeft);
		const right = Order(seller, Asset(ERC721, enc( token.address, tokenId), 1), zeroAddress, Asset(ETH, "0x", 1000), 1, 0, 0, ORDER_DATA_V3_SELL, encDataRight);
    
    const matchTx1 = await exchangeV2.matchOrders(left, "0x", right, await getSignature(exchangeV2, right, seller), { from: buyer, value: 1000 });
    console.log("RARIBLE: match ETH <=> ERC721", matchTx1.receipt.gasUsed)

    const tokenid1 = "1235112312"

    //TEST-CASE 2: ETH <=> ERC721
    await token.mint(seller, tokenid1)
    await token.setApprovalForAll(transferProxy.address, true, {from: seller})

    const left1 = Order(buyer, Asset(ETH, "0x", 1000), zeroAddress, Asset(ERC721, enc( token.address, tokenid1), 1), 1, 0, 0, ORDER_DATA_V3_BUY, encDataLeft);
		const right1 = Order(seller, Asset(ERC721, enc( token.address, tokenid1), 1), zeroAddress, Asset(ETH, "0x", 1000), 1, 0, 0, ORDER_DATA_V3_SELL, encDataRight);
    
    const matchTx2 = await exchangeV2.matchOrders(left1, "0x", right1, await getSignature(exchangeV2, right1, seller), { from: buyer, value: 1000});
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

    await exchangeV2.setFeeReceiver(zeroAddress, protocol);
    await exchangeV2.setFeeReceiver(erc20.address, protocol);

    //TEST-CASE 1: ERC20 <=> ERC721
    await token.mint(seller, tokenId)
    await token.setApprovalForAll(transferProxy.address, true, {from: seller})

    await erc20.mint(buyer, 1000)
    await erc20.approve(erc20TransferProxy.address, 1000, {from: buyer})
    assert.equal(await erc20.balanceOf(buyer), 1000, "erc20 deposit")

    let encDataLeft = await encDataV3_BUY([ await Payouts([[buyer, 10000]]), await OriginFee() ]);
		let encDataRight = await encDataV3_SELL([ await Payouts([[seller, 10000]]), await OriginFee(), 1000 ]);

    const left = Order(buyer, Asset(ERC20, enc(erc20.address), 1000), zeroAddress, Asset(ERC721, enc( token.address, tokenId), 1), 1, 0, 0, ORDER_DATA_V3_BUY, encDataLeft);
		const right = Order(seller, Asset(ERC721, enc( token.address, tokenId), 1), zeroAddress, Asset(ERC20, enc(erc20.address), 1000), 1, 0, 0, ORDER_DATA_V3_SELL, encDataRight);
    
    const matchTx1 = await exchangeV2.matchOrders(left, "0x", right, await getSignature(exchangeV2, right, seller), { from: buyer});
    console.log("RARIBLE: match ERC20 <=> ERC721", matchTx1.receipt.gasUsed)

    const tokenid1 = "1235112312"

    //TEST-CASE 2: ERC20 <=> ERC721
    await token.mint(seller, tokenid1)
    await token.setApprovalForAll(transferProxy.address, true, {from: seller})

    await erc20.mint(buyer, 1000)
    await erc20.approve(erc20TransferProxy.address, 1000, {from: buyer})
    assert.equal(await erc20.balanceOf(buyer), 1000, "erc20 deposit")

    const left1 = Order(buyer, Asset(ERC20, enc(erc20.address), 1000), zeroAddress, Asset(ERC721, enc( token.address, tokenid1), 1), 1, 0, 0, ORDER_DATA_V3_BUY, encDataLeft);
		const right1 = Order(seller, Asset(ERC721, enc( token.address, tokenid1), 1), zeroAddress, Asset(ERC20, enc(erc20.address), 1000), 1, 0, 0, ORDER_DATA_V3_SELL, encDataRight);
    
    const matchTx2 = await exchangeV2.matchOrders(left1, "0x", right1, await getSignature(exchangeV2, right1, seller), { from: buyer});
    console.log("RARIBLE: match ERC20 <=> ERC721 (second token of collection)", matchTx2.receipt.gasUsed)

    const cancelTx1 = await exchangeV2.cancel(right, {from: seller})
    console.log("RARIBLE: cancel ERC-20 order", cancelTx1.receipt.gasUsed)

    assert.equal(await token.ownerOf(tokenid1), buyer, "buyer has token1");
    assert.equal(await erc20.balanceOf(buyer), 0, "erc20 buyer");
    assert.equal(await erc20.balanceOf(protocol), 60, "protocol")
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

  function encDataV3_BUY(tuple) {
    return testHelper.encodeV3_BUY(tuple);
  }

  function encDataV3_SELL(tuple) {
    return testHelper.encodeV3_SELL(tuple);
  }

  async function OriginFee(account = zeroAddress, value = 0){
    return await testHelper.encodeOriginFeeIntoUint(account, value);
  }

  async function Payouts(arr = []){
    let result = [];
    for (const element of arr) {
      result.push(await testHelper.encodeOriginFeeIntoUint(element[0], element[1]))
    }
    return result;
  }

  async function getSignature(exchangeV2, order, signer) {
		return sign(order, signer, exchangeV2.address);
	}

});
