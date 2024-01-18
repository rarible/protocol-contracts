const AssetMatcherCollection = artifacts.require("AssetMatcherCollection.sol");

const order = require("../../scripts/order.js");

const { enc, ETH, ERC20, ERC721, ERC721_LAZY, ERC1155, ERC1155_LAZY, COLLECTION } = require("../../scripts/assets.js");

contract("AssetMatcherCustom", accounts => {
  let assetMatcherCollection;
  const operator = accounts[3];

  before(async () => {
    assetMatcherCollection = await AssetMatcherCollection.new();
  });

  describe("Check match by customMatcher Match one from Collection", () => {
    it("Collection COLLECTION <-> ERC1155  matches!", async () => {
      const tokenId = 3000;
      const encoded = enc(accounts[5]);
      const encodedNFT = enc(accounts[5], tokenId);
      const result = await assetMatcherCollection.matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ERC1155, encodedNFT), {from: operator});
      assert.equal(result[0], ERC1155);
      assert.equal(result[1], encodedNFT);
    });

    it("Collection COLLECTION <-> ERC1155_LAZY  matches!", async () => {
      const tokenId = 3000;
      const encoded = enc(accounts[5]);
      const encodedNFT = enc(accounts[5], tokenId);
      const result = await assetMatcherCollection.matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ERC1155_LAZY, encodedNFT), {from: operator});
      assert.equal(result[0], ERC1155_LAZY);
      assert.equal(result[1], encodedNFT);
    });

    it("Collection COLLECTION <-> ERC721  matches!", async () => {
      const tokenId = 3000;
      const encoded = enc(accounts[5]);
      const encodedNFT = enc(accounts[5], tokenId);
      const result = await assetMatcherCollection.matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ERC721, encodedNFT), {from: operator});
      assert.equal(result[0], ERC721);
      assert.equal(result[1], encodedNFT);
    });

    it("Collection COLLECTION <-> ERC721_LAZY  matches!", async () => {
      const tokenId = 3000;
      const encoded = enc(accounts[5]);
      const encodedNFT = enc(accounts[5], tokenId);
      const result = await assetMatcherCollection.matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ERC721_LAZY, encodedNFT), {from: operator});
      assert.equal(result[0], ERC721_LAZY);
      assert.equal(result[1], encodedNFT);
    });

    it("Collection COLLECTION <-> ERC1155 (another collection) don`t match!", async () => {
      const tokenId = 3000;
      const encoded = enc(accounts[5]);
      const encodedNFT = enc(accounts[6], tokenId);
      const result = await assetMatcherCollection.matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ERC1155, encodedNFT), {from: operator});
      assert.equal(result[0], 0);
    });

    it("Collection COLLECTION <-> ERC721 (another collection) don`t match!", async () => {
      const tokenId = 3000;
      const encoded = enc(accounts[5]);
      const encodedNFT = enc(accounts[6], tokenId);
      const result = await assetMatcherCollection.matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ERC721, encodedNFT), {from: operator});
      assert.equal(result[0], 0);
    });

    it("Collection COLLECTION <-> ERC20  don`t match", async () => {
      const encoded = enc(accounts[5]);
      const encodedERC20 = enc(accounts[5]);
      const result = await assetMatcherCollection.matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ERC20, encodedERC20), {from: operator});
      assert.equal(result[0], 0);
    });

    it("Collection COLLECTION <-> COLLECTION  don`t match", async () => {
      const encoded = enc(accounts[5]);
      const encodedCollection = enc(accounts[5]);
      const result = await assetMatcherCollection.matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(COLLECTION, encodedCollection), {from: operator});
      assert.equal(result[0], 0);
    });

    it("Collection COLLECTION <-> ETH  don`t match", async () => {
      const encoded = enc(accounts[5]);
      const encodedETH = enc(accounts[5]);
      const result = await assetMatcherCollection.matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ETH, encodedETH), {from: operator});
      assert.equal(result[0], 0);
    });
  })
});
