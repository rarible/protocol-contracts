const Testing = artifacts.require("ERC1155DefaultApprovalTest.sol");

const { expectThrow } = require("@daonomic/tests-common");

contract("ERC1155DefaultApproval", accounts => {
	let testing;

	beforeEach(async () => {
		testing = await Testing.new();
	})

	it("should allow approved operator to transfer any token", async () => {
		await testing.mint(accounts[5], 1, 10);

		await expectThrow(
			testing.safeTransferFrom(accounts[5], accounts[0], 1, 10, "0x")
		)

		await testing.setDefaultApproval(accounts[0], true);
		testing.safeTransferFrom(accounts[5], accounts[0], 1, 10, "0x");
		assert.equal(await testing.balanceOf(accounts[0], 1), 10);
	})
})