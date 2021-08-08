const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const ERC721MetaTx = artifacts.require("ERC721RaribleMeta.sol");
const ERC721NoMetaTx = artifacts.require("ERC721Rarible.sol");
const truffleAssert = require('truffle-assertions');
const { expectThrow } = require("@daonomic/tests-common");

let ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

contract("ERC721MetaTxTest", accounts => {

  beforeEach(async () => {
    erc721NoMetaTx = await deployProxy(ERC721NoMetaTx, ["Rarible", "RARI", "ipfs:/", ""], { initializer: '__ERC721Rarible_init' });
  });

  it("Upgrade, which use MetaTransaction for ERC721Rarible token works", async () => {
  		const wrapper = await ERC721MetaTx.at(erc721NoMetaTx.address);
  		await expectThrow(
  			wrapper.getNonce(ZERO_ADDRESS)
  		);

  		await upgradeProxy(erc721NoMetaTx.address, ERC721MetaTx);
  		assert.equal(await wrapper.getNonce(ZERO_ADDRESS), 0);
  });

});