const Testing = artifacts.require("ERC721RaribleMinimal.sol");

const { expectThrow } = require('@daonomic/tests-common');
const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');

function creators(list) {
  const value = 10000 / list.length
  return list.map(account => ({ account, value }))
}

contract("MinterAccessControl721", accounts => {
  let token;
  let tokenOwner = accounts[9];
  const name = 'FreeMintableRarible';
  const chainId = 1;
  const zeroWord = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const ZERO = "0x0000000000000000000000000000000000000000";

  beforeEach(async () => {
    token = await deployProxy(Testing, [name, "RARI", "https://ipfs.rarible.com", "https://ipfs.rarible.com"], { initializer: "__ERC721Rarible_init" });
    await token.transferOwnership(tokenOwner);
  });

  it("conserve minter access control after upgrade", async () => {
    const minter = accounts[1];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";

    await token.enableMinterAccessControl({from: tokenOwner});
    assert.equal(await token.minterAccessControlEnabled(), true);

    await expectThrow(
      token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], transferTo, {from: minter})
    );

    // upgrade contract
    const newInstance = await upgradeProxy(token.address, Testing);
    assert.equal(await newInstance.minterAccessControlEnabled(), true);

    await expectThrow(
      newInstance.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], transferTo, {from: minter})
    );

    await newInstance.grantMinter(minter, {from: tokenOwner})
    assert.equal(await newInstance.isValidMinter(minter), true);
    assert.equal(await newInstance.isValidMinter(transferTo), false);

    await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], transferTo, {from: minter})
    assert.equal(await token.ownerOf(tokenId), transferTo);
  });
});