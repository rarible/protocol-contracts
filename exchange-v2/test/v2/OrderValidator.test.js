const OrderValidatorTest = artifacts.require("OrderValidatorTest.sol");
const TestERC1271 = artifacts.require("TestERC1271.sol");
const TestERC20 = artifacts.require("TestERC20.sol");
const order = require("../order");
const sign = order.sign;
const ZERO = "0x0000000000000000000000000000000000000000";
const tests = require("@daonomic/tests-common");
const expectThrow = tests.expectThrow;

contract("OrderValidator", accounts => {
	let testing;
  let erc1271;
  let erc20;

	beforeEach(async () => {
		testing = await OrderValidatorTest.new();
		await testing.__OrderValidatorTest_init();
		erc1271 = await TestERC1271.new();
		erc20 = await TestERC1271.new();
	});

	it("Test1. should validate if signer is correct", async () => {
		const testOrder = order.Order(accounts[1], order.Asset("0xffffffff", "0x", 100), ZERO, order.Asset("0xffffffff", "0x", 200), 1, 0, 0, "0xffffffff", "0x");
		const signature = await getSignature(testOrder, accounts[1]);
		await testing.validateOrderTest(testOrder, signature);
	});

	it("Test2. should fail validate if signer is incorrect", async () => {
		const testOrder = order.Order(accounts[1], order.Asset("0xffffffff", "0x", 100), ZERO, order.Asset("0xffffffff", "0x", 200), 1, 0, 0, "0xffffffff", "0x");
		const signature = await getSignature(testOrder, accounts[2]);
		await expectThrow(
			testing.validateOrderTest(testOrder, signature)
		);
	});

	it("Test3. should bypass signature if maker is msg.sender", async () => {
		const testOrder = order.Order(accounts[5], order.Asset("0xffffffff", "0x", 100), ZERO, order.Asset("0xffffffff", "0x", 200), 1, 0, 0, "0xffffffff", "0x");
		await testing.validateOrderTest(testOrder, "0x", { from: accounts[5] });
	});

	async function getSignature(order, signer) {
		return sign(order, signer, testing.address);
	}

	it("Test4. should validate if signer is contract and 1271 passes", async () => {
		const testOrder = order.Order(erc1271.address, order.Asset("0xffffffff", "0x", 100), ZERO, order.Asset("0xffffffff", "0x", 200), 1, 0, 0, "0xffffffff", "0x");
		const signature = await getSignature(testOrder, accounts[2]);

		await expectThrow(
			testing.validateOrderTest(testOrder, signature)
		);

		await erc1271.setReturnSuccessfulValidSignature(true);

		await testing.validateOrderTest(testOrder, signature);
	});

	it("Test5. should not validate contract don`t support ERC1271_INTERFACE", async () => {
		const testOrder = order.Order(erc20.address, order.Asset("0xffffffff", "0x", 100), ZERO, order.Asset("0xffffffff", "0x", 200), 1, 0, 0, "0xffffffff", "0x");
		const signature = await getSignature(testOrder, accounts[2]);
		await expectThrow(
			testing.validateOrderTest(testOrder, signature)
		);
	});
});
