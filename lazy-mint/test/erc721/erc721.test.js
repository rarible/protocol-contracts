const ERC721Test = artifacts.require("ERC721Test.sol");
const ZERO = "0x0000000000000000000000000000000000000000";
const { expectThrow } = require("@daonomic/tests-common");
const { sign } = require("../../../scripts/mint721.js");

contract("ERC721Test", accounts => {
	let testing;
	let royalties;
	let creators;

	beforeEach(async () => {
		testing = await ERC721Test.new();
		await testing.__ERC721Test_init();
		royalties = [{ account: accounts[1], value: 1 }, { account: accounts[2], value: 100 }];
		creators = [{ account: accounts[1], value: 100000 }]
	});

	it("should recover signer", async () => {
		const signature = await sign(accounts[1], 1, "testURI", creators, royalties, testing.address);
		assert.equal(
			await testing.recover([1, "testURI", creators, royalties, [signature]], signature),
			accounts[1]
		);
	});
});
