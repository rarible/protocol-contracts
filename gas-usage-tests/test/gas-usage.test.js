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

//TOKENS
const TestERC721RoyaltiesV2 = artifacts.require("TestERC721RoyaltiesV2.sol");
const WETH = artifacts.require("WETH.sol");

// UTILS
const EIP712 = require("./EIP712");

const zeroAddress = "0x0000000000000000000000000000000000000000";

const { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, ORDER_DATA_V2, ORDER_DATA_V3_BUY, ORDER_DATA_V3_SELL, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, CRYPTO_PUNKS, COLLECTION, TO_LOCK, LOCK, enc, id } = require("./assets");

contract("Test gas usage", accounts => {

  const registrar = accounts[0]
  const seller = accounts[1];
  const sellerFundsRecipient = accounts[2];
  const operator = accounts[3];
  const buyer = accounts[4];
  const finder = accounts[5];
  const royaltyRecipient = accounts[6];
  const maker = accounts[7];
  const taker = accounts[8];
  const protocol = accounts[9];

  const protocolFeeBP = 300;

  const defaultRoyalties = [[royaltyRecipient, 1000]]

  const tokenId  = 12345;
  const tokenId1 = 123456;
  const tokenId2 = 1234567;
  const tokenId3 = 12345678;

  let testHelper;

  
  before(async () => {
    testHelper = await RaribleTestHelper.new()
  });

	it("zora", async () => {
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

    const token = await TestERC721RoyaltiesV2.new();
    await token.initialize()
    const weth = await WETH.new();

    // Deploy Asks v1.1
    const asks = await AsksV1_1.new(erc20TransferHelper.address, erc721TransferHelper.address, royaltyEngine.address, ZPFS.address, weth.address);
    await ZMM.registerModule(asks.address)
    await ZMM.setApprovalForModule(asks.address, true, {from: seller})
    await ZMM.setApprovalForModule(asks.address, true, {from: buyer})
    await ZPFS.setFeeParams(asks.address, protocol, protocolFeeBP)
    
    const offers = await OffersV1.new(erc20TransferHelper.address, erc721TransferHelper.address, royaltyEngine.address, ZPFS.address, weth.address);
    await ZMM.registerModule(offers.address)
    await ZMM.setApprovalForModule(offers.address, true, {from: seller})
    await ZMM.setApprovalForModule(offers.address, true, {from: buyer})
    await ZPFS.setFeeParams(offers.address, protocol, protocolFeeBP)

    console.log("ASKS:")
    //TEST CASE 1: ask ETH <=> ERC721
    //minting token
    await token.mint(seller, tokenId, defaultRoyalties)
    await token.setApprovalForAll(erc721TransferHelper.address, true, {from: seller})

    const createAsk = await asks.createAsk(token.address, tokenId, 1000, zeroAddress, seller, 1000, {from: seller})
    console.log("ZORA: list ask", createAsk.receipt.gasUsed)

    const cancelAsk = await asks.cancelAsk(token.address, tokenId, {from: seller})
    console.log("ZORA: cancel ask", cancelAsk.receipt.gasUsed)

    await asks.createAsk(token.address, tokenId, 1000, zeroAddress, seller, 1000, {from: seller})

    const fillAsk = await asks.fillAsk(token.address, tokenId, zeroAddress, 1000, finder, {from: buyer, value: 1000})
    console.log("ZORA: buy ETH <=> ERC721, 1 ORIGIN, PROTOCOL FEE, 1 ROYALTY",fillAsk.receipt.gasUsed)
    assert.equal(await token.ownerOf(tokenId), buyer, "buyer has token")

    // TEST CASE 2: ask WETH <=> ERC721
    // minting second token
    await token.mint(seller, tokenId1, defaultRoyalties)
    await token.setApprovalForAll(erc721TransferHelper.address, true, {from: seller})
    
    // getting WETH
    await weth.deposit({value: 1000, from: buyer})
    await weth.approve(erc20TransferHelper.address, 1000, {from: buyer})
    assert.equal(await weth.balanceOf(buyer), 1000, "weth deposit")

    //CREATING ASK
    await asks.createAsk(token.address, tokenId1, 1000, weth.address, seller, 1000, {from: seller})

    const fillAsk1 = await asks.fillAsk(token.address, tokenId1, weth.address, 1000, finder, {from: buyer})
    console.log("ZORA: buy ERC20 <=> ERC721, 1 ORIGIN, PROTOCOL FEE, 1 ROYALTY",fillAsk1.receipt.gasUsed)
    assert.equal(await token.ownerOf(tokenId1), buyer, "buyer has token1");
    assert.equal(await weth.balanceOf(buyer), 0, "weth buyer");
    assert.equal(await weth.balanceOf(royaltyRecipient), 100, "royalties")
    assert.equal(await weth.balanceOf(protocol), 27, "protocol")
    assert.equal(await weth.balanceOf(finder), 87, "finder")
    assert.equal(await weth.balanceOf(seller), 786, "finder")

    console.log()
    console.log("OFFERS:")
    // TEST-CASE 3: offer ETH <=> ERC721
    await token.mint(seller, tokenId2, defaultRoyalties)
    await token.setApprovalForAll(erc721TransferHelper.address, true, {from: seller})

    const createOffer = await offers.createOffer(token.address, tokenId2, zeroAddress, 1000, 1000, {from: buyer, value: 1000})
    console.log("ZORA: list offer (bid)", createOffer.receipt.gasUsed)

    const cancelOffer = await offers.cancelOffer(token.address, tokenId2, 1, {from: buyer})
    console.log("ZORA: cancel offer (bid)", cancelOffer.receipt.gasUsed)

    await offers.createOffer(token.address, tokenId2, zeroAddress, 1000, 1000, {from: buyer, value: 1000})

    const fillOffer = await offers.fillOffer(token.address, tokenId2, 2, zeroAddress, 1000, finder, {from: seller})
    console.log("ZORA: accept bid ERC20 <=> ERC721, 1 ORIGIN, PROTOCOL FEE, 1 ROYALTY", fillOffer.receipt.gasUsed)
    assert.equal(await token.ownerOf(tokenId2), buyer, "buyer has token")

    // TEST-CASE 4: offer ERC20 <=> ERC721
    await token.mint(seller, tokenId3, defaultRoyalties)
    await token.setApprovalForAll(erc721TransferHelper.address, true, {from: seller})

    // getting WETH
    await weth.deposit({value: 1000, from: buyer})
    await weth.approve(erc20TransferHelper.address, 2000, {from: buyer})
    assert.equal(await weth.balanceOf(buyer), 1000, "weth deposit")

    const createOffer1 = await offers.createOffer(token.address, tokenId3, weth.address, 1000, 1000, {from: buyer})
    console.log("ZORA: list offer (bid)", createOffer1.receipt.gasUsed)

    const cancelOffer1 = await offers.cancelOffer(token.address, tokenId3, 3, {from: buyer})
    console.log("ZORA: cancel offer (bid)", cancelOffer1.receipt.gasUsed)

    await offers.createOffer(token.address, tokenId3, weth.address, 1000, 1000, {from: buyer})

    const fillOffer1 = await offers.fillOffer(token.address, tokenId3, 4, weth.address, 1000, finder, {from: seller})
    console.log("ZORA: accept bid ERC20 <=> ERC721, 1 ORIGIN, PROTOCOL FEE, 1 ROYALTY", fillOffer1.receipt.gasUsed)
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

    const token = await TestERC721RoyaltiesV2.new();
    await token.initialize()
    const weth = await WETH.new();

    await exchangeV2.setFeeReceiver(zeroAddress, protocol);
    await exchangeV2.setFeeReceiver(weth.address, protocol);

    //TEST-CASE 1: ETH <=> ERC721
    await token.mint(seller, tokenId, defaultRoyalties)
    await token.setApprovalForAll(transferProxy.address, true, {from: seller})

    let encDataLeft = await encDataV3_BUY([ await Payouts([[buyer, 10000]]), await OriginFee(finder, 300) ]);
		let encDataRight = await encDataV3_SELL([ await Payouts([[seller, 10000]]), await OriginFee(finder, 400), 1000 ]);

    const left = Order(buyer, Asset(ETH, "0x", 1000), zeroAddress, Asset(ERC721, enc( token.address, tokenId), 1), 1, 0, 0, ORDER_DATA_V3_BUY, encDataLeft);
		const right = Order(seller, Asset(ERC721, enc( token.address, tokenId), 1), zeroAddress, Asset(ETH, "0x", 1000), 1, 0, 0, ORDER_DATA_V3_SELL, encDataRight);
    
    const matchTx1 = await exchangeV2.matchOrders(left, "0x", right, await getSignature(exchangeV2, right, seller), { from: buyer, value: 1000 });
    console.log("RARIBLE: match ETH <=> ERC721", matchTx1.receipt.gasUsed)
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
    await royaltiesRegistry.__RoyaltiesRegistry_init()
    await exchangeV2.__ExchangeV2_init(transferProxy.address, erc20TransferProxy.address, protocolFeeBP, protocol, royaltiesRegistry.address);

    const token = await TestERC721RoyaltiesV2.new();
    await token.initialize()
    const weth = await WETH.new();

    await exchangeV2.setFeeReceiver(zeroAddress, protocol);
    await exchangeV2.setFeeReceiver(weth.address, protocol);

    //TEST-CASE 1: ETH <=> ERC721
    await token.mint(seller, tokenId, defaultRoyalties)
    await token.setApprovalForAll(transferProxy.address, true, {from: seller})

    await weth.deposit({value: 1000, from: buyer})
    await weth.approve(erc20TransferProxy.address, 2000, {from: buyer})
    assert.equal(await weth.balanceOf(buyer), 1000, "weth deposit")

    let encDataLeft = await encDataV3_BUY([ await Payouts([[buyer, 10000]]), await OriginFee(finder, 300) ]);
		let encDataRight = await encDataV3_SELL([ await Payouts([[seller, 10000]]), await OriginFee(finder, 400), 1000 ]);

    const left = Order(buyer, Asset(ERC20, enc(weth.address), 1000), zeroAddress, Asset(ERC721, enc( token.address, tokenId), 1), 1, 0, 0, ORDER_DATA_V3_BUY, encDataLeft);
		const right = Order(seller, Asset(ERC721, enc( token.address, tokenId), 1), zeroAddress, Asset(ERC20, enc(weth.address), 1000), 1, 0, 0, ORDER_DATA_V3_SELL, encDataRight);
    
    const matchTx1 = await exchangeV2.matchOrders(left, "0x", right, await getSignature(exchangeV2, right, seller), { from: buyer});
    console.log("RARIBLE: match ERC20 <=> ERC721", matchTx1.receipt.gasUsed)

    const cancelTx = await exchangeV2.cancel(right, {from: seller})
    console.log("RARIBLE: cancel order", cancelTx.receipt.gasUsed)

    assert.equal(await token.ownerOf(tokenId), buyer, "buyer has token1");
    assert.equal(await weth.balanceOf(buyer), 0, "weth buyer");
    assert.equal(await weth.balanceOf(royaltyRecipient), 100, "royalties")
    assert.equal(await weth.balanceOf(protocol), 30, "protocol")
    assert.equal(await weth.balanceOf(finder), 70, "finder")
    assert.equal(await weth.balanceOf(seller), 800, "seller")
  })

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

  function AssetType(assetClass, data) {
    return { assetClass, data }
  }

  function Asset(assetClass, assetData, value) {
    return { assetType: AssetType(assetClass, assetData), value };
  }

  function Order(maker, makeAsset, taker, takeAsset, salt, start, end, dataType, data) {
    return { maker, makeAsset, taker, takeAsset, salt, start, end, dataType, data };
  }

  const Types = {
    AssetType: [
      {name: 'assetClass', type: 'bytes4'},
      {name: 'data', type: 'bytes'}
    ],
    Asset: [
      {name: 'assetType', type: 'AssetType'},
      {name: 'value', type: 'uint256'}
    ],
    Order: [
      {name: 'maker', type: 'address'},
      {name: 'makeAsset', type: 'Asset'},
      {name: 'taker', type: 'address'},
      {name: 'takeAsset', type: 'Asset'},
      {name: 'salt', type: 'uint256'},
      {name: 'start', type: 'uint256'},
      {name: 'end', type: 'uint256'},
      {name: 'dataType', type: 'bytes4'},
      {name: 'data', type: 'bytes'},
    ]
  };

  async function sign(order, account, verifyingContract) {
    const chainId = Number(await web3.eth.getChainId());
    const data = EIP712.createTypeData({
      name: "Exchange",
      version: "2",
      chainId,
      verifyingContract
    }, 'Order', order, Types);
    return (await EIP712.signTypedData(web3, account, data)).sig;
  }

});
