const AssetMatcherCollection = artifacts.require("AssetMatcherCollection.sol");
const order = require("../../exchange-v2/test/order.js");
const { enc, ETH, ERC20, ERC721, ERC1155, COLLECTION, id } = require("../../exchange-v2/test/assets.js");

contract("AssetMatcherCustom", accounts => {
	let testingCustom;

	beforeEach(async () => {
	  testingCustom = await AssetMatcherCollection.new();
	});

	describe("Check match by customMatcher Match one from Collection", () => {
    it("Collection COLLECTION <-> ERC1155  matches!", async () => {
      const tokenId = 3000;
      const encoded = enc(accounts[5]);
      const encodedNFT = enc(accounts[5], tokenId);
      const result = await testingCustom.matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ERC1155, encodedNFT));
      assert.equal(result[0], ERC1155);
      assert.equal(result[1], encodedNFT);
    });

    it("Collection COLLECTION <-> ERC721  matches!", async () => {
      const tokenId = 3000;
      const encoded = enc(accounts[5]);
      const encodedNFT = enc(accounts[5], tokenId);
      const result = await testingCustom.matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ERC721, encodedNFT));
      assert.equal(result[0], ERC721);
      assert.equal(result[1], encodedNFT);
    });

    it("Collection COLLECTION <-> ERC1155 (another collection) don`t match!", async () => {
      const tokenId = 3000;
      const encoded = enc(accounts[5]);
      const encodedNFT = enc(accounts[6], tokenId);
      const result = await testingCustom.matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ERC1155, encodedNFT));
      assert.equal(result[0], 0);
    });

    it("Collection COLLECTION <-> ERC721 (another collection) don`t match!", async () => {
      const tokenId = 3000;
      const encoded = enc(accounts[5]);
      const encodedNFT = enc(accounts[6], tokenId);
      const result = await testingCustom.matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ERC721, encodedNFT));
      assert.equal(result[0], 0);
    });

    it("Collection COLLECTION <-> ERC20  don`t match", async () => {
      const encoded = enc(accounts[5]);
      const encodedERC20 = enc(accounts[5]);
      const result = await testingCustom.matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ERC20, encodedERC20));
      assert.equal(result[0], 0);
    });

    it("Collection COLLECTION <-> COLLECTION  don`t match", async () => {
      const encoded = enc(accounts[5]);
      const encodedCollection = enc(accounts[5]);
      const result = await testingCustom.matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(COLLECTION, encodedCollection));
      assert.equal(result[0], 0);
    });

    it("Collection COLLECTION <-> ETH  don`t match", async () => {
      const encoded = enc(accounts[5]);
      const encodedETH = enc(accounts[5]);
      const result = await testingCustom.matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ETH, encodedETH));
      assert.equal(result[0], 0);
    });
  })
});
