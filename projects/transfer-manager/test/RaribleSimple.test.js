const RaribleSimpleTest = artifacts.require("RaribleSimpleTest.sol");

const { AssetType } = require("../../scripts/order.js");
const { id } = require("../../scripts/assets.js");

contract("RaribleTSimpleTest:", accounts => {
	let testing;

	before(async () => {
		testing = await RaribleSimpleTest.new();
	});

	describe("Check royalties()", () => {

		it("Check get royalties ERC1155Lazy ", async () => {
		  let encodedMintData = await testing.encode1155([1, "uri", 10, [[accounts[1], 0], [accounts[3], 0]], [[accounts[4], 100], [accounts[5], 200]], []]);
		  let royalties = {};
		  royalties = await testing.getRoyaltiesByAssetTest.call(AssetType(id("ERC1155_LAZY"), encodedMintData));

      assert.equal(royalties[0].value, 100);
      assert.equal(royalties[0].account, accounts[4]);
      assert.equal(royalties[1].value, 200);
      assert.equal(royalties[1].account, accounts[5]);
      assert.equal(royalties.length, 2);
		})

		it("Check  get royalties  ERC721Lazy ", async () => {
		  let encodedMintData = await testing.encode721([1, "uri", [[accounts[1], 0], [accounts[3], 0]], [[accounts[4], 300], [accounts[5], 400]], []]);
		  let royalties = {};
		  royalties = await testing.getRoyaltiesByAssetTest.call(AssetType(id("ERC721_LAZY"), encodedMintData));

      assert.equal(royalties[0].value, 300);
      assert.equal(royalties[0].account, accounts[4]);
      assert.equal(royalties[1].value, 400);
      assert.equal(royalties[1].account, accounts[5]);
      assert.equal(royalties.length, 2);
		})

		it("Check  get royalties  wrong type, LibPart[] empty ", async () => {
		  let encodedMintData = await testing.encode721([1, "uri", [[accounts[1], 0], [accounts[3], 0]], [[accounts[4], 300], [accounts[5], 400]], []]);
		  let royalties = {};
		  royalties = await testing.getRoyaltiesByAssetTest.call(AssetType(id("ERC721_LAZY_WRONG_TYPE"), encodedMintData));

      assert.equal(royalties.length, 0);
		})
	})
});
