const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const ExchangeBulkV2 = artifacts.require("ExchangeBulkV2.sol");
const ExchangeBulkV2Test = artifacts.require("ExchangeBulkV2Test.sol");
const ExchangeV2 = artifacts.require("ExchangeV2.sol");
const TestERC20 = artifacts.require("TestERC20.sol");
const TestERC721 = artifacts.require("TestERC721.sol");
const TransferProxyTest = artifacts.require("TransferProxyTest.sol");
const ERC20TransferProxyTest = artifacts.require("ERC20TransferProxyTest.sol");
const truffleAssert = require('truffle-assertions');
const TestRoyaltiesRegistry = artifacts.require("TestRoyaltiesRegistry.sol");

const WyvernExchangeWithBulkCancellations = artifacts.require("WyvernExchangeWithBulkCancellations");
const TokenTransferProxy = artifacts.require("TokenTransferProxy");
const ProxyRegistry = artifacts.require("ProxyRegistry");
const WyvernTokenTransferProxy = artifacts.require("WyvernTokenTransferProxy");
const MerkleValidator = artifacts.require("MerkleValidator");
const WyvernProxyRegistry = artifacts.require("WyvernProxyRegistry");

const { Order, OrderOpenSeaSell, OrdersOpenSea, TradeData, RaribleBuy, Asset, sign } = require("../order");
const EIP712 = require("../EIP712");
const { expectThrow, verifyBalanceChange } = require("@daonomic/tests-common");
const { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, ORDER_DATA_V2, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, CRYPTO_PUNKS, COLLECTION, enc, id } = require("../assets");
const InputDataDecoder = require('ethereum-input-data-decoder');
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

