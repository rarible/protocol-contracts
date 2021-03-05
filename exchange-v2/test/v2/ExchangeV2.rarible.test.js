const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const ExchangeV2 = artifacts.require("ExchangeV2.sol");
const TestERC20 = artifacts.require("TestERC20.sol");
const TransferProxy = artifacts.require("TransferProxy.sol");
const ERC20TransferProxy = artifacts.require("ERC20TransferProxy.sol");
const LibOrderTest = artifacts.require("LibOrderTest.sol");

const { Order, Asset, sign } = require("../order");
const EIP712 = require("../EIP712");
const ZERO = "0x0000000000000000000000000000000000000000";
const { expectThrow, verifyBalanceChange } = require("@daonomic/tests-common");
const { ETH, ERC20, ERC721, ERC1155, enc, id } = require("../assets");

contract("ExchangeV2", accounts => {
	let testing;
	let transferProxy;
	let erc20TransferProxy;
	let t1;
	let t2;
	let libOrder;
	let protocol = accounts[9];

	beforeEach(async () => {
		libOrder = await LibOrderTest.new();
		transferProxy = await TransferProxy.new();
		await transferProxy.__TransferProxy_init();
		erc20TransferProxy = await ERC20TransferProxy.new();
		await erc20TransferProxy.__ERC20TransferProxy_init();
		testing = await deployProxy(ExchangeV2, [1, transferProxy.address, erc20TransferProxy.address], { initializer: "__Exchange_init" });
		//todo test testing.setProtocolAddress(protocol);
		await transferProxy.addOperator(testing.address);
		await erc20TransferProxy.addOperator(testing.address);
		t1 = await TestERC20.new();
		t2 = await TestERC20.new();
	});

	describe("matchOrders", () => {
		it("beneficiary can be defined for Order", async () => {
			const { left, right } = await prepare2Orders()
			right.dataType = id("V1");
			right.data = enc(accounts[3]);

			await testing.matchOrders(left, await sign(left, accounts[1]), right, "0x", { from: accounts[2] });

			assert.equal(await testing.fills(await libOrder.hashKey(left)), 200);

			assert.equal(await t1.balanceOf(accounts[1]), 0);
			assert.equal(await t1.balanceOf(accounts[3]), 100);
			assert.equal(await t2.balanceOf(accounts[1]), 200);
			assert.equal(await t2.balanceOf(accounts[2]), 0);
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

	function getSignature(order, signer) {
		return sign(order, signer, testing.address);
	}

});
