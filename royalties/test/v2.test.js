const Impl = artifacts.require("RoyaltiesV2TestImpl.sol");
const Test = artifacts.require("RoyaltiesV2Test.sol");

contract("v2", accounts => {
	let impl;
	let testing;

	beforeEach(async () => {
		impl = await Impl.new();
		testing = await Test.new(impl.address);
	})

	it("simple impl works", async () => {
		await impl.saveFees(10, [{ account: accounts[1], value: 100 }]);

		const result = await impl.getFees(10);
		assert.equal(result.length, 1);
		assert.equal(result[0][0], accounts[1]);
		assert.equal(result[0][1], 100);

		const tx = await testing.feesTest(10);
		console.log("used gas", tx.receipt.gasUsed);
	})

	it("update allows to change fee recipient", async () => {
		await impl.saveFees(10, [{ account: accounts[1], value: 100 }]);
		await impl.updateAccount(10, accounts[1], accounts[2]);

		const result = await impl.getFees(10);
		assert.equal(result.length, 1);
		assert.equal(result[0][0], accounts[2]);
		assert.equal(result[0][1], 100);

	})

})