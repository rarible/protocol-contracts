//RARIBLE
const ExchangeV2 = artifacts.require("ExchangeV2.sol");
const RoyaltiesRegistry = artifacts.require("RoyaltiesRegistry.sol");
const TransferProxy = artifacts.require("TransferProxy.sol");
const ERC20TransferProxy = artifacts.require("ERC20TransferProxy.sol");
const RaribleTestHelper = artifacts.require("RaribleTestHelper.sol");

//RARIBLE Exchange (november 2021)
const ExchangeV2Old = artifacts.require("ExchangeV2Old.sol");

//TOKENS
const TestERC721 = artifacts.require("TestERC721.sol");
const TestERC20 = artifacts.require("TestERC20.sol");

// UTILS
const { Order, Asset, sign } = require("../../../scripts/order.js");

const BN = web3.utils.BN;

const zeroAddress = "0x0000000000000000000000000000000000000000";
const MARKET_MARKER_SELL = "0x68619b8adb206de04f676007b2437f99ff6129b672495a6951499c6c56bc2fa6";
const MARKET_MARKER_BUY =  "0x68619b8adb206de04f676007b2437f99ff6129b672495a6951499c6c56bc2fa7";

const { verifyBalanceChangeReturnTx } = require("../../../scripts/balance")

const { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, ORDER_DATA_V2, ORDER_DATA_V3_BUY, ORDER_DATA_V3_SELL, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, CRYPTO_PUNKS, COLLECTION, TO_LOCK, LOCK, enc, id } = require("../../../scripts/assets.js");

