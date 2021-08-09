const Testing = artifacts.require("ERC1155Rarible.sol");
const ERC1271 = artifacts.require("TestERC1271.sol");
const UpgradeableBeacon = artifacts.require("UpgradeableBeacon.sol");
const BeaconProxy = artifacts.require("BeaconProxy.sol");
const ERC1155Factory = artifacts.require("ERC1155RaribleFactory.sol");
const truffleAssert = require('truffle-assertions');

const { expectThrow } = require("@daonomic/tests-common");
const { sign } = require("./mint");

contract("ERC1155Rarible", accounts => {

  let token;
  let tokenOwner = accounts[9];
  let erc1271;
  let beacon;
  let proxy;
  const zeroWord = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const name = 'FreeMintable';

  beforeEach(async () => {
    token = await Testing.new();
    await token.__ERC1155Rarible_init(name, "TST", "ipfs:/", "ipfs:/", {from: tokenOwner});
    erc1271 = await ERC1271.new();
  });

  it("mint and transfer by minter, token create by Factory", async () => {
    beacon = await UpgradeableBeacon.new(token.address);
    factory = await ERC1155Factory.new(beacon.address);
    resultCreateToken = await factory.createToken(name, "TST", "ipfs:/", "ipfs:/", {from: tokenOwner});
    truffleAssert.eventEmitted(resultCreateToken, 'Create1155RaribleProxy', (ev) => {
     	proxy = ev.proxy;
      return true;
    });
    tokenByProxy = await Testing.at(proxy);

    let minter = tokenOwner;
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "/uri";
    let supply = 5;
    let mint = 2;

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

  it("approve for all", async () => {
    let proxy = accounts[5];
    assert.equal(await token.isApprovedForAll(accounts[1], proxy), false);

    await token.setDefaultApproval(proxy, true, {from: tokenOwner});
    assert.equal(await token.isApprovedForAll(accounts[1], proxy), true);

    await token.setDefaultApproval(proxy, false, {from: tokenOwner});
    assert.equal(await token.isApprovedForAll(accounts[1], proxy), false);
  });

  it("mint and transfer by proxy", async () => {
    let minter = accounts[1];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    let supply = 5;
    let mint = 2;

    const signature = await getSignature(tokenId, tokenURI, supply, creators([minter]), [], minter);

    let whiteListProxy = accounts[5];
    await token.setDefaultApproval(whiteListProxy, true, {from: tokenOwner});
    await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [signature]], transferTo, mint, {from: whiteListProxy});

    assert.equal(await token.balanceOf(transferTo, tokenId), mint);
  });

  it("mint and transfer by minter", async () => {
    let minter = accounts[1];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "/uri";
    let supply = 5;
    let mint = 2;

    await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, {from: minter});

		assert.equal(await token.uri(tokenId), "ipfs:/" + tokenURI);
    assert.equal(await token.balanceOf(transferTo, tokenId), mint);
    assert.equal(await token.balanceOf(minter, tokenId), 0);
  });

  it("mint and transfer by minter several creators", async () => {
    let minter = accounts[1];
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
    let minter = accounts[1];
    let transferTo = minter;

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    let supply = 5;
    let mint = 2;

    await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, {from: minter});

    assert.equal(await token.balanceOf(transferTo, tokenId), mint);
    await checkCreators(tokenId, [minter]);
  });

  it("transferFromOrMint by minter", async () => {
    let minter = accounts[1];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    let supply = 5;
    let mint = 2;

		assert.equal(await token.balanceOf(minter, tokenId), 0);
    await token.transferFromOrMint([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], minter, transferTo, mint, {from: minter});
    assert.equal(await token.balanceOf(transferTo, tokenId), mint);
    assert.equal(await token.balanceOf(minter, tokenId), 0);
    await token.transferFromOrMint([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], minter, transferTo, mint, {from: minter});
    await expectThrow(
    	token.transferFromOrMint([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], minter, transferTo, mint, {from: minter})
    )

    assert.equal(await token.balanceOf(transferTo, tokenId), mint * 2);
    await checkCreators(tokenId, [minter]);

    await expectThrow(
    	token.transferFromOrMint([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, minter, 1, { from: minter })
    )

    await token.transferFromOrMint([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, minter, 1, { from: transferTo })
    assert.equal(await token.balanceOf(minter, tokenId), 1);
  });

  it("mint and transfer by approved proxy for all by minter", async () => {
    let minter = accounts[1];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    let supply = 5;
    let mint = 2;

    const signature = await getSignature(tokenId, tokenURI, supply, creators([minter]), [], minter);

    let proxy = accounts[5];
    await token.setApprovalForAll(proxy, true, {from: minter});
    await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [signature]], transferTo, mint, {from: proxy});

    assert.equal(await token.balanceOf(transferTo, tokenId), mint);
  });

  it("second mint and transfer", async () => {
    let whiteListProxy = accounts[5];
    await token.setDefaultApproval(whiteListProxy, true, {from: tokenOwner});
    let minter = accounts[1];
    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    let supply = 5;

    let transferTo = accounts[2];
    let mint = 2;

    const signature = await getSignature(tokenId, tokenURI, supply, creators([minter]), [], minter);
    await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [signature]], transferTo, mint, {from: whiteListProxy});
    assert.equal(await token.balanceOf(transferTo, tokenId), mint);

    //не нужна подпись, uri, fees не проверяется
    let transferTo2 = accounts[3];
    let mint2 = 3;
    await token.mintAndTransfer([tokenId, "any, idle", supply, creators([minter]), [], [zeroWord]], transferTo2, mint2, {from: whiteListProxy});
    assert.equal(await token.balanceOf(transferTo2, tokenId), mint2);
  });

  it("second mint and transfer for the same person", async () => {
    let whiteListProxy = accounts[5];
    await token.setDefaultApproval(whiteListProxy, true, {from: tokenOwner});
    let minter = accounts[1];
    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    let supply = 5;

    let transferTo = accounts[2];
    let mint = 1;

    const signature = await getSignature(tokenId, tokenURI, supply, creators([minter]), [], minter);
    await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [signature]], transferTo, mint, {from: whiteListProxy});
    assert.equal(await token.balanceOf(transferTo, tokenId), mint);

    //не нужна подпись, uri не проверяется
    let mint2 = 2;
    await token.mintAndTransfer([tokenId, "any, idle", supply, creators([minter]), [], [zeroWord]], transferTo, mint2, {from: whiteListProxy});
    assert.equal(await token.balanceOf(transferTo, tokenId), 3);
  });

  it("second mint and transfer: wrong supply", async () => {
    let whiteListProxy = accounts[5];
    await token.setDefaultApproval(whiteListProxy, true, {from: tokenOwner});
    let minter = accounts[1];
    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    let supply = 5;

    let transferTo = accounts[2];
    let mint = 2;

    const signature = await getSignature(tokenId, tokenURI, supply, creators([minter]), [], minter);
    await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [signature]], transferTo, mint, {from: whiteListProxy});
    assert.equal(await token.balanceOf(transferTo, tokenId), mint);

    //не нужна подпись, uri не проверяется
    let transferTo2 = accounts[3];
    await expectThrow(
      token.mintAndTransfer([tokenId, "any, idle", 10, creators([minter]), [], [zeroWord]], transferTo2, 4, {from: whiteListProxy})
    );
    await token.mintAndTransfer([tokenId, "any, idle", 10, creators([minter]), [], [zeroWord]], transferTo2, 3, {from: whiteListProxy});
  });

  it("second mint and transfer: more than supply", async () => {
    let whiteListProxy = accounts[5];
    await token.setDefaultApproval(whiteListProxy, true, {from: tokenOwner});
    let minter = accounts[1];
    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    let supply = 5;

    let transferTo = accounts[2];
    let mint = 2;

    const signature = await getSignature(tokenId, tokenURI, supply, creators([minter]), [], minter);
    await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [signature]], transferTo, mint, {from: whiteListProxy});
    assert.equal(await token.balanceOf(transferTo, tokenId), mint);

    //не нужна подпись, uri не проверяется
    let transferTo2 = accounts[3];
    let mint2 = 4;
    await expectThrow(
      token.mintAndTransfer([tokenId, "any, idle", supply, creators([minter]), [], [zeroWord]], transferTo2, mint2, {from: whiteListProxy})
    );
  });

  it("mint and transfer with signature of not minter", async () => {
    let minter = accounts[1];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    let supply = 5;
    let mint = 2;

    const signature = await getSignature(tokenId, tokenURI, supply, creators([minter]), [], transferTo);

    let whiteListProxy = accounts[5];
    await token.setDefaultApproval(whiteListProxy, true, {from: tokenOwner});

    await expectThrow(
      token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [signature]], transferTo, mint, {from: whiteListProxy})
    );
  });

  it("mint and transfer without approval", async () => {
    let minter = accounts[1];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    let supply = 5;
    let mint = 2;

    const signature = await getSignature(tokenId, tokenURI, supply, creators([minter]), [], minter);

    await expectThrow(
      token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [signature]], transferTo, mint, {from: accounts[3]})
    );
  });

  it("standard transfer from owner", async () => {
    let minter = accounts[1];
    const tokenId = minter + "b00000000000000000000001";
    let supply = 5;
    await token.mintAndTransfer([tokenId, "//uri", supply, creators([minter]), [],  [zeroWord]], minter, supply, {from: minter});

    assert.equal(await token.balanceOf(minter, tokenId), supply);

    let transferTo = accounts[2];
    await token.safeTransferFrom(minter, transferTo, tokenId, supply, [], {from: minter});

    assert.equal(await token.balanceOf(transferTo, tokenId), supply);
  });

  it("standard transfer by approved contract", async () => {
    let minter = accounts[1];
    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    let supply = 5;
    await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], minter, supply, {from: minter});

    assert.equal(await token.balanceOf(minter, tokenId), supply);

    let transferTo = accounts[2];
    let whiteListProxy = accounts[5];
    await token.setDefaultApproval(whiteListProxy, true, {from: tokenOwner});
    await token.safeTransferFrom(minter, transferTo, tokenId, supply, [], {from: whiteListProxy});

    assert.equal(await token.balanceOf(transferTo, tokenId), supply);
  });

  it("standard transfer by not approved contract", async () => {
    let minter = accounts[1];
    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    let supply = 5;
    await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], minter, supply, {from: minter});

    assert.equal(await token.balanceOf(minter, tokenId), supply);

    let transferTo = accounts[2];
    await expectThrow(
      token.safeTransferFrom(minter, transferTo, tokenId, supply, [], {from: accounts[5]})
    );
  });

  it("signature by contract wallet erc1271, with whitelist proxy", async () => {
    const minter = erc1271;
    let transferTo = accounts[2];

    const tokenId = minter.address + "b00000000000000000000001";
    const tokenURI = "//uri";
    let supply = 5;
    let mint = 2;

    let whiteListProxy = accounts[5];
    await token.setDefaultApproval(whiteListProxy, true, {from: tokenOwner});
    await expectThrow(
      token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter.address]), [], [zeroWord]], transferTo, supply, {from: whiteListProxy})
    );

    await erc1271.setReturnSuccessfulValidSignature(true);
    await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter.address]), [], [zeroWord]], transferTo, mint, {from: whiteListProxy});
    assert.equal(await token.balanceOf(transferTo, tokenId), mint);
  });

  function getSignature(tokenId, tokenURI, supply, creators, fees, account) {
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