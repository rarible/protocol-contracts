const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const ExchangeV2 = artifacts.require("ExchangeV2.sol");
const TestERC20 = artifacts.require("TestERC20.sol");
const TestERC721 = artifacts.require("TestERC721.sol");
const TestERC1155 = artifacts.require("TestERC1155.sol");
const ERC1155_V2 = artifacts.require("TestERC1155WithRoyaltiesV2.sol");
const ERC721_V1 = artifacts.require("TestERC721WithRoyaltiesV1.sol");
const TransferProxyTest = artifacts.require("TransferProxyTest.sol");
const ERC20TransferProxyTest = artifacts.require("ERC20TransferProxyTest.sol");
const LibOrderTest = artifacts.require("LibOrderTest.sol");
const RaribleTransferManagerTest = artifacts.require("RaribleTransferManagerTest.sol");
const truffleAssert = require('truffle-assertions');
const TestRoyaltiesRegistry = artifacts.require("TestRoyaltiesRegistry.sol");
const TestERC721RoyaltyV1OwnUpgrd = artifacts.require("TestERC721WithRoyaltiesV1OwnableUpgradeable");
const AssetMatcherCollectionTest = artifacts.require("AssetMatcherCollectionTest.sol");

const { Order, Asset, sign } = require("../order");
const EIP712 = require("../EIP712");
const ZERO = "0x0000000000000000000000000000000000000000";
const { expectThrow, verifyBalanceChange } = require("@daonomic/tests-common");
const { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, ORDER_DATA_V2, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, CRYPTO_PUNK, COLLECTION, enc, id } = require("../assets");

