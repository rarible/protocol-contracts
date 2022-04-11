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
  let erc721TokenId1 = 55;
  let erc721TokenId2 = 56;
  let erc721TokenId3 = 57;
  let erc721TokenId4 = 58;
  let erc721TokenId5 = 59;
  let royaltiesRegistry;

  let wyvernExchangeWithBulkCancellations;
  let proxyRegistry;
  let tokenTransferProxy;
  let testERC20;
  let testERC721;

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
 		testERC721 = await TestERC721.new("Rarible", "RARI", "https://ipfs.rarible.com");

	});

  async function getOpenSeaSellOrder(
    exchange,
    feeRecipienter,
    seller,
    merkleValidator,
    protocolFee,
    basePrice,
    hexTokenId,
    token,
    paymentToken
    ) {

 	  const addrs = [
      exchange,
      seller,
      "0x0000000000000000000000000000000000000000",
      feeRecipienter,
      merkleValidator,
      "0x0000000000000000000000000000000000000000",
      paymentToken
    ];

    const now = Math.floor(Date.now() / 1000)
    const listingTime = now - 60 * 60;
    const expirationTime = now + 60 * 60;
    const uints = [
      protocolFee,
      0,
      0,
      0,
      basePrice,
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
    const zeroWord = "0000000000000000000000000000000000000000000000000000000000000000";

    const merklePart = "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000"
    const methodSigPart = "0xfb16a595"

    const calldataSell = methodSigPart + addrToBytes32No0x(seller) + zeroWord + addrToBytes32No0x(token) + hexTokenId + merklePart;
    const replacementPatternSell = "0x000000000000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
    const staticExtradataSell = "0x";

    const vs = [
      27
    ];

    const rssMetadata = [
      "0x" + zeroWord, // sig r buy
      "0x" + zeroWord // sig s buy
    ];
    return [
      addrs,
      uints,
      feeMethodsSidesKindsHowToCalls,
      calldataSell,
      replacementPatternSell,
      staticExtradataSell,
      vs,
      rssMetadata
    ];
  }

  function addrToBytes32No0x(addr) {
    return "000000000000000000000000" + addr.substring(2)
  }


	describe("matchOrders OpenSea Bulk", () => {

		it("Test Bulk2 Wyvern (num orders = 1) enough and more gas with ERC721<->ETH ", async () => {
      const wyvernProtocolFeeAddress = accounts[9];
		  const buyer = accounts[2];
		  const seller1 = accounts[1];
		  const seller2 = accounts[3];
		  const feeRecipienter = accounts[5];
      /*Wyvern*/
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

		  testing = await ExchangeBulkV2.new();
		  await testing.__ExchangeBulkV2_init(transferProxy.address, erc20TransferProxy.address, openSea.address, 300, community, royaltiesRegistry.address);
      await testing.setFeeReceiver(eth, protocol);
      await testing.setFeeReceiver(t1.address, protocol);

      const matchData = (await getOpenSeaSellOrder(
        openSea.address,
        feeRecipienter,
        seller1,
        merkleValidator.address,
        "1000",
        "100",
        "0000000000000000000000000000000000000000000000000000000000000005",
        erc721.address,
        zeroAddress
      ))

		  const left1 = OrderOpenSeaSell(...matchData);
//		  console.log("order:", left1);

      /*enough ETH for transfer*/
    	await verifyBalanceChange(buyer, 100, async () =>
    		verifyBalanceChange(seller1, -90, async () =>
    			verifyBalanceChange(feeRecipienter, -10, () =>
    			  testing.matchWyvernExchangeBulk([left1], { from: buyer, value: 100, gasPrice: 0 })
    			)
    		)
    	);

      const matchData2 = (await getOpenSeaSellOrder(
        openSea.address,
        feeRecipienter,
        seller2,
        merkleValidator.address,
        "1000",
        "100",
        "0000000000000000000000000000000000000000000000000000000000000006",
        erc721.address,
        zeroAddress
      ))

		  const left2 = OrderOpenSeaSell(...matchData2);

      /*more ETH for transfer*/
    	await verifyBalanceChange(buyer, 100, async () =>
    		verifyBalanceChange(seller2, -90, async () =>
    			verifyBalanceChange(feeRecipienter, -10, () =>
    			  testing.matchWyvernExchangeBulk([left2], { from: buyer, value: 200, gasPrice: 0 })
    			)
    		)
    	);
//    	assert.equal(await erc721.balanceOf(buyer), 2); //transfer all
//      let tx = await testing.matchWyvernExchangeBulk([left2], { from: buyer, value: 200, gasPrice: 0 });
//      console.log("Bulk2 Wyvern orders, ERC721<->ETH (num = 1), Gas consumption :", tx.receipt.gasUsed);
    })

		it("Test Bulk2 Wyvern (num orders = 3)  more gas with ERC721<->ETH ", async () => {
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

		  testing = await ExchangeBulkV2.new();
		  await testing.__ExchangeBulkV2_init(transferProxy.address, erc20TransferProxy.address, openSea.address, 300, community, royaltiesRegistry.address);
      await testing.setFeeReceiver(eth, protocol);
      await testing.setFeeReceiver(t1.address, protocol);

      const matchData = (await getOpenSeaSellOrder(
        openSea.address,
        feeRecipienter,
        seller1,
        merkleValidator.address,
        "1000",
        "100",
        "0000000000000000000000000000000000000000000000000000000000000005",
        erc721.address,
        zeroAddress
      ))
		  const left1 = OrderOpenSeaSell(...matchData);

      const matchData2 = (await getOpenSeaSellOrder(
        openSea.address,
        feeRecipienter,
        seller2,
        merkleValidator.address,
        "1000",
        "100",
        "0000000000000000000000000000000000000000000000000000000000000006",
        erc721.address,
        zeroAddress
      ))
		  const left2 = OrderOpenSeaSell(...matchData2);

      const matchData3 = (await getOpenSeaSellOrder(
         openSea.address,
         feeRecipienter,
         seller3,
         merkleValidator.address,
         "1000",
         "100",
         "0000000000000000000000000000000000000000000000000000000000000007",
         erc721.address,
         zeroAddress
       ))
		   const left3 = OrderOpenSeaSell(...matchData3);

      /*more ETH for transfer*/
//    	await verifyBalanceChange(buyer, 300, async () =>
//    		verifyBalanceChange(seller1, -90, async () =>
//    		  verifyBalanceChange(seller2, -90, async () =>
//    		    verifyBalanceChange(seller3, -90, async () =>
//    			    verifyBalanceChange(feeRecipienter, -30, () =>
//    			      testing.matchWyvernExchangeBulk([left1, left2, left3], { from: buyer, value: 400, gasPrice: 0 })
//    			    )
//    			  )
//    			)
//    		)
//    	);
    	const tx = await testing.matchWyvernExchangeBulk([left1, left2, left3], { from: buyer, value: 400, gasPrice: 0 });
    	console.log("Bulk2 Wyvern orders, ERC721<->ETH (num = 3), Gas consumption :", tx.receipt.gasUsed);

    	assert.equal(await erc721.balanceOf(buyer), 3); //transfer all
    })

  });


	describe("matchOrders Rarible Bulk", () => {
		it("Test Bulk2 (num = 3) with ERC721<->ETH ", async () => {
		  const buyer = accounts[2];
		  await testERC721.mint(accounts[1], erc721TokenId1);
		  await testERC721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
		  await testERC721.mint(accounts[3], erc721TokenId2);
		  await testERC721.setApprovalForAll(transferProxy.address, true, {from: accounts[3]});
		  await testERC721.mint(accounts[4], erc721TokenId3);
		  await testERC721.setApprovalForAll(transferProxy.address, true, {from: accounts[4]});

		  const left1 = Order(accounts[1], Asset(ERC721, enc(testERC721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 100), 1, 0, 0, "0xffffffff", "0x");
		  const left2 = Order(accounts[3], Asset(ERC721, enc(testERC721.address, erc721TokenId2), 1), ZERO, Asset(ETH, "0x", 100), 1, 0, 0, "0xffffffff", "0x");
		  const left3 = Order(accounts[4], Asset(ERC721, enc(testERC721.address, erc721TokenId3), 1), ZERO, Asset(ETH, "0x", 100), 1, 0, 0, "0xffffffff", "0x");

		  testing = await ExchangeBulkV2.new();
		  await testing.__ExchangeBulkV2_init(transferProxy.address, erc20TransferProxy.address, ZERO_ADDRESS, 300, community, royaltiesRegistry.address);
      await testing.setFeeReceiver(eth, protocol);
      await testing.setFeeReceiver(t1.address, protocol);

      let signatureLeft1 = await getSignature(left1, accounts[1], testing.address);
		  let signatureLeft2 = await getSignature(left2, accounts[3], testing.address);
		  let signatureLeft3 = await getSignature(left3, accounts[4], testing.address);

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
    	const tx = await testing.matchOrdersBulk([left1, left2, left3], [signatureLeft1, signatureLeft2, signatureLeft3], buyer, { from: buyer, value: 1000, gasPrice: 0 });
    	console.log("Bulk2, ERC721<->ETH (num = 3), Gas consumption :",tx.receipt.gasUsed);
    	assert.equal(await testERC721.balanceOf(accounts[1]), 0);
    	assert.equal(await testERC721.balanceOf(accounts[2]), 3); //transfer all
    })

		it("Test Bulk2 (num = 3) with ERC721<->ERC20", async () => {

      const buyer = accounts[2];
      testing = await ExchangeBulkV2.new();
      await testing.__ExchangeBulkV2_init(transferProxy.address, erc20TransferProxy.address, ZERO_ADDRESS, 300, community, royaltiesRegistry.address);
      await testing.setFeeReceiver(eth, protocol);
      await testing.setFeeReceiver(t1.address, protocol);
      const { left1,left2,left3, signatureLeft1, signatureLeft2, signatureLeft3 } = await prepare721DV1_2Array0rders3(105, testing.address);

			const tx = await testing.matchOrdersBulk([left1,left2,left3], [signatureLeft1, signatureLeft2, signatureLeft3], buyer, { from: accounts[2] });
      console.log("ERC721<->ERC20 (num = 3), Gas consumption :", tx.receipt.gasUsed);
//			assert.equal(await t2.balanceOf(accounts[1]), 97);	//=100 - 3sellerFee
//			assert.equal(await t2.balanceOf(accounts[2]), 2);		//=105 - (100amount + 3byuerFee )
//			assert.equal(await erc721.balanceOf(accounts[1]), 0);
//			assert.equal(await erc721.balanceOf(accounts[2]), 1);
//			assert.equal(await t2.balanceOf(community), 6);
		})

		async function prepare721DV1_2Array0rders3(t2Amount = 105, exchangeContract) {
			await erc721.mint(accounts[1], erc721TokenId1);
			await erc721.mint(accounts[3], erc721TokenId2);
			await erc721.mint(accounts[4], erc721TokenId3);
			await t2.mint(accounts[2], t2Amount*3);
			await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
			await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[3]});
			await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[4]});
			await t2.approve(erc20TransferProxy.address, 10000000, { from: accounts[2] });
			const left1 = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(t2.address), 100), 1, 0, 0, "0xffffffff", "0x");
			const left2 = Order(accounts[3], Asset(ERC721, enc(erc721.address, erc721TokenId2), 1), ZERO, Asset(ERC20, enc(t2.address), 100), 1, 0, 0, "0xffffffff", "0x");
			const left3 = Order(accounts[4], Asset(ERC721, enc(erc721.address, erc721TokenId3), 1), ZERO, Asset(ERC20, enc(t2.address), 100), 1, 0, 0, "0xffffffff", "0x");
			let signatureLeft1 = await getSignature(left1, accounts[1], exchangeContract);
      let signatureLeft2 = await getSignature(left2, accounts[3], exchangeContract);
      let signatureLeft3 = await getSignature(left3, accounts[4], exchangeContract);
			return { left1, left2, left3, signatureLeft1, signatureLeft2, signatureLeft3 };
		}

  });

	async function getSignature(order, signer, exchangeContract) {
		return sign(order, signer, exchangeContract);
	}
});
