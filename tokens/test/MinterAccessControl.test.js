const TestingV1 = artifacts.require("MinterAccessControlTestV1.sol");
const TestingV2 = artifacts.require("MinterAccessControlTestV2.sol");

const { expectThrow } = require('@daonomic/tests-common');
const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const truffleAssert = require('truffle-assertions');

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

    await token.addMinter(minter, {from: tokenOwner})
    assert.equal(await token.isMinter(minter), true);
    
    // upgrade contract
    const newInstance = await upgradeProxy(token.address, TestingV2);
    assert.equal(await newInstance.version(), await newInstance.V2());

    assert.equal(await newInstance.isMinter(minter), true);
  });

  it("should add a minter and emit event", async () => {
    const minter = accounts[2];

    let operator;
    let addedMinter;
    const receipt = await token.addMinter(minter, {from: tokenOwner})
    truffleAssert.eventEmitted(receipt, 'MinterAdded', (ev) => {
      operator = ev.operator;
      addedMinter = ev.minter;
      return true;
    });
    
    assert.equal(operator, tokenOwner);
    assert.equal(addedMinter, minter);
    assert.equal(await token.isMinter(minter), true);
  })

  it("should remove a minter and emit event", async () => {
    const minter = accounts[2];

    await token.addMinter(minter, {from: tokenOwner})
    assert.equal(await token.isMinter(minter), true);

    let operator;
    let removedMinter;
    const receipt = await token.removeMinter(minter, {from: tokenOwner})
    truffleAssert.eventEmitted(receipt, 'MinterRemoved', (ev) => {
      operator = ev.operator;
      removedMinter = ev.minter;
      return true;
    });
    
    assert.equal(operator, tokenOwner);
    assert.equal(removedMinter, minter);
    assert.equal(await token.isMinter(minter), false);
  })
});