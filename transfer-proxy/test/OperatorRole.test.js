const OperatorRoleTest = artifacts.require("OperatorRoleTest.sol");
const ZERO = "0x0000000000000000000000000000000000000000";
const tests = require("@daonomic/tests-common");
const expectThrow = tests.expectThrow;

contract("OperatorRole", accounts => {
	let testing;

	beforeEach(async () => {
		testing = await OperatorRoleTest.new();
		await testing.__OperatorRoleTest_init();
	});

	it("only owner can add/remove operators", async () => {
		await expectThrow(
			testing.addOperator(accounts[1], { from: accounts[1] })
		)
		await expectThrow(
			testing.removeOperator(accounts[1], { from: accounts[1] })
		)

		await testing.addOperator(accounts[1])
		await testing.removeOperator(accounts[1])
	})

	it("only operator can call protected functions", async () => {
		await expectThrow(
			testing.getSomething({ from: accounts[1] })
		)

		await testing.addOperator(accounts[1], )
		assert.equal(await testing.getSomething({ from: accounts[1] }), 10);

		await expectThrow(
			testing.getSomething({ from: accounts[0] })
		)

	})

});
