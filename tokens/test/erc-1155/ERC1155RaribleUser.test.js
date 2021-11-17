const Testing = artifacts.require("ERC1155Rarible.sol");
const UpgradeableBeacon = artifacts.require("UpgradeableBeacon.sol");
const BeaconProxy = artifacts.require("BeaconProxy.sol");
const ERC1155RaribleUserFactoryC2 = artifacts.require("ERC1155RaribleFactoryC2.sol");
const truffleAssert = require('truffle-assertions');

const { expectThrow } = require("@daonomic/tests-common");
const { sign } = require("./mint");


contract("ERC1155RaribleUser", accounts => {

  let token;
  let beacon;
  let proxy;
  let tokenOwner = accounts[9];
  const zeroWord = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const ZERO = "0x0000000000000000000000000000000000000000";

  const name = 'FreeMintable';
  const whiteListProxy = accounts[5];

  beforeEach(async () => {
    token = await Testing.new();
    await token.__ERC1155RaribleUser_init(name, "TST", "ipfs:/", "ipfs:/", [whiteListProxy], accounts[6], accounts[7], {from: tokenOwner});
  });

  it("approve for all", async () => {
    assert.equal(await token.isApprovedForAll(accounts[1], accounts[6]), true);
    assert.equal(await token.isApprovedForAll(accounts[1], accounts[7]), true);
  });

  it("mint and transfer by minter, token create by Factory", async () => {
    beacon = await UpgradeableBeacon.new(token.address);
    factory = await ERC1155RaribleUserFactoryC2.new(beacon.address, ZERO, ZERO);
    const salt = 3;

    const addressBeforeDeploy = await factory.getAddress(name, "TST", "ipfs:/", "ipfs:/", [], salt)
    const addfressWithDifferentSalt = await factory.getAddress(name, "TST", "ipfs:/", "ipfs:/", [], salt + 1)
    const addressWithDifferentData = await factory.getAddress(name, "TSA", "ipfs:/", "ipfs:/", [], salt)

    assert.notEqual(addressBeforeDeploy, addfressWithDifferentSalt, "different salt = different addresses")
    assert.notEqual(addressBeforeDeploy, addressWithDifferentData, "different data = different addresses")

    const resultCreateToken = await factory.createToken(name, "TST", "ipfs:/", "ipfs:/", [], salt, {from: tokenOwner});
    truffleAssert.eventEmitted(resultCreateToken, 'Create1155RaribleUserProxy', (ev) => {
     	proxy = ev.proxy;
      return true;
    });
    assert.equal(addressBeforeDeploy, proxy, "correct address got before deploy")
    
    let addrToken2;
    const resultCreateToken2 = await factory.createToken(name, "TST", "ipfs:/", "ipfs:/", [], salt + 1, {from: tokenOwner});
    truffleAssert.eventEmitted(resultCreateToken2, 'Create1155RaribleUserProxy', (ev) => {
        addrToken2 = ev.proxy;
      return true;
    });
    assert.equal(addrToken2, addfressWithDifferentSalt, "correct address got before deploy")

    let addrToken3;
    const resultCreateToken3 = await factory.createToken(name, "TSA", "ipfs:/", "ipfs:/", [], salt, {from: tokenOwner});
    truffleAssert.eventEmitted(resultCreateToken3, 'Create1155RaribleUserProxy', (ev) => {
      addrToken3 = ev.proxy;
    return true;
    });
    assert.equal(addrToken3, addressWithDifferentData, "correct address got before deploy")

    let minter = tokenOwner;
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "/uri";
    let supply = 5;
    let mint = 2;

    tokenByProxy = await Testing.at(proxy);

    await tokenByProxy.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, {from: minter});
    
		assert.equal(await tokenByProxy.uri(tokenId), "ipfs:/" + tokenURI);
    assert.equal(await tokenByProxy.balanceOf(transferTo, tokenId), mint);
    assert.equal(await tokenByProxy.balanceOf(minter, tokenId), 0);
  });

  it("check for ERC165 interface", async () => {
  	assert.equal(await token.supportsInterface("0x01ffc9a7"), true);
  });

  it("check for mintAndTransfer interface", async () => {
  	assert.equal(await token.supportsInterface("0x6db15a0f"), true);
  });

  it("check for RoayltiesV2 interface", async () => {
  	assert.equal(await token.supportsInterface("0xcad96cca"), true);
  });

  it("check for ERC1155 interfaces", async () => {
  	assert.equal(await token.supportsInterface("0xd9b67a26"), true);
  	assert.equal(await token.supportsInterface("0x0e89341c"), true);
  });

  it("mint and transfer by proxy. minter is tokenOwner", async () => {
    let minter = tokenOwner;
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "/uri";
    let supply = 5;
    let mint = 2;

    const signature = await getSignature(tokenId, tokenURI, supply, creators([minter]), [], minter);

    await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [signature]], transferTo, mint, {from: whiteListProxy});

		assert.equal(await token.uri(tokenId), "ipfs:/" + tokenURI);
    assert.equal(await token.balanceOf(transferTo, tokenId), mint);
  });

  it("mint and transfer by minter. minter is tokenOwner", async () => {
    let minter = tokenOwner;
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    let supply = 5;
    let mint = 2;

    await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, {from: minter});

    assert.equal(await token.balanceOf(transferTo, tokenId), mint);
  });

  it("mint and transfer by minter. minter is not tokenOwner", async () => {
    let minter = accounts[1];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    let supply = 5;
    let mint = 2;

    await expectThrow(
      token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, {from: minter})
    );
  });

  it("mint and transfer by minter several creators", async () => {
    let minter = tokenOwner;
    const creator2 = accounts[3];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    let supply = 5;
    let mint = 2;

    const signature2 = await getSignature(tokenId, tokenURI, supply, creators([minter, creator2]), [], creator2);

    await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter, creator2]), [], [zeroWord, signature2]], transferTo, mint, {from: minter});

    assert.equal(await token.balanceOf(transferTo, tokenId), mint);
    await checkCreators(tokenId, [minter, creator2]);
  });

  it("mint and transfer to self by minter", async () => {
    let minter = tokenOwner;
    let transferTo = minter;

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    let supply = 5;
    let mint = 2;

    await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, {from: minter});

    assert.equal(await token.balanceOf(transferTo, tokenId), mint);
    await checkCreators(tokenId, [minter]);
  });

  async function getSignature(tokenId, tokenURI, supply, creators, fees, account) {
  	return sign(account, tokenId, tokenURI, supply, creators, fees, token.address);
  }

  async function checkCreators(tokenId, exp) {
    const creators = await token.getCreators(tokenId);
    assert.equal(creators.length, exp.length);
    const value = 10000 / exp.length;
    for(let i = 0; i < creators.length; i++) {
      assert.equal(creators[i][0], exp[i]);
      assert.equal(creators[i][1], value);
    }
  }

  function creators(list) {
  	const value = 10000 / list.length
  	return list.map(account => ({ account, value }))
  }
});