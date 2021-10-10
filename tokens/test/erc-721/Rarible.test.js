const Testing = artifacts.require("ERC721RaribleMinimal.sol");
const ERC1271 = artifacts.require("TestERC1271.sol");
const UpgradeableBeacon = artifacts.require("UpgradeableBeacon.sol");
const BeaconProxy = artifacts.require("BeaconProxy.sol");
const ERC721Factory = artifacts.require("ERC721RaribleFactoryMinimal.sol");
const truffleAssert = require('truffle-assertions');

const { sign } = require("./mint");
const { expectThrow } = require("@daonomic/tests-common");

contract("ERC721Rarible", accounts => {

  let token;
  let tokenOwner = accounts[9];
  let erc1271;
  let beacon;
  let proxy;
  const name = 'FreeMintableRarible';
  const chainId = 1;
  const zeroWord = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const ZERO = "0x0000000000000000000000000000000000000000";

  function creators(list) {
  	const value = 10000 / list.length
  	return list.map(account => ({ account, value }))
  }

  beforeEach(async () => {
    token = await Testing.new();
    await token.__ERC721Rarible_init(name, "RARI", "https://ipfs.rarible.com", "https://ipfs.rarible.com");
    await token.transferOwnership(tokenOwner);
    erc1271 = await ERC1271.new();
  });

 it("mint and transfer by minter, and token created by ERC721Factory ", async () => {
    beacon = await UpgradeableBeacon.new(token.address);
    factory = await ERC721Factory.new(beacon.address, ZERO, ZERO);
    resultCreateToken = await factory.createToken("name", "RARI", "https://ipfs.rarible.com", "https://ipfs.rarible.com", {from: tokenOwner});
    truffleAssert.eventEmitted(resultCreateToken, 'Create721RaribleProxy', (ev) => {
     	proxy = ev.proxy;
      return true;
    });
    tokenByProxy = await Testing.at(proxy);

    const minter = tokenOwner;
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";

    await tokenByProxy.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], transferTo, {from: minter});

    assert.equal(await tokenByProxy.ownerOf(tokenId), transferTo);
  });

  it("check for ERC165 interface", async () => {
  	assert.equal(await token.supportsInterface("0x01ffc9a7"), true);
  });

  it("check for mintAndTransfer interface", async () => {
  	assert.equal(await token.supportsInterface("0x8486f69f"), true);
  });

  it("check for RoayltiesV2 interface", async () => {
  	assert.equal(await token.supportsInterface("0xcad96cca"), true);
  });

  it("check for ERC721 interfaces", async () => {
  	assert.equal(await token.supportsInterface("0x80ac58cd"), true);
  	assert.equal(await token.supportsInterface("0x5b5e139f"), true);
  	assert.equal(await token.supportsInterface("0x780e9d63"), true);
  });

  it("approve for all", async () => {
    let proxy = accounts[5];
    assert.equal(await token.isApprovedForAll(accounts[1], proxy), false);

    await token.setDefaultApproval(proxy, true, {from: tokenOwner});
    assert.equal(await token.isApprovedForAll(accounts[1], proxy), true);

    await token.setDefaultApproval(proxy, false, {from: tokenOwner});
    assert.equal(await token.isApprovedForAll(accounts[1], proxy), false);
  });

  it("set approval not by owner", async () => {
    await expectThrow(
      token.setDefaultApproval(accounts[5], true, {from: accounts[2]})
    );
  });

  it("mint and transfer by whitelist proxy", async () => {
    const minter = accounts[1];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    let fees = [];

    const signature = await getSignature(tokenId, tokenURI, creators([minter]), fees, minter);

    let whiteListProxy = accounts[5];
    await token.setDefaultApproval(whiteListProxy, true, {from: tokenOwner});
    await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), fees, [signature]], transferTo, {from: whiteListProxy});

    assert.equal(await token.ownerOf(tokenId), transferTo);
    await checkCreators(tokenId, [minter]);
    // assert.equal(await token.getCreators(tokenId), [minter]);
  });

  it("mint and transfer by whitelist proxy. several creators", async () => {
    const minter = accounts[1];
    const creator2 = accounts[3];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    let fees = [];

    const signature1 = await getSignature(tokenId, tokenURI, creators([minter, creator2]), fees, minter);
    const signature2 = await getSignature(tokenId, tokenURI, creators([minter, creator2]), fees, creator2);

    let whiteListProxy = accounts[5];
    await token.setDefaultApproval(whiteListProxy, true, {from: tokenOwner});
    await token.mintAndTransfer([tokenId, tokenURI, creators([minter, creator2]), fees, [signature1, signature2]], transferTo, {from: whiteListProxy});

    assert.equal(await token.ownerOf(tokenId), transferTo);
    await checkCreators(tokenId, [minter, creator2]);
  });

  it("mint and transfer by whitelist proxy. several creators. minter is not first", async () => {
    const minter = accounts[1];
    const creator2 = accounts[3];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    let fees = [];

    const signature1 = await getSignature(tokenId, tokenURI, creators([creator2, minter]), fees, minter);
    const signature2 = await getSignature(tokenId, tokenURI, creators([creator2, minter]), fees, creator2);

    let whiteListProxy = accounts[5];
    await token.setDefaultApproval(whiteListProxy, true, {from: tokenOwner});
    await expectThrow(
      token.mintAndTransfer([tokenId, tokenURI, creators([creator2, minter]), fees, [signature2, signature1]], transferTo, {from: whiteListProxy})
    );
  });

  it("mint and transfer by whitelist proxy. several creators. wrong order of signatures", async () => {
    const minter = accounts[1];
    const creator2 = accounts[3];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    let fees = [];

    const signature1 = await getSignature(tokenId, tokenURI, creators([minter, creator2]), fees, minter);
    const signature2 = await getSignature(tokenId, tokenURI, creators([minter, creator2]), fees, creator2);

    let whiteListProxy = accounts[5];
    await token.setDefaultApproval(whiteListProxy, true, {from: tokenOwner});
    await expectThrow(
      token.mintAndTransfer([tokenId, tokenURI, creators([minter, creator2]), fees, [signature2, signature1]], transferTo, {from: whiteListProxy})
    );
  });

  it("mint and transfer by approved proxy for all", async () => {
    const minter = accounts[1];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";

    const signature = await getSignature(tokenId, tokenURI, creators([minter]), [], minter);

    let proxy = accounts[5];
    await token.setApprovalForAll(proxy, true, {from: minter});
    await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [signature]], transferTo, {from: proxy});

    assert.equal(await token.ownerOf(tokenId), transferTo);
  });

  it("mint and transfer by approved proxy for tokenId", async () => {
    const minter = accounts[1];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";

    const signature = await getSignature(tokenId, tokenURI, creators([minter]), [], minter);

    let proxy = accounts[5];

    //нельзя дать approval для tokenId, который еще не создали. owner query for nonexistent token.
    await expectThrow(
      token.approve(proxy, tokenId, {from: minter})
    );
    //todo ничего не проверяет?
    // await token.mintAndTransfer(tokenId, [], tokenURI, [minter], [signature], transferTo, {from: proxy});
    // assert.equal(await token.ownerOf(tokenId), transferTo);
  });

  it("mint and transfer by minter", async () => {
    const minter = accounts[1];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";

    await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], transferTo, {from: minter});

    assert.equal(await token.ownerOf(tokenId), transferTo);
  });

  it("transferFromOrMint from minter. not yet minted", async () => {
    const minter = accounts[1];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";

    await token.transferFromOrMint([tokenId, tokenURI, creators([minter]), [], [zeroWord]], minter, transferTo, {from: minter});

    assert.equal(await token.ownerOf(tokenId), transferTo);
  });

  it("transferFromOrMint from minter. already minted", async () => {
    const minter = accounts[1];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";

		await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], minter, {from: minter});
    await token.transferFromOrMint([tokenId, tokenURI, creators([minter]), [], [zeroWord]], minter, transferTo, {from: minter});
    await expectThrow(
    	token.transferFromOrMint([tokenId, tokenURI, creators([minter]), [], [zeroWord]], minter, transferTo, {from: minter})
    )

    assert.equal(await token.ownerOf(tokenId), transferTo);
  });

  it("transferFromOrMint when not minter. not yet minted", async () => {
    const minter = accounts[1];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";

		await expectThrow(
			token.transferFromOrMint([tokenId, tokenURI, creators([minter]), [], [zeroWord]], minter, transferTo, {from: transferTo})
		);
    await token.transferFromOrMint([tokenId, tokenURI, creators([minter]), [], [zeroWord]], minter, transferTo, {from: minter});
    await token.transferFromOrMint([tokenId, tokenURI, creators([minter]), [], [zeroWord]], transferTo, accounts[5], {from: transferTo});

    assert.equal(await token.ownerOf(tokenId), accounts[5]);
  });

  it("mint and transfer to self by minter", async () => {
    const minter = accounts[1];
    let transferTo = minter;

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";

    await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], transferTo, {from: minter});

    assert.equal(await token.ownerOf(tokenId), transferTo);
  });

  it("mint and transfer with signature of not minter", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";

    const signature = await getSignature(tokenId, tokenURI, creators([minter]), [], transferTo);

    let whiteListProxy = accounts[5];
    await token.setDefaultApproval(whiteListProxy, true, {from: tokenOwner});

    await expectThrow(
      token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [signature]], transferTo, {from: whiteListProxy})
    );
  });

  it("mint and transfer without approval", async () => {
    const minter = accounts[1];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";

    const signature = await getSignature(tokenId, tokenURI, creators([minter]), [], minter);

    await expectThrow(
      token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [signature]], transferTo, {from: accounts[3]})
    );
  });

  it("standard transfer from owner", async () => {
    let minter = accounts[1];
    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], minter, {from: minter});

    assert.equal(await token.ownerOf(tokenId), minter);

    let transferTo = accounts[2];
    await token.transferFrom(minter, transferTo, tokenId, {from: minter});

    assert.equal(await token.ownerOf(tokenId), transferTo);
  });

  it("standard transfer by approved contract", async () => {
    let minter = accounts[1];
    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], minter, {from: minter});

    assert.equal(await token.ownerOf(tokenId), minter);

    let transferTo = accounts[2];
    let whiteListProxy = accounts[5];
    await token.setDefaultApproval(whiteListProxy, true, {from: tokenOwner});
    await token.transferFrom(minter, transferTo, tokenId, {from: whiteListProxy});

    assert.equal(await token.ownerOf(tokenId), transferTo);
  });

  it("standard transfer by not approved contract", async () => {
    let minter = accounts[1];
    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], minter, {from: minter});

    assert.equal(await token.ownerOf(tokenId), minter);

    let transferTo = accounts[2];
    await expectThrow(
      token.transferFrom(minter, transferTo, tokenId, {from: accounts[5]})
    );
  });

  it("signature by contract wallet erc1271, with whitelist proxy", async () => {
    const minter = erc1271;
    let transferTo = accounts[2];

    const tokenId = minter.address + "b00000000000000000000001";
    const tokenURI = "//uri";

    let whiteListProxy = accounts[5];
    await token.setDefaultApproval(whiteListProxy, true, { from: tokenOwner });
    await expectThrow(
      token.mintAndTransfer([tokenId, tokenURI, creators([minter.address]), [], [zeroWord]], transferTo, {from: whiteListProxy})
    );

    await erc1271.setReturnSuccessfulValidSignature(true);
    await token.mintAndTransfer([tokenId, tokenURI, creators([minter.address]), [], [zeroWord]], transferTo, {from: whiteListProxy});
    assert.equal(await token.ownerOf(tokenId), transferTo);
  });

  function getSignature(tokenId, tokenURI, creators, fees, account) {
		return sign(account, tokenId, tokenURI, creators, fees, token.address);
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
});