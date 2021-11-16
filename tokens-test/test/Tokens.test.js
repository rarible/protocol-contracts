const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const TestERC721 = artifacts.require("TestERC721.sol");

const { expectThrow } = require("@daonomic/tests-common");

contract("Tokens test", accounts => {
  let erc721;
  let erc1155;
  let erc721TokenId = 52;
  let url = "https://ipfs.rarible.com";

  beforeEach(async () => {
    /*ERC721 */
    erc721 = await TestERC721.new("Rarible", "RARI");
  });

  describe("Check transfer, burn, transfer", () => {

    it("Mint and transfer after burn ERC721, it`s bad, but possible please use ERC721Rarible, ERC721RaribleMinimal for careful burn", async () => {
      let owner = accounts[1];
      let to = accounts[2];
      let newTo = accounts[4];
      let approvePerson = accounts[3];
      await erc721.mint(owner, erc721TokenId, url);
      await erc721.setApprovalForAll(approvePerson, true, { from: owner });
      await erc721.transferFrom(owner, to, erc721TokenId, { from: approvePerson });

      assert.equal(await erc721.ownerOf(erc721TokenId), to);
      assert.equal(await erc721.balanceOf(to), 1);

      await erc721.burn(erc721TokenId, { from: to });
      await expectThrow(
        erc721.ownerOf(erc721TokenId)
      );
      await erc721.mint(owner, erc721TokenId, url);
      await erc721.setApprovalForAll(approvePerson, true, { from: owner });
      await erc721.transferFrom(owner, newTo, erc721TokenId, { from: approvePerson });
      await erc721.burn(erc721TokenId, { from: to });
    })

  })
});
