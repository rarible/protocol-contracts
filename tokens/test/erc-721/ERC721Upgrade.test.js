const UpgradeableBeacon = artifacts.require("UpgradeableBeacon.sol");
const BeaconProxy = artifacts.require("BeaconProxy.sol");
const Impl = artifacts.require("ERC721RaribleUser.sol");
const ERC721Factory = artifacts.require("ERC721RaribleUserFactory.sol");
const truffleAssert = require('truffle-assertions');

const zeroWord = "0x0000000000000000000000000000000000000000000000000000000000000000";
const zeroAddress = "0x0000000000000000000000000000000000000000";

contract("ERC721RaribleUser - upgrade", accounts => {
	let beacon;
	let impl;
	let proxy;
	let token;
	let factory;
	const tokenOwner = accounts[1];
	let tokenOwnerTmp;

	beforeEach(async () => {
		impl = await Impl.new();
		beacon = await UpgradeableBeacon.new(impl.address);
		factory = await ERC721Factory.new(beacon.address);
		resultCreateToken = await factory.createToken("name", "RARI", "https://ipfs.rarible.com", "https://ipfs.rarible.com", [], {from: tokenOwner});
    truffleAssert.eventEmitted(resultCreateToken, 'CreateProxy', (ev) => {
     	proxy = ev.proxy;
      return true;
    });
		token = await Impl.at(proxy);
	})

	it("should work through beacon proxy", async () => {
    const minter = tokenOwner;
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    console.log("Before call _mintAndTransfer");
    const tx = await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], transferTo, {from: minter});

		console.log("mint through proxy", tx.receipt.gasUsed);
    assert.equal(await token.ownerOf(tokenId), transferTo);

    const txTransfer = await token.safeTransferFrom(transferTo, minter, tokenId, { from: transferTo });
    console.log("transfer through proxy", txTransfer.receipt.gasUsed);
	})

  function creators(list) {
  	const value = 10000 / list.length
  	return list.map(account => ({ account, value }))
  }

});