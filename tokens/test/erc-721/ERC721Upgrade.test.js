const UpgradeableBeacon = artifacts.require("UpgradeableBeacon.sol");
const BeaconProxy = artifacts.require("BeaconProxy.sol");
const Impl = artifacts.require("ERC721RaribleUser.sol");
const ERC721Factory = artifacts.require("ERC721Factory.sol");
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

		factory = await ERC721Factory.new(beacon.address, beacon.address);

		resultCreateToken = await factory.createToken("name", "RARI", "https://ipfs.rarible.com", "https://ipfs.rarible.com", []);
//todo удалить коментарий. но пока евент не прихоит,
//		truffleAssert.eventEmitted(resultCreateToken, 'CreateERC721RaribleUser', (ev) => {
//     	tokenOwnerTmp = ev.owner;
//      return true;
//    });
//todo код ниже удалить тут я эмитил proxy сам
    truffleAssert.eventEmitted(resultCreateToken, 'CreateProxy', (ev) => {
     	token = ev.proxy;
      return true;
    });
//todo код ниже удалить пока как пример
//		token = await Impl.at(proxy);
//		await token.__ERC721RaribleUser_init("name", "RARI", "https://ipfs.rarible.com", "https://ipfs.rarible.com", [], { from: tokenOwner });
	})

	it("should work through beacon proxy", async () => {
    const minter = tokenOwner;
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";

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