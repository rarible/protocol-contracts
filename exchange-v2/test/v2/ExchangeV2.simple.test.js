const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const ExchangeSimpleV2 = artifacts.require("ExchangeSimpleV2.sol");
const ExchangeSimpleV2_1 = artifacts.require("ExchangeSimpleV2_1.sol");
const TestERC20 = artifacts.require("TestERC20.sol");
const TransferProxy = artifacts.require("TransferProxy.sol");
const ERC20TransferProxy = artifacts.require("ERC20TransferProxy.sol");
const LibOrderTest = artifacts.require("LibOrderTest.sol");

const { Order, Asset, sign } = require("../order");
const EIP712 = require("../EIP712");
const ZERO = "0x0000000000000000000000000000000000000000";
const { expectThrow, verifyBalanceChange } = require("@daonomic/tests-common");
const { ETH, ERC20, ERC721, ERC1155, enc, id } = require("../assets");

contract("ExchangeSimpleV2", accounts => {
	let testing;
	let transferProxy;
	let erc20TransferProxy;
	let t1;
	let t2;
	let libOrder;

	beforeEach(async () => {
		libOrder = await LibOrderTest.new();
		transferProxy = await TransferProxy.new();
		await transferProxy.__TransferProxy_init();
		erc20TransferProxy = await ERC20TransferProxy.new();
		await erc20TransferProxy.__ERC20TransferProxy_init();
		testing = await deployProxy(ExchangeSimpleV2, [transferProxy.address, erc20TransferProxy.address], { initializer: "__ExchangeSimpleV2_init" });
		await transferProxy.addOperator(testing.address);
		await erc20TransferProxy.addOperator(testing.address);
		t1 = await TestERC20.new();
		t2 = await TestERC20.new();
	});

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
			await t1.mint(accounts[1], 100);
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });

			const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");

			await expectThrow(
				testing.matchOrders(left, await getSignature(left, accounts[1]), right, "0x", { from: accounts[2], value: 199 })
			);
			await verifyBalanceChange(accounts[2], 200, async () =>
				verifyBalanceChange(accounts[1], -200, async () =>
					testing.matchOrders(left, await getSignature(left, accounts[1]), right, "0x", { from: accounts[2], value: 201, gasPrice: 0 })
				)
			)
			assert.equal(await t1.balanceOf(accounts[1]), 0);
			assert.equal(await t1.balanceOf(accounts[2]), 100);
		});

		it("eth orders work, rest is returned to taker (other side)", async () => {
			await t1.mint(accounts[1], 100);
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });

			const right = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");
			const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");

			await expectThrow(
				testing.matchOrders(left, "0x", right, await getSignature(right, accounts[1]), { from: accounts[2], value: 199 })
			);
			await verifyBalanceChange(accounts[2], 200, async () =>
				verifyBalanceChange(accounts[1], -200, async () =>
					testing.matchOrders(left, "0x", right, await getSignature(right, accounts[1]), { from: accounts[2], value: 201, gasPrice: 0 })
				)
			)
			assert.equal(await t1.balanceOf(accounts[1]), 0);
			assert.equal(await t1.balanceOf(accounts[2]), 100);
		});

		it("only owner can change transfer proxy", async () => {
			await expectThrow(
				testing.setTransferProxy("0x00112233", accounts[2], { from: accounts[1] })
			)
			testing.setTransferProxy("0x00112233", accounts[2], { from: accounts[0] });
		})

		it("simplest possible exchange works", async () => {
			const { left, right } = await prepare2Orders()

			await testing.matchOrders(left, await getSignature(left, accounts[1]), right, await getSignature(right, accounts[2]));

			assert.equal(await testing.fills(await libOrder.hashKey(left)), 200);
			assert.equal(await testing.fills(await libOrder.hashKey(right)), 100);

			assert.equal(await t1.balanceOf(accounts[1]), 0);
			assert.equal(await t1.balanceOf(accounts[2]), 100);
			assert.equal(await t2.balanceOf(accounts[1]), 200);
			assert.equal(await t2.balanceOf(accounts[2]), 0);
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

		it("doesn't allow to fill more than 100% of the order", async () => {
			const { left, right } = await prepare2Orders()
			right.makeAsset.amount = 100;
			right.takeAsset.amount = 50;

			await testing.matchOrders(left, await getSignature(left, accounts[1]), right, "0x", { from: accounts[2] });
			await testing.matchOrders(left, await getSignature(left, accounts[1]), right, "0x", { from: accounts[2] });

			await expectThrow(
				testing.matchOrders(left, await getSignature(left, accounts[1]), right, "0x", { from: accounts[2] })
			);

			assert.equal(await t1.balanceOf(accounts[1]), 0);
			assert.equal(await t1.balanceOf(accounts[2]), 100);
			assert.equal(await t2.balanceOf(accounts[1]), 200);
			assert.equal(await t2.balanceOf(accounts[2]), 0);
		})

	})

	describe("validate", () => {
		it("should not let proceed if taker is not correct", async () => {
			const { left, right } = await prepare2Orders()
			left.taker = accounts[3]

			await expectThrow(
				testing.matchOrders(left, await getSignature(left, accounts[1]), right, await getSignature(right, accounts[2]))
			);

			await expectThrow(
				testing.matchOrders(right, await getSignature(right, accounts[2]), left, await getSignature(left, accounts[1]))
			);

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
			const { left, right } = await prepare2Orders()
			left.takeAsset.assetType.data = enc(accounts[1]);

			await expectThrow(
				testing.matchOrders(left, await getSignature(left, accounts[1]), right, await getSignature(right, accounts[2]))
			);
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
		return sign(order, signer, await testing.getChainId(), testing.address);
	}

});