contract("ExchangeV2, sellerFee + buyerFee =  6%,", accounts => {
	let testing;
	let transferProxy;
	let erc20TransferProxy;
	let transferManagerTest;
	let t1;
	let t2;
	let libOrder;
	let protocol = accounts[9];
	let community = accounts[8];
	const eth = "0x0000000000000000000000000000000000000000";
	let erc721TokenId0 = 52;
  let erc721TokenId1 = 53;
  let erc1155TokenId1 = 54;
  let erc1155TokenId2 = 55;
  let royaltiesRegistry;

	beforeEach(async () => {
		libOrder = await LibOrderTest.new();
		transferProxy = await TransferProxyTest.new();
		erc20TransferProxy = await ERC20TransferProxyTest.new();
		royaltiesRegistry = await TestRoyaltiesRegistry.new();
		testing = await deployProxy(ExchangeV2, [transferProxy.address, erc20TransferProxy.address, 300, community, royaltiesRegistry.address], { initializer: "__ExchangeV2_init" });
		transferManagerTest = await RaribleTransferManagerTest.new();
		t1 = await TestERC20.new();
		t2 = await TestERC20.new();
    /*ETH*/
    await testing.setFeeReceiver(eth, protocol);
    await testing.setFeeReceiver(t1.address, protocol);
 		/*ERC721 */
 		erc721 = await TestERC721.new("Rarible", "RARI", "https://ipfs.rarible.com");
		/*ERC1155V2*/
		erc1155_v2 = await ERC1155_V2.new("https://ipfs.rarible.com");
		erc1155_v2.initialize();
		/*ERC721_V1 */
 		erc721V1 = await ERC721_V1.new("Rarible", "RARI", "https://ipfs.rarible.com");
    await erc721V1.initialize();

	});
	describe("matchOrders", () => {
		it("eth orders work, expect throw, not enough eth ", async () => {
    	await t1.mint(accounts[1], 100);
    	await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });

    	const right = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");
    	const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
    	await expectThrow(
    		testing.matchOrders(left, "0x", right, await getSignature(right, accounts[1]), { from: accounts[2], value: 199 })
    	);
    })

		it("eth orders work, expect throw, unknown Data type of Order ", async () => {
    	await t1.mint(accounts[1], 100);
    	await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });

    	const right = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xfffffffe", "0x");
    	const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
    	await expectThrow(
    		testing.matchOrders(left, "0x", right, await getSignature(right, accounts[1]), { from: accounts[2], value: 300 })
    	);
    })

		it("eth orders work, rest is returned to taker (other side) ", async () => {
    	await t1.mint(accounts[1], 100);
    	await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });

			const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
    	const right = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");

    	let signatureRight = await getSignature(right, accounts[1]);
    	await verifyBalanceChange(accounts[2], 206, async () =>
    		verifyBalanceChange(accounts[1], -194, async () =>
    			verifyBalanceChange(protocol, -12, () =>
    				testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })
    			)
    		)
    	)
    	assert.equal(await t1.balanceOf(accounts[1]), 0);
    	assert.equal(await t1.balanceOf(accounts[2]), 100);
    })

		it("ERC721 to ETH order maker ETH != who pay, both orders have to be with signature ", async () => {
		  await erc721.mint(accounts[1], erc721TokenId1);
		  await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});

		  const left = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");

    	let signatureLeft = await getSignature(left, accounts[1]);
    	let signatureRight = await getSignature(right, accounts[2]);
    	await verifyBalanceChange(accounts[7], 206, async () =>
    		verifyBalanceChange(accounts[1], -194, async () =>
    			verifyBalanceChange(protocol, -12, () =>
    			  //NB! from: accounts[7] - who pay for NFT != order Maker
    				testing.matchOrders(left, signatureLeft, right, signatureRight, { from: accounts[7], value: 300, gasPrice: 0 })
    			)
    		)
    	)
    	assert.equal(await erc721.balanceOf(accounts[1]), 0);
    	assert.equal(await erc721.balanceOf(accounts[2]), 1);
    })

	  it("ERC721 to ETH order maker ETH != who pay, ETH orders have no signature, throw", async () => {
		  await erc721.mint(accounts[1], erc721TokenId1);
		  await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});

		  const left = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");

    	let signatureLeft = await getSignature(left, accounts[1]);

      await expectThrow(
    			testing.matchOrders(left, signatureLeft, right, "0x", { from: accounts[7], value: 300, gasPrice: 0 })
    	);
    })

    it("should match orders with ERC721 сollections", async () => {
      const matcher = await AssetMatcherCollectionTest.new();
      await matcher.__AssetMatcherCollection_init();
      await matcher.addOperator(testing.address);

      await erc721.mint(accounts[1], erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});

      const left = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(COLLECTION, enc(erc721.address), 1), 1, 0, 0, "0xffffffff", "0x");

      await testing.setAssetMatcher(COLLECTION, matcher.address);

      await testing.matchOrders(left, await getSignature(left, accounts[1]), right, await getSignature(right, accounts[2]), {value: 300});

      assert.equal(await erc721.balanceOf(accounts[1]), 0);
      assert.equal(await erc721.balanceOf(accounts[2]), 1);
    })
  });

	describe("Do matchOrders(), orders dataType == V1", () => {
		it("From ERC20(100) to ERC20(200) Protocol, Origin fees, no Royalties ", async () => {
			const { left, right } = await prepare2Orders()

			await testing.matchOrders(left, await getSignature(left, accounts[1]), right, "0x", { from: accounts[2] });

			assert.equal(await testing.fills(await libOrder.hashKey(left)), 200);

			assert.equal(await t1.balanceOf(accounts[1]), 0); //=104 - (100amount + 3byuerFee +1originleft)
			assert.equal(await t1.balanceOf(accounts[2]), 95);//=100 - 3sellerFee - 2originRight
			assert.equal(await t1.balanceOf(accounts[3]), 1);
			assert.equal(await t1.balanceOf(accounts[4]), 2);
			assert.equal(await t2.balanceOf(accounts[1]), 200);
			assert.equal(await t2.balanceOf(accounts[2]), 0);
		})

		it("From ERC20(10) to ERC20(20) Protocol, no fees because of rounding", async () => {
			const { left, right } = await prepare2Orders(10, 20, 10, 20)

			await testing.matchOrders(left, await getSignature(left, accounts[1]), right, "0x", { from: accounts[2] });

			assert.equal(await testing.fills(await libOrder.hashKey(left)), 20);

			assert.equal(await t1.balanceOf(accounts[1]), 0);
			assert.equal(await t1.balanceOf(accounts[2]), 10);
			assert.equal(await t2.balanceOf(accounts[1]), 20);
			assert.equal(await t2.balanceOf(accounts[2]), 0);
		})

		async function prepare2Orders(t1Amount = 104, t2Amount = 200, makeAmount = 100, takeAmount = 200) {
			await t1.mint(accounts[1], t1Amount);
			await t2.mint(accounts[2], t2Amount);
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
			await t2.approve(erc20TransferProxy.address, 10000000, { from: accounts[2] });
			let addrOriginLeft =[[accounts[3], makeAmount]];
			let addrOriginRight = [[accounts[4], takeAmount]];
			let encDataLeft = await encDataV1([ [[accounts[1], 10000]], addrOriginLeft ]);
			let encDataRight = await encDataV1([ [[accounts[2], 10000]], addrOriginRight ]);
			const left = Order(accounts[1], Asset(ERC20, enc(t1.address), makeAmount), ZERO, Asset(ERC20, enc(t2.address), takeAmount), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[2], Asset(ERC20, enc(t2.address), takeAmount), ZERO, Asset(ERC20, enc(t1.address), makeAmount), 1, 0, 0, ORDER_DATA_V1, encDataRight);
			return { left, right }
		}

		it("From ERC721(DataV1) to ERC20(NO DataV1) Protocol, Origin fees, no Royalties ", async () => {
			const { left, right } = await prepare721DV1_20rders()

			await testing.matchOrders(left, await getSignature(left, accounts[1]), right, "0x", { from: accounts[2] });

			assert.equal(await testing.fills(await libOrder.hashKey(left)), 100);

			assert.equal(await t2.balanceOf(accounts[1]), 94);	//=100 - 3sellerFee - 2originRight -1originleft
			assert.equal(await t2.balanceOf(accounts[2]), 2);		//=105 - (100amount + 3byuerFee )
			assert.equal(await t2.balanceOf(accounts[3]), 1);
			assert.equal(await t2.balanceOf(accounts[4]), 2);
			assert.equal(await erc721.balanceOf(accounts[1]), 0);
			assert.equal(await erc721.balanceOf(accounts[2]), 1);
			assert.equal(await t2.balanceOf(community), 6);
		})

		async function prepare721DV1_20rders(t2Amount = 105) {
			await erc721.mint(accounts[1], erc721TokenId1);
			await t2.mint(accounts[2], t2Amount);
			await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
			await t2.approve(erc20TransferProxy.address, 10000000, { from: accounts[2] });
			let addrOriginLeft = [[accounts[3], 100], [accounts[4], 200]];
			let encDataLeft = await encDataV1([ [[accounts[1], 10000]], addrOriginLeft ]);
			const left = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(t2.address), 100), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[2], Asset(ERC20, enc(t2.address), 100), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0,  "0xffffffff", "0x");
			return { left, right }
		}

		it("From ERC20(DataV1) to ERC1155(RoyalytiV2, DataV1) Protocol, Origin fees, Royalties ", async () => {
			const { left, right } = await prepare20DV1_1155V2Orders()

			await testing.matchOrders(left, await getSignature(left, accounts[1]), right, "0x", { from: accounts[2] });

			assert.equal(await testing.fills(await libOrder.hashKey(left)), 7);

			assert.equal(await t1.balanceOf(accounts[1]), 10);		//=120 - (100amount + 3byuerFee + 3originLeft + 4originleft)
			assert.equal(await t1.balanceOf(accounts[2]), 77);			//=100 - 3sellerFee - (10 +5)Royalties - 5originRight

			assert.equal(await t1.balanceOf(accounts[3]), 3);			//originleft
			assert.equal(await t1.balanceOf(accounts[4]), 4);			//originleft
			assert.equal(await t1.balanceOf(accounts[5]), 5);			//originRight
			assert.equal(await t1.balanceOf(accounts[6]), 10);		//Royalties
			assert.equal(await t1.balanceOf(accounts[7]), 5);			//Royalties
			assert.equal(await erc1155_v2.balanceOf(accounts[1], erc1155TokenId1), 7);
			assert.equal(await erc1155_v2.balanceOf(accounts[2], erc1155TokenId1), 3);
			assert.equal(await t1.balanceOf(protocol), 6);
		})

		async function prepare20DV1_1155V2Orders(t1Amount = 120, t2Amount = 10) {
			await t1.mint(accounts[1], t1Amount);
			await  erc1155_v2.mint(accounts[2], erc1155TokenId1, [], t2Amount);
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
			await  erc1155_v2.setApprovalForAll(transferProxy.address, true, {from: accounts[2]});

			let addrOriginLeft = [[accounts[3], 300], [accounts[4], 400]];
			let addrOriginRight = [[accounts[5], 500]];

			let encDataLeft = await encDataV1([ [[accounts[1], 10000]], addrOriginLeft ]);
			let encDataRight = await encDataV1([ [[accounts[2], 10000]], addrOriginRight ]);

			await royaltiesRegistry.setRoyaltiesByToken(erc1155_v2.address, [[accounts[6], 1000], [accounts[7], 500]]); //set royalties by token
			const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC1155, enc( erc1155_v2.address, erc1155TokenId1), 7), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[2], Asset(ERC1155, enc( erc1155_v2.address, erc1155TokenId1), 7), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, ORDER_DATA_V1, encDataRight);
			return { left, right }
		}

		it("From ERC1155(RoyalytiV2, DataV1) to ERC20(DataV1):Protocol, Origin fees, Royalties ", async () => {
			const { left, right } = await prepare1155V1_20DV1Orders()

			await testing.matchOrders(left, await getSignature(left, accounts[2]), right, "0x", { from: accounts[1] });

			assert.equal(await testing.fills(await libOrder.hashKey(left)), 100);

			assert.equal(await t1.balanceOf(accounts[1]), 12);		//=120 - (100amount + 3byuerFee +5originRight )
			assert.equal(await t1.balanceOf(accounts[2]), 75);			//=100 - 3sellerFee - (10 +5)Royalties - (3+4)originLeft

			assert.equal(await t1.balanceOf(accounts[3]), 3);			//originleft
			assert.equal(await t1.balanceOf(accounts[4]), 4);			//originleft
			assert.equal(await t1.balanceOf(accounts[5]), 5);			//originRight
			assert.equal(await t1.balanceOf(accounts[6]), 10);		//Royalties
			assert.equal(await t1.balanceOf(accounts[7]), 5);			//Royalties
			assert.equal(await erc1155_v2.balanceOf(accounts[1], erc1155TokenId1), 7);
			assert.equal(await erc1155_v2.balanceOf(accounts[2], erc1155TokenId1), 3);
			assert.equal(await t1.balanceOf(protocol), 6);
		})

		async function prepare1155V1_20DV1Orders(t1Amount = 120, t2Amount = 10) {
			await  erc1155_v2.mint(accounts[2], erc1155TokenId1, [], t2Amount);
			await t1.mint(accounts[1], t1Amount);
			await  erc1155_v2.setApprovalForAll(transferProxy.address, true, {from: accounts[2]});
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });

			let addrOriginLeft = [[accounts[3], 300], [accounts[4], 400]];
			let addrOriginRight = [[accounts[5], 500]];

			let encDataLeft = await encDataV1([ [[accounts[2], 10000]], addrOriginLeft ]);
			let encDataRight = await encDataV1([ [[accounts[1], 10000]], addrOriginRight ]);

			await royaltiesRegistry.setRoyaltiesByToken(erc1155_v2.address, [[accounts[6], 1000], [accounts[7], 500]]); //set royalties by token
			const left = Order(accounts[2], Asset(ERC1155, enc( erc1155_v2.address, erc1155TokenId1), 7), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC1155, enc( erc1155_v2.address, erc1155TokenId1), 7), 1, 0, 0, ORDER_DATA_V1, encDataRight);
			return { left, right }
		}

		it("From ETH(DataV1) to ERC720(RoyalytiV1, DataV1) Protocol, Origin fees, Royalties", async () => {
			await erc721V1.mint(accounts[1], erc721TokenId1, []);
    	await erc721V1.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});

			let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600]];
			let addrOriginRight = [[accounts[7], 700]];

			let encDataLeft = await encDataV1([ [[accounts[2], 10000]], addrOriginLeft ]);
			let encDataRight = await encDataV1([ [[accounts[1], 10000]], addrOriginRight ]);
			await royaltiesRegistry.setRoyaltiesByToken(erc721V1.address, [[accounts[3], 300], [accounts[4], 400]]); //set royalties by token
			const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
    	const right = Order(accounts[1], Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
    	let signatureRight = await getSignature(right, accounts[1]);
    	await verifyBalanceChange(accounts[2], 228, async () =>			//200+6buyerFee+ (10+12 origin left) (72back)
    		verifyBalanceChange(accounts[1], -166, async () =>				//200 -6seller - (6+8royalties) - 14originright
    			verifyBalanceChange(accounts[3], -6, async () =>
    				verifyBalanceChange(accounts[4], -8, async () =>
    					verifyBalanceChange(accounts[5], -10, async () =>
    						verifyBalanceChange(accounts[6], -12, async () =>
    							verifyBalanceChange(accounts[7], -14, async () =>
    								verifyBalanceChange(protocol, -12, () =>
    									testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })
    								)
    							)
    						)
    					)
    				)
    			)
    		)
    	)
    	assert.equal(await erc721V1.balanceOf(accounts[1]), 0);
    	assert.equal(await erc721V1.balanceOf(accounts[2]), 1);
    })

		it("From ETH(DataV1) to ERC720(DataV1) Protocol, Origin fees,  no Royalties", async () => {
			await erc721.mint(accounts[1], erc721TokenId1);
    	await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});

			let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600]];
			let addrOriginRight = [[accounts[7], 700]];

			let encDataLeft = await encDataV1([ [[accounts[2], 10000]], addrOriginLeft ]);
			let encDataRight = await encDataV1([ [[accounts[1], 10000]], addrOriginRight ]);

			const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
    	const right = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
    	let signatureRight = await getSignature(right, accounts[1]);
    	await verifyBalanceChange(accounts[2], 228, async () =>			//200+6buyerFee+ (10 +12 origin left) (72back)
    		verifyBalanceChange(accounts[1], -180, async () =>				//200 -6seller - 14 originright
    			verifyBalanceChange(accounts[5], -10, async () =>
    				verifyBalanceChange(accounts[6], -12, async () =>
    					verifyBalanceChange(accounts[7], -14, async () =>
    						verifyBalanceChange(protocol, -12, () =>
    							testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })
    						)
    					)
    				)
    			)
  			)
 			)
    	assert.equal(await erc721.balanceOf(accounts[1]), 0);
    	assert.equal(await erc721.balanceOf(accounts[2]), 1);
    })

		it("From ETH(DataV1) to ERC720(DataV1) Protocol, Origin fees comes from OrderNFT,  no Royalties", async () => {
			await erc721.mint(accounts[1], erc721TokenId1);
    	await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});

			let addrOriginLeft = [];
			let addrOriginRight = [[accounts[5], 500], [accounts[6], 600], [accounts[7], 700]];

			let encDataLeft = await encDataV1([ [[accounts[2], 10000]], addrOriginLeft]);
			let encDataRight = await encDataV1([ [[accounts[1], 10000]], addrOriginRight ]);

			const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
    	const right = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
    	let signatureRight = await getSignature(right, accounts[1]);
    	await verifyBalanceChange(accounts[2], 206, async () =>			//200+6buyerFee+  (94back)
    		verifyBalanceChange(accounts[1], -158, async () =>				//200 -6seller - (10+ 12+ 14) originright
    			verifyBalanceChange(accounts[5], -10, async () =>
    				verifyBalanceChange(accounts[6], -12, async () =>
    					verifyBalanceChange(accounts[7], -14, async () =>
    						verifyBalanceChange(protocol, -12, () =>
    							testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })
    						)
    					)
    				)
    			)
  			)
 			)
    	assert.equal(await erc721.balanceOf(accounts[1]), 0);
    	assert.equal(await erc721.balanceOf(accounts[2]), 1);
    })

		it("From ETH(DataV1) to ERC720(DataV1) Protocol, Origin fees comes from OrderETH,  no Royalties", async () => {
			await erc721.mint(accounts[1], erc721TokenId1);
    	await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});

			let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600], [accounts[7], 700]];
			let addrOriginRight = [];

			let encDataLeft = await encDataV1([ [[accounts[2], 10000]], addrOriginLeft ]);
			let encDataRight = await encDataV1([ [[accounts[1], 10000]], addrOriginRight ]);

			const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
    	const right = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
    	let signatureRight = await getSignature(right, accounts[1]);
    	await verifyBalanceChange(accounts[2], 242, async () =>			//200+6buyerFee+ (10 +12 +14 origin left) (72back)
    		verifyBalanceChange(accounts[1], -194, async () =>				//200 -6seller -
    			verifyBalanceChange(accounts[5], -10, async () =>
    				verifyBalanceChange(accounts[6], -12, async () =>
    					verifyBalanceChange(accounts[7], -14, async () =>
    						verifyBalanceChange(protocol, -12, () =>
    							testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })
    						)
    					)
    				)
    			)
  			)
 			)
    	assert.equal(await erc721.balanceOf(accounts[1]), 0);
    	assert.equal(await erc721.balanceOf(accounts[2]), 1);
    })

		it("From ETH(DataV1) to ERC720(DataV1) Protocol, no Royalties, Origin fees comes from OrderETH NB!!! not enough ETH", async () => {
			await erc721.mint(accounts[1], erc721TokenId1);
    	await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});

			let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600], [accounts[7], 700], [accounts[3], 3000]];
			let addrOriginRight = [];

			let encDataLeft = await encDataV1([ [[accounts[2], 10000]], addrOriginLeft ]);
			let encDataRight = await encDataV1([ [[accounts[1], 10000]], addrOriginRight ]);

			const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
    	const right = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
    	let signatureRight = await getSignature(right, accounts[1]);

    	await expectThrow(
      	testing.matchOrders(left, "0x", right, await getSignature(right, accounts[1]), { from: accounts[2], value: 300, gasPrice: 0 })
      );
			/*comments for k.shcherbakov@rarible.com to show mechanism*/
