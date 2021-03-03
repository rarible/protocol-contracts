const Testing = artifacts.require("ERC721DefaultApprovalTest.sol");

const { expectThrow } = require("@daonomic/tests-common");

contract("ERC721DefaultApproval", accounts => {
	let testing;

	beforeEach(async () => {
		testing = await Testing.new();
	})

	it("should allow approved operator to transfer any token", async () => {
		await testing.mint(accounts[5], 1);

		await expectThrow(
			testing.transferFrom(accounts[5], accounts[0], 1)
		)

		await testing.setDefaultApproval(accounts[0], true);
		testing.transferFrom(accounts[5], accounts[0], 1);
		assert.equal(await testing.ownerOf(1), accounts[0]);
	})
})