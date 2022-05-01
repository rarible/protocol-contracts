const Mint721ValidatorTest = artifacts.require("Mint721ValidatorTest.sol");
const TestERC1271 = artifacts.require("TestERC1271.sol");
const ZERO = "0x0000000000000000000000000000000000000000";
const { expectThrow } = require("@daonomic/tests-common");
const { sign } = require("./mint");

contract("Mint721Validator minimal", accounts => {
	let testing;
	let erc1271;
	let fees;

	before(async () => {
		testing = await Mint721ValidatorTest.new();
		await testing.__Mint721ValidatorTest_init();
		erc1271 = await TestERC1271.new();
		fees = [{ account: accounts[1], value: 1 }, { account: accounts[2], value: 100 }]
	});

	it("should validate if signer is correct", async () => {
		const creators = [{ account: accounts[1], value: 10000 }]
		const signature = await sign(accounts[1], 1, "testURI", creators, fees, testing.address);
		await testing.validateTest([1, "testURI", creators, fees, [signature]], 0);
	});

	it("should work for some creators", async () => {
		const creators = [{ account: accounts[2], value: 5000 }, { account: accounts[1], value: 10000 }];
		const signature = await sign(accounts[1], 1, "testURI", creators, fees, testing.address);
		await testing.validateTest([1, "testURI", creators, fees, ["0x", signature]], 1);
	});

	it("should work if fees list is empty", async () => {
		const creators = [{ account: accounts[1], value: 10000 }]
		const signature = await sign(accounts[1], 1, "testURI", creators, [], testing.address);
		await testing.validateTest([1, "testURI", creators, [], [signature]], 0);
	});

	it("should fail if signer is incorrect", async () => {
		const creators = [{ account: accounts[1], value: 10000 }]
		const signature = await sign(accounts[0], 1, "testURI", creators, fees, testing.address);
		await expectThrow(
			testing.validateTest([1, "testURI", creators, fees, [signature]], 0)
		);
	});

	it("should validate if signer is contract and 1271 passes", async () => {
		const creators = [{ account: erc1271.address, value: 10000 }]
		await expectThrow(
			testing.validateTest([1, "testURI", creators, fees, ["0x"]], 0)
		);

		await erc1271.setReturnSuccessfulValidSignature(true);

		await testing.validateTest([1, "testURI", creators, fees, ["0x"]], 0)
	});

});
