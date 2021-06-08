const AssetMatcherTest = artifacts.require("AssetMatcherTest.sol");
const TestAssetMatcher = artifacts.require("TestAssetMatcher.sol");
const order = require("../order");
const EIP712 = require("../EIP712");
const ZERO = "0x0000000000000000000000000000000000000000";
const tests = require("@daonomic/tests-common");
const expectThrow = tests.expectThrow;
const { enc, ETH, ERC20, ERC721, ERC1155, id } = require("../assets");

contract("AssetMatcher", accounts => {
	let testing;

	beforeEach(async () => {
		testing = await AssetMatcherTest.new();
		await testing.__AssetMatcherTest_init();
	});

	it("setAssetMatcher works", async () => {
		const encoded = enc(accounts[5]);
		await expectThrow(
			testing.matchAssetsTest(order.AssetType(ERC20, encoded), order.AssetType(id("BLA"), encoded))
		);
		const testMatcher = await TestAssetMatcher.new();
		await testing.setAssetMatcher(id("BLA"), testMatcher.address);
		const result = await testing.matchAssetsTest(order.AssetType(ERC20, encoded), order.AssetType(id("BLA"), encoded));
		assert.equal(result[0], ERC20);
		assert.equal(result[1], encoded);
	})

	describe("ETH", () => {
		it("should extract ETH type if both are ETHs", async () => {
			const result = await testing.matchAssetsTest(order.AssetType(ETH, "0x"), order.AssetType(ETH, "0x"))
			assert.equal(result[0], ETH);
		});

		it("should extract nothing if one is not ETH", async () => {
			const result = await testing.matchAssetsTest(order.AssetType(ETH, "0x"), order.AssetType(ERC20, "0x"))
			assert.equal(result[0], 0);
		});
	})

	describe("ERC20", () => {
		it("should extract ERC20 type if both are and addresses equal", async () => {
			const encoded = enc(accounts[5])
			const result = await testing.matchAssetsTest(order.AssetType(ERC20, encoded), order.AssetType(ERC20, encoded))
			assert.equal(result[0], ERC20);
			assert.equal(result[1], encoded);
		});

		it("should extract nothing if erc20 don't match", async () => {
			const result = await testing.matchAssetsTest(order.AssetType(ERC20, enc(accounts[1])), order.AssetType(ERC20, enc(accounts[2])))
			assert.equal(result[0], 0);
		});

		it("should extract nothing if other type is not ERC20", async () => {
			const result = await testing.matchAssetsTest(order.AssetType(ERC20, enc(accounts[1])), order.AssetType(ETH, "0x"))
			assert.equal(result[0], 0);
		});
	})

	describe("ERC721", () => {
		it("should extract ERC721 type if both are equal", async () => {
			const encoded = enc(accounts[5], 100)
			const result = await testing.matchAssetsTest(order.AssetType(ERC721, encoded), order.AssetType(ERC721, encoded))
			assert.equal(result[0], ERC721);
			assert.equal(result[1], encoded);
		});

		it("should extract nothing if tokenIds don't match", async () => {
			const result = await testing.matchAssetsTest(order.AssetType(ERC721, enc(accounts[5], 100)), order.AssetType(ERC721, enc(accounts[5], 101)))
			assert.equal(result[0], 0);
		});

		it("should extract nothing if addresses don't match", async () => {
			const result = await testing.matchAssetsTest(order.AssetType(ERC721, enc(accounts[4], 100)), order.AssetType(ERC721, enc(accounts[5], 100)))
			assert.equal(result[0], 0);
		});

		it("should extract nothing if other type is not ERC721", async () => {
			const result = await testing.matchAssetsTest(order.AssetType(ERC721, enc(accounts[5], 100)), order.AssetType(ETH, "0x"))
			assert.equal(result[0], 0);
		});
	})

	describe("ERC1155", () => {
		it("should extract ERC1155 type if both are equal", async () => {
			const encoded = enc(accounts[5], 100)
			const result = await testing.matchAssetsTest(order.AssetType(ERC1155, encoded), order.AssetType(ERC1155, encoded))
			assert.equal(result[0], ERC1155);
			assert.equal(result[1], encoded);
		});

		it("should extract nothing if tokenIds don't match", async () => {
			const result = await testing.matchAssetsTest(order.AssetType(ERC1155, enc(accounts[5], 100)), order.AssetType(ERC1155, enc(accounts[5], 101)))
			assert.equal(result[0], 0);
		});

		it("should extract nothing if addresses don't match", async () => {
			const result = await testing.matchAssetsTest(order.AssetType(ERC1155, enc(accounts[4], 100)), order.AssetType(ERC1155, enc(accounts[5], 100)))
			assert.equal(result[0], 0);
		});

		it("should extract nothing if other type is not erc1155", async () => {
			const encoded = enc(accounts[5], 100);
			const result = await testing.matchAssetsTest(order.AssetType(ERC1155, encoded), order.AssetType(ERC721, encoded))
			assert.equal(result[0], 0);
		});
	})

	describe("generic", () => {
		it("should extract left type if asset types are equal", async () => {
			const result = await testing.matchAssetsTest(order.AssetType("0x00112233", "0x1122"), order.AssetType("0x00112233", "0x1122"))
			assert.equal(result[0], "0x00112233");
			assert.equal(result[1], "0x1122");
		});

		it("should extract nothing single byte differs", async () => {
			const result = await testing.matchAssetsTest(order.AssetType("0x00112233", "0x1122"), order.AssetType("0x00112233", "0x1111"));
			assert.equal(result[0], 0);
		});
	})
});
