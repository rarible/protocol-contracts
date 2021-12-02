const TestingV1 = artifacts.require("MinterAccessControlTestV1.sol");
const TestingV2 = artifacts.require("MinterAccessControlTestV2.sol");

const { expectThrow } = require('@daonomic/tests-common');
const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');

function creators(list) {
  const value = 10000 / list.length
  return list.map(account => ({ account, value }))
}

contract("MinterAccessControl", accounts => {
  let token;
  let tokenOwner = accounts[9];

  beforeEach(async () => {
    token = await deployProxy(TestingV1, [], { initializer: 'initialize' });
    await token.transferOwnership(tokenOwner);
  });

  it("conserve minter access control after upgrade", async () => {
    const minter = accounts[1];

    await token.grantMinter(minter, {from: tokenOwner})
    assert.equal(await token.isValidMinter(minter), true);
    
    // upgrade contract
    const newInstance = await upgradeProxy(token.address, TestingV2);
    assert.equal(await newInstance.version(), 2);

    assert.equal(await newInstance.isValidMinter(minter), true);
  });
});