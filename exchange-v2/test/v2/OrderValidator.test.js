const OrderValidatorTest = artifacts.require("OrderValidatorTest.sol");
const order = require("../order");
const sign = order.sign;
const ZERO = "0x0000000000000000000000000000000000000000";
const tests = require("@daonomic/tests-common");
const expectThrow = tests.expectThrow;

contract("OrderValidator", accounts => {
	let testing;

	beforeEach(async () => {
		testing = await OrderValidatorTest.new();
		await testing.__OrderValidatorTest_init();
	});

	it("should validate if signer is correct", async () => {
		const testOrder = order.Order(accounts[1], order.Asset("0xffffffff", "0x", 100), ZERO, order.Asset("0xffffffff", "0x", 200), 1, 0, 0, "0xffffffff", "0x");
		const signature = await getSignature(testOrder, accounts[1]);
		await testing.validateOrderTest(testOrder, signature);
	});

	it("should fail validate if signer is incorrect", async () => {
		const testOrder = order.Order(accounts[1], order.Asset("0xffffffff", "0x", 100), ZERO, order.Asset("0xffffffff", "0x", 200), 1, 0, 0, "0xffffffff", "0x");
		const signature = await getSignature(testOrder, accounts[2]);
		await expectThrow(
			testing.validateOrderTest(testOrder, signature)
		);
	});

	it("should bypass signature if maker is msg.sender", async () => {
		const testOrder = order.Order(accounts[5], order.Asset("0xffffffff", "0x", 100), ZERO, order.Asset("0xffffffff", "0x", 200), 1, 0, 0, "0xffffffff", "0x");
		await testing.validateOrderTest(testOrder, "0x", { from: accounts[5] });
	});

	async function getSignature(order, signer) {
		return sign(order, signer, testing.address);
	}

});