contract("ExchangeBulkV2, sellerFee + buyerFee =  6%,", accounts => {
	let testing;
	let exchangeV2;
	let exchangeBulkV2Test;
	let transferProxy;
	let erc20TransferProxy;
	let royaltiesRegistry;
	let t1;
	let protocol = accounts[9];
	let community = accounts[8];
	const eth = "0x0000000000000000000000000000000000000000";
  let erc721TokenId1 = 55;
  let erc721TokenId2 = 56;
  let erc721TokenId3 = 57;

  let wyvernExchangeWithBulkCancellations;
  let proxyRegistry;
  let tokenTransferProxy;
  let testERC20;
  let testERC721;

	beforeEach(async () => {
		transferProxy = await TransferProxyTest.new();
		erc20TransferProxy = await ERC20TransferProxyTest.new();
		royaltiesRegistry = await TestRoyaltiesRegistry.new();
    /*ERC20 */
		t1 = await TestERC20.new();
 		/*ERC721 */
 		erc721 = await TestERC721.new("Rarible", "RARI", "https://ipfs.rarible.com");
 		testERC721 = await TestERC721.new("Rarible", "RARI", "https://ipfs.rarible.com");
 		/*generating orders*/
    exchangeBulkV2Test = await ExchangeBulkV2Test.new();
	});

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
    paymentToken
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

    const feeMethodsSidesKindsHowToCalls = [
      1, // FeeMethod{ ProtocolFee, SplitFee }) buy
      0, // SaleKindInterface.Side({ Buy, Sell }) buy
      0, // SaleKindInterface.SaleKind({ FixedPrice, DutchAuction }) buy
      1, // AuthenticatedProxy.HowToCall({ Call, DelegateCall } buy

      1, // FeeMethod({ ProtocolFee, SplitFee }) sell
      1, // SaleKindInterface.Side({ Buy, Sell } sell
      0, // SaleKindInterface.SaleKind({ FixedPrice, DutchAuction } sell
      1  // AuthenticatedProxy.HowToCall({ Call, DelegateCall } sell
    ];

    const zeroWord = "0000000000000000000000000000000000000000000000000000000000000000";

    // constant tokenId !!!
    const hexTokenId = tokenId;

    const merklePart = "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000";
    const methodSigPart = "0xfb16a595";

    const calldataBuy = methodSigPart + zeroWord + addrToBytes32No0x(buyer) + addrToBytes32No0x(token) + hexTokenId + merklePart;
    const calldataSell = methodSigPart + addrToBytes32No0x(seller) + zeroWord + addrToBytes32No0x(token) + hexTokenId + merklePart;

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


  function addrToBytes32No0x(addr) {
    return "000000000000000000000000" + addr.substring(2)
  }


	describe("matchOrders Wywern Bulk", () => {

		it("Test bulkTransfer Wyvern (num orders = 3) orders are ready, ERC721<->ETH", async () => {
      const wyvernProtocolFeeAddress = accounts[9];
		  const buyer = accounts[2];
		  const seller1 = accounts[1];
		  const seller2 = accounts[3];
		  const seller3 = accounts[4];
		  const feeRecipienter = accounts[5];
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

		  testing = await ExchangeBulkV2.new();
		  await testing.__ExchangeBulkV2_init(openSea.address, exchangeV2.address);


      const matchData = (await getOpenSeaMatchDataMerkleValidator(
        openSea.address,
        testing.address,
        buyer,
        seller1,
        merkleValidator.address,
        feeRecipienter,
        "100",
        "0000000000000000000000000000000000000000000000000000000000000005",
        erc721.address,
        ZERO_ADDRESS
      ))

      const buySellOrders1 = OrdersOpenSea(...matchData);
      let dataForWyvernCall1 = await exchangeBulkV2Test.getDataWyvernAtomicMatch(buySellOrders1);
      const tradeData1 = TradeData(1, 100, dataForWyvernCall1);
//		  const left1 = OrdersOpenSea(...matchData);
//		  console.log("order:", left1);

      /*enough ETH for transfer*/
//    	await verifyBalanceChange(buyer, 100, async () =>
//    		verifyBalanceChange(seller1, -90, async () =>
//    			verifyBalanceChange(feeRecipienter, -10, () =>
//    			  testing._tradeExperiment(dataForWyvernCall, { from: buyer, value: 100, gasPrice: 0 })
//    			)
//    		)
//    	);


//      let tx = await testing._tradeExperiment(dataForWyvernCall, { from: buyer, value: 100, gasPrice: 0 });
//      let tx = await testing.bulkWyvernTransfer([tradeData1], { from: buyer, value: 100, gasPrice: 0 });
//      console.log("Bulk2 Wyvern orders, by _tradeExperiment ERC721<->ETH (num = 1), ortders are ready, Gas consumption :", tx.receipt.gasUsed);
//      assert.equal(await erc721.balanceOf(buyer), 1); //transfer all

      const matchData2 = (await getOpenSeaMatchDataMerkleValidator(
        openSea.address,
        testing.address,
        buyer,
        seller2,
        merkleValidator.address,
        feeRecipienter,
        "100",
        "0000000000000000000000000000000000000000000000000000000000000006",
        erc721.address,
        ZERO_ADDRESS
      ))
		  const buySellOrders2 = OrdersOpenSea(...matchData2);
      let dataForWyvernCall2 = await exchangeBulkV2Test.getDataWyvernAtomicMatch(buySellOrders2);
      const tradeData2 = TradeData(1, 100, dataForWyvernCall2); //1 is Wyvern orders, 100 is amount

      const matchData3 = (await getOpenSeaMatchDataMerkleValidator(
        openSea.address,
        testing.address,
        buyer,
        seller3,
        merkleValidator.address,
        feeRecipienter,
        "100",
        "0000000000000000000000000000000000000000000000000000000000000007",
        erc721.address,
        ZERO_ADDRESS
      ))
		  const buySellOrders3 = OrdersOpenSea(...matchData3);
      let dataForWyvernCall3 = await exchangeBulkV2Test.getDataWyvernAtomicMatch(buySellOrders3);
      const tradeData3 = TradeData(1, 100, dataForWyvernCall3);

      let tx = await testing.bulkTransfer([tradeData1, tradeData2, tradeData3], { from: buyer, value: 400, gasPrice: 0 });
      console.log("Bulk2 Wyvern orders, ERC721<->ETH (num = 3), by tradeData, Gas consumption :", tx.receipt.gasUsed);
      assert.equal(await erc721.balanceOf(buyer), 3); //transfer all
    })
  });


	describe("matchOrders Rarible Bulk", () => {
		it("Test bulkTransfer ExchangeV2 (num orders = 3) orders are ready, ERC721<->ETH", async () => {
		  const buyer = accounts[2];
		  await testERC721.mint(accounts[1], erc721TokenId1);
		  await testERC721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
		  await testERC721.mint(accounts[3], erc721TokenId2);
		  await testERC721.setApprovalForAll(transferProxy.address, true, {from: accounts[3]});
		  await testERC721.mint(accounts[4], erc721TokenId3);
		  await testERC721.setApprovalForAll(transferProxy.address, true, {from: accounts[4]});

		  const left1 = Order(accounts[1], Asset(ERC721, enc(testERC721.address, erc721TokenId1), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, "0xffffffff", "0x");
		  const left2 = Order(accounts[3], Asset(ERC721, enc(testERC721.address, erc721TokenId2), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, "0xffffffff", "0x");
		  const left3 = Order(accounts[4], Asset(ERC721, enc(testERC721.address, erc721TokenId3), 1), ZERO_ADDRESS, Asset(ETH, "0x", 100), 1, 0, 0, "0xffffffff", "0x");
      const right1 = Order(accounts[2], Asset(ETH, "0x", 100), ZERO_ADDRESS, Asset(ERC721, enc(testERC721.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
      const right2 = Order(accounts[2], Asset(ETH, "0x", 100), ZERO_ADDRESS, Asset(ERC721, enc(testERC721.address, erc721TokenId2), 1), 1, 0, 0, "0xffffffff", "0x");
      const right3 = Order(accounts[2], Asset(ETH, "0x", 100), ZERO_ADDRESS, Asset(ERC721, enc(testERC721.address, erc721TokenId3), 1), 1, 0, 0, "0xffffffff", "0x");

      exchangeV2 = await deployProxy(ExchangeV2, [transferProxy.address, erc20TransferProxy.address, 300, community, royaltiesRegistry.address], { initializer: "__ExchangeV2_init" });
      await exchangeV2.setFeeReceiver(eth, protocol);
      await exchangeV2.setFeeReceiver(t1.address, protocol);

		  testing = await ExchangeBulkV2.new();
		  await testing.__ExchangeBulkV2_init(ZERO_ADDRESS/*openSea.address*/, exchangeV2.address); //dont need openSea.address, process only exchaneV2 orders

      let signatureLeft1 = await getSignature(left1, accounts[1], exchangeV2.address);
		  let signatureLeft2 = await getSignature(left2, accounts[3], exchangeV2.address);
		  let signatureLeft3 = await getSignature(left3, accounts[4], exchangeV2.address);
		  /*NB!!! Need to signature buy orders, because ExchangeBulkV2 is  msg.sender != buyOrder.maker*/
      let signatureRight1 = await getSignature(right1, accounts[2], exchangeV2.address);
		  let signatureRight2 = await getSignature(right2, accounts[2], exchangeV2.address);
		  let signatureRight3 = await getSignature(right3, accounts[2], exchangeV2.address);

      let raribleBuy1 = RaribleBuy(left1, signatureLeft1, right1, signatureRight1);
      let dataForExchCall1 = await exchangeBulkV2Test.getDataExchangeV2MatchOrders(raribleBuy1);
      const tradeData1 = TradeData(0, 103, dataForExchCall1); //0 is Exch orders, 100 is amount + 3 protocolFee

      let raribleBuy2 = RaribleBuy(left2, signatureLeft2, right2, signatureRight2);
      let dataForExchCall2 = await exchangeBulkV2Test.getDataExchangeV2MatchOrders(raribleBuy2);
      const tradeData2 = TradeData(0, 103, dataForExchCall2); //0 is Exch orders, 100 is amount + 3 protocolFee

      let raribleBuy3 = RaribleBuy(left3, signatureLeft3, right3, signatureRight3);
      let dataForExchCall3 = await exchangeBulkV2Test.getDataExchangeV2MatchOrders(raribleBuy3);
      const tradeData3 = TradeData(0, 103, dataForExchCall3); //0 is Exch orders, 100 is amount + 3 protocolFee

//    	await verifyBalanceChange(buyer, 309, async () =>
//    		verifyBalanceChange(accounts[1], -97, async () =>
//    		  verifyBalanceChange(accounts[3], -97, async () =>
//    		    verifyBalanceChange(accounts[4], -97, async () =>
//    			    verifyBalanceChange(protocol, -18, () =>
//    				    testing.matchOrdersBulk([left1, left2, left3], [signatureLeft1, signatureLeft2, signatureLeft3], buyer, { from: buyer, value: 400, gasPrice: 0 })
//    				  )
//    				)
//    			)
//    		)
//    	);
      const tx = await testing.bulkTransfer([tradeData1, tradeData2, tradeData3], { from: buyer, value: 400, gasPrice: 0 });
    	console.log("Bulk2, ERC721<->ETH (num = 3), Gas consumption :",tx.receipt.gasUsed);
    	assert.equal(await testERC721.balanceOf(accounts[1]), 0);
    	assert.equal(await testERC721.balanceOf(accounts[2]), 3); //transfer all
    })

  });

	async function getSignature(order, signer, exchangeContract) {
		return sign(order, signer, exchangeContract);
	}
});
