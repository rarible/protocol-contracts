const Impl = artifacts.require("FeesV1Impl.sol");
const Test = artifacts.require("FeesV1Test.sol");

contract("v1", accounts => {
	let impl;
	let testing;

	beforeEach(async () => {
		impl = await Impl.new();
		testing = await Test.new(impl.address);
	})

	it("simple impl works", async () => {
		await impl.saveFees(10, [{ account: accounts[1], value: 100 }]);

		const recipients = await impl.getFeeRecipients(10);
		assert.equal(recipients.length, 1);
		assert.equal(recipients[0], accounts[1]);

		const values = await impl.getFeeBps(10);
		assert.equal(values.length, 1);
		assert.equal(values[0], 100);

		const tx = await testing.feesTest(10);
		console.log("used gas", tx.receipt.gasUsed);
	})

	it("update allows to change fee recipient", async () => {
		await impl.saveFees(10, [{ account: accounts[1], value: 100 }]);
		await impl.updateAccount(10, accounts[1], accounts[2]);

		const recipients = await impl.getFeeRecipients(10);
		assert.equal(recipients.length, 1);
		assert.equal(recipients[0], accounts[2]);

		const values = await impl.getFeeBps(10);
		assert.equal(values.length, 1);
		assert.equal(values[0], 100);
	})
})