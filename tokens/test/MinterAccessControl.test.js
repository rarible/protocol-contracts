const TestingV1 = artifacts.require("MinterAccessControlTestV1.sol");
const TestingV2 = artifacts.require("MinterAccessControlTestV2.sol");

const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const truffleAssert = require('truffle-assertions');

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

    let addedMinter;
    let status;
    const receipt = await token.addMinter(minter, {from: tokenOwner})
    truffleAssert.eventEmitted(receipt, 'MinterStatusChanged', (ev) => {
      status = ev.status;
      addedMinter = ev.minter;
      return true;
    });
    
    assert.equal(status, true);
    assert.equal(addedMinter, minter);
    assert.equal(await token.isMinter(minter), true);
  })

  it("should add a list of minters and emit events", async () => {
    const minter = accounts[2];
    const minter2 = accounts[3];

    await token.addMinters([minter, minter2], {from: tokenOwner})

    assert.equal(await token.isMinter(minter), true);
    assert.equal(await token.isMinter(minter2), true);
  })

  it("should remove a minter and emit event", async () => {
    const minter = accounts[2];

    await token.addMinter(minter, {from: tokenOwner})
    assert.equal(await token.isMinter(minter), true);

    let removedMinter;
    let status;
    const receipt = await token.removeMinter(minter, {from: tokenOwner})
    truffleAssert.eventEmitted(receipt, 'MinterStatusChanged', (ev) => {
      status = ev.status;
      removedMinter = ev.minter;
      return true;
    });
    
    assert.equal(status, false);
    assert.equal(removedMinter, minter);
    assert.equal(await token.isMinter(minter), false);
  })
});