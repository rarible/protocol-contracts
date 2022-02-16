const AssetMatcherWETH = artifacts.require("AssetMatcherWETH.sol");
const WETHTest = artifacts.require("WETHTest.sol");
const order = require("../../exchange-v2/test/order.js");
const { expectThrow } = require("@daonomic/tests-common");
const { enc, ETH, ERC20, ERC721, ERC721_LAZY, ERC1155, ERC1155_LAZY, WETH_UNWRAP, COLLECTION, id } = require("../../exchange-v2/test/assets.js");

contract("AssetMatcherWETHCustom", accounts => {
  let assetMatcherWETH;
  const operator = accounts[3];

  beforeEach(async () => {
    assetMatcherWETH = await AssetMatcherWETH.new();
    wETHTest = await WETHTest.new();
  });

  describe("Check match by customMatcher Match WETH_UNWRAP", () => {
    it("Collection ERC20 <-> WETH_UNWRAP  matches!", async () => {
      const encoded = enc(wETHTest.address);
      const result = await assetMatcherWETH.matchAssets(order.AssetType(ERC20, encoded), order.AssetType(WETH_UNWRAP, encoded));
      assert.equal(result[0], WETH_UNWRAP);
      assert.equal(result[1], encoded);
    });

    it("Collection WETH_UNWRAP <-> ERC20  matches!", async () => {
      const encoded = enc(wETHTest.address);
      const result = await assetMatcherWETH.matchAssets(order.AssetType(WETH_UNWRAP, encoded), order.AssetType(ERC20, encoded));
      assert.equal(result[0], WETH_UNWRAP);
      assert.equal(result[1], encoded);
    });

    it("Collection ERC20 <-> WETH_UNWRAP, ERC20 token data wrong, throw, don`t matches!", async () => {
      const encoded = enc(wETHTest.address);
      await await expectThrow(
        assetMatcherWETH.matchAssets(order.AssetType(ERC20, "0x"), order.AssetType(WETH_UNWRAP, encoded))
      );
    });

    it("Collection ERC721 <-> WETH_UNWRAP, One side is ERC721, token wrong type, don`t matches!", async () => {
      const encoded = enc(wETHTest.address);
      const result = await  assetMatcherWETH.matchAssets(order.AssetType(ERC721, encoded), order.AssetType(WETH_UNWRAP, "0x"));
      assert.equal(result[0], 0);
    });

    it("Collection WETH_UNWRAP <-> both side are WETH_UNWRAP token, don`t matches!", async () => {
      const encoded = enc(wETHTest.address);
      const result = await assetMatcherWETH.matchAssets(order.AssetType(WETH_UNWRAP, "0x"), order.AssetType(WETH_UNWRAP, "0x"));
      assert.equal(result[0], 0);
    });

  })
});
