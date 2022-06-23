const ERC721RaribleMinimal = artifacts.require("ERC721RaribleMinimal.sol");
const ERC721RaribleFactoryC2 = artifacts.require("ERC721RaribleFactoryC2.sol");

const ERC1155RaribleFactoryC2 = artifacts.require("ERC1155RaribleFactoryC2.sol");
const ERC1155Rarible = artifacts.require("ERC1155Rarible.sol");

const truffleAssert = require('truffle-assertions');

const zeroWord = "0x0000000000000000000000000000000000000000000000000000000000000000";

contract("Test factories and tokens", accounts => {

	const minter = accounts[1];
  const salt = 3;
  const transferTo = accounts[2];
  const tokenId = minter + "b00000000000000000000001";
  const tokenURI = "//uri";

  const supply = 5;
  const mint = 2;

  it("rarible erc721 collection should be able to mint tokens", async () => {
    const token = await ERC721RaribleMinimal.deployed();

    await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], transferTo, {from: minter});
    assert.equal(await token.ownerOf(tokenId), transferTo, "owner1");
    assert.equal(await token.name(), "Rarible", "name")
    
    await token.safeTransferFrom(transferTo, minter, tokenId, { from: transferTo });
    assert.equal(await token.ownerOf(tokenId), minter, "owner2");
  })

  it("rarible erc1155 collection should be able to mint tokens", async () => {
    const token = await ERC1155Rarible.deployed();

    await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, {from: minter});
    assert.equal(await token.balanceOf(transferTo, tokenId), mint);
    assert.equal(await token.name(), "Rarible", "name")
    
    await token.safeTransferFrom(transferTo, minter, tokenId, mint, [], { from: transferTo });

    assert.equal(await token.balanceOf(minter, tokenId), mint);
  })

	it("create public collection from 721 factory, it should be able to mint tokens", async () => {
    const factory = await ERC721RaribleFactoryC2.deployed();

    let proxy;
    const addressBeforeDeploy = await factory.getAddress("name", "RARI", "https://ipfs.rarible.com", "https://ipfs.rarible.com", salt)

		const resultCreateToken = await factory.methods['createToken(string,string,string,string,uint256)']("name", "RARI", "https://ipfs.rarible.com", "https://ipfs.rarible.com", salt, {from: minter});
      truffleAssert.eventEmitted(resultCreateToken, 'Create721RaribleProxy', (ev) => {
        proxy = ev.proxy;
        return true;
      });
		const token = await ERC721RaribleMinimal.at(proxy);

    assert.equal(proxy, addressBeforeDeploy, "correct address got before deploy")

    await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], transferTo, {from: minter});
    assert.equal(await token.ownerOf(tokenId), transferTo);
    assert.equal(await token.name(), "name")

    await token.safeTransferFrom(transferTo, minter, tokenId, { from: transferTo });
    assert.equal(await token.ownerOf(tokenId), minter);
	})

  it("create private collection from 721 factory, it should be able to mint tokens", async () => {
    const factory = await ERC721RaribleFactoryC2.deployed();

    let proxy;
    const addressBeforeDeploy = await factory.getAddress("name", "RARI", "https://ipfs.rarible.com", "https://ipfs.rarible.com", [], salt)

		const resultCreateToken = await factory.createToken("name", "RARI", "https://ipfs.rarible.com", "https://ipfs.rarible.com", [], salt, {from: minter});
      truffleAssert.eventEmitted(resultCreateToken, 'Create721RaribleUserProxy', (ev) => {
        proxy = ev.proxy;
        return true;
      });
		const token = await ERC721RaribleMinimal.at(proxy);

    assert.equal(proxy, addressBeforeDeploy, "correct address got before deploy")

    await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], transferTo, {from: minter});
    assert.equal(await token.ownerOf(tokenId), transferTo);
    assert.equal(await token.name(), "name")

    await token.safeTransferFrom(transferTo, minter, tokenId, { from: transferTo });
    assert.equal(await token.ownerOf(tokenId), minter);
	})

  it("create public collection from 1155 factory, it should be able to mint tokens", async () => {
    const factory = await ERC1155RaribleFactoryC2.deployed();

    let proxy;
    const addressBeforeDeploy = await factory.getAddress("name", "RARI", "https://ipfs.rarible.com", "https://ipfs.rarible.com", salt)

		const resultCreateToken = await factory.methods['createToken(string,string,string,string,uint256)']("name", "RARI", "https://ipfs.rarible.com", "https://ipfs.rarible.com", salt, {from: minter});
      truffleAssert.eventEmitted(resultCreateToken, 'Create1155RaribleProxy', (ev) => {
        proxy = ev.proxy;
        return true;
      });
		const token = await ERC1155Rarible.at(proxy);

    assert.equal(proxy, addressBeforeDeploy, "correct address got before deploy")

    await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, {from: minter});
    assert.equal(await token.balanceOf(transferTo, tokenId), mint);
    assert.equal(await token.name(), "name", "name")
    
    await token.safeTransferFrom(transferTo, minter, tokenId, mint, [], { from: transferTo });
    assert.equal(await token.balanceOf(minter, tokenId), mint);

  })

  it("create private collection from 1155 factory, it should be able to mint tokens", async () => {
    const factory = await ERC1155RaribleFactoryC2.deployed();

    let proxy;
    const addressBeforeDeploy = await factory.getAddress("name", "RARI", "https://ipfs.rarible.com", "https://ipfs.rarible.com", [], salt)

		const resultCreateToken = await factory.createToken("name", "RARI", "https://ipfs.rarible.com", "https://ipfs.rarible.com", [], salt, {from: minter});
      truffleAssert.eventEmitted(resultCreateToken, 'Create1155RaribleUserProxy', (ev) => {
        proxy = ev.proxy;
        return true;
      });
		const token = await ERC1155Rarible.at(proxy);

    assert.equal(proxy, addressBeforeDeploy, "correct address got before deploy")

    await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, {from: minter});
    assert.equal(await token.balanceOf(transferTo, tokenId), mint);
    assert.equal(await token.name(), "name", "name")
    
    await token.safeTransferFrom(transferTo, minter, tokenId, mint, [], { from: transferTo });
    assert.equal(await token.balanceOf(minter, tokenId), mint);
  })

  function creators(list) {
  	const value = 10000 / list.length
  	return list.map(account => ({ account, value }))
  }

});