const Mint1155ValidatorTest = artifacts.require("Mint1155ValidatorTest.sol");
const TestERC1271 = artifacts.require("TestERC1271.sol");
const ZERO = "0x0000000000000000000000000000000000000000";
const tests = require("@daonomic/tests-common");
const expectThrow = tests.expectThrow;
const { sign } = require("./mint");

contract("Mint1155Validator", accounts => {
	let testing;
	let erc1271;
	let fees;

	beforeEach(async () => {
		testing = await Mint1155ValidatorTest.new();
		await testing.__Mint1155ValidatorTest_init();
		erc1271 = await TestERC1271.new();
		fees = [{ account: accounts[1], value: 1 }, { account: accounts[2], value: 100 }]
	});

	it("should validate if signer is correct", async () => {
		const signature = await sign(accounts[1], 1, "testURI", 10, [accounts[1]], fees, testing.address);
		await testing.validateTest(ZERO, [1, "testURI", 10, [accounts[1]], fees, [signature]], 0);
	});

	it("should work if fees list is empty", async () => {
		const signature = await sign(accounts[1], 1, "testURI", 10, [accounts[1]], [], testing.address);
		await testing.validateTest(ZERO, [1, "testURI", 10, [accounts[1]], [], [signature]], 0);
	});

	it("should fail if signer is incorrect", async () => {
		const signature = await sign(accounts[0], 1, "testURI", 10, [accounts[1]], fees, testing.address);
		await expectThrow(
			testing.validateTest(ZERO, [1, "testURI", 10, [accounts[1]], fees, [signature]], 0)
		);
	});

	it("should validate if signer is contract and 1271 passes", async () => {
		await expectThrow(
			testing.validateTest(ZERO, [1, "testURI", 10, [erc1271.address], fees, ["0x"]], 0)
		);

		await erc1271.setReturnSuccessfulValidSignature(true);

		await testing.validateTest(ZERO, [1, "testURI", 10, [erc1271.address], fees, ["0x"]], 0);
	});

});
