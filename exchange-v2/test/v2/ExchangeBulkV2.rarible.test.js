const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const ExchangeBulkV2 = artifacts.require("ExchangeBulkV2.sol");
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

const { Order, OrderOpenSeaSell, Asset, sign } = require("../order");
const EIP712 = require("../EIP712");
const ZERO = "0x0000000000000000000000000000000000000000";
const { expectThrow, verifyBalanceChange } = require("@daonomic/tests-common");
const { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, ORDER_DATA_V2, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, CRYPTO_PUNKS, COLLECTION, enc, id } = require("../assets");
const InputDataDecoder = require('ethereum-input-data-decoder');
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const zeroAddress = "0x0000000000000000000000000000000000000000";

contract("ExchangeBulkV2, sellerFee + buyerFee =  6%,", accounts => {
	let testing;
	let transferProxy;
	let erc20TransferProxy;
	let t1;
	let t2;
	let protocol = accounts[9];
	let community = accounts[8];
	const eth = "0x0000000000000000000000000000000000000000";
	let erc721TokenId0 = 52;
//  let erc721TokenId1 = 5;
  let erc721TokenId2 = 6;
  let erc721TokenId3 = 7;
  let erc721TokenId4 = 8;
  let erc721TokenId5 = 9;
  let royaltiesRegistry;

  let wyvernExchangeWithBulkCancellations;
  let proxyRegistry;
  let tokenTransferProxy;
  let testERC20;

	beforeEach(async () => {
//		libOrder = await LibOrderTest.new();
		transferProxy = await TransferProxyTest.new();
		erc20TransferProxy = await ERC20TransferProxyTest.new();
		royaltiesRegistry = await TestRoyaltiesRegistry.new();

		//Wyvern
//    const wyvernProtocolFeeAddress = accounts[9];
//    proxyRegistry = await ProxyRegistry.new();
//    tokenTransferProxy = await TokenTransferProxy.new();
//    wyvernExchangeWithBulkCancellations = await WyvernExchangeWithBulkCancellations.new(proxyRegistry.address, tokenTransferProxy.address, ZERO_ADDRESS, wyvernProtocolFeeAddress);

//		testing = await deployProxy(ExchangeBulkV2, [transferProxy.address, erc20TransferProxy.address, wyvernExchangeWithBulkCancellations.address, 300, community, royaltiesRegistry.address], { initializer: "__ExchangeBulkV2_init" });
//		testing = await ExchangeBulkV2.new();
//		await testing.__ExchangeBulkV2_init(transferProxy.address, erc20TransferProxy.address, wyvernExchangeWithBulkCancellations.address, 300, community, royaltiesRegistry.address);
		t1 = await TestERC20.new();
		t2 = await TestERC20.new();
    /*ETH*/
//    await testing.setFeeReceiver(eth, protocol);
//    await testing.setFeeReceiver(t1.address, protocol);
 		/*ERC721 */
 		erc721 = await TestERC721.new("Rarible", "RARI", "https://ipfs.rarible.com");
	});

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

  function addrToBytes32No0x(addr) {
    return "000000000000000000000000" + addr.substring(2)
  }


	describe("matchOrders OpenSea Bulk", () => {
//		it("Test Bulk2 Wyvern new method By Dima (num = 3) with ERC721<->ETH ", async () => {
//      const wyvernProtocolFeeAddress = accounts[9];
//		  const buyer = accounts[2];
//		  const seller1 = accounts[1];
//		  const feeRecipienter = accounts[5];
//      /*Wyvern*/
//      const wyvernProxyRegistry = await WyvernProxyRegistry.new();
//      await wyvernProxyRegistry.registerProxy( {from: seller1} );
//
//      const tokenTransferProxy = await WyvernTokenTransferProxy.new(wyvernProxyRegistry.address);
//
//      const openSea = await WyvernExchangeWithBulkCancellations.new(wyvernProxyRegistry.address, tokenTransferProxy.address, ZERO_ADDRESS, wyvernProtocolFeeAddress, {gas: 6000000});
//      await wyvernProxyRegistry.endGrantAuthentication(openSea.address);
//
//      const merkleValidator = await MerkleValidator.new();
//
//      const erc721TokenId1 = "75613545885676541905391001206491807325218654950449380199280837289294958690904"
//		  await erc721.mint(seller1, erc721TokenId1);
//		  await erc721.setApprovalForAll(await wyvernProxyRegistry.proxies(seller1), true, {from: seller1});
//
//      const matchData = (await getOpenSeaMatchDataMerkleValidator(
//         openSea.address,
//         buyer,
//         seller1,
//         merkleValidator.address,
//         protocol,
//         "1000",
//         erc721.address,
//         zeroAddress
//       ))
//
//      const txMatch = await openSea.atomicMatch_(...matchData, {from:buyer, value: 4000, gas: 500000})
//
//    })

		it("Test Bulk2 Wyvern new method (num = 3) with ERC721<->ETH ", async () => {
      const wyvernProtocolFeeAddress = accounts[9];
		  const buyer = accounts[2];
		  const seller1 = accounts[1];
		  const feeRecipienter = accounts[5];
      /*Wyvern*/
      const wyvernProxyRegistry = await WyvernProxyRegistry.new();
      await wyvernProxyRegistry.registerProxy( {from: seller1} );

      const tokenTransferProxy = await WyvernTokenTransferProxy.new(wyvernProxyRegistry.address);

      const openSea = await WyvernExchangeWithBulkCancellations.new(wyvernProxyRegistry.address, tokenTransferProxy.address, ZERO_ADDRESS, wyvernProtocolFeeAddress, {gas: 6000000});
      await wyvernProxyRegistry.endGrantAuthentication(openSea.address);

      const merkleValidator = await MerkleValidator.new();
//      const wywernExchAddr = wyvernExchangeWithBulkCancellations.address;
      let erc721TokenIdLocal = "75613545885676541905391001206491807325218654950449380199280837289294958690904";
		  await erc721.mint(seller1, erc721TokenIdLocal);
		  await erc721.setApprovalForAll(await wyvernProxyRegistry.proxies(seller1), true, {from: seller1});

		  testing = await ExchangeBulkV2.new();
		  await testing.__ExchangeBulkV2_init(transferProxy.address, erc20TransferProxy.address, openSea.address, 300, community, royaltiesRegistry.address);
      await testing.setFeeReceiver(eth, protocol);
      await testing.setFeeReceiver(t1.address, protocol);

 	    const addrs = [
          openSea.address,
          seller1,
          "0x0000000000000000000000000000000000000000",
          feeRecipienter,
          merkleValidator.address,
          "0x0000000000000000000000000000000000000000",
          "0x0000000000000000000000000000000000000000"
    	];
    	const now = Math.floor(Date.now() / 1000)
      const listingTime = now - 60*60;
      const expirationTime = now + 60*60;

    	const uints = [
        1000,
        0,
        0,
        0,
        100, //price(13)
        0,
        listingTime,
        expirationTime,
        95
    	];
    	const feeMethodsSidesKindsHowToCalls = [
          1,
          1,
          0,
          1
      ];
//      const calldataSell =           "0xfb16a595000000000000000000000000f17f52151EbEF6C7334FAD080c5704D77216b73200000000000000000000000000000000000000000000000000000000000000000000000000000000000000004E72770760c011647D4873f60A3CF6cDeA896CD80000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000";
      const zeroWord = "0000000000000000000000000000000000000000000000000000000000000000";

     // constant tokenId !!!
      const hexTokenId = "a72bc016be8f075fdf24964fd62c422101574bb4000000000000020000000258"

      const merklePart = "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000"
      const methodSigPart = "0xfb16a595"

//      const calldataBuy = methodSigPart + zeroWord + addrToBytes32No0x(buyer) + addrToBytes32No0x(erc721.address) + hexTokenId + merklePart;
      const calldataSell = methodSigPart + addrToBytes32No0x(seller1) + zeroWord + addrToBytes32No0x(erc721.address) + hexTokenId + merklePart;
      const replacementPatternSell = "0x000000000000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
      const staticExtradataSell = "0x";
      const vs = [
        27
      ];
      const rssMetadata = [
        "0x" + zeroWord, // sig r buy
        "0x" + zeroWord // sig s buy
      ];
		  const left1 = OrderOpenSeaSell(addrs, uints, feeMethodsSidesKindsHowToCalls, calldataSell, replacementPatternSell, staticExtradataSell, vs, rssMetadata);
		  console.log("order:", left1);

		  let ordersToLog = await testing.matchWyvernExchangeParametersTest.call(left1, { from: buyer });
		  console.log("ordersTo Log simple test:");
		  console.log("ordersTo Log:", ordersToLog);
//		  console.log("ordersTo Log:", JSON.stringify(ordersToLog));
//      let addrBytes = await testing.buyCalldata(calldataSell ,accounts[1]);
//      console.log("addrBytes:", addrBytes);
//      let valueBytes = await testing.buyMask(replacementPatternSell);
//      console.log("ValueToBytes:", valueBytes);
      console.log("from:", seller1);
      console.log("to:", buyer);
      console.log("collection:", erc721.address );

    	await verifyBalanceChange(buyer, 100, async () =>
    		verifyBalanceChange(seller1, -90, async () =>
    			verifyBalanceChange(feeRecipienter, -10, () =>
    			  testing.matchWyvernExchangeBulk([left1], { from: buyer, value: 100, gasPrice: 0 })
    			)
    		)
    	);
    	assert.equal(await erc721.balanceOf(buyer), 1); //transfer all
    })

//		it("Test Bulk2 Wyvern (num = 3) with ERC721<->ETH ", async () => {
//		  console.log("testing.address:", testing.address);
//		  const buyer = accounts[2];
//		  const seller1 = accounts[1];
//		  const seller2 = accounts[3];
//		  const seller3 = accounts[4];
//		  const feeRecipienter = accounts[5];
//		  const wywernExchAddr = wyvernExchangeWithBulkCancellations.address;
//
//		  await erc721.mint(seller1, erc721TokenId1);
//		  await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
//		  await erc721.mint(seller2, erc721TokenId2);
//		  await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[3]});
//		  await erc721.mint(seller3, erc721TokenId3);
//		  await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[4]});
//
////		  const left1 = OrderOpenSeaSell(await prepareWywernNFT_ETH(wywernExchAddr, seller1, feeRecipienter));
////		  const left2 = OrderOpenSeaSell(await prepareWywernNFT_ETH(wywernExchAddr, seller2, feeRecipienter));
////		  const left3 = OrderOpenSeaSell(await prepareWywernNFT_ETH(wywernExchAddr, seller3, feeRecipienter));
////		  const left1 = await prepareWywernNFT_ETH(wywernExchAddr, seller1, feeRecipienter);
////		  const left2 = await prepareWywernNFT_ETH(wywernExchAddr, seller2, feeRecipienter);
////		  const left3 = await prepareWywernNFT_ETH(wywernExchAddr, seller3, feeRecipienter);
// 	    const addrs = [
//          wywernExchAddr,//"0x5206e78b21ce315ce284fb24cf05e0585a93b1d9",
//          seller1,//"0x9133d618c4f756dc231462a70701757d0af9f1bb",
//          "0x0000000000000000000000000000000000000000",
//          feeRecipienter,//"0x5b3256965e7c3cf26e11fcaf296dfc8807c01073", //addr2 (10)
//          transferProxy.address,//"0x45b594792a5cdc008d0de1c1d69faa3d16b3ddc1",
//          "0x0000000000000000000000000000000000000000",
//          "0x0000000000000000000000000000000000000000"
//    	];
//    	const uints = [
//        1250,
//        0,
//        0,
//        0,
//        100, //price(13)
//        0,
//        1644904254,
//        1645509143,
//        95//95144179924824683514752879284650766319723498665295994162030050771481728005307 salt
//    	];
//    	const feeMethodsSidesKindsHowToCalls = [
//          1,
//          1,
//          0,
//          1
//      ];
////      const calldataSell = "0xfb16a5950000000000000000000000009133d618c4f756dc231462a70701757d0af9f1bb000000000000000000000000000000000000000000000000000000000000000000000000000000000000000065701542a5866bd5273f4b38e3fb7984fcf564740000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000";
//      const calldataSell =           "0xf9cc2afe000000000000000000000000f17f52151EbEF6C7334FAD080c5704D77216b7320000000000000000000000000000000000000000000000000000000000000000000000000000000000000000Bd2c938B9F6Bfc1A66368D08CB44dC3EB2aE27bE0000000000000000000000000000000000000000000000000000000000000005";
//      const replacementPatternSell = "0x000000000000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
////      const replacementPatternSell = "0x000000000000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
////      const calldataSell =
////      "0xfb16a5950000000000000000000000009133d618c4f756dc231462a70701757d0af9f1bb000000000000000000000000000000000000000000000000000000000000000000000000000000000000000065701542a5866bd5273f4b38e3fb7984fcf564740000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000";
////      "0xfb16a5950000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b73200000000000000000000000065701542a5866bd5273f4b38e3fb7984fcf564740000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000
////      "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
////      "0x000000000000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
//      const staticExtradataSell = "0x";
//      const vs = [
//        28
//      ];
//      const rssMetadata = [
//        "0x991d85b29321ba7f317b5c4cd074cb902b9e362a6983d3f5bd1ec9087a1ad46d",
//        "0x36dd0be4d10c3e6694cb0f4bfdcf59f57364d4cf32f491d3cbe454699b91c735",
//      ];
//		  const left1 = OrderOpenSeaSell(addrs ,uints, feeMethodsSidesKindsHowToCalls ,calldataSell, replacementPatternSell, staticExtradataSell, vs, rssMetadata);
////		  const left2 = await prepareWywernNFT_ETH(wywernExchAddr, seller2, feeRecipienter);
////		  const left3 = await prepareWywernNFT_ETH(wywernExchAddr, seller3, feeRecipienter);
////      console.log("left1:", left1);
//      let addrBytes = await testing.buyCalldata(calldataSell ,accounts[1]);
//      console.log("addrBytes:", addrBytes);
//      let valueBytes = await testing.buyMask(replacementPatternSell);
//      console.log("ValueToBytes:", valueBytes);
//      let b4result = await transferProxy.testB4();
//      console.log("b4result:", b4result);
//
//      console.log("from:", seller1);
//      console.log("to:", buyer);
//      console.log("collection:", erc721.address );
//
//    	await verifyBalanceChange(buyer, 400, async () =>
//    		verifyBalanceChange(accounts[1], -88, async () =>
////    		  verifyBalanceChange(accounts[3], -97, async () =>
////    		    verifyBalanceChange(accounts[4], -97, async () =>
//    			    verifyBalanceChange(feeRecipienter, -12, () =>
//    				    testing.matchWyvernExchangeBulk([left1], { from: buyer, value: 400, gasPrice: 0 })
//    				  )
////    				)
////    			)
//    		)
//    	);
////    	const tx = await testing.matchOrdersBulk([left1, left2, left3], [signatureLeft1, signatureLeft2, signatureLeft3], buyer, { from: buyer, value: 1000, gasPrice: 0 });
////    	console.log("Bulk2, ERC721<->ETH (num = 3), Gas consumption :",tx.receipt.gasUsed);
////    	assert.equal(await erc721.balanceOf(accounts[1]), 0);
//    	assert.equal(await erc721.balanceOf(buyer), 1); //transfer all
//    })
//
//    async function prepareWywernNFT_ETH(_wywernExch, _seller, _feeRecipient) {
//    	const addrs = [
////    	    "0x5206e78b21ce315ce284fb24cf05e0585a93b1d9",
////          "0x3b7c5d4925b5e2ed0cf51b248bdeaaa3d1f5904f",
////          "0x9133d618c4f756dc231462a70701757d0af9f1bb",
////          "0x0000000000000000000000000000000000000000", //addr1 (3)
////          "0x45b594792a5cdc008d0de1c1d69faa3d16b3ddc1",
////          "0x0000000000000000000000000000000000000000",
////          "0x0000000000000000000000000000000000000000",
//          _wywernExch,//"0x5206e78b21ce315ce284fb24cf05e0585a93b1d9",
//          _seller,//"0x9133d618c4f756dc231462a70701757d0af9f1bb",
//          "0x0000000000000000000000000000000000000000",
//          _feeRecipient,//"0x5b3256965e7c3cf26e11fcaf296dfc8807c01073", //addr2 (10)
//          "0x45b594792a5cdc008d0de1c1d69faa3d16b3ddc1",
//          "0x0000000000000000000000000000000000000000",
//          "0x0000000000000000000000000000000000000000"
//    	];
//    	const uints = [
////        1250,
////        0,
////        0,
////        0,
////        100, //price(4)
////        0,
////        1644921132,
////        0,
////        78,//7808363378110069269429576006778471314492080592927804318730676593877089017422, salt
//        1250,
//        0,
//        0,
//        0,
//        100, //price(13)
//        0,
//        1644904254,
//        1645509143,
//        95//95144179924824683514752879284650766319723498665295994162030050771481728005307 salt
//    	];
//    	const feeMethodsSidesKindsHowToCalls = [
////    	    1,
////          0,
////          0,
////          1,
//          1,
//          1,
//          0,
//          1
//      ];
////      const calldataBuy = "0xfb16a59500000000000000000000000000000000000000000000000000000000000000000000000000000000000000003b7c5d4925b5e2ed0cf51b248bdeaaa3d1f5904f00000000000000000000000065701542a5866bd5273f4b38e3fb7984fcf564740000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000";
//      const calldataSell = "0xfb16a5950000000000000000000000009133d618c4f756dc231462a70701757d0af9f1bb000000000000000000000000000000000000000000000000000000000000000000000000000000000000000065701542a5866bd5273f4b38e3fb7984fcf564740000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000";
////      const replacementPatternBuy = "0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
//      const replacementPatternSell = "0x000000000000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
////      const staticExtradataBuy = "0x";
//      const staticExtradataSell = "0x";
//      const vs = [
//        28
////        28
//      ];
//      const rssMetadata = [
//        "0x991d85b29321ba7f317b5c4cd074cb902b9e362a6983d3f5bd1ec9087a1ad46d",
//        "0x36dd0be4d10c3e6694cb0f4bfdcf59f57364d4cf32f491d3cbe454699b91c735",
////        "0x991d85b29321ba7f317b5c4cd074cb902b9e362a6983d3f5bd1ec9087a1ad46d",
////        "0x36dd0be4d10c3e6694cb0f4bfdcf59f57364d4cf32f491d3cbe454699b91c735",
////        "0x0000000000000000000000000000000000000000000000000000000000000000"
//      ];
//      return  {addrs, uints, feeMethodsSidesKindsHowToCalls,  calldataSell,  replacementPatternSell,  vs, rssMetadata};
//    }
  });


//	describe("matchOrders Rarible Bulk", () => {
//		it("Test Bulk2 (num = 3) with ERC721<->ETH ", async () => {
//		  const buyer = accounts[2];
//		  await erc721.mint(accounts[1], erc721TokenId1);
//		  await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
//		  await erc721.mint(accounts[3], erc721TokenId2);
//		  await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[3]});
//		  await erc721.mint(accounts[4], erc721TokenId3);
//		  await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[4]});
//
//		  const left1 = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 100), 1, 0, 0, "0xffffffff", "0x");
//		  const left2 = Order(accounts[3], Asset(ERC721, enc(erc721.address, erc721TokenId2), 1), ZERO, Asset(ETH, "0x", 100), 1, 0, 0, "0xffffffff", "0x");
//		  const left3 = Order(accounts[4], Asset(ERC721, enc(erc721.address, erc721TokenId3), 1), ZERO, Asset(ETH, "0x", 100), 1, 0, 0, "0xffffffff", "0x");
//		  let signatureLeft1 = await getSignature(left1, accounts[1]);
//		  let signatureLeft2 = await getSignature(left2, accounts[3]);
//		  let signatureLeft3 = await getSignature(left3, accounts[4]);
//
////    	await verifyBalanceChange(buyer, 309, async () =>
////    		verifyBalanceChange(accounts[1], -97, async () =>
////    		  verifyBalanceChange(accounts[3], -97, async () =>
////    		    verifyBalanceChange(accounts[4], -97, async () =>
////    			    verifyBalanceChange(protocol, -18, () =>
////    				    testing.matchOrdersBulk([left1, left2, left3], [signatureLeft1, signatureLeft2, signatureLeft3], buyer, { from: buyer, value: 400, gasPrice: 0 })
////    				  )
////    				)
////    			)
////    		)
////    	);
//    	const tx = await testing.matchOrdersBulk([left1, left2, left3], [signatureLeft1, signatureLeft2, signatureLeft3], buyer, { from: buyer, value: 1000, gasPrice: 0 });
//    	console.log("Bulk2, ERC721<->ETH (num = 3), Gas consumption :",tx.receipt.gasUsed);
//    	assert.equal(await erc721.balanceOf(accounts[1]), 0);
//    	assert.equal(await erc721.balanceOf(accounts[2]), 3); //transfer all
//    })
//
//		it("Test Bulk2 (num = 3) with ERC721<->ERC20", async () => {
//			const { left1,left2,left3, signatureLeft1, signatureLeft2, signatureLeft3 } = await prepare721DV1_2Array0rders3();
//      const buyer = accounts[2];
//			const tx = await testing.matchOrdersBulk([left1,left2,left3], [signatureLeft1, signatureLeft2, signatureLeft3], buyer, { from: accounts[2] });
//      console.log("ERC721<->ERC20 (num = 3), Gas consumption :", tx.receipt.gasUsed);
////			assert.equal(await t2.balanceOf(accounts[1]), 97);	//=100 - 3sellerFee
////			assert.equal(await t2.balanceOf(accounts[2]), 2);		//=105 - (100amount + 3byuerFee )
////			assert.equal(await erc721.balanceOf(accounts[1]), 0);
////			assert.equal(await erc721.balanceOf(accounts[2]), 1);
////			assert.equal(await t2.balanceOf(community), 6);
//		})
//
//		async function prepare721DV1_2Array0rders3(t2Amount = 105) {
//			await erc721.mint(accounts[1], erc721TokenId1);
//			await erc721.mint(accounts[3], erc721TokenId2);
//			await erc721.mint(accounts[4], erc721TokenId3);
//			await t2.mint(accounts[2], t2Amount*3);
//			await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
//			await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[3]});
//			await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[4]});
//			await t2.approve(erc20TransferProxy.address, 10000000, { from: accounts[2] });
//			const left1 = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(t2.address), 100), 1, 0, 0, "0xffffffff", "0x");
//			const left2 = Order(accounts[3], Asset(ERC721, enc(erc721.address, erc721TokenId2), 1), ZERO, Asset(ERC20, enc(t2.address), 100), 1, 0, 0, "0xffffffff", "0x");
//			const left3 = Order(accounts[4], Asset(ERC721, enc(erc721.address, erc721TokenId3), 1), ZERO, Asset(ERC20, enc(t2.address), 100), 1, 0, 0, "0xffffffff", "0x");
//			let signatureLeft1 = await getSignature(left1, accounts[1]);
//      let signatureLeft2 = await getSignature(left2, accounts[3]);
//      let signatureLeft3 = await getSignature(left3, accounts[4]);
//			return { left1, left2, left3, signatureLeft1, signatureLeft2, signatureLeft3 };
//		}
//
//  });

	async function getSignature(order, signer) {
		return sign(order, signer, testing.address);
	}
});
