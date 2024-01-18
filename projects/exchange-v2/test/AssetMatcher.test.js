const AssetMatcherTest = artifacts.require("AssetMatcherTest.sol");
const TestAssetMatcher = artifacts.require("TestAssetMatcher.sol");

const { expectThrow } = require("@daonomic/tests-common");

const order = require("../../scripts/order.js");
const { enc, ETH, ERC20, ERC721, ERC1155, CRYPTO_PUNKS, id } = require("../../scripts/assets.js");

contract("AssetMatcher", accounts => {
	let testing;

	before(async () => {
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

  describe("CRYPTO_PUNKS", () => {
    it("Punk Id = 3000 <-> Punk Id = 3000 matches!", async () => {
      const tokenId = 3000;
      const encodedPunk1 = enc(accounts[5], tokenId);
      const encodedPunk2 = enc(accounts[5], tokenId);
      const result = await testing.matchAssetsTest(order.AssetType(CRYPTO_PUNKS, encodedPunk1), order.AssetType(CRYPTO_PUNKS, encodedPunk2));
      assert.equal(result[0], CRYPTO_PUNKS);
      assert.equal(result[1], encodedPunk1);
    })

    it("Punk Id = 3000 <-> Punk Id = 3001 don`t matches!", async () => {
      const tokenId1 = 3000;
      const tokenId2 = 3001;
      const encodedPunk1 = enc(accounts[5], tokenId1);
      const encodedPunk2 = enc(accounts[5], tokenId2);
      const result = await testing.matchAssetsTest(order.AssetType(CRYPTO_PUNKS, encodedPunk1), order.AssetType(CRYPTO_PUNKS, encodedPunk2));
      assert.equal(result[0], 0);
    })

    it("Punk Id = 3000 <-> Punk Id = 3000, but different collections don`t matches!", async () => {
      const tokenId1 = 3000;
      const tokenId2 = 3000;
      const encodedPunk1 = enc(accounts[5], tokenId1);
      const encodedPunk2 = enc(accounts[6], tokenId2);
      const result = await testing.matchAssetsTest(order.AssetType(CRYPTO_PUNKS, encodedPunk1), order.AssetType(CRYPTO_PUNKS, encodedPunk2));
      assert.equal(result[0], 0);
    })

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
