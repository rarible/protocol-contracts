const Testing = artifacts.require("ERC721RaribleMinimal.sol");

const { expectThrow } = require("@daonomic/tests-common");
const { sign } = require('./mint');

contract("ERC721RaribleUser minimal", accounts => {

  let token;
  let tokenOwner = accounts[9];
  const name = 'FreeMintableRarible';
  const zeroWord = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const whiteListProxy = accounts[5];

  beforeEach(async () => {
    token = await Testing.new();
    await token.__ERC721RaribleUser_init(name, "RARI", "https://ipfs.rarible.com", "https://ipfs.rarible.com", [whiteListProxy], zeroAddress, zeroAddress, { from: tokenOwner });
  });

  it("check for ERC165 interface", async () => {
  	assert.equal(await token.supportsInterface("0x01ffc9a7"), true);
  });

	//todo check this id
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

  it("mint and transfer by whitelist proxy. minter is tokenOwner", async () => {
    const minter = tokenOwner;
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    let fees = [];

    const signature = await getSignature(tokenId, tokenURI, creators([minter]), fees, minter);

    await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), fees, [signature]], transferTo, {from: whiteListProxy});

    assert.equal(await token.ownerOf(tokenId), transferTo);
    await checkCreators(tokenId, [minter]);
    // assert.equal(await token.getCreators(tokenId), [minter]);
  });

  it("mint and transfer by whitelist proxy. minter is not tokenOwner", async () => {
    const minter = accounts[1];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    let fees = [];

    const signature = await getSignature(tokenId, tokenURI, creators([minter]), fees, minter);

    await expectThrow(
      token.mintAndTransfer([tokenId, tokenURI, creators([minter]), fees, [signature]], transferTo, {from: whiteListProxy})
    );
  });

  it("mint and transfer by whitelist proxy. several creators", async () => {
    const minter = tokenOwner;
    const creator2 = accounts[3];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    let fees = [];

    const signature1 = await getSignature(tokenId, tokenURI, creators([minter, creator2]), fees, minter);
    const signature2 = await getSignature(tokenId, tokenURI, creators([minter, creator2]), fees, creator2);

    await token.mintAndTransfer([tokenId, tokenURI, creators([minter, creator2]), fees, [signature1, signature2]], transferTo, {from: whiteListProxy});

    assert.equal(await token.ownerOf(tokenId), transferTo);
    await checkCreators(tokenId, [minter, creator2]);
  });

  it("mint and transfer by minter. minter is tokenOwner", async () => {
    const minter = tokenOwner;
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";

    const tx = await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], transferTo, {from: minter});

		console.log("mint through impl", tx.receipt.gasUsed);
    assert.equal(await token.ownerOf(tokenId), transferTo);

    const txTransfer = await token.safeTransferFrom(transferTo, minter, tokenId, { from: transferTo });
    console.log("transfer through impl", txTransfer.receipt.gasUsed);
  });

  it("mint and transfer by minter. minter is not tokenOwner", async () => {
    const minter = accounts[1];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    await expectThrow(
      token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], transferTo, {from: minter})
    );
  });

  it("mint and transfer to self by minter. minter is not tokenOwner", async () => {
    const minter = accounts[1];
    let transferTo = minter;

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    await expectThrow(
      token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], transferTo, {from: minter})
    );
  });

  function getSignature(tokenId, tokenURI, fees, creators, account) {
		return sign(account, tokenId, tokenURI, fees, creators, token.address);
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