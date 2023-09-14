const UpgradeableBeacon = artifacts.require("UpgradeableBeacon.sol");
const ERC721MinimalRaribleTest = artifacts.require("ERC721MinimalRaribleTest.sol");
const ERC721RaribleFactoryC2 = artifacts.require("ERC721RaribleFactoryC2.sol");
const OperatorFilterRegistryTest = artifacts.require("OperatorFilterRegistryTest.sol");

const truffleAssert = require('truffle-assertions');

const zeroWord = "0x0000000000000000000000000000000000000000000000000000000000000000";
const zeroAddress = "0x0000000000000000000000000000000000000000";

contract("Test factories minimal", accounts => {

	const tokenOwner = accounts[1];
  const salt = 3;
  let OFR;
  let factory;

  const subscribeTo = accounts[9];
  const bannedOperator = accounts[8]

  before(async () => {
		const impl = await ERC721MinimalRaribleTest.new();
		const beacon = await UpgradeableBeacon.new(impl.address);

    //setting operator filter registry
    OFR = await OperatorFilterRegistryTest.new();
    await OFR.register(subscribeTo, { from: subscribeTo });
    await OFR.updateOperator(subscribeTo, bannedOperator, true, { from: subscribeTo })

		factory = await ERC721RaribleFactoryC2.new(beacon.address, zeroAddress, zeroAddress, subscribeTo);
	})

	it("should create erc721 private from factory, getAddress works correctly", async () => {
    let proxy;
    const addressBeforeDeploy = await factory.getAddress("name", "RARI", "https://ipfs.rarible.com", "https://ipfs.rarible.com", [], salt)

		const resultCreateToken = await factory.createToken("name", "RARI", "https://ipfs.rarible.com", "https://ipfs.rarible.com", [], salt, {from: tokenOwner});
      truffleAssert.eventEmitted(resultCreateToken, 'Create721RaribleUserProxy', (ev) => {
        proxy = ev.proxy;
        return true;
      });
		const token = await ERC721MinimalRaribleTest.at(proxy);
    const minter = tokenOwner;
    let transferTo = accounts[2];

    assert.equal(proxy, addressBeforeDeploy, "correct address got before deploy")

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    console.log("Before call _mintAndTransfer");
    const tx = await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], transferTo, {from: minter});

		console.log("mint through proxy", tx.receipt.gasUsed);
    assert.equal(await token.ownerOf(tokenId), transferTo);
    assert.equal(await token.name(), "name")

    const txTransfer = await token.safeTransferFrom(transferTo, minter, tokenId, { from: transferTo });
    console.log("transfer through proxy", txTransfer.receipt.gasUsed);
	})

	it("test check don`t add operators while create token create erc721 private from factory, getAddress works correctly", async () => {
    let proxy;
    const operator1 = accounts[7];
		const resultCreateToken = await factory.createToken("name", "RARI2", "https://ipfs.rarible.com", "https://ipfs.rarible.com", [operator1], salt, {from: tokenOwner});
      truffleAssert.eventEmitted(resultCreateToken, 'Create721RaribleUserProxy', (ev) => {
        proxy = ev.proxy;
        return true;
      });
		const token = await ERC721MinimalRaribleTest.at(proxy);

    //setting OFR
    await token.setOFR(OFR.address)
    assert.equal(await token.OPERATOR_FILTER_REGISTRY(), OFR.address, "OFR set")

		assert.equal(await token.isApprovedForAll(factory.address, operator1), false);
		assert.equal(await token.isApprovedForAll(tokenOwner, operator1), false);

		await token.setApprovalForAll(operator1, true, {from: tokenOwner});
		//only after tokenOwner call isApprovedForAll to operator1, operator1 is approved
		assert.equal(await token.isApprovedForAll(tokenOwner, operator1), true);

    await OFR.registerAndSubscribe(token.address, subscribeTo)

    await truffleAssert.fails(
      token.setApprovalForAll(bannedOperator, true,{ from: tokenOwner }),
      truffleAssert.ErrorType.REVERT,
      "OperatorNotAllowed"
    )
	})

  it("should create erc721 public from factory, getAddress works correctly", async () => {
    let proxy;
    const addressBeforeDeploy = await factory.getAddress("name", "RARI", "https://ipfs.rarible.com", "https://ipfs.rarible.com", salt)

		const resultCreateToken = await factory.methods['createToken(string,string,string,string,uint256)']("name", "RARI", "https://ipfs.rarible.com", "https://ipfs.rarible.com", salt, {from: tokenOwner});
      truffleAssert.eventEmitted(resultCreateToken, 'Create721RaribleProxy', (ev) => {
        proxy = ev.proxy;
        return true;
      });
		const token = await ERC721MinimalRaribleTest.at(proxy);
    const minter = tokenOwner;
    let transferTo = accounts[2];

    assert.equal(proxy, addressBeforeDeploy, "correct address got before deploy")

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    console.log("Before call _mintAndTransfer");
    const tx = await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], transferTo, {from: minter});

		console.log("mint through proxy", tx.receipt.gasUsed);
    assert.equal(await token.ownerOf(tokenId), transferTo);
    assert.equal(await token.name(), "name")

    const txTransfer = await token.safeTransferFrom(transferTo, minter, tokenId, { from: transferTo });
    console.log("transfer through proxy", txTransfer.receipt.gasUsed);
	})

  function creators(list) {
  	const value = 10000 / list.length
  	return list.map(account => ({ account, value }))
  }

});