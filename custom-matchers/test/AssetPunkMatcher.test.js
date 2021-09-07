const AssetMatcherPunk = artifacts.require("AssetMatcherPunk.sol");
const order = require("../../exchange-v2/test/order.js");
const { enc, ETH, ERC20, ERC721, ERC1155, CRYPTO_PUNK, id } = require("../../exchange-v2/test/assets.js");

contract("AssetMatcherCustom", accounts => {
	let testingCustom;

	beforeEach(async () => {
	  testingPunk = await AssetMatcherPunk.new();
	});

	describe("Check match by customMatcher Match Punk", () => {
    it("Punk Id = 3000 <-> Punk Id = 3000  matches!", async () => {
      const tokenId = 3000;
      const encodedPunk1 = enc(accounts[5], tokenId);
      const encodedPunk2 = enc(accounts[5], tokenId);
      const result = await testingPunk.matchAssets(order.AssetType(CRYPTO_PUNK, encodedPunk1), order.AssetType(CRYPTO_PUNK, encodedPunk2));
      assert.equal(result[0], CRYPTO_PUNK);
      assert.equal(result[1], encodedPunk2);
    });

    it("Punk Id = 3000 <-> Punk Id = 3001  don`t matches!", async () => {
      const tokenId1 = 3000;
      const tokenId2 = 3001;
      const encodedPunk1 = enc(accounts[5], tokenId1);
      const encodedPunk2 = enc(accounts[5], tokenId2);
      const result = await testingPunk.matchAssets(order.AssetType(CRYPTO_PUNK, encodedPunk1), order.AssetType(CRYPTO_PUNK, encodedPunk2));
      assert.equal(result[0], 0);
    });

    it("Punk Id = 3000 <-> Punk Id = 3000, but different collections don`t matches!", async () => {
      const tokenId = 3000;
      const encodedPunk1 = enc(accounts[5], tokenId);
      const encodedPunk2 = enc(accounts[6], tokenId);
      const result = await testingPunk.matchAssets(order.AssetType(CRYPTO_PUNK, encodedPunk1), order.AssetType(CRYPTO_PUNK, encodedPunk2));
      assert.equal(result[0], 0);
    });

  })
});
