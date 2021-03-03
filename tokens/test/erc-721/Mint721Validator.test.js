const Mint721ValidatorTest = artifacts.require("Mint721ValidatorTest.sol");
const TestERC1271 = artifacts.require("TestERC1271.sol");
const ZERO = "0x0000000000000000000000000000000000000000";
const { expectThrow } = require("@daonomic/tests-common");
const { sign } = require("./mint");

contract("Mint721Validator", accounts => {
	let testing;
	let erc1271;
	let fees;

	beforeEach(async () => {
		testing = await Mint721ValidatorTest.new();
		await testing.__Mint721ValidatorTest_init();
		erc1271 = await TestERC1271.new();
		fees = [{ account: accounts[1], value: 1 }, { account: accounts[2], value: 100 }]
	});

	it("should validate if signer is correct", async () => {
		const signature = await sign(accounts[1], 1, "testURI", [accounts[1]], fees, testing.address);
		await testing.validateTest([1, "testURI", [accounts[1]], fees, [signature]], 0);
	});

	it("should work for some creators", async () => {
		const signature = await sign(accounts[1], 1, "testURI", [accounts[2], accounts[1]], fees, testing.address);
		await testing.validateTest([1, "testURI", [accounts[2], accounts[1]], fees, ["0x", signature]], 1);
	});

	it("should work if fees list is empty", async () => {
		const signature = await sign(accounts[1], 1, "testURI", [accounts[1]], [], testing.address);
		await testing.validateTest([1, "testURI", [accounts[1]], [], [signature]], 0);
	});

	it("should fail if signer is incorrect", async () => {
		const signature = await sign(accounts[0], 1, "testURI", [accounts[1]], fees, testing.address);
		await expectThrow(
			testing.validateTest([1, "testURI", [accounts[1]], fees, [signature]], 0)
		);
	});

	it("should validate if signer is contract and 1271 passes", async () => {
		await expectThrow(
			testing.validateTest([1, "testURI", [erc1271.address], fees, ["0x"]], 0)
		);

		await erc1271.setReturnSuccessfulValidSignature(true);

		await testing.validateTest([1, "testURI", [erc1271.address], fees, ["0x"]], 0)
	});

});