//    	await verifyBalanceChange(accounts[2], 302, async () =>			//200+6buyerFee+ (10 +12 +14 +60 origin left) (Need 302 ETH not enough!)
//    		verifyBalanceChange(accounts[1], -194, async () =>				//200 -6seller -
//    			verifyBalanceChange(accounts[5], -10, async () =>
//    				verifyBalanceChange(accounts[6], -12, async () =>
//    					verifyBalanceChange(accounts[7], -14, async () =>
//    						verifyBalanceChange(protocol, -12, () =>
//    							testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })
//    						)
//    					)
//    				)
//    			)
//  			)
// 			)
//    	assert.equal(await erc721.balanceOf(accounts[1]), 0);
//    	assert.equal(await erc721.balanceOf(accounts[2]), 1);
    })

		it("From ETH(DataV1) to ERC720(DataV1) Protocol, no Royalties, Origin fees comes from OrderNFT NB!!! not enough ETH for lastOrigin and seller!", async () => {
			await erc721.mint(accounts[1], erc721TokenId1);
    	await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});

			let addrOriginLeft = [];
			let addrOriginRight = [[accounts[3], 9000], [accounts[5], 500], [accounts[6], 600], [accounts[7], 700]];

			let encDataLeft = await encDataV1([ [[accounts[2], 10000]], addrOriginLeft ]);
			let encDataRight = await encDataV1([ [[accounts[1], 10000]], addrOriginRight ]);

			const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
    	const right = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
    	let signatureRight = await getSignature(right, accounts[1]);

    	await verifyBalanceChange(accounts[2], 206, async () =>			//200+6buyerFee+
    		verifyBalanceChange(accounts[1], 0, async () =>				//200 -6seller -(180 + 10 + 12(really 10) + 14(really 0) origin left)
    			verifyBalanceChange(accounts[3], -180, async () =>
    				verifyBalanceChange(accounts[5], -10, async () =>
    					verifyBalanceChange(accounts[6], -4, async () =>
    						verifyBalanceChange(accounts[7], 0, async () =>
    							verifyBalanceChange(protocol, -12, () =>
    								testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })
    							)
    						)
    					)
    				)
    			)
  			)
 			)
    	assert.equal(await erc721.balanceOf(accounts[1]), 0);
    	assert.equal(await erc721.balanceOf(accounts[2]), 1);
    })

	})	//("Do matchOrders(), orders dataType == V1"

	describe("Do matchOrders(), orders dataType == V1, MultipleBeneficiary", () => {
		it("From ERC20(100) to ERC20(200) Protocol, Origin fees, no Royalties, payouts: 1)20/80%, 2)50/50%", async () => {
			const { left, right } = await prepare2Orders()

			await testing.matchOrders(left, await getSignature(left, accounts[1]), right, "0x", { from: accounts[2] });

			assert.equal(await testing.fills(await libOrder.hashKey(left)), 200);

			assert.equal(await t1.balanceOf(accounts[1]), 0); //=104 - (100amount + 3byuerFee +1originleft)
			assert.equal(await t1.balanceOf(accounts[2]), 19);//=(100 - 3sellerFee - 2originRight)*20%
			assert.equal(await t1.balanceOf(accounts[6]), 76);//=(100 - 3sellerFee - 2originRight)*80%
			assert.equal(await t1.balanceOf(accounts[3]), 1);
			assert.equal(await t1.balanceOf(accounts[4]), 2);
			assert.equal(await t2.balanceOf(accounts[1]), 100); //50%
			assert.equal(await t2.balanceOf(accounts[5]), 100); //50%
			assert.equal(await t2.balanceOf(accounts[2]), 0);
		})

		async function prepare2Orders(t1Amount = 104, t2Amount = 200) {
			await t1.mint(accounts[1], t1Amount);
			await t2.mint(accounts[2], t2Amount);
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
			await t2.approve(erc20TransferProxy.address, 10000000, { from: accounts[2] });
			let addrOriginLeft =[[accounts[3], 100]];
			let addrOriginRight = [[accounts[4], 200]];
			let encDataLeft = await encDataV1([ [[accounts[1], 5000], [accounts[5], 5000]], addrOriginLeft ]);
			let encDataRight = await encDataV1([ [[accounts[2], 2000], [accounts[6], 8000]], addrOriginRight ]);
			const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC20, enc(t2.address), 200), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[2], Asset(ERC20, enc(t2.address), 200), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, ORDER_DATA_V1, encDataRight);
			return { left, right }
		}

		it("From ERC721(DataV1) to ERC20(NO DataV1) Protocol, Origin fees, no Royalties, payouts: 50/50%", async () => {
			const { left, right } = await prepare721DV1_20rders()

			await testing.matchOrders(left, await getSignature(left, accounts[1]), right, "0x", { from: accounts[2] });

			assert.equal(await testing.fills(await libOrder.hashKey(left)), 100);

			assert.equal(await t2.balanceOf(accounts[1]), 47);	//=100 - 3sellerFee - 2originRight -1originleft 50%
			assert.equal(await t2.balanceOf(accounts[5]), 47);	//=100 - 3sellerFee - 2originRight -1originleft 50%
			assert.equal(await t2.balanceOf(accounts[2]), 2);		//=105 - (100amount + 3byuerFee )
			assert.equal(await t2.balanceOf(accounts[3]), 1);
			assert.equal(await t2.balanceOf(accounts[4]), 2);
			assert.equal(await erc721.balanceOf(accounts[1]), 0);
			assert.equal(await erc721.balanceOf(accounts[2]), 1);
			assert.equal(await t2.balanceOf(community), 6);
		})

		async function prepare721DV1_20rders(t2Amount = 105) {
			await erc721.mint(accounts[1], erc721TokenId1);
			await t2.mint(accounts[2], t2Amount);
			await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
			await t2.approve(erc20TransferProxy.address, 10000000, { from: accounts[2] });
			let addrOriginLeft = [[accounts[3], 100], [accounts[4], 200]];
			let encDataLeft = await encDataV1([ [[accounts[1], 5000], [accounts[5], 5000]], addrOriginLeft ]);
			const left = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(t2.address), 100), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[2], Asset(ERC20, enc(t2.address), 100), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0,  "0xffffffff", "0x");
			return { left, right }
		}

		it("From ERC721(DataV1) to ERC20(NO DataV1) Protocol, Origin fees, no Royalties, payouts: 110%, throw", async () => {
			const { left, right } = await prepare721DV1_20_110CentsOrders()

			await expectThrow(
				testing.matchOrders(left, await getSignature(left, accounts[1]), right, "0x", { from: accounts[2] })
			);

		})

		async function prepare721DV1_20_110CentsOrders(t2Amount = 105) {
			await erc721.mint(accounts[1], erc721TokenId1);
			await t2.mint(accounts[2], t2Amount);
			await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
			await t2.approve(erc20TransferProxy.address, 10000000, { from: accounts[2] });
			let addrOriginLeft = [[accounts[3], 100], [accounts[4], 200]];
			let encDataLeft = await encDataV1([ [[accounts[1], 5000], [accounts[5], 6000]], addrOriginLeft ]);
			const left = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(t2.address), 100), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[2], Asset(ERC20, enc(t2.address), 100), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0,  "0xffffffff", "0x");
			return { left, right }
		}

		it("From ETH(DataV1) to ERC721(DataV1) Protocol, Origin fees,  no Royalties, payouts: 50/50%", async () => {
			await erc721.mint(accounts[1], erc721TokenId1);
    	await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});

			let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600]];
			let addrOriginRight = [[accounts[7], 700]];

			let encDataLeft = await encDataV1([ [[accounts[2], 10000]], addrOriginLeft ]);
			let encDataRight = await encDataV1([ [[accounts[1], 5000], [accounts[3], 5000]], addrOriginRight ]);

			const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
    	const right = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
    	let signatureRight = await getSignature(right, accounts[1]);
    	await verifyBalanceChange(accounts[2], 228, async () =>			//200+6buyerFee+ (10 +12 origin left) (72back)
    		verifyBalanceChange(accounts[3], -90, async () =>				//200 -6seller - 14 originright *50%
    			verifyBalanceChange(accounts[1], -90, async () =>				//200 -6seller - 14 originright *50%
    				verifyBalanceChange(accounts[5], -10, async () =>
    					verifyBalanceChange(accounts[6], -12, async () =>
    						verifyBalanceChange(accounts[7], -14, async () =>
    							verifyBalanceChange(protocol, -12, () =>
    								testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })
    							)
    						)
    					)
    				)
    			)
  			)
 			)
    	assert.equal(await erc721.balanceOf(accounts[1]), 0);
    	assert.equal(await erc721.balanceOf(accounts[2]), 1);
    })

		it("From ETH(DataV1) to ERC721(DataV1) Protocol, Origin fees,  no Royalties, payouts: empy 100% to order.maker", async () => {
			await erc721.mint(accounts[1], erc721TokenId1);
    	await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});

			let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600]];
			let addrOriginRight = [[accounts[7], 700]];

			let encDataLeft = await encDataV1([ [[accounts[2], 10000]], addrOriginLeft ]);
			let encDataRight = await encDataV1([ [], addrOriginRight ]); //empty payout

			const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
    	const right = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
    	let signatureRight = await getSignature(right, accounts[1]);
    	await verifyBalanceChange(accounts[2], 228, async () =>			//200+6buyerFee+ (10 +12 origin left) (72back)
    			verifyBalanceChange(accounts[1], -180, async () =>				//200 -6seller - 14 originright *100%
    				verifyBalanceChange(accounts[5], -10, async () =>
    					verifyBalanceChange(accounts[6], -12, async () =>
    						verifyBalanceChange(accounts[7], -14, async () =>
    							verifyBalanceChange(protocol, -12, () =>
    								testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })
    							)
    						)
    					)
    				)
    			)
 			)
    	assert.equal(await erc721.balanceOf(accounts[1]), 0);
    	assert.equal(await erc721.balanceOf(accounts[2]), 1);
    })


	})	//Do matchOrders(), orders dataType == V1, MultipleBeneficiary

	describe("Catch emit event Transfer", () => {
		it("From ETH(DataV1) to ERC721(DataV1) Protocol, check emit ", async () => {
			const seller = accounts[1];
			const sellerRoyaltiy = accounts[4];
			const seller2 = accounts[3];
			const buyer = accounts[2];
			const originLeft1 = accounts[5];
			const originLeft2 = accounts[6];
			const originRight = accounts[7];

			await erc721V1.mint(seller, erc721TokenId1, [[sellerRoyaltiy, 1000]]);
    	await erc721V1.setApprovalForAll(transferProxy.address, true, {from: seller});

			let addrOriginLeft = [[originLeft1, 500], [originLeft2, 600]];
 			let addrOriginRight = [[originRight, 700]];
 			let encDataLeft = await encDataV1([ [[buyer, 10000]], addrOriginLeft ]);
 			let encDataRight = await encDataV1([ [[seller, 5000], [seller2, 5000]], addrOriginRight ]);

			const left = Order(buyer, Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
    	const right = Order(seller, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
    	let signatureRight = await getSignature(right, seller);
    	let tx = await testing.matchOrders(left, "0x", right, signatureRight, { from: buyer, value: 300, gasPrice: 0 });
			let errorCounter = 0
//			eventEmitted  - срабатывает по нескольким transfer, для фиксации ошибки нужно чтоб все трансферы завалились
			truffleAssert.eventEmitted(tx, 'Transfer', (ev) => {
				let result = false;
				switch (ev.to){
					case protocol:
						if ((ev.transferDirection != TO_TAKER) && (ev.transferType != PROTOCOL)) {
							console.log("Error in protocol check:");
							errorCounter++;
						}
					break
					case seller:
						if ((ev.transferDirection != TO_TAKER) && (ev.transferType != PAYOUT) ) {
							console.log("Error in seller check:");
							errorCounter++;
						}
					break
					case sellerRoyaltiy:
						if ((ev.transferDirection != TO_TAKER) && (ev.transferType != ROYALTY) ) {
							console.log("Error in seller check:");
							errorCounter++;
						}
					break
					case seller2:
						if ((ev.transferDirection != TO_TAKER) && (ev.transferType != PAYOUT) ) {
							console.log("Error in seller2 check:");
							errorCounter++;
						}
					break
					case originLeft1:
						if ((ev.transferDirection != TO_TAKER) && (ev.transferType != ORIGIN) ) {
							console.log("Error in originLeft1 check:");
							errorCounter++;
						}
					break
					case originLeft2:
						if ((ev.transferDirection != TO_TAKER) && (ev.transferType != ORIGIN) ) {
							console.log("Error in originLeft2 check:");
							errorCounter++;
						}
					break
					case originRight:
						if ((ev.transferDirection != TO_TAKER) && (ev.transferType != ORIGIN) ) {
							console.log("Error in originRight check:");
							errorCounter++;
						}
					break
					case buyer:
						if ((ev.transferDirection != TO_MAKER) && (ev.transferType != PAYOUT) ){
							console.log("Error in buyer check:");
							errorCounter++;
						}
					break
				}
				if (errorCounter > 0) {
					result = false;
				} else {
					result = true;
				}
				return result;
    	}, "Transfer shuold be emietted with correct parameters ");
			assert.equal(errorCounter, 0); //фиксируем наличие ошибок тут
    })

		it("From ERC1155(DataV2) to ETH(DataV1) Protocol, check emit ", async () => {
			const seller = accounts[1];
			const sellerRoyaltiy = accounts[4];
			const seller2 = accounts[3];
			const buyer = accounts[2];
			const originLeft1 = accounts[5];
			const originLeft2 = accounts[6];
			const originRight = accounts[7];

			await erc1155_v2.mint(seller, erc1155TokenId1, [[sellerRoyaltiy, 1000]], 10);
    	await erc1155_v2.setApprovalForAll(transferProxy.address, true, {from: seller});

			let addrOriginLeft = [[originLeft1, 500], [originLeft2, 600]];
 			let addrOriginRight = [[originRight, 700]];
 			let encDataLeft = await encDataV1([ [[seller, 5000], [seller2, 5000]] , addrOriginLeft ]);
 			let encDataRight = await encDataV1([ [[buyer, 10000]], addrOriginRight ]);

			const left = Order(seller, Asset(ERC1155, enc(erc1155_v2.address, erc1155TokenId1), 5), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(buyer, Asset(ETH, "0x", 200), ZERO, Asset(ERC1155, enc(erc1155_v2.address, erc1155TokenId1), 5), 1, 0, 0, ORDER_DATA_V1, encDataRight);

    	let signatureRight = await getSignature(right, buyer);
    	let tx = await testing.matchOrders(left, "0x", right, signatureRight, { from: seller, value: 300, gasPrice: 0 });
			let errorCounter = 0
//			eventEmitted  - срабатывает по нескольким transfer, для фиксации ошибки нужно чтоб все трансферы завалились
			truffleAssert.eventEmitted(tx, 'Transfer', (ev) => {
				let result = false;
				switch (ev.to){
					case protocol:
						if ((ev.transferDirection != TO_MAKER) && (ev.transferType != PROTOCOL)) {
							console.log("Error in protocol check:");
							errorCounter++;
						}
					break
					case seller:
						if ((ev.transferDirection != TO_MAKER) && (ev.transferType != PAYOUT) ) {
							console.log("Error in seller check:");
							errorCounter++;
						}
					break
					case sellerRoyaltiy:
						if ((ev.transferDirection != TO_MAKER) && (ev.transferType != ROYALTY) ) {
							console.log("Error in seller check:");
							errorCounter++;
						}
					break
					case seller2:
						if ((ev.transferDirection != TO_MAKER) && (ev.transferType != PAYOUT) ) {
							console.log("Error in seller2 check:");
							errorCounter++;
						}
					break
					case originLeft1:
						if ((ev.transferDirection != TO_MAKER) && (ev.transferType != ORIGIN) ) {
							console.log("Error in originLeft1 check:");
							errorCounter++;
						}
					break
					case originLeft2:
						if ((ev.transferDirection != TO_MAKER) && (ev.transferType != ORIGIN) ) {
							console.log("Error in originLeft2 check:");
							errorCounter++;
						}
					break
					case originRight:
						if ((ev.transferDirection != TO_MAKER) && (ev.transferType != ORIGIN) ) {
							console.log("Error in originRight check:");
							errorCounter++;
						}
					break
					case buyer:
						if ((ev.transferDirection != TO_TAKER) && (ev.transferType != PAYOUT) ){
							console.log("Error in buyer check:");
							errorCounter++;
						}
					break
				}
				if (errorCounter > 0) {
					result = false;
				} else {
					result = true;
				}
				return result;
    	}, "Transfer shuold be emietted with correct parameters ");
			assert.equal(errorCounter, 0); //фиксируем наличие ошибок тут
    })

	}) //Catch emit event Transfer

	describe("Exchange with Royalties", () => {
		it("Royalties by owner, token 721 to ETH", async () => {
			await erc721.mint(accounts[1], erc721TokenId1);
    	await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
    	await royaltiesRegistry.setRoyaltiesByToken(erc721.address, [[accounts[3], 500], [accounts[4], 1000]]); //set royalties by token
    	let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600]];
    	let addrOriginRight = [[accounts[7], 700]];

    	let encDataLeft = await encDataV1([ [[accounts[2], 10000]], addrOriginLeft ]);
    	let encDataRight = await encDataV1([ [[accounts[1], 10000]], addrOriginRight ]);

    	const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
    	const right = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
    	let signatureRight = await getSignature(right, accounts[1]);
    	await verifyBalanceChange(accounts[2], 228, async () =>			//200+6buyerFee+ (10 +12 origin left) (72back)
    		verifyBalanceChange(accounts[1], -150, async () =>				//200 -6seller - 14 originright
    			verifyBalanceChange(accounts[3], -10, async () =>
    				verifyBalanceChange(accounts[4], -20, async () =>
    					verifyBalanceChange(accounts[5], -10, async () =>
    						verifyBalanceChange(accounts[6], -12, async () =>
    							verifyBalanceChange(accounts[7], -14, async () =>
    								verifyBalanceChange(protocol, -12, () =>
    									testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })
    								)
    							)
    						)
    					)
    				)
    			)
    		)
    	)
    	assert.equal(await erc721.balanceOf(accounts[1]), 0);
    	assert.equal(await erc721.balanceOf(accounts[2]), 1);

		})
		it("Royalties by owner, token and tokenId 721 to ETH", async () => {
			await erc721.mint(accounts[1], erc721TokenId1);
    	await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
    	await royaltiesRegistry.setRoyaltiesByTokenAndTokenId(erc721.address, erc721TokenId1, [[accounts[3], 500], [accounts[4], 1000]]); //set royalties by token and tokenId
    	let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600]];
    	let addrOriginRight = [[accounts[7], 700]];

    	let encDataLeft = await encDataV1([ [[accounts[2], 10000]], addrOriginLeft ]);
    	let encDataRight = await encDataV1([ [[accounts[1], 10000]], addrOriginRight ]);

    	const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
    	const right = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
    	let signatureRight = await getSignature(right, accounts[1]);
    	await verifyBalanceChange(accounts[2], 228, async () =>			//200+6buyerFee+ (10 +12 origin left) (72back)
    		verifyBalanceChange(accounts[1], -150, async () =>				//200 -6seller - 14 originright
    			verifyBalanceChange(accounts[3], -10, async () =>
    				verifyBalanceChange(accounts[4], -20, async () =>
    					verifyBalanceChange(accounts[5], -10, async () =>
    						verifyBalanceChange(accounts[6], -12, async () =>
    							verifyBalanceChange(accounts[7], -14, async () =>
    								verifyBalanceChange(protocol, -12, () =>
    									testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })
    								)
    							)
    						)
    					)
    				)
    			)
    		)
    	)
    	assert.equal(await erc721.balanceOf(accounts[1]), 0);
    	assert.equal(await erc721.balanceOf(accounts[2]), 1);

		})

		it("Royalties by token and tokenId 721v1_OwnableUpgradaeble to ETH", async () => {
			let ownerErc721 = accounts[6];
   		ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.new("Rarible", "RARI", "https://ipfs.rarible.com", {from: ownerErc721 });
      await ERC721_V1OwnUpgrd.initialize( {from: ownerErc721});

			await ERC721_V1OwnUpgrd.mint(accounts[1], erc721TokenId1, []);
    	await ERC721_V1OwnUpgrd.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
    	await royaltiesRegistry.setRoyaltiesByTokenAndTokenId(ERC721_V1OwnUpgrd.address, erc721TokenId1, [[accounts[3], 500], [accounts[4], 1000]], {from: ownerErc721}); //set royalties by token and tokenId
    	let addrOriginLeft = [[accounts[5], 500]];
    	let addrOriginRight = [[accounts[7], 700]];

    	let encDataLeft = await encDataV1([ [[accounts[2], 10000]], addrOriginLeft ]);
    	let encDataRight = await encDataV1([ [[accounts[1], 10000]], addrOriginRight ]);

    	const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(ERC721_V1OwnUpgrd.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
    	const right = Order(accounts[1], Asset(ERC721, enc(ERC721_V1OwnUpgrd.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
    	let signatureRight = await getSignature(right, accounts[1]);
    	await verifyBalanceChange(accounts[2], 216, async () =>			//200+6buyerFee+ (10  origin left) (72back)
    		verifyBalanceChange(accounts[1], -150, async () =>				//200 -6seller - 14 originright
    			verifyBalanceChange(accounts[3], -10, async () =>
    				verifyBalanceChange(accounts[4], -20, async () =>
    					verifyBalanceChange(accounts[5], -10, async () =>
    						verifyBalanceChange(accounts[7], -14, async () =>
    							verifyBalanceChange(protocol, -12, () =>
    								testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })
    							)
    						)
    					)
    				)
    			)
    		)
    	)
    	assert.equal(await ERC721_V1OwnUpgrd.balanceOf(accounts[1]), 0);
    	assert.equal(await ERC721_V1OwnUpgrd.balanceOf(accounts[2]), 1);

		})

	})

  describe("matchOrders, orderType = V2", () => {
    it("should correctly calculate make-side fill for isMakeFill = true ", async () => {
      const seller = accounts[1];
      const buyer = accounts[2];
      const buyer1 = accounts[3];
  
      await erc1155_v2.mint(seller, erc1155TokenId1, [], 200);
      await erc1155_v2.setApprovalForAll(transferProxy.address, true, { from: seller });
  
      const encDataLeft = await encDataV2([[], [], true]);
      const encDataRight = await encDataV2([[], [], false]);
  
      const left = Order(seller, Asset(ERC1155, enc(erc1155_v2.address, erc1155TokenId1), 200), ZERO, Asset(ETH, "0x", 1000), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const right = Order(buyer, Asset(ETH, "0x", 500), ZERO, Asset(ERC1155, enc(erc1155_v2.address, erc1155TokenId1), 100), 1, 0, 0, ORDER_DATA_V2, encDataRight);
  
      await verifyBalanceChange(seller, -485, async () =>
        verifyBalanceChange(buyer, 515, async () =>
          testing.matchOrders(left, await getSignature(left, seller), right, "0x", { from: buyer, value: 600, gasPrice: 0 })
        )
      )
      assert.equal(await erc1155_v2.balanceOf(buyer, erc1155TokenId1), 100);
      assert.equal(await erc1155_v2.balanceOf(seller, erc1155TokenId1), 100);
  
      const leftOrderHash = await libOrder.hashKey(left);
      const test_hash = await libOrder.hashV2(seller, Asset(ERC1155, enc(erc1155_v2.address, erc1155TokenId1), 200), Asset(ETH, "0x", 1000), 1, encDataLeft)
      assert.equal(leftOrderHash, test_hash, "correct hash for V2")
      assert.equal(await testing.fills(leftOrderHash), 100, "left fill make side")
  
      const left1 = Order(seller, Asset(ERC1155, enc(erc1155_v2.address, erc1155TokenId1), 200), ZERO, Asset(ETH, "0x", 600), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const right1 = Order(buyer1, Asset(ETH, "0x", 300), ZERO, Asset(ERC1155, enc(erc1155_v2.address, erc1155TokenId1), 100), 1, 0, 0, ORDER_DATA_V2, encDataRight);
  
      await verifyBalanceChange(seller, -291, async () =>
        verifyBalanceChange(buyer1, 309, async () =>
          testing.matchOrders(left1, await getSignature(left1, seller), right1, "0x", { from: buyer1, value: 600, gasPrice: 0 })
        )
      )
      assert.equal(await testing.fills(leftOrderHash), 200, "left fill make side 1")
      assert.equal(await erc1155_v2.balanceOf(buyer1, erc1155TokenId1), 100);
      assert.equal(await erc1155_v2.balanceOf(seller, erc1155TokenId1), 0);
    })
  
    it("should correctly calculate take-side fill for isMakeFill = false ", async () => {
      const seller = accounts[1];
      const buyer = accounts[2];
      const buyer1 = accounts[3];
  
      await erc1155_v2.mint(seller, erc1155TokenId1, [], 200);
      await erc1155_v2.setApprovalForAll(transferProxy.address, true, { from: seller });
  
      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[], [], false]);
  
      const left = Order(seller, Asset(ERC1155, enc(erc1155_v2.address, erc1155TokenId1), 200), ZERO, Asset(ETH, "0x", 1000), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const right = Order(buyer, Asset(ETH, "0x", 500), ZERO, Asset(ERC1155, enc(erc1155_v2.address, erc1155TokenId1), 100), 1, 0, 0, ORDER_DATA_V2, encDataRight);
  
      await verifyBalanceChange(seller, -485, async () =>
        verifyBalanceChange(buyer, 515, async () =>
          testing.matchOrders(left, await getSignature(left, seller), right, "0x", { from: buyer, value: 600, gasPrice: 0 })
        )
      )
      assert.equal(await erc1155_v2.balanceOf(buyer, erc1155TokenId1), 100);
      assert.equal(await erc1155_v2.balanceOf(seller, erc1155TokenId1), 100);
  
      const leftOrderHash = await libOrder.hashKey(left);
      assert.equal(await testing.fills(leftOrderHash), 500, "left fill make side")
  
      const left1 = Order(seller, Asset(ERC1155, enc(erc1155_v2.address, erc1155TokenId1), 200), ZERO, Asset(ETH, "0x", 2000), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const right1 = Order(buyer1, Asset(ETH, "0x", 1000), ZERO, Asset(ERC1155, enc(erc1155_v2.address, erc1155TokenId1), 100), 1, 0, 0, ORDER_DATA_V2, encDataRight);
  
      await verifyBalanceChange(seller, -970, async () =>
        verifyBalanceChange(buyer1, 1030, async () =>
          testing.matchOrders(left1, await getSignature(left1, seller), right1, "0x", { from: buyer1, value: 1100, gasPrice: 0 })
        )
      )
  
      assert.equal(await erc1155_v2.balanceOf(buyer1, erc1155TokenId1), 100);
      assert.equal(await erc1155_v2.balanceOf(seller, erc1155TokenId1), 0);
      assert.equal(await testing.fills(leftOrderHash), 1500, "left fill make side 1")
    })

    it("should correctly calculate make-side fill for isMakeFill = true and originFees ", async () => {
      const seller = accounts[1];
      const buyer = accounts[2];
      const buyer1 = accounts[3];
  
      await erc1155_v2.mint(seller, erc1155TokenId1, [], 200);
      await erc1155_v2.setApprovalForAll(transferProxy.address, true, { from: seller });
  
      const encDataLeft = await encDataV2([[[seller, 10000]], [[accounts[5], 1000]], true]);
      const encDataRight = await encDataV2([[], [], false]);
  
      const left = Order(seller, Asset(ERC1155, enc(erc1155_v2.address, erc1155TokenId1), 200), ZERO, Asset(ETH, "0x", 1000), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const right = Order(buyer, Asset(ETH, "0x", 500), ZERO, Asset(ERC1155, enc(erc1155_v2.address, erc1155TokenId1), 100), 1, 0, 0, ORDER_DATA_V2, encDataRight);
  
      await verifyBalanceChange(seller, -435, async () =>
        verifyBalanceChange(buyer, 515, async () =>
          verifyBalanceChange(accounts[5], -50, async () =>
            testing.matchOrders(left, await getSignature(left, seller), right, "0x", { from: buyer, value: 600, gasPrice: 0 })
          )
        )
      )
      assert.equal(await erc1155_v2.balanceOf(buyer, erc1155TokenId1), 100);
      assert.equal(await erc1155_v2.balanceOf(seller, erc1155TokenId1), 100);
  
      const leftOrderHash = await libOrder.hashKey(left);
      const test_hash = await libOrder.hashV2(seller, Asset(ERC1155, enc(erc1155_v2.address, erc1155TokenId1), 200), Asset(ETH, "0x", 1000), 1, encDataLeft)
      assert.equal(leftOrderHash, test_hash, "correct hash for V2")
      assert.equal(await testing.fills(leftOrderHash), 100, "left fill make side")
  
      const left1 = Order(seller, Asset(ERC1155, enc(erc1155_v2.address, erc1155TokenId1), 200), ZERO, Asset(ETH, "0x", 600), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const right1 = Order(buyer1, Asset(ETH, "0x", 300), ZERO, Asset(ERC1155, enc(erc1155_v2.address, erc1155TokenId1), 100), 1, 0, 0, ORDER_DATA_V2, encDataRight);
  
      await verifyBalanceChange(seller, -261, async () =>
        verifyBalanceChange(buyer1, 309, async () =>
          verifyBalanceChange(accounts[5], -30, async () =>
            testing.matchOrders(left1, await getSignature(left1, seller), right1, "0x", { from: buyer1, value: 600, gasPrice: 0 })
          )
        )
      )
      assert.equal(await testing.fills(leftOrderHash), 200, "left fill make side 1")
      assert.equal(await erc1155_v2.balanceOf(buyer1, erc1155TokenId1), 100);
      assert.equal(await erc1155_v2.balanceOf(seller, erc1155TokenId1), 0);
    })
  
  })

	function encDataV1(tuple) {
 		return transferManagerTest.encode(tuple);
  }

	function encDataV2(tuple) {
    return transferManagerTest.encodeV2(tuple);
 }
  
	async function getSignature(order, signer) {
		return sign(order, signer, testing.address);
	}

});
