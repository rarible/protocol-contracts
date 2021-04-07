const UpgradeableBeacon = artifacts.require("UpgradeableBeacon.sol");
const BeaconProxy = artifacts.require("BeaconProxy.sol");
const Impl = artifacts.require("ERC721RaribleUser");

const zeroWord = "0x0000000000000000000000000000000000000000000000000000000000000000";

contract("ERC721RaribleUser - upgrade", accounts => {
	let beacon;
	let impl;
	let proxy;
	let token;
	const tokenOwner = accounts[1];

	beforeEach(async () => {
		impl = await Impl.new();
		beacon = await UpgradeableBeacon.new(impl.address);
		proxy = await BeaconProxy.new(beacon.address, "0x");
		token = await Impl.at(proxy.address);
		await token.__ERC721RaribleUser_init("name", "RARI", "https://ipfs.rarible.com", "https://ipfs.rarible.com", { from: tokenOwner });
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