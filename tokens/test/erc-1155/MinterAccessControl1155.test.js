const Testing = artifacts.require("ERC1155Rarible.sol");

const { expectThrow } = require('@daonomic/tests-common');
const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');

function creators(list) {
  const value = 10000 / list.length
  return list.map(account => ({ account, value }))
}

contract("MinterAccessControl1155", accounts => {
  let token;
  let tokenOwner = accounts[9];
  const zeroWord = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const name = 'FreeMintable';
  const ZERO = "0x0000000000000000000000000000000000000000";

  beforeEach(async () => {
    token = await deployProxy(Testing, [name, "TST", "ipfs:/", "ipfs:/"], { initializer: "__ERC1155Rarible_init" });
    await token.transferOwnership(tokenOwner);
  });

  it("conserve minter access control after upgrade", async () => {
    const minter = accounts[1];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    let supply = 5;
    let mint = 2;


    console.log(`owner: ${await token.owner()}, expected: ${tokenOwner}`);

    await token.enableMinterAccessControl({from: tokenOwner});
    assert.equal(await token.minterAccessControlEnabled(), true);

    await expectThrow(
      token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, {from: minter})
    );

    // upgrade contract
    const newInstance = await upgradeProxy(token.address, Testing);
    assert.equal(await newInstance.minterAccessControlEnabled(), true);

    await expectThrow(
      newInstance.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, {from: minter})
    );

    await newInstance.grantMinter(minter, {from: tokenOwner});
    assert.equal(await newInstance.isValidMinter(minter), true);
    assert.equal(await newInstance.isValidMinter(transferTo), false);

    await newInstance.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, {from: minter});
		assert.equal(await newInstance.uri(tokenId), "ipfs:/" + tokenURI);
    assert.equal(await newInstance.balanceOf(transferTo, tokenId), mint);
    assert.equal(await newInstance.balanceOf(minter, tokenId), 0);
  });
});