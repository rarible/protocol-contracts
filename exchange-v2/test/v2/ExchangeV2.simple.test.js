const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const ExchangeSimpleV2 = artifacts.require("ExchangeSimpleV2.sol");
const ExchangeSimpleV2_1 = artifacts.require("ExchangeSimpleV2_1.sol");
const TestERC20 = artifacts.require("TestERC20.sol");
const TransferProxyTest = artifacts.require("TransferProxyTest.sol");
const ERC20TransferProxyTest = artifacts.require("ERC20TransferProxyTest.sol");
const LibOrderTest = artifacts.require("LibOrderTest.sol");
const CryptoPunksMarket = artifacts.require("CryptoPunksMarket.sol");
const PunkTransferProxy = artifacts.require("PunkTransferProxyTest.sol");
const TestRoyaltiesRegistry = artifacts.require("TestRoyaltiesRegistry.sol");

const { Order, Asset, sign } = require("../order");
const EIP712 = require("../EIP712");
const ZERO = "0x0000000000000000000000000000000000000000";
const { expectThrow, verifyBalanceChange } = require("@daonomic/tests-common");
const { ETH, ERC20, ERC721, ERC1155, CRYPTO_PUNKS, enc, id } = require("../assets");

contract("ExchangeSimpleV2", accounts => {
	let testing;
	let transferProxy;
	let erc20TransferProxy;
	let transferManagerTest;
	let community = accounts[8];
	let t1;
	let t2;
	let libOrder;
	const protocolFee = 0;

	const resetState = async () => {
		libOrder = await LibOrderTest.new();
		transferProxy = await TransferProxyTest.new();
		erc20TransferProxy = await ERC20TransferProxyTest.new();
		royaltiesRegistry = await TestRoyaltiesRegistry.new();
    testing = await deployProxy(ExchangeSimpleV2, [transferProxy.address, erc20TransferProxy.address], { initializer: "__ExchangeSimpleV2_init" });
		t1 = await TestERC20.new();
		t2 = await TestERC20.new();
	}

	beforeEach(resetState);

	it("upgrade works", async () => {
		const wrapper = await ExchangeSimpleV2_1.at(testing.address);
		await expectThrow(
			wrapper.getSomething()
		);

		await upgradeProxy(testing.address, ExchangeSimpleV2_1);
		assert.equal(await wrapper.getSomething(), 10);
	})

	describe("matchOrders", () => {
		it("eth orders work, rest is returned to taker", async () => {
			await runTest(async createOrder => {
				await t1.mint(accounts[1], 100);
				await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });

				const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");
				const right = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
				
				const {signature, valMatch} = await createOrder(left, accounts[1])
				await expectThrow(
					testing.matchOrders(left, signature, right, "0x", { from: accounts[2], value: 199 })
				);

				await verifyBalanceChange(accounts[2], 200, async () =>
					verifyBalanceChange(accounts[1], -200, async () =>
						testing.matchOrders(left, signature, right, "0x", { from: accounts[2], value: valMatch, gasPrice: 0 })
					)
				)
				assert.equal(await t1.balanceOf(accounts[1]), 0);
				assert.equal(await t1.balanceOf(accounts[2]), 100);	
			})
			
		});

		it("eth orders work, rest is returned to taker (other side)", async () => {

			await runTest(async createOrder => {
				await t1.mint(accounts[1], 100);
				await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });

				const right = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");
				const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");

				const {signature, valMatch} = await createOrder(right, accounts[1])
				await expectThrow(
					testing.matchOrders(left, "0x", right, signature, { from: accounts[2], value: 199 })
				);
				await verifyBalanceChange(accounts[2], 200, async () =>
					verifyBalanceChange(accounts[1], -200, async () =>
						testing.matchOrders(left, "0x", right, signature, { from: accounts[2], value: valMatch, gasPrice: 0 })
					)
				)
				assert.equal(await t1.balanceOf(accounts[1]), 0);
				assert.equal(await t1.balanceOf(accounts[2]), 100);
			})
			
		});

		it("only owner can change transfer proxy", async () => {
			await expectThrow(
				testing.setTransferProxy("0x00112233", accounts[2], { from: accounts[1] })
			)
			testing.setTransferProxy("0x00112233", accounts[2], { from: accounts[0] });
		})

		it("simplest possible exchange works", async () => {
			await runTest(async createOrder => {
				const { left, right } = await prepare2Orders()

				const dataLeft = await createOrder(left, accounts[1], 0)
				const dataRight = await createOrder(right, accounts[2], 0)

				await testing.matchOrders(left, dataLeft.signature, right, dataRight.signature);

				assert.equal(await testing.fills(await libOrder.hashKey(left)), 200);
				assert.equal(await testing.fills(await libOrder.hashKey(right)), 100);

				assert.equal(await t1.balanceOf(accounts[1]), 0);
				assert.equal(await t1.balanceOf(accounts[2]), 100);
				assert.equal(await t2.balanceOf(accounts[1]), 200);
				assert.equal(await t2.balanceOf(accounts[2]), 0);
			})
			
		})

		it("cancel", async () => {
			const { left, right } = await prepare2Orders()

			await expectThrow(
				testing.cancel(left, { from: accounts[2] })
			)
			await testing.cancel(left, { from: accounts[1] })
			await expectThrow(
				testing.matchOrders(left, await getSignature(left, accounts[1]), right, await getSignature(right, accounts[2]))
			);
		})

		it("order with salt 0 can't be canceled", async () => {
			const { left, right } = await prepare2Orders()
			left.salt = "0";

			await expectThrow(
				testing.cancel(left, { from: accounts[1] })
			)
		})

		it("doesn't allow to fill more than 100% of the order", async () => {
			await runTest(async createOrder => {
				const { left, right } = await prepare2Orders()
				right.makeAsset.value = 100;
				right.takeAsset.value = 50;
				right.salt = 0;

				const {signature} = await createOrder(left, accounts[1])

				await testing.matchOrders(left, signature, right, "0x", { from: accounts[2] });
				await testing.matchOrders(left, signature, right, "0x", { from: accounts[2] });

				await expectThrow(
					testing.matchOrders(left, signature, right, "0x", { from: accounts[2] })
				);

				assert.equal(await t1.balanceOf(accounts[1]), 0);
				assert.equal(await t1.balanceOf(accounts[2]), 100);
				assert.equal(await t2.balanceOf(accounts[1]), 200);
				assert.equal(await t2.balanceOf(accounts[2]), 0);
			})
			
		})

    it("should match orders with crypto punks", async () => {
			const cryptoPunksMarket = await CryptoPunksMarket.new();
      await cryptoPunksMarket.allInitialOwnersAssigned(); //allow test contract work with Punk CONTRACT_OWNER accounts[0]
      let punkIndex = 256;
      await cryptoPunksMarket.getPunk(punkIndex, { from: accounts[1] }); //accounts[1] - owner punk with punkIndex

      const proxy = await PunkTransferProxy.new();
      await proxy.__OperatorRole_init();
      await proxy.addOperator(testing.address);
      await cryptoPunksMarket.offerPunkForSaleToAddress(punkIndex, 0, proxy.address, { from: accounts[1] }); //accounts[1] - wants to sell punk with punkIndex, min price 0 wei

      await testing.setTransferProxy((CRYPTO_PUNKS), proxy.address)
      const encodedMintData = await enc(cryptoPunksMarket.address, punkIndex);;
      await t1.mint(accounts[2], 106);
      await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[2] });

      const left = Order(accounts[1], Asset((CRYPTO_PUNKS), encodedMintData, 1), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(accounts[2], Asset(ERC20, enc(t1.address), 100), ZERO, Asset((CRYPTO_PUNKS), encodedMintData, 1), 1, 0, 0, "0xffffffff", "0x");

			await testing.matchOrders(left, await getSignature(left, accounts[1]), right, await getSignature(right, accounts[2]));

      assert.equal(await t1.balanceOf(accounts[1]), 100); 
      assert.equal(await cryptoPunksMarket.balanceOf(accounts[1]), 0);//accounts[1] - not owner now
      assert.equal(await cryptoPunksMarket.balanceOf(accounts[2]), 1);//punk owner - accounts[2]
		})

	})

	describe("validate", () => {
		it("should not let proceed if taker is not correct", async () => {
			await runTest(async createOrder => {
				const { left, right } = await prepare2Orders()
				left.taker = accounts[3]

				const leftData = await createOrder(left, accounts[1], 0)
				const rightData = await createOrder(right, accounts[2], 0)

				await expectThrow(
					testing.matchOrders(left, leftData.signature, right, rightData.signature)
				);

				await expectThrow(
					testing.matchOrders(right, rightData.signature, left, leftData.signature)
				);
			})
			

		});

		it("should not let proceed if one of the signatures is incorrect", async () => {
			const { left, right } = await prepare2Orders()

			await expectThrow(
				testing.matchOrders(left, await getSignature(left, accounts[2]), right, await getSignature(right, accounts[2]))
			);

			await expectThrow(
				testing.matchOrders(right, await getSignature(right, accounts[2]), left, await getSignature(left, accounts[2]))
			);
		});

		it("should not let proceed if order dates are wrong", async () => {
			const now = parseInt(new Date().getTime() / 1000)

			const { left, right } = await prepare2Orders()
			left.start = now + 1000

			await expectThrow(
				testing.matchOrders(left, await getSignature(left, accounts[1]), right, await getSignature(right, accounts[2]))
			);
		});
	})

	describe("asset matcher", () => {
		it("should throw if assets do not match", async () => {
			await runTest(async createOrder => {
				const { left, right } = await prepare2Orders()
				left.takeAsset.assetType.data = enc(accounts[1]);
				
				const leftData = await createOrder(left, accounts[1], 0)
				const rightData = await createOrder(right, accounts[2], 0)

				await expectThrow(
					testing.matchOrders(left, leftData.signature, right, rightData.signature)
				);	
			})
			
		})
	})

	async function prepare2Orders(t1Amount = 100, t2Amount = 200) {
		await t1.mint(accounts[1], t1Amount);
		await t2.mint(accounts[2], t2Amount);
		await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
		await t2.approve(erc20TransferProxy.address, 10000000, { from: accounts[2] });

		const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC20, enc(t2.address), 200), 1, 0, 0, "0xffffffff", "0x");
		const right = Order(accounts[2], Asset(ERC20, enc(t2.address), 200), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
		return { left, right }
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

		return {signature: sig, valMatch: valMatch, amountToVerify: amountToVerify};
	}

	//runs tests both for on-chain and offchain cases
	async function runTest(fn) {
		await fn(createOffchainOrder)
	}

});
