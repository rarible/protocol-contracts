const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const ERC721MetaTx = artifacts.require("ERC721RaribleMeta.sol");
const ERC721UserMetaTx = artifacts.require("ERC721RaribleUserMeta.sol");
const ERC1155MetaTx = artifacts.require("ERC1155RaribleMeta.sol");
const ERC1155UserMetaTx = artifacts.require("ERC1155RaribleUserMeta.sol");

const ERC721NoMetaTx = artifacts.require("ERC721Rarible.sol");
const ERC721UserNoMetaTx = artifacts.require("ERC721RaribleUser.sol");
const ERC1155NoMetaTx = artifacts.require("ERC1155Rarible.sol");
const ERC1155UserNoMetaTx = artifacts.require("ERC1155RaribleUser.sol");

const truffleAssert = require('truffle-assertions');
const { expectThrow } = require("@daonomic/tests-common");

let ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

contract("ERC721MetaTxTest", accounts => {
  let erc721NoMetaTx;
  let erc721UserNoMetaTx;
  let erc1155NoMetaTx;
  let erc1155UserNoMetaTx;

  beforeEach(async () => {
    erc721NoMetaTx = await deployProxy(ERC721NoMetaTx, ["Rarible", "RARI", "ipfs:/", ""], { initializer: '__ERC721Rarible_init' });
    erc721UserNoMetaTx = await deployProxy(ERC721UserNoMetaTx, ["Rarible", "RARI", "ipfs:/", "", []], { initializer: '__ERC721RaribleUser_init' });
    erc1155NoMetaTx = await deployProxy(ERC1155NoMetaTx, ["Rarible", "RARI", "ipfs:/", ""], { initializer: '__ERC1155Rarible_init' });
    erc1155UserNoMetaTx = await deployProxy(ERC1155UserNoMetaTx, ["Rarible", "RARI", "ipfs:/", "", []], { initializer: '__ERC1155RaribleUser_init' });
  });

  it("Upgrade, which use MetaTransaction for ERC721RaribleMeta token works", async () => {
  		const wrapper = await ERC721MetaTx.at(erc721NoMetaTx.address);
  		await expectThrow(
  			wrapper.getNonce(ZERO_ADDRESS)
  		);

  		await upgradeProxy(erc721NoMetaTx.address, ERC721MetaTx);
  		assert.equal(await wrapper.getNonce(ZERO_ADDRESS), 0);
  });

  it("Upgrade, which use MetaTransaction for ERC721RaribleUserMeta token works", async () => {
  		const wrapper = await ERC721UserMetaTx.at(ERC721UserNoMetaTx.address);
  		await expectThrow(
  			wrapper.getNonce(ZERO_ADDRESS)
  		);

  		await upgradeProxy(ERC721UserNoMetaTx.address, ERC721UserMetaTx);
  		assert.equal(await wrapper.getNonce(ZERO_ADDRESS), 0);
  });

  it("Upgrade, which use MetaTransaction for ERC1155RaribleMeta token works", async () => {
  		const wrapper = await ERC1155MetaTx.at(erc1155NoMetaTx.address);
  		await expectThrow(
  			wrapper.getNonce(ZERO_ADDRESS)
  		);

  		await upgradeProxy(erc1155NoMetaTx.address, ERC1155MetaTx);
  		assert.equal(await wrapper.getNonce(ZERO_ADDRESS), 0);
  });

  it("Upgrade, which use MetaTransaction for ERC1155RaribleUserMeta token works", async () => {
  		const wrapper = await ERC1155UserMetaTx.at(erc1155UserNoMetaTx.address);
  		await expectThrow(
  			wrapper.getNonce(ZERO_ADDRESS)
  		);

  		await upgradeProxy(erc1155UserNoMetaTx.address, ERC1155UserMetaTx);
  		assert.equal(await wrapper.getNonce(ZERO_ADDRESS), 0);
  });
});