const AssetMatcherCollection = artifacts.require("AssetMatcherCollection.sol");
const order = require("../../exchange-v2/test/order.js");
const { enc, ETH, ERC20, ERC721, ERC721_LAZY, ERC1155, ERC1155_LAZY, COLLECTION, id } = require("../../exchange-v2/test/assets.js");

contract("AssetMatcherCustom", accounts => {
  let assetMatcherCollection;
  const operator = accounts[3];

  beforeEach(async () => {
    assetMatcherCollection = await AssetMatcherCollection.new();
    assetMatcherCollection.__AssetMatcherCollection_init();
    assetMatcherCollection.addOperator(operator);
//    assetMatcherCollection.addOperator(accounts[2]);
//    let tmp = await assetMatcherCollection.getOperator(operator);
//    console.log("address operator before:", tmp);
//    console.log("address operator before:", await assetMatcherCollection.getOperator(operator));
  });

  describe("Check match by customMatcher Match one from Collection", () => {
    it("Collection COLLECTION <-> ERC1155  matches!", async () => {
      const tokenId = 3000;
      const encoded = enc(accounts[5]);
      const encodedNFT = enc(accounts[5], tokenId);
//      console.log("address operator2:", await assetMatcherCollection.getOperator(accounts[2]));
//      console.log("address operator1:", await assetMatcherCollection.getOperator(operator));

//      console.log("address operator2:", await assetMatcherCollection.getOperator(accounts[2]));
      const result = await assetMatcherCollection.matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ERC1155, encodedNFT), {from: operator});
      assert.equal(result[0], ERC1155);
      assert.equal(result[1], encodedNFT);
    });

//    it("Collection COLLECTION <-> ERC1155_LAZY  matches!", async () => {
//      const tokenId = 3000;
//      const encoded = enc(accounts[5]);
//      const encodedNFT = enc(accounts[5], tokenId);
//      const result = await testingCustom.matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ERC1155_LAZY, encodedNFT));
//      assert.equal(result[0], ERC1155_LAZY);
//      assert.equal(result[1], encodedNFT);
//    });
//
//    it("Collection COLLECTION <-> ERC721  matches!", async () => {
//      const tokenId = 3000;
//      const encoded = enc(accounts[5]);
//      const encodedNFT = enc(accounts[5], tokenId);
//      const result = await testingCustom.matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ERC721, encodedNFT));
//      assert.equal(result[0], ERC721);
//      assert.equal(result[1], encodedNFT);
//    });
//
//    it("Collection COLLECTION <-> ERC721_LAZY  matches!", async () => {
//      const tokenId = 3000;
//      const encoded = enc(accounts[5]);
//      const encodedNFT = enc(accounts[5], tokenId);
//      const result = await testingCustom.matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ERC721_LAZY, encodedNFT));
//      assert.equal(result[0], ERC721_LAZY);
//      assert.equal(result[1], encodedNFT);
//    });
//
//    it("Collection COLLECTION <-> ERC1155 (another collection) don`t match!", async () => {
//      const tokenId = 3000;
//      const encoded = enc(accounts[5]);
//      const encodedNFT = enc(accounts[6], tokenId);
//      const result = await testingCustom.matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ERC1155, encodedNFT));
//      assert.equal(result[0], 0);
//    });
//
//    it("Collection COLLECTION <-> ERC721 (another collection) don`t match!", async () => {
//      const tokenId = 3000;
//      const encoded = enc(accounts[5]);
//      const encodedNFT = enc(accounts[6], tokenId);
//      const result = await testingCustom.matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ERC721, encodedNFT));
//      assert.equal(result[0], 0);
//    });
//
//    it("Collection COLLECTION <-> ERC20  don`t match", async () => {
//      const encoded = enc(accounts[5]);
//      const encodedERC20 = enc(accounts[5]);
//      const result = await testingCustom.matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ERC20, encodedERC20));
//      assert.equal(result[0], 0);
//    });
//
//    it("Collection COLLECTION <-> COLLECTION  don`t match", async () => {
//      const encoded = enc(accounts[5]);
//      const encodedCollection = enc(accounts[5]);
//      const result = await testingCustom.matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(COLLECTION, encodedCollection));
//      assert.equal(result[0], 0);
//    });
//
//    it("Collection COLLECTION <-> ETH  don`t match", async () => {
//      const encoded = enc(accounts[5]);
//      const encodedETH = enc(accounts[5]);
//      const result = await testingCustom.matchAssets(order.AssetType(COLLECTION, encoded), order.AssetType(ETH, encodedETH));
//      assert.equal(result[0], 0);
//    });
  })
});