contract("rarible only gas usage tests", accounts => {

  let exchangeV2;
  let exchangeV2OLD;
  let transferProxy;
  let erc20TransferProxy;
  let royaltiesRegistry;

  const seller = accounts[1];
  const buyer = accounts[2];
  const origin1 = accounts[3];
  const additionalRoyalties = accounts[4];

  const protocol = accounts[9];

  const protocolFeeBP = 0;

  const tokenId1 = 12345;
  const tokenId2 = 12345;

  let testHelper;

  const salt = 1;
  const price = 1000;

  beforeEach(async () => {
    testHelper = await RaribleTestHelper.new()

    exchangeV2 = await ExchangeV2.new();
    exchangeV2OLD = await ExchangeV2Old.new();

    transferProxy = await TransferProxy.new();
    await transferProxy.__TransferProxy_init()
    await transferProxy.addOperator(exchangeV2.address)
    await transferProxy.addOperator(exchangeV2OLD.address)

    erc20TransferProxy = await ERC20TransferProxy.new();
    await erc20TransferProxy.__ERC20TransferProxy_init();
    await erc20TransferProxy.addOperator(exchangeV2.address)
    await erc20TransferProxy.addOperator(exchangeV2OLD.address)

    royaltiesRegistry = await RoyaltiesRegistry.new();
    await royaltiesRegistry.__RoyaltiesRegistry_init();

    await exchangeV2.__ExchangeV2_init(transferProxy.address, erc20TransferProxy.address, protocolFeeBP, protocol, royaltiesRegistry.address);
    await exchangeV2OLD.__ExchangeV2_init(transferProxy.address, erc20TransferProxy.address, protocolFeeBP, protocol, royaltiesRegistry.address);
  });

  it("NEW + OLD: cancel()", async () => {
    const token = await TestERC721.new();

    let encDataRight = await encDataV3_SELL([await LibPartToUint(seller, 10000), await LibPartToUint(), 0, 1000, MARKET_MARKER_SELL]);

    const right = Order(seller, Asset(ERC721, enc(token.address, tokenId1), 1), zeroAddress, Asset(ETH, "0x", 1000), 1, 0, 0, ORDER_DATA_V3_SELL, encDataRight);

    const cancelTx1 = await exchangeV2.cancel(right, { from: seller })
    console.log("RARIBLE NEW: cancel order", cancelTx1.receipt.gasUsed)

    const cancelTx2 = await exchangeV2OLD.cancel(right, { from: seller })
    console.log("RARIBLE OLD: cancel order", cancelTx2.receipt.gasUsed)
  })


  it("RARIBLE NEW: ETH ROYALTIES = SELLER", async () => {
    const token = await TestERC721.new();
    const nftAmount = 1;
    await token.mint(seller, tokenId1)
    await token.setApprovalForAll(transferProxy.address, true, { from: seller })

    let addrOriginLeft = await LibPartToUint(origin1, 300);
    let addrOriginRight = await LibPartToUint(origin1, 300);

    let encDataLeft = await encDataV3_SELL([0, addrOriginRight, 0, 1000, MARKET_MARKER_SELL]);
    let encDataRight = await encDataV3_BUY([0, addrOriginLeft, 0, MARKET_MARKER_BUY]);

    const _nftSellAssetData = enc(token.address, tokenId1);
    const _nftPurchaseAssetData = "0x";

    const left = Order(seller, Asset(ERC721, _nftSellAssetData, nftAmount), zeroAddress, Asset(ETH, _nftPurchaseAssetData, price), salt, 0, 0, ORDER_DATA_V3_SELL, encDataLeft);

    await royaltiesRegistry.setRoyaltiesByToken(token.address, [[seller, 1000]]);
    const signature = await getSignature(exchangeV2, left, seller);

    var directPurchaseParams = {
      sellOrderMaker: seller,
      sellOrderNftAmount: nftAmount,
      nftAssetClass: ERC721,
      nftData: _nftSellAssetData,
      sellOrderPaymentAmount: price,
      paymentToken: zeroAddress,
      sellOrderSalt: salt,
      sellOrderStart: 0,
      sellOrderEnd: 0,
      sellOrderDataType: ORDER_DATA_V3_SELL,
      sellOrderData: encDataLeft,
      sellOrderSignature: signature,
      buyOrderPaymentAmount: price,
      buyOrderNftAmount: nftAmount,
      buyOrderData: encDataRight
    };

    console.log("RARIBLE NEW: direct buy ETH <=> ERC721 ROYALTIES = SELLER");
    await verifyBalanceChangeReturnTx(web3, buyer, 1000, async () =>
      verifyBalanceChangeReturnTx(web3, protocol, 0, async () =>
        verifyBalanceChangeReturnTx(web3, origin1, -60, async () =>
          verifyBalanceChangeReturnTx(web3, additionalRoyalties, 0, async () =>
            verifyBalanceChangeReturnTx(web3, seller, -940, async () =>
              exchangeV2.directPurchase(directPurchaseParams, { from: buyer, value: price})
            )
          )
        )
      )
    )
    console.log()
  })

  it("RARIBLE NEW: ETH ROYALTIES != SELLER", async () => {
    const token = await TestERC721.new();
    const nftAmount = 1;
    await token.mint(seller, tokenId1)
    await token.setApprovalForAll(transferProxy.address, true, { from: seller })

    let addrOriginLeft = await LibPartToUint(origin1, 300);
    let addrOriginRight = await LibPartToUint(origin1, 300);

    let encDataLeft = await encDataV3_SELL([0, addrOriginRight, 0, 1000, MARKET_MARKER_SELL]);
    let encDataRight = await encDataV3_BUY([0, addrOriginLeft, 0, MARKET_MARKER_BUY]);

    const _nftSellAssetData = enc(token.address, tokenId1);
    const _nftPurchaseAssetData = "0x";

    const left = Order(seller, Asset(ERC721, _nftSellAssetData, nftAmount), zeroAddress, Asset(ETH, "0x", price), salt, 0, 0, ORDER_DATA_V3_SELL, encDataLeft);

    await royaltiesRegistry.setRoyaltiesByToken(token.address, [[additionalRoyalties, 1000]]);

    const signature = await getSignature(exchangeV2, left, seller);

    var directPurchaseParams = {
      sellOrderMaker: seller,
      sellOrderNftAmount: nftAmount,
      nftAssetClass: ERC721,
      nftData: _nftSellAssetData,
      sellOrderPaymentAmount: price,
      paymentToken: zeroAddress,
      sellOrderSalt: salt,
      sellOrderStart: 0,
      sellOrderEnd: 0,
      sellOrderDataType: ORDER_DATA_V3_SELL,
      sellOrderData: encDataLeft,
      sellOrderSignature: signature,
      buyOrderPaymentAmount: price,
      buyOrderNftAmount: nftAmount,
      buyOrderData: encDataRight
    };

    console.log("RARIBLE NEW: direct buy ETH <=> ERC721 ROYALTIES != SELLER:");
    await verifyBalanceChangeReturnTx(web3, buyer, 1000, async () =>
      verifyBalanceChangeReturnTx(web3, protocol, 0, async () =>
        verifyBalanceChangeReturnTx(web3, origin1, -60, async () =>
          verifyBalanceChangeReturnTx(web3, additionalRoyalties, -100, async () =>
            verifyBalanceChangeReturnTx(web3, seller, -840, async () =>
              exchangeV2.directPurchase(directPurchaseParams, { from: buyer, value: price})
            )
          )
        )
      )
    )
    console.log()
  })

  it("RARIBLE NEW matchOrders(): ETH ROYALTIES != SELLER", async () => {
    const token = await TestERC721.new();

    await token.mint(seller, tokenId1)
    await token.setApprovalForAll(transferProxy.address, true, { from: seller })

    let addrOriginLeft = await LibPartToUint(origin1, 300);
    let addrOriginRight = await LibPartToUint(origin1, 300);

    let encDataLeft = await encDataV3_SELL([0, addrOriginRight, 0, 1000, MARKET_MARKER_SELL]);
    let encDataRight = await encDataV3_BUY([0, addrOriginLeft, 0, MARKET_MARKER_BUY]);

    const left = Order(seller, Asset(ERC721, enc(token.address, tokenId1), 1), zeroAddress, Asset(ETH, "0x", price), salt, 0, 0, ORDER_DATA_V3_SELL, encDataLeft);
    const right = Order(buyer,  Asset(ETH, "0x", price), zeroAddress, Asset(ERC721, enc(token.address, tokenId1), 1), 0, 0, 0, ORDER_DATA_V3_BUY, encDataRight);

    await royaltiesRegistry.setRoyaltiesByToken(token.address, [[additionalRoyalties, 1000]]);

    const signature = await getSignature(exchangeV2, left, seller);

    console.log("RARIBLE NEW: matchOrders ETH <=> ERC721 ROYALTIES != SELLER:");
    await verifyBalanceChangeReturnTx(web3, buyer, 1000, async () =>
      verifyBalanceChangeReturnTx(web3, protocol, 0, async () =>
        verifyBalanceChangeReturnTx(web3, origin1, -60, async () =>
          verifyBalanceChangeReturnTx(web3, additionalRoyalties, -100, async () =>
            verifyBalanceChangeReturnTx(web3, seller, -840, async () =>
              exchangeV2.matchOrders(left, signature, right, "0x", { from: buyer, value: price})
            )
          )
        )
      )
    )
    console.log()
  })

  it("RARIBLE OLD: ETH", async () => {
    const token = await TestERC721.new();

    await token.mint(seller, tokenId1)
    await token.setApprovalForAll(transferProxy.address, true, { from: seller })

    let encDataLeft = await encDataV2([[], [[origin1, 300]], true]);
    let encDataRight = await encDataV2([[], [[origin1, 300]], false]);

    const left = Order(buyer, Asset(ETH, "0x", 1000), zeroAddress, Asset(ERC721, enc(token.address, tokenId1), 1), 0, 0, 0, ORDER_DATA_V2, encDataLeft);
    const right = Order(seller, Asset(ERC721, enc(token.address, tokenId1), 1), zeroAddress, Asset(ETH, "0x", 1000), 1, 0, 0, ORDER_DATA_V2, encDataRight);

    await royaltiesRegistry.setRoyaltiesByToken(token.address, [[seller, 1000]]);

    console.log("OLD RARIBLE: match ETH <=> ERC72")
    await verifyBalanceChangeReturnTx(web3, buyer, 1030, async () =>
      verifyBalanceChangeReturnTx(web3, protocol, 0, async () =>
        verifyBalanceChangeReturnTx(web3, origin1, -60, async () =>
          verifyBalanceChangeReturnTx(web3, additionalRoyalties, 0, async () =>
            verifyBalanceChangeReturnTx(web3, seller, -970, async () =>
              exchangeV2OLD.matchOrders(left, "0x", right, await getSignature(exchangeV2OLD, right, seller), { from: buyer, value: 2000})
            )
          )
        )
      )
    )
    console.log()
  })

  it("RARIBLE NEW: ERC-20 ROYALTIES = SELLER", async () => {
    const token = await TestERC721.new();
    const erc20 = await TestERC20.new();
    const nftAmount = 1;
    await erc20.mint(buyer, price)
    await erc20.approve(erc20TransferProxy.address, price, { from: buyer })
    assert.equal(await erc20.balanceOf(buyer), price, "erc20 deposit")

    await token.mint(seller, tokenId1)
    await token.setApprovalForAll(transferProxy.address, true, { from: seller })

    let addrOriginLeft = await LibPartToUint(origin1, 300);
    let addrOriginRight = await LibPartToUint(origin1, 300);

    let encDataRight = await encDataV3_SELL([0, addrOriginRight, 0, 1000, MARKET_MARKER_SELL]);
    let encDataLeft = await encDataV3_BUY([0, addrOriginLeft, 0, MARKET_MARKER_BUY]);

    const _nftAssetData = enc(token.address, tokenId1);
    const _paymentAssetData = enc(erc20.address);

    const left = Order(buyer, Asset(ERC20, _paymentAssetData, price), zeroAddress, Asset(ERC721, _nftAssetData, nftAmount), 1, 0, 0, ORDER_DATA_V3_BUY, encDataLeft);

    await royaltiesRegistry.setRoyaltiesByToken(token.address, [[seller, 1000]]);

    const signature = await getSignature(exchangeV2, left, buyer);

    const directAcceptParams = {
      bidMaker: buyer,
      bidNftAmount: nftAmount,
      nftAssetClass: ERC721,
      nftData: _nftAssetData,
      bidPaymentAmount: price,
      paymentToken: erc20.address,
      bidSalt: 1,
      bidStart: 0,
      bidEnd: 0,
      bidDataType: ORDER_DATA_V3_BUY,
      bidData: encDataLeft,
      bidSignature: signature,
      sellOrderPaymentAmount: price,
      sellOrderNftAmount: nftAmount,
      sellOrderData: encDataRight
    };

    const tx = await exchangeV2.directAcceptBid(directAcceptParams, { from: seller });

    console.log("RARIBLE NEW: direct accept bid ERC-20 <=> ERC721 ROYALTIES = SELLER", tx.receipt.gasUsed);

    assert.equal(await token.ownerOf(tokenId1), buyer, "buyer has token1");
    assert.equal(await erc20.balanceOf(buyer), 0, "erc20 buyer");
    assert.equal(await erc20.balanceOf(protocol), 0, "erc20 buyer");
    assert.equal(await erc20.balanceOf(origin1), 60, "origin")
    assert.equal(await erc20.balanceOf(seller), 940, "seller")
  })

  it("RARIBLE NEW: ERC-20 ROYALTIES != SELLER", async () => {
    const token = await TestERC721.new();
    const erc20 = await TestERC20.new();
    const nftAmount = 1;
    await erc20.mint(buyer, price)
    await erc20.approve(erc20TransferProxy.address, price, { from: buyer })
    assert.equal(await erc20.balanceOf(buyer), price, "erc20 deposit")

    await token.mint(seller, tokenId1)
    await token.setApprovalForAll(transferProxy.address, true, { from: seller })

    let addrOriginLeft = await LibPartToUint(origin1, 300);
    let addrOriginRight = await LibPartToUint(origin1, 300);

    let encDataLeft = await encDataV3_BUY([0, addrOriginLeft, 0, MARKET_MARKER_BUY]);
    let encDataRight = await encDataV3_SELL([0, addrOriginRight, 0, 1000, MARKET_MARKER_SELL]);

    const _nftAssetData = enc(token.address, tokenId1);
    const _paymentAssetData = enc(erc20.address);

    const left = Order(buyer, Asset(ERC20, _paymentAssetData, price), zeroAddress, Asset(ERC721, _nftAssetData, nftAmount), 1, 0, 0, ORDER_DATA_V3_BUY, encDataLeft);

    await royaltiesRegistry.setRoyaltiesByToken(token.address, [[additionalRoyalties, 1000]]);

    const signature = await getSignature(exchangeV2, left, buyer);

    const directAcceptParams = {
      bidMaker: buyer,
      bidNftAmount: nftAmount,
      nftAssetClass: ERC721,
      nftData: _nftAssetData,
      bidPaymentAmount: price,
      paymentToken: erc20.address,
      bidSalt: 1,
      bidStart: 0,
      bidEnd: 0,
      bidDataType: ORDER_DATA_V3_BUY,
      bidData: encDataLeft,
      bidSignature: signature,
      sellOrderPaymentAmount: price,
      sellOrderNftAmount: nftAmount,
      sellOrderData: encDataRight
    };

    const tx = await exchangeV2.directAcceptBid(directAcceptParams, { from: seller });

    console.log("RARIBLE NEW: direct accept bid ERC-20 <=> ERC721 ROYALTIES != SELLER", tx.receipt.gasUsed);

    assert.equal(await token.ownerOf(tokenId1), buyer, "buyer has token1");
    assert.equal(await erc20.balanceOf(buyer), 0, "erc20 buyer");
    assert.equal(await erc20.balanceOf(protocol), 0, "erc20 buyer");
    assert.equal(await erc20.balanceOf(origin1), 60, "origin")
    assert.equal(await erc20.balanceOf(additionalRoyalties), 100, "origin")
    assert.equal(await erc20.balanceOf(seller), 840, "seller")
  })

  it("RARIBLE OLD: ERC-20 ROYALTIES = SELLER", async () => {
    const token = await TestERC721.new();
    const erc20 = await TestERC20.new();

    await erc20.mint(buyer, 1030)
    await erc20.approve(erc20TransferProxy.address, 1030, { from: buyer })
    assert.equal(await erc20.balanceOf(buyer), 1030, "erc20 deposit")

    await token.mint(seller, tokenId1)
    await token.setApprovalForAll(transferProxy.address, true, { from: seller })

    let encDataLeft = await encDataV2([[], [[origin1, 300]], true]);
    let encDataRight = await encDataV2([[], [[origin1, 300]], false]);

    const left = Order(buyer, Asset(ERC20, enc(erc20.address), price), zeroAddress, Asset(ERC721, enc(token.address, tokenId1), 1), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
    const right = Order(seller, Asset(ERC721, enc(token.address, tokenId1), 1), zeroAddress, Asset(ERC20, enc(erc20.address), price), 0, 0, 0, ORDER_DATA_V2, encDataRight);

    await royaltiesRegistry.setRoyaltiesByToken(token.address, [[seller, 1000]]);

    const tx = await exchangeV2OLD.matchOrders(left, await getSignature(exchangeV2OLD, left, buyer), right, "0x", { from: seller });

    console.log("RARIBLE OLD: direct accept bid ERC-20 <=> ERC721", tx.receipt.gasUsed);

    assert.equal(await token.ownerOf(tokenId1), buyer, "buyer has token1");
    assert.equal(await erc20.balanceOf(buyer), 0, "erc20 buyer");
    assert.equal(await erc20.balanceOf(protocol), 0, "erc20 buyer");
    assert.equal(await erc20.balanceOf(origin1), 60, "origin")
    assert.equal(await erc20.balanceOf(seller), 970, "seller")
  })

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
