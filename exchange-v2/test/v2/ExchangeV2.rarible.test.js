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
const zeroAddress = "0x0000000000000000000000000000000000000000";
const { expectThrow, verifyBalanceChange } = require("@daonomic/tests-common");
const { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, ORDER_DATA_V2, ORDER_DATA_V3_BUY, ORDER_DATA_V3_SELL, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, CRYPTO_PUNKS, COLLECTION, TO_LOCK, LOCK, enc, id } = require("../assets");

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
  const protocolFee = 300;

	const resetState = async () => {
		libOrder = await LibOrderTest.new();
		transferProxy = await TransferProxyTest.new();
		erc20TransferProxy = await ERC20TransferProxyTest.new();
		royaltiesRegistry = await TestRoyaltiesRegistry.new();
		testing = await deployProxy(ExchangeV2, [transferProxy.address, erc20TransferProxy.address, protocolFee, community, royaltiesRegistry.address], { initializer: "__ExchangeV2_init" });
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

	}
	beforeEach(resetState);

  describe("estimate gas", () => {
		it("ERC20<->eth two offChain orders, Logic: Separate RTM vofc ", async () => {
			await t1.mint(accounts[1], 100);
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });

			const right = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");
			const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
			const tx = await testing.matchOrders(left, "0x", right, await getSignature(right, accounts[1]), { from: accounts[2], value: 300 });
			console.log("ERC20<->eth two offChain orders, with Separate RTM logic gas:", tx.receipt.gasUsed);
		})

    it("not same origin, not same royalties V3", async () => {
      await t1.mint(accounts[1], 1000);
      await erc1155_v2.mint(accounts[2], erc1155TokenId1, [], 1000);
      await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
      await erc1155_v2.setApprovalForAll(transferProxy.address, true, { from: accounts[2] });

      let addrOriginLeft = await LibPartToUint(accounts[6], 300);
      let addrOriginRight = await LibPartToUint(accounts[5], 300);

      let encDataLeft = await encDataV3_BUY([0, addrOriginLeft, 0]);
      let encDataRight = await encDataV3_SELL([0, addrOriginRight, 0, 1000]);

      // setting protocol fee to 0 to check gas difference with V2 orders 
      await testing.setProtocolFee(0);

      await royaltiesRegistry.setRoyaltiesByToken(erc1155_v2.address, [[accounts[7], 1000]]); //set royalties by token
      const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC1155, enc(erc1155_v2.address, erc1155TokenId1), 7), 1, 0, 0, ORDER_DATA_V3_BUY, encDataLeft);
      const right = Order(accounts[2], Asset(ERC1155, enc(erc1155_v2.address, erc1155TokenId1), 7), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, ORDER_DATA_V3_SELL, encDataRight);

      const tx = await testing.matchOrders(left, await getSignature(left, accounts[1]), right, "0x", { from: accounts[2] });
      console.log("not same origin, not same royalties (no protocol Fee) V3:", tx.receipt.gasUsed);

    })

    it("same origin, not same royalties", async () => {
      await t1.mint(accounts[1], 1000);
			await  erc1155_v2.mint(accounts[2], erc1155TokenId1, [], 1000);
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
			await  erc1155_v2.setApprovalForAll(transferProxy.address, true, {from: accounts[2]});

			let addrOriginLeft = [[accounts[5], 500]];
			let addrOriginRight = [[accounts[5], 500]];

			let encDataLeft = await encDataV1([ [[accounts[1], 10000]], addrOriginLeft ]);
			let encDataRight = await encDataV1([ [[accounts[2], 10000]], addrOriginRight ]);

			await royaltiesRegistry.setRoyaltiesByToken(erc1155_v2.address, [[accounts[6], 1000]]); //set royalties by token
			const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC1155, enc( erc1155_v2.address, erc1155TokenId1), 7), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[2], Asset(ERC1155, enc( erc1155_v2.address, erc1155TokenId1), 7), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, ORDER_DATA_V1, encDataRight);

      const tx = await testing.matchOrders(left, await getSignature(left, accounts[1]), right, "0x", { from: accounts[2] });
      console.log("same origin, no royalties:", tx.receipt.gasUsed);
			
		})

    it("same origin, yes royalties", async () => {
      await t1.mint(accounts[1], 1000);
			await  erc1155_v2.mint(accounts[2], erc1155TokenId1, [], 1000);
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
			await  erc1155_v2.setApprovalForAll(transferProxy.address, true, {from: accounts[2]});

			let addrOriginLeft = [[accounts[5], 500]];
			let addrOriginRight = [[accounts[5], 500]];

			let encDataLeft = await encDataV1([ [[accounts[1], 10000]], addrOriginLeft ]);
			let encDataRight = await encDataV1([ [[accounts[2], 10000]], addrOriginRight ]);

			await royaltiesRegistry.setRoyaltiesByToken(erc1155_v2.address, [[accounts[2], 1000]]); //set royalties by token
			const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC1155, enc( erc1155_v2.address, erc1155TokenId1), 7), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[2], Asset(ERC1155, enc( erc1155_v2.address, erc1155TokenId1), 7), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, ORDER_DATA_V1, encDataRight);

      const tx = await testing.matchOrders(left, await getSignature(left, accounts[1]), right, "0x", { from: accounts[2] });
      console.log("same origin, yes royalties:", tx.receipt.gasUsed);
			
		})

    it("not same origin, yes royalties", async () => {
      await t1.mint(accounts[1], 1000);
			await  erc1155_v2.mint(accounts[2], erc1155TokenId1, [], 1000);
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
			await  erc1155_v2.setApprovalForAll(transferProxy.address, true, {from: accounts[2]});

			let addrOriginLeft = [[accounts[6], 500]];
			let addrOriginRight = [[accounts[5], 500]];

			let encDataLeft = await encDataV1([ [[accounts[1], 10000]], addrOriginLeft ]);
			let encDataRight = await encDataV1([ [[accounts[2], 10000]], addrOriginRight ]);

			await royaltiesRegistry.setRoyaltiesByToken(erc1155_v2.address, [[accounts[2], 1000]]); //set royalties by token
			const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC1155, enc( erc1155_v2.address, erc1155TokenId1), 7), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[2], Asset(ERC1155, enc( erc1155_v2.address, erc1155TokenId1), 7), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, ORDER_DATA_V1, encDataRight);

      const tx = await testing.matchOrders(left, await getSignature(left, accounts[1]), right, "0x", { from: accounts[2] });
      console.log("not same origin, yes royalties:", tx.receipt.gasUsed);
			
		})

    it("not same origin, not same royalties", async () => {
      await t1.mint(accounts[1], 1000);
			await  erc1155_v2.mint(accounts[2], erc1155TokenId1, [], 1000);
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
			await  erc1155_v2.setApprovalForAll(transferProxy.address, true, {from: accounts[2]});

			let addrOriginLeft = [[accounts[6], 500]];
			let addrOriginRight = [[accounts[5], 500]];

			let encDataLeft = await encDataV1([ [[accounts[1], 10000]], addrOriginLeft ]);
			let encDataRight = await encDataV1([ [[accounts[2], 10000]], addrOriginRight ]);

			await royaltiesRegistry.setRoyaltiesByToken(erc1155_v2.address, [[accounts[7], 1000]]); //set royalties by token
			const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC1155, enc( erc1155_v2.address, erc1155TokenId1), 7), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[2], Asset(ERC1155, enc( erc1155_v2.address, erc1155TokenId1), 7), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, ORDER_DATA_V1, encDataRight);

      const tx = await testing.matchOrders(left, await getSignature(left, accounts[1]), right, "0x", { from: accounts[2] });
      console.log("not same origin, not same royalties:", tx.receipt.gasUsed);
			
		})

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
			await runTest(async createOrder => {
				await t1.mint(accounts[1], 100);
				await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });

				const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
				const right = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");

				const {signature, valMatch} = await createOrder(right, accounts[1], 0)
				await verifyBalanceChange(accounts[2], 200, async () =>
					verifyBalanceChange(accounts[1], -200, async () =>
						verifyBalanceChange(protocol, 0, () =>
							testing.matchOrders(left, "0x", right, signature, { from: accounts[2], value: valMatch, gasPrice: 0 })
						)
					)
				)
				assert.equal(await t1.balanceOf(accounts[1]), 0);
				assert.equal(await t1.balanceOf(accounts[2]), 100);
			})
    	})

		it("ERC721 to ETH order maker ETH != who pay, both orders have to be with signature ", async () => {
			await runTest(async createOrder => {
				await erc721.mint(accounts[1], erc721TokenId1);
				await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});

				const left = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");
				const right = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");

				const dataLeft = await createOrder(left, accounts[1], 0)
				const dataRight = await createOrder(right, accounts[2], 200)
				await verifyBalanceChange(accounts[7], dataRight.amountToVerify, async () =>
					verifyBalanceChange(accounts[1], -200, async () =>
						verifyBalanceChange(protocol, 0, () =>
						//NB! from: accounts[7] - who pay for NFT != order Maker
							testing.matchOrders(left, dataLeft.signature, right, dataRight.signature, { from: accounts[7], value: 200, gasPrice: 0 })
						)
					)
				)
				assert.equal(await erc721.balanceOf(accounts[1]), 0);
				assert.equal(await erc721.balanceOf(accounts[2]), 1);
			})

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

      await erc721.mint(accounts[1], erc721TokenId1);
      await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});

      const left = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(COLLECTION, enc(erc721.address), 1), 1, 0, 0, "0xffffffff", "0x");

      await testing.setAssetMatcher(COLLECTION, matcher.address);

      const tx = await testing.matchOrders(left, await getSignature(left, accounts[1]), right, await getSignature(right, accounts[2]), {value: 300});
      console.log("ETH <=> COLLECTION:", tx.receipt.gasUsed);

      assert.equal(await erc721.balanceOf(accounts[1]), 0);
      assert.equal(await erc721.balanceOf(accounts[2]), 1);
    })
  });

	describe("Do matchOrders(), orders dataType == V1", () => {
		it("From ERC20(100) to ERC20(200) Protocol, Origin fees, no Royalties ", async () => {
			await runTest(async createOrder => {
				const { left, right } = await prepare2Orders()

				const {signature, onChain} = await createOrder(left, accounts[1])

				const tx = await testing.matchOrders(left, signature, right, "0x", { from: accounts[2] });
        console.log("ERC20 <=> ERC20:", tx.receipt.gasUsed);

				if (onChain == 1) {
					assert.equal(await testing.fills(await libOrder.hashKeyOnChain(left)), 200);
				} else {
					assert.equal(await testing.fills(await libOrder.hashKey(left)), 200);
				}


				assert.equal(await t1.balanceOf(accounts[1]), 3); //=104 - (100amount + 3byuerFee +1originleft)
				assert.equal(await t1.balanceOf(accounts[2]), 98);//=100 - 3sellerFee - 2originRight
				assert.equal(await t1.balanceOf(accounts[3]), 1);
				assert.equal(await t1.balanceOf(accounts[4]), 2);
				assert.equal(await t2.balanceOf(accounts[1]), 200);
				assert.equal(await t2.balanceOf(accounts[2]), 0);
			})
		})

		it("From ERC20(10) to ERC20(20) Protocol, no fees because of rounding", async () => {
			await runTest(async createOrder => {
				const { left, right } = await prepare2Orders(10, 20, 10, 20)

				const {signature, onChain} = await createOrder(left, accounts[1])

				await testing.matchOrders(left, signature, right, "0x", { from: accounts[2] });

				if (onChain == 1) {
					assert.equal(await testing.fills(await libOrder.hashKeyOnChain(left)), 20);
				} else {
					assert.equal(await testing.fills(await libOrder.hashKey(left)), 20);
				}

				assert.equal(await t1.balanceOf(accounts[1]), 0);
				assert.equal(await t1.balanceOf(accounts[2]), 10);
				assert.equal(await t2.balanceOf(accounts[1]), 20);
				assert.equal(await t2.balanceOf(accounts[2]), 0);
			})
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
			await runTest(async createOrder => {
				const { left, right } = await prepare721DV1_20rders()

				const {signature, onChain} = await createOrder(left, accounts[1])

				const tx = await testing.matchOrders(left, signature, right, "0x", { from: accounts[2] });
        console.log("ERC20 <=> ERC721:", tx.receipt.gasUsed);

				if (onChain == 1) {
					assert.equal(await testing.fills(await libOrder.hashKeyOnChain(left)), 100);
				} else {
					assert.equal(await testing.fills(await libOrder.hashKey(left)), 100);
				}

				assert.equal(await t2.balanceOf(accounts[1]), 97);	//=100 - 2originRight -1originleft
				assert.equal(await t2.balanceOf(accounts[2]), 5);		//=105 - (100amount + 3byuerFee )
				assert.equal(await t2.balanceOf(accounts[3]), 1);
				assert.equal(await t2.balanceOf(accounts[4]), 2);
				assert.equal(await erc721.balanceOf(accounts[1]), 0);
				assert.equal(await erc721.balanceOf(accounts[2]), 1);
				assert.equal(await t2.balanceOf(community), 0);
			})
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
			await runTest(async createOrder => {
				const { left, right } = await prepare20DV1_1155V2Orders()
				const {signature, onChain} = await createOrder(left, accounts[1])

				const tx = await testing.matchOrders(left, signature, right, "0x", { from: accounts[2] });
        console.log("ERC20 <=> ERC1155:", tx.receipt.gasUsed);

				if (onChain == 1) {
					assert.equal(await testing.fills(await libOrder.hashKeyOnChain(left)), 7);
				} else {
					assert.equal(await testing.fills(await libOrder.hashKey(left)), 7);
				}

				assert.equal(await t1.balanceOf(accounts[1]), 13);		//=120 - (100amount + 3byuerFee + 3originLeft + 4originleft)
				assert.equal(await t1.balanceOf(accounts[2]), 80);			//=100 - 3sellerFee - (10 +5)Royalties - 5originRight

				assert.equal(await t1.balanceOf(accounts[3]), 3);			//originleft
				assert.equal(await t1.balanceOf(accounts[4]), 4);			//originleft
				assert.equal(await t1.balanceOf(accounts[5]), 5);			//originRight
				assert.equal(await t1.balanceOf(accounts[6]), 10);		//Royalties
				assert.equal(await t1.balanceOf(accounts[7]), 5);			//Royalties
				assert.equal(await erc1155_v2.balanceOf(accounts[1], erc1155TokenId1), 7);
				assert.equal(await erc1155_v2.balanceOf(accounts[2], erc1155TokenId1), 3);
				assert.equal(await t1.balanceOf(protocol), 0);
			})
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
			await runTest(async createOrder => {
				const { left, right } = await prepare1155V1_20DV1Orders()
				const {signature, onChain} = await createOrder(left, accounts[2])

				const tx = await testing.matchOrders(left, signature, right, "0x", { from: accounts[1] });
        console.log("ERC1155 V1 <=> ERC20 V1:", tx.receipt.gasUsed);

				if (onChain == 1) {
					assert.equal(await testing.fills(await libOrder.hashKeyOnChain(left)), 100);
				} else {
					assert.equal(await testing.fills(await libOrder.hashKey(left)), 100);
				}

				assert.equal(await t1.balanceOf(accounts[1]), 15);		//=120 - (100amount + 3byuerFee +5originRight )
				assert.equal(await t1.balanceOf(accounts[2]), 78);			//=100 - 3sellerFee - (10 +5)Royalties - (3+4)originLeft

				assert.equal(await t1.balanceOf(accounts[3]), 3);			//originleft
				assert.equal(await t1.balanceOf(accounts[4]), 4);			//originleft
				assert.equal(await t1.balanceOf(accounts[5]), 5);			//originRight
				assert.equal(await t1.balanceOf(accounts[6]), 10);		//Royalties
				assert.equal(await t1.balanceOf(accounts[7]), 5);			//Royalties
				assert.equal(await erc1155_v2.balanceOf(accounts[1], erc1155TokenId1), 7);
				assert.equal(await erc1155_v2.balanceOf(accounts[2], erc1155TokenId1), 3);
				assert.equal(await t1.balanceOf(protocol), 0);
			})
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
			await runTest(async createOrder => {
				await erc721V1.mint(accounts[1], erc721TokenId1, []);
				await erc721V1.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});

				let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600]];
				let addrOriginRight = [[accounts[7], 700]];

				let encDataLeft = await encDataV1([ [[accounts[2], 10000]], addrOriginLeft ]);
				let encDataRight = await encDataV1([ [[accounts[1], 10000]], addrOriginRight ]);
				await royaltiesRegistry.setRoyaltiesByToken(erc721V1.address, [[accounts[3], 300], [accounts[4], 400]]); //set royalties by token
				const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
				const right = Order(accounts[1], Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
				const {signature} = await createOrder(right, accounts[1])
				await verifyBalanceChange(accounts[2], 222, async () =>			//200+6buyerFee+ (10+12 origin left) (72back)
					verifyBalanceChange(accounts[1], -172, async () =>				//200 -6seller - (6+8royalties) - 14originright
						verifyBalanceChange(accounts[3], -6, async () =>
							verifyBalanceChange(accounts[4], -8, async () =>
								verifyBalanceChange(accounts[5], -10, async () =>
									verifyBalanceChange(accounts[6], -12, async () =>
										verifyBalanceChange(accounts[7], -14, async () =>
											verifyBalanceChange(protocol, 0, () =>
												testing.matchOrders(left, "0x", right, signature, { from: accounts[2], value: 300, gasPrice: 0 })
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
    })

		it("From ETH(DataV1) to ERC720(DataV1) Protocol, Origin fees,  no Royalties", async () => {
			await runTest(async createOrder => {
				await erc721.mint(accounts[1], erc721TokenId1);
				await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});

				let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600]];
				let addrOriginRight = [[accounts[7], 700]];

				let encDataLeft = await encDataV1([ [[accounts[2], 10000]], addrOriginLeft ]);
				let encDataRight = await encDataV1([ [[accounts[1], 10000]], addrOriginRight ]);

				const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
				const right = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
				const {signature} = await createOrder(right, accounts[1])
				await verifyBalanceChange(accounts[2], 222, async () =>			//200+6buyerFee+ (10 +12 origin left) (72back)
					verifyBalanceChange(accounts[1], -186, async () =>				//200 -6seller - 14 originright
						verifyBalanceChange(accounts[5], -10, async () =>
							verifyBalanceChange(accounts[6], -12, async () =>
								verifyBalanceChange(accounts[7], -14, async () =>
									verifyBalanceChange(protocol, 0, () =>
										testing.matchOrders(left, "0x", right, signature, { from: accounts[2], value: 300, gasPrice: 0 })
									)
								)
							)
						)
					)
					)
				assert.equal(await erc721.balanceOf(accounts[1]), 0);
				assert.equal(await erc721.balanceOf(accounts[2]), 1);
			})
    })

		it("From ETH(DataV1) to ERC720(DataV1) Protocol, Origin fees comes from OrderNFT,  no Royalties", async () => {
			await runTest(async createOrder => {
				await erc721.mint(accounts[1], erc721TokenId1);
				await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});

				let addrOriginLeft = [];
				let addrOriginRight = [[accounts[5], 500], [accounts[6], 600], [accounts[7], 700]];

				let encDataLeft = await encDataV1([ [[accounts[2], 10000]], addrOriginLeft]);
				let encDataRight = await encDataV1([ [[accounts[1], 10000]], addrOriginRight ]);

				const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
				const right = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
				const {signature} = await createOrder(right, accounts[1])
				await verifyBalanceChange(accounts[2], 200, async () =>			//200+6buyerFee+  (94back)
					verifyBalanceChange(accounts[1], -164, async () =>				//200 -6seller - (10+ 12+ 14) originright
						verifyBalanceChange(accounts[5], -10, async () =>
							verifyBalanceChange(accounts[6], -12, async () =>
								verifyBalanceChange(accounts[7], -14, async () =>
									verifyBalanceChange(protocol, 0, () =>
										testing.matchOrders(left, "0x", right, signature, { from: accounts[2], value: 300, gasPrice: 0 })
									)
								)
							)
						)
					)
					)
				assert.equal(await erc721.balanceOf(accounts[1]), 0);
				assert.equal(await erc721.balanceOf(accounts[2]), 1);
			})

    })

		it("From ETH(DataV1) to ERC720(DataV1) Protocol, Origin fees comes from OrderETH,  no Royalties", async () => {
			await runTest(async createOrder => {
				await erc721.mint(accounts[1], erc721TokenId1);
				await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});

				let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600], [accounts[7], 700]];
				let addrOriginRight = [];

				let encDataLeft = await encDataV1([ [[accounts[2], 10000]], addrOriginLeft ]);
				let encDataRight = await encDataV1([ [[accounts[1], 10000]], addrOriginRight ]);

				const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
				const right = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
				const {signature} = await createOrder(right, accounts[1])
				await verifyBalanceChange(accounts[2], 236, async () =>			//200+6buyerFee+ (10 +12 +14 origin left) (72back)
					verifyBalanceChange(accounts[1], -200, async () =>				//200 -6seller -
						verifyBalanceChange(accounts[5], -10, async () =>
							verifyBalanceChange(accounts[6], -12, async () =>
								verifyBalanceChange(accounts[7], -14, async () =>
									verifyBalanceChange(protocol, 0, () =>
										testing.matchOrders(left, "0x", right, signature, { from: accounts[2], value: 300, gasPrice: 0 })
									)
								)
							)
						)
					)
					)
				assert.equal(await erc721.balanceOf(accounts[1]), 0);
				assert.equal(await erc721.balanceOf(accounts[2]), 1);
			})
    })

		it("From ETH(DataV1) to ERC720(DataV1) Protocol, no Royalties, Origin fees comes from OrderETH NB!!! not enough ETH", async () => {
			await erc721.mint(accounts[1], erc721TokenId1);
    	await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});

			let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600], [accounts[7], 1000], [accounts[3], 3000]];
			let addrOriginRight = [];

			let encDataLeft = await encDataV1([ [[accounts[2], 10000]], addrOriginLeft ]);
			let encDataRight = await encDataV1([ [[accounts[1], 10000]], addrOriginRight ]);

			const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
    	const right = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);

    	await expectThrow(
      	testing.matchOrders(left, "0x", right, await getSignature(right, accounts[1]), { from: accounts[2], value: 300, gasPrice: 0 })
      );
    })

		it("From ETH(DataV1) to ERC720(DataV1) Protocol, no Royalties, Origin fees comes from OrderNFT NB!!! not enough ETH for lastOrigin and seller!", async () => {
			await runTest(async createOrder => {
				await erc721.mint(accounts[1], erc721TokenId1);
				await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});

				let addrOriginLeft = [];
				let addrOriginRight = [[accounts[3], 9000], [accounts[5], 500], [accounts[6], 600], [accounts[7], 700]];

				let encDataLeft = await encDataV1([ [[accounts[2], 10000]], addrOriginLeft ]);
				let encDataRight = await encDataV1([ [[accounts[1], 10000]], addrOriginRight ]);

				const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
				const right = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
				const {signature} = await createOrder(right, accounts[1])

				await verifyBalanceChange(accounts[2], 200, async () =>			//200+6buyerFee+
					verifyBalanceChange(accounts[1], 0, async () =>				//200 -6seller -(180 + 10 + 12(really 10) + 14(really 0) origin left)
						verifyBalanceChange(accounts[3], -180, async () =>
							verifyBalanceChange(accounts[5], -10, async () =>
								verifyBalanceChange(accounts[6], -10, async () =>
									verifyBalanceChange(accounts[7], 0, async () =>
										verifyBalanceChange(protocol, 0, () =>
											testing.matchOrders(left, "0x", right, signature, { from: accounts[2], value: 300, gasPrice: 0 })
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
    	})

	})	//("Do matchOrders(), orders dataType == V1"

	describe("Do matchOrders(), orders dataType == V1, MultipleBeneficiary", () => {
		it("From ERC20(100) to ERC20(200) Protocol, Origin fees, no Royalties, payouts: 1)20/80%, 2)50/50%", async () => {
			await runTest(async createOrder => {
				const { left, right } = await prepare2Orders()
				const {signature, onChain} = await createOrder(left, accounts[1])
				const tx = await testing.matchOrders(left, signature, right, "0x", { from: accounts[2] });
        console.log("ERC20 <=> ERC20 PAYOUTS:", tx.receipt.gasUsed);

				if (onChain == 1) {
					assert.equal(await testing.fills(await libOrder.hashKeyOnChain(left)), 200);
				} else {
					assert.equal(await testing.fills(await libOrder.hashKey(left)), 200);
				}

				assert.equal(await t1.balanceOf(accounts[1]), 3); //=104 - (100amount + 3byuerFee +1originleft)
				assert.equal(await t1.balanceOf(accounts[2]), 19);//=(100 - 3sellerFee - 2originRight)*20%
				assert.equal(await t1.balanceOf(accounts[6]), 79);//=(100 - 3sellerFee - 2originRight)*80%
				assert.equal(await t1.balanceOf(accounts[3]), 1);
				assert.equal(await t1.balanceOf(accounts[4]), 2);
				assert.equal(await t2.balanceOf(accounts[1]), 100); //50%
				assert.equal(await t2.balanceOf(accounts[5]), 100); //50%
				assert.equal(await t2.balanceOf(accounts[2]), 0);
			})
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
			await runTest(async createOrder => {
				const { left, right } = await prepare721DV1_20rders()

				const {signature, onChain} = await createOrder(left, accounts[1])
				await testing.matchOrders(left, signature, right, "0x", { from: accounts[2] });

				if (onChain == 1) {
				  assert.equal(await testing.fills(await libOrder.hashKeyOnChain(left)), 100);
				} else {
			  	assert.equal(await testing.fills(await libOrder.hashKey(left)), 100);
				}

				assert.equal(await t2.balanceOf(accounts[1]), 49);	//=100 - 3sellerFee - 2originRight -1originleft 50%
				assert.equal(await t2.balanceOf(accounts[5]), 49);	//=100 - 3sellerFee - 2originRight -1originleft 50%
				assert.equal(await t2.balanceOf(accounts[2]), 5);		//=105 - (100amount + 3byuerFee )
				assert.equal(await t2.balanceOf(accounts[3]), 1);
				assert.equal(await t2.balanceOf(accounts[4]), 1);
				assert.equal(await erc721.balanceOf(accounts[1]), 0);
				assert.equal(await erc721.balanceOf(accounts[2]), 1);
				assert.equal(await t2.balanceOf(community), 0);
			})
		})

		async function prepare721DV1_20rders(t2Amount = 105) {
			await erc721.mint(accounts[1], erc721TokenId1);
			await t2.mint(accounts[2], t2Amount);
			await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
			await t2.approve(erc20TransferProxy.address, 10000000, { from: accounts[2] });
			let addrOriginLeft = [[accounts[3], 100], [accounts[4], 100]];
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
			await runTest(async createOrder => {
				await erc721.mint(accounts[1], erc721TokenId1);
				await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});

				let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600]];
				let addrOriginRight = [[accounts[7], 700]];

				let encDataLeft = await encDataV1([ [[accounts[2], 10000]], addrOriginLeft ]);
				let encDataRight = await encDataV1([ [[accounts[1], 5000], [accounts[3], 5000]], addrOriginRight ]);

				const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
				const right = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
				const {signature} = await createOrder(right, accounts[1])
				await verifyBalanceChange(accounts[2], 222, async () =>			//200+6buyerFee+ (10 +12 origin left) (72back)
					verifyBalanceChange(accounts[3], -93, async () =>				//200 -6seller - 14 originright *50%
						verifyBalanceChange(accounts[1], -93, async () =>				//200 -6seller - 14 originright *50%
							verifyBalanceChange(accounts[5], -10, async () =>
								verifyBalanceChange(accounts[6], -12, async () =>
									verifyBalanceChange(accounts[7], -14, async () =>
										verifyBalanceChange(protocol, 0, () =>
											testing.matchOrders(left, "0x", right, signature, { from: accounts[2], value: 300, gasPrice: 0 })
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
    })

		it("From ETH(DataV1) to ERC721(DataV1) Protocol, Origin fees,  no Royalties, payouts: empy 100% to order.maker", async () => {
			await runTest(async createOrder => {
				await erc721.mint(accounts[1], erc721TokenId1);
				await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});

				let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600]];
				let addrOriginRight = [[accounts[7], 700]];

				let encDataLeft = await encDataV1([ [[accounts[2], 10000]], addrOriginLeft ]);
				let encDataRight = await encDataV1([ [], addrOriginRight ]); //empty payout

				const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
				const right = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
				const {signature} = await createOrder(right, accounts[1])
				await verifyBalanceChange(accounts[2], 222, async () =>			//200+6buyerFee+ (10 +12 origin left) (72back)
						verifyBalanceChange(accounts[1], -186, async () =>				//200 -6seller - 14 originright *100%
							verifyBalanceChange(accounts[5], -10, async () =>
								verifyBalanceChange(accounts[6], -12, async () =>
									verifyBalanceChange(accounts[7], -14, async () =>
										verifyBalanceChange(protocol, 0, () =>
											testing.matchOrders(left, "0x", right, signature, { from: accounts[2], value: 300, gasPrice: 0 })
										)
									)
								)
							)
						)
					)
				assert.equal(await erc721.balanceOf(accounts[1]), 0);
				assert.equal(await erc721.balanceOf(accounts[2]), 1);
			})
    })

	})	//Do matchOrders(), orders dataType == V1, MultipleBeneficiary

	describe("Exchange with Royalties", () => {
		it("Royalties by owner, token 721 to ETH", async () => {
			await runTest(async createOrder => {
				await erc721.mint(accounts[1], erc721TokenId1);
				await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
				await royaltiesRegistry.setRoyaltiesByToken(erc721.address, [[accounts[3], 500], [accounts[4], 1000]]); //set royalties by token
				let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600]];
				let addrOriginRight = [[accounts[7], 700]];

				let encDataLeft = await encDataV1([ [[accounts[2], 10000]], addrOriginLeft ]);
				let encDataRight = await encDataV1([ [[accounts[1], 10000]], addrOriginRight ]);

				const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
				const right = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
				const {signature} = await createOrder(right, accounts[1])
				await verifyBalanceChange(accounts[2], 222, async () =>			//200+6buyerFee+ (10 +12 origin left) (72back)
					verifyBalanceChange(accounts[1], -156, async () =>				//200 -6seller - 14 originright
						verifyBalanceChange(accounts[3], -10, async () =>
							verifyBalanceChange(accounts[4], -20, async () =>
								verifyBalanceChange(accounts[5], -10, async () =>
									verifyBalanceChange(accounts[6], -12, async () =>
										verifyBalanceChange(accounts[7], -14, async () =>
											verifyBalanceChange(protocol, 0, () =>
												testing.matchOrders(left, "0x", right, signature, { from: accounts[2], value: 300, gasPrice: 0 })
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
		})
		it("Royalties by owner, token and tokenId 721 to ETH", async () => {
			await runTest(async createOrder => {
				await erc721.mint(accounts[1], erc721TokenId1);
				await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
				await royaltiesRegistry.setRoyaltiesByTokenAndTokenId(erc721.address, erc721TokenId1, [[accounts[3], 500], [accounts[4], 1000]]); //set royalties by token and tokenId
				let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600]];
				let addrOriginRight = [[accounts[7], 700]];

				let encDataLeft = await encDataV1([ [[accounts[2], 10000]], addrOriginLeft ]);
				let encDataRight = await encDataV1([ [[accounts[1], 10000]], addrOriginRight ]);

				const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
				const right = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
				const {signature} = await createOrder(right, accounts[1])
				await verifyBalanceChange(accounts[2], 222, async () =>			//200+6buyerFee+ (10 +12 origin left) (72back)
					verifyBalanceChange(accounts[1], -156, async () =>				//200 -6seller - 14 originright
						verifyBalanceChange(accounts[3], -10, async () =>
							verifyBalanceChange(accounts[4], -20, async () =>
								verifyBalanceChange(accounts[5], -10, async () =>
									verifyBalanceChange(accounts[6], -12, async () =>
										verifyBalanceChange(accounts[7], -14, async () =>
											verifyBalanceChange(protocol, 0, () =>
												testing.matchOrders(left, "0x", right, signature, { from: accounts[2], value: 300, gasPrice: 0 })
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
		})

		it("Royalties by token and tokenId 721v1_OwnableUpgradaeble to ETH", async () => {
			await runTest(async createOrder => {
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
				const {signature} = await createOrder(right, accounts[1])
				await verifyBalanceChange(accounts[2], 210, async () =>			//200+6buyerFee+ (10  origin left) (72back)
					verifyBalanceChange(accounts[1], -156, async () =>				//200 -6seller - 14 originright
						verifyBalanceChange(accounts[3], -10, async () =>
							verifyBalanceChange(accounts[4], -20, async () =>
								verifyBalanceChange(accounts[5], -10, async () =>
									verifyBalanceChange(accounts[7], -14, async () =>
										verifyBalanceChange(protocol, 0, () =>
											testing.matchOrders(left, "0x", right, signature, { from: accounts[2], value: 300, gasPrice: 0 })
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

      await verifyBalanceChange(seller, -500, async () =>
        verifyBalanceChange(buyer, 500, async () =>
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

      await verifyBalanceChange(seller, -300, async () =>
        verifyBalanceChange(buyer1, 300, async () =>
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

      await verifyBalanceChange(seller, -500, async () =>
        verifyBalanceChange(buyer, 500, async () =>
          testing.matchOrders(left, await getSignature(left, seller), right, "0x", { from: buyer, value: 600, gasPrice: 0 })
        )
      )
      assert.equal(await erc1155_v2.balanceOf(buyer, erc1155TokenId1), 100);
      assert.equal(await erc1155_v2.balanceOf(seller, erc1155TokenId1), 100);

      const leftOrderHash = await libOrder.hashKey(left);
      assert.equal(await testing.fills(leftOrderHash), 500, "left fill make side")

      const left1 = Order(seller, Asset(ERC1155, enc(erc1155_v2.address, erc1155TokenId1), 200), ZERO, Asset(ETH, "0x", 2000), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const right1 = Order(buyer1, Asset(ETH, "0x", 1000), ZERO, Asset(ERC1155, enc(erc1155_v2.address, erc1155TokenId1), 100), 1, 0, 0, ORDER_DATA_V2, encDataRight);

      await verifyBalanceChange(seller, -1000, async () =>
        verifyBalanceChange(buyer1, 1000, async () =>
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

      await verifyBalanceChange(seller, -450, async () =>
        verifyBalanceChange(buyer, 500, async () =>
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

      await verifyBalanceChange(seller, -270, async () =>
        verifyBalanceChange(buyer1, 300, async () =>
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

  describe("matchOrders, orderType = V3", () => {
    const buyer = accounts[1]
    const seller = accounts[2]
    const originBuyer = accounts[3]
    const originSeller = accounts[4]
    const creator = accounts[5]
    const originBuyer2 = accounts[6]
    const originSeller2 = accounts[7]

    it("should correctly pay to everyone envloved in a match ", async () => {
      await t1.mint(buyer, 1000);
      await t1.approve(erc20TransferProxy.address, 10000000, { from: buyer });

			await erc1155_v2.mint(seller, erc1155TokenId1, [], 1000);
			await erc1155_v2.setApprovalForAll(transferProxy.address, true, {from: seller});

			let encDataLeft = await encDataV3_BUY([ await LibPartToUint(buyer, 10000), await LibPartToUint(originBuyer, 300), 0 ]);
			let encDataRight = await encDataV3_SELL([ await LibPartToUint(seller, 10000), await LibPartToUint(originSeller, 400), 0, 1000 ]);

			await royaltiesRegistry.setRoyaltiesByToken(erc1155_v2.address, [[creator, 1000]]); //set royalties by token

			const left = Order(buyer, Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC1155, enc( erc1155_v2.address, erc1155TokenId1), 200), 1, 0, 0, ORDER_DATA_V3_BUY, encDataLeft);
			const right = Order(seller, Asset(ERC1155, enc( erc1155_v2.address, erc1155TokenId1), 200), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, ORDER_DATA_V3_SELL, encDataRight);

      await testing.matchOrders(left, await getSignature(left, buyer), right, "0x", { from: seller });

      assert.equal(await erc1155_v2.balanceOf(buyer, erc1155TokenId1), 200);
      assert.equal(await erc1155_v2.balanceOf(seller, erc1155TokenId1), 800);

      // 3% to protocol
      assert.equal(await t1.balanceOf(protocol), 3);
      // 3% to originBuyer
      assert.equal(await t1.balanceOf(originBuyer), 3);
      // 4% to originSeller
      assert.equal(await t1.balanceOf(originSeller), 4);
      // 10% to creator as royalties, 80 left
      assert.equal(await t1.balanceOf(creator), 10);
      // 100% of what's left (80) to seller
      assert.equal(await t1.balanceOf(seller), 80);

      //checking fills
      // sell-order has make-side fills
      assert.equal(await testing.fills(await libOrder.hashKey(right)), 200);
      //buy-order has take-side fills
      assert.equal(await testing.fills(await libOrder.hashKey(left)), 200);
    })

    it("should not match when there's a problem with orders' types ", async () => {
      await t1.mint(buyer, 1000);
      await t1.approve(erc20TransferProxy.address, 10000000, { from: buyer });

			await erc1155_v2.mint(seller, erc1155TokenId1, [], 1000);
			await erc1155_v2.setApprovalForAll(transferProxy.address, true, {from: seller});

			let encDataLeft = await encDataV3_BUY([ await LibPartToUint(buyer, 10000), await LibPartToUint(originBuyer, 300), 0 ]);
			let encDataRight = await encDataV3_SELL([ await LibPartToUint(seller, 10000), await LibPartToUint(originSeller, 400), 0, 1000 ]);

			let left = Order(buyer, Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC1155, enc( erc1155_v2.address, erc1155TokenId1), 100), 1, 0, 0, ORDER_DATA_V3_SELL, encDataRight);
			let right = Order(seller, Asset(ERC1155, enc( erc1155_v2.address, erc1155TokenId1), 100), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, ORDER_DATA_V3_BUY, encDataLeft);
      
      // wrong => sell order has V3_BUY type and buy order has V3_SELL type
      await truffleAssert.fails(
        testing.matchOrders(left, await getSignature(left, buyer), right, "0x", { from: seller }),
        truffleAssert.ErrorType.REVERT,
        "wrong V3 type1"
      )

      // wrong => sell order has no type (buy order is correct)
      changeOrderData(left, encDataLeft);
      changeOrderData(right, encDataRight);

      changeOrderType(left, ORDER_DATA_V3_BUY);
      changeOrderType(right, "0xffffffff");
      await expectThrow(
        testing.matchOrders(left, await getSignature(left, buyer), right, "0x", { from: seller })
      );

      // wrong => sell order has V1 type (buy order is correct)
      changeOrderType(right, ORDER_DATA_V1);
      await expectThrow(
        testing.matchOrders(left, await getSignature(left, buyer), right, "0x", { from: seller })
      );

      // wrong => sell order has V2 type (buy order is correct)
      changeOrderType(right, ORDER_DATA_V2);
      await expectThrow(
        testing.matchOrders(left, await getSignature(left, buyer), right, "0x", { from: seller })
      );

      // wrong => buy order has no type (sell order is coorect)
      changeOrderType(left, "0xffffffff");
      changeOrderType(right, ORDER_DATA_V3_SELL);
      await expectThrow(
        testing.matchOrders(left, await getSignature(left, buyer), right, "0x", { from: seller })
      );

      // wrong => buy order has V1 type (sell order is coorect)
      changeOrderType(left, ORDER_DATA_V1);
      await expectThrow(
        testing.matchOrders(left, await getSignature(left, buyer), right, "0x", { from: seller })
      );

      // wrong => buy order has V2 type (sell order is coorect)
      changeOrderType(left, ORDER_DATA_V2);
      await expectThrow(
        testing.matchOrders(left, await getSignature(left, buyer), right, "0x", { from: seller })
      );

      // make type right
      changeOrderType(left, ORDER_DATA_V3_BUY);
      await testing.matchOrders(left, await getSignature(left, buyer), right, "0x", { from: seller })

    })

    it("should not match when there's a problem with fees sum ", async () => {
      await t1.mint(buyer, 1000);
      await t1.approve(erc20TransferProxy.address, 10000000, { from: buyer });

			await erc1155_v2.mint(seller, erc1155TokenId1, [], 1000);
			await erc1155_v2.setApprovalForAll(transferProxy.address, true, {from: seller});

			let encDataLeft = await encDataV3_BUY([ await LibPartToUint(buyer, 10000), await LibPartToUint(originBuyer, 300), 0 ]);
			let encDataRight = await encDataV3_SELL([ await LibPartToUint(seller, 10000), await LibPartToUint(originSeller, 400), 0, 1000 ]);

			let left = Order(buyer, Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC1155, enc( erc1155_v2.address, erc1155TokenId1), 100), 1, 0, 0, ORDER_DATA_V3_BUY, encDataLeft);
			let right = Order(seller, Asset(ERC1155, enc( erc1155_v2.address, erc1155TokenId1), 100), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, ORDER_DATA_V3_SELL, encDataRight);
      
      // change protocolFee 3 => 5%, so all fees are 12%
      await testing.setProtocolFee(500)
      await expectThrow(
        testing.matchOrders(left, await getSignature(left, buyer), right, "0x", { from: seller })
      );

      // change protocol fee 5 => 3 and buyer origin fee 3 => 4, so resulting fee is 11%
      await testing.setProtocolFee(300)
      changeOrderData(left, await encDataV3_BUY([ await LibPartToUint(buyer, 10000), await LibPartToUint(originBuyer, 400), 0 ]))
      await expectThrow(
        testing.matchOrders(left, await getSignature(left, buyer), right, "0x", { from: seller })
      );

      //changing protocolFee makes it work
      await testing.setProtocolFee(200)
      await testing.matchOrders(left, await getSignature(left, buyer), right, "0x", { from: seller })

    })

    it("should not match when there's a problem with max fee ", async () => {
      await t1.mint(buyer, 1000);
      await t1.approve(erc20TransferProxy.address, 10000000, { from: buyer });

			await erc1155_v2.mint(seller, erc1155TokenId1, [], 1000);
			await erc1155_v2.setApprovalForAll(transferProxy.address, true, {from: seller});

			let encDataLeft = await encDataV3_BUY([ 0, 0, 0 ]);
			let encDataRight = await encDataV3_SELL([ 0, 0, 0, 200 ]);

			let left = Order(buyer, Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC1155, enc( erc1155_v2.address, erc1155TokenId1), 100), 1, 0, 0, ORDER_DATA_V3_BUY, encDataLeft);
			let right = Order(seller, Asset(ERC1155, enc( erc1155_v2.address, erc1155TokenId1), 100), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, ORDER_DATA_V3_SELL, encDataRight);
      
      // wrong, maxfee = 2%, protocolFee = 3%
      await expectThrow(
        testing.matchOrders(left, await getSignature(left, buyer), right, "0x", { from: seller })
      );

      //maxFee = 0 is wrong even if protocolFee = 0
      await testing.setProtocolFee(0)
      changeOrderData(right, await encDataV3_SELL([ await LibPartToUint(seller, 10000), 0, 0, 0 ]))
      await expectThrow(
        testing.matchOrders(left, await getSignature(left, buyer), right, "0x", { from: seller })
      );

      //setting maxFee at 1% works
      changeOrderData(right, await encDataV3_SELL([ await LibPartToUint(seller, 10000), 0, 0, 100 ]))
      await testing.matchOrders(left, await getSignature(left, buyer), right, "0x", { from: seller })

    })

    it("should work with 2 origin Fees", async () => {
      await t1.mint(buyer, 1000);
      await t1.approve(erc20TransferProxy.address, 10000000, { from: buyer });

			await erc1155_v2.mint(seller, erc1155TokenId1, [], 1000);
			await erc1155_v2.setApprovalForAll(transferProxy.address, true, {from: seller});

			let encDataLeft = await encDataV3_BUY([ 0, await LibPartToUint(originBuyer, 100), await LibPartToUint(originBuyer2, 200) ]);
			let encDataRight = await encDataV3_SELL([ 0, await LibPartToUint(originSeller, 300), await LibPartToUint(originSeller2, 400), 1000 ]);
      
			let left = Order(buyer, Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC1155, enc( erc1155_v2.address, erc1155TokenId1), 100), 1, 0, 0, ORDER_DATA_V3_BUY, encDataLeft);
			let right = Order(seller, Asset(ERC1155, enc( erc1155_v2.address, erc1155TokenId1), 100), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, ORDER_DATA_V3_SELL, encDataRight);
      
      await testing.setProtocolFee(0);

      await testing.matchOrders(left, await getSignature(left, buyer), right, "0x", { from: seller })

      // 0% to protocol
      assert.equal(await t1.balanceOf(protocol), 0);
      // 1% to originBuyer
      assert.equal(await t1.balanceOf(originBuyer), 1);
      // 2% to originBuyer2
      assert.equal(await t1.balanceOf(originBuyer2), 2);
      // 3% to originSeller
      assert.equal(await t1.balanceOf(originSeller), 3);
      // 4% to originSeller2
      assert.equal(await t1.balanceOf(originSeller2), 4);
      // 100% of what's left to seller
      assert.equal(await t1.balanceOf(seller), 90);

    })

    it("should work when using only second origin", async () => {
      await t1.mint(buyer, 1000);
      await t1.approve(erc20TransferProxy.address, 10000000, { from: buyer });

			await erc1155_v2.mint(seller, erc1155TokenId1, [], 1000);
			await erc1155_v2.setApprovalForAll(transferProxy.address, true, {from: seller});

			let encDataLeft = await encDataV3_BUY([ 0, 0, await LibPartToUint(originBuyer2, 200) ]);
			let encDataRight = await encDataV3_SELL([ 0, 0, await LibPartToUint(originSeller2, 400), 1000 ]);
      
			let left = Order(buyer, Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC1155, enc( erc1155_v2.address, erc1155TokenId1), 100), 1, 0, 0, ORDER_DATA_V3_BUY, encDataLeft);
			let right = Order(seller, Asset(ERC1155, enc( erc1155_v2.address, erc1155TokenId1), 100), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, ORDER_DATA_V3_SELL, encDataRight);
      
      await testing.setProtocolFee(0);

      await testing.matchOrders(left, await getSignature(left, buyer), right, "0x", { from: seller })

      // 0% to protocol
      assert.equal(await t1.balanceOf(protocol), 0);
      // 2% to originBuyer2
      assert.equal(await t1.balanceOf(originBuyer2), 2);
      // 4% to originSeller2
      assert.equal(await t1.balanceOf(originSeller2), 4);
      // 100% of what's left to seller
      assert.equal(await t1.balanceOf(seller), 94);

    })

    function changeOrderData(order, data) {
      order.data = data;
    }

    function changeOrderType(order, type) {
      order.dataType = type;
    }
  })


	function encDataV1(tuple) {
 		return transferManagerTest.encode(tuple);
  }

	function encDataV2(tuple) {
    return transferManagerTest.encodeV2(tuple);
  }

  function encDataV3_BUY(tuple) {
    return transferManagerTest.encodeV3_BUY(tuple);
  }

  function encDataV3_SELL(tuple) {
    return transferManagerTest.encodeV3_SELL(tuple);
  }

  async function LibPartToUint(account = zeroAddress, value = 0){
    return await transferManagerTest.encodeOriginFeeIntoUint(account, value);
  }

	async function getSignature(order, signer) {
		return sign(order, signer, testing.address);
	}

	//creates an offchaing order
	async function createOffchainOrder(order, signer, verify) {
		//getting the signature
		const sig = await getSignature(order, signer)

		//calculating amount of eth required for matching
		let valMatch = 0
		if (order.makeAsset.assetType.assetClass == ETH){
			valMatch = order.makeAsset.value * 2;
		}
		if (order.takeAsset.assetType.assetClass == ETH){
			valMatch = order.takeAsset.value * 2;
		}

		const amountToVerify = (!!verify) ? verify : 0;
		const onChain = 0;
		return {signature: sig, valMatch: valMatch, amountToVerify: amountToVerify, onChain: onChain};
	}

	//runs tests both for on-chain and offchain cases
	async function runTest(fn) {
		await fn(createOffchainOrder)
	}


});
