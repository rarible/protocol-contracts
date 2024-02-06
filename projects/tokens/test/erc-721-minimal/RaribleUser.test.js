const Testing = artifacts.require("ERC721RaribleMinimal.sol");
const TestRoyaltyV2981Calculate = artifacts.require("TestRoyaltyV2981Calculate.sol");

const { expectThrow } = require("@daonomic/tests-common");
const { sign } = require("../../../../scripts/mint721.js");
const truffleAssert = require('truffle-assertions');

contract("ERC721RaribleUser minimal", accounts => {

  let token;
  let tokenOwner = accounts[9];
  const name = 'FreeMintableRarible';
  const zeroWord = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const whiteListProxy = accounts[5];

  function fees(list) {
    const value = 500;
    return list.map(account => ({ account, value }))
  }

  beforeEach(async () => {
    token = await Testing.new();
    await token.__ERC721RaribleUser_init(name, "RARI", "https://ipfs.rarible.com", "https://ipfs.rarible.com", [], zeroAddress, zeroAddress, { from: tokenOwner });
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

  it("set new BaseUri, check only owner, check emit event", async () => {
    let olBaseUri = await token.baseURI();
    const newBusaUriSet = "https://ipfs.rarible-the-best-in-the-World.com"
    await expectThrow(
      token.setBaseURI(newBusaUriSet)//caller is not the owner
    );
    let tx = await token.setBaseURI(newBusaUriSet, { from: tokenOwner })//caller is owner
    let newBaseUri = await token.baseURI();
    assert.equal(newBaseUri, newBusaUriSet);
    assert.notEqual(newBaseUri, olBaseUri);

    let newBaseUriFromEvent;
    truffleAssert.eventEmitted(tx, 'BaseUriChanged', (ev) => {
     	newBaseUriFromEvent = ev.newBaseURI;
      return true;
    });
    assert.equal(newBaseUri, newBaseUriFromEvent);
  });
  
  it("check for support IERC2981 interface", async () => {
  	assert.equal(await token.supportsInterface("0x2a55205a"), true);
  });

  it("check Royalties IERC2981", async () => {
    let testRoyaltyV2981Calculate = await TestRoyaltyV2981Calculate.new();
    const minter = tokenOwner;
    let transferTo = accounts[2];
    let royaltiesBeneficiary1 = accounts[3];
    let royaltiesBeneficiary2 = accounts[4];
    let royaltiesBeneficiary3 = accounts[6];
    const WEIGHT_PRICE = 1000000;
    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    const signature = await getSignature(tokenId, tokenURI, creators([minter]), fees([royaltiesBeneficiary1,royaltiesBeneficiary2,royaltiesBeneficiary3]), minter);

    const tx = await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), fees([royaltiesBeneficiary1,royaltiesBeneficiary2,royaltiesBeneficiary3]), [signature]], transferTo, {from: tokenOwner});
    const addressValue = await token.royaltyInfo(tokenId, WEIGHT_PRICE);

    assert.equal(addressValue[0], royaltiesBeneficiary1, "account");
    assert.equal(addressValue[1], 150000, "value"); //why 15000?: 3 beneficiaries, each have 5%(500) in total 15%(1500), but WEIGHT_PRICE = 1000000, and 15% form this is 150000
    const royaltiesAddress = addressValue[0];
    const royaltiesPercent = addressValue[1];
    let royaltiesPart = await testRoyaltyV2981Calculate.calculateRoyaltiesTest(royaltiesAddress, royaltiesPercent);
    assert.equal(royaltiesPart[0].account, royaltiesBeneficiary1, "account");
    assert.equal(royaltiesPart[0].value, 1500, "value");
  });

  it("mint and transfer by whitelist proxy. minter is tokenOwner", async () => {
    const minter = tokenOwner;
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    let fees = [];

    const signature = await getSignature(tokenId, tokenURI, creators([minter]), fees, minter);

    await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), fees, [signature]], transferTo, {from: tokenOwner});

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

    await token.mintAndTransfer([tokenId, tokenURI, creators([minter, creator2]), fees, [signature1, signature2]], transferTo, {from: tokenOwner});

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

  it("mint and transfer with minter access control", async () => {
    const minter = accounts[1];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";

    await expectThrow(
      token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], transferTo, {from: minter})
    );

    await token.addMinter(minter, {from: tokenOwner})
    assert.equal(await token.isMinter(minter), true);
    assert.equal(await token.isMinter(transferTo), false);

    await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], transferTo, {from: minter})
    assert.equal(await token.ownerOf(tokenId), transferTo);
  });

  it("mint and transfer with minter access control and minter signature", async () => {
    const minter = accounts[1];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";

    const signature = await getSignature(tokenId, tokenURI, creators([minter]), [], minter);

    await expectThrow(
      token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [signature]], transferTo, {from: minter})
    );

    await token.addMinter(minter, {from: tokenOwner})
    assert.equal(await token.isMinter(minter), true);

    await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [signature]], transferTo, {from: minter})
    assert.equal(await token.ownerOf(tokenId), transferTo);
  });

  it("mint and transfer with minter access control and wrong minter signature", async () => {
    const minter = accounts[1];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";

    const signature = await getSignature(tokenId, tokenURI, creators([minter]), [], transferTo);

    await expectThrow(
      token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [signature]], transferTo, {from: minter})
    );

    await token.addMinter(minter, {from: tokenOwner})
    assert.equal(await token.isMinter(minter), true);

    await expectThrow(
      token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [signature]], transferTo, {from: whiteListProxy})
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