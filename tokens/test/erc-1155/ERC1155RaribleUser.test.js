const Testing = artifacts.require("ERC1155RaribleUser.sol");
const UpgradeableBeacon = artifacts.require("UpgradeableBeacon.sol");
const BeaconProxy = artifacts.require("BeaconProxy.sol");
const ERC1155Factory = artifacts.require("ERC1155RaribleUserFactory.sol");
const truffleAssert = require('truffle-assertions');

const { expectThrow } = require("@daonomic/tests-common");
const { sign } = require("./mint");


contract("ERC1155RaribleUser", accounts => {

  let token;
  let beacon;
  let proxy;
  let tokenOwner = accounts[9];
  const zeroWord = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const name = 'FreeMintable';
  const whiteListProxy = accounts[5];

  beforeEach(async () => {
    token = await Testing.new();
    await token.__ERC1155RaribleUser_init(name, "TST", "ipfs:/", "ipfs:/", [whiteListProxy], {from: tokenOwner});
  });

  describe("burn before mint ()", () => {
    it("Test1. Supply = 5, burn = 2 not from minter, throw, mintAndTransfer by the minter = 5, ok", async () => {
      let minter = tokenOwner;
      let anotherUser = accounts[5];
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001"; //save token creator
      const tokenURI = "/uri";
      let supply = 5;
      let burn = 2;
      let mintValue = 5;

      await expectThrow(
        token.burn(anotherUser, tokenId, burn, {from: anotherUser})  //token has another creator
      );
      await expectThrow(
        token.burn(minter, tokenId, burn, {from: anotherUser})  //burn not from minter
      );
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mintValue, {from: minter});
      assert.equal(await token.balanceOf(transferTo, tokenId), mintValue);
    });

    it("Test2. Supply = 5, burn = 2, mintAndTransfer by the same minter = 3, ok", async () => {
      let minter = tokenOwner;
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "/uri";
      let supply = 5;
      let burn = 2;
      let mintValue = supply - burn;

      await token.burn(minter, tokenId, burn, {from: minter});
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mintValue, {from: minter});
      assert.equal(await token.balanceOf(transferTo, tokenId), mintValue);
    });

    it("Test3.1. Supply = 5, burn = 5, mintAndTransfer by the same minter = 1, burn==supply, throw", async () => {
      let minter = tokenOwner;
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "/uri";
      let supply = 5;
      let burn = 5;
      let mintValue = 1;

      await token.burn(minter, tokenId, burn, {from: minter});
      await expectThrow(
        token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mintValue, {from: minter})
      )
      assert.equal(await token.balanceOf(transferTo, tokenId), 0);
    });

    it("Test3.2. Supply = 5, burn = 10, mintAndTransfer by the same minter = 1, burn>supply, throw", async () => {
      let minter = tokenOwner;
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "/uri";
      let supply = 5;
      let burn = 10;
      let mintValue = 1;

      await token.burn(minter, tokenId, burn, {from: minter});
      await expectThrow(
        token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mintValue, {from: minter})
      )
      assert.equal(await token.balanceOf(transferTo, tokenId), 0);
    });
    it("Test4. Supply = 5, burn = 1, repeat 3 times, mintAndTransfer by the same minter = 3, more, throw", async () => {
      let minter = tokenOwner;
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "/uri";
      let supply = 5;
      let burn = 1;
      let mintValue = 3;

      await token.burn(minter, tokenId, burn, {from: minter});
      await token.burn(minter, tokenId, burn, {from: minter});
      await token.burn(minter, tokenId, burn, {from: minter});
      await expectThrow(
        token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mintValue, {from: minter})
      );
      assert.equal(await token.balanceOf(transferTo, tokenId), 0);
    });
    it("Test5. Supply = 5, burn = 2, mintAndTransfer = 2, burn2, mintAndTransfer = 1, ok", async () => {
      let minter = tokenOwner;
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "/uri";
      let supply = 5;
      let burn = 2;
      let mintValue = 2;

      await token.burn(minter, tokenId, burn, {from: minter});
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mintValue, {from: minter}); // now owner is transferTo
      assert.equal(await token.balanceOf(transferTo, tokenId), mintValue);
      await token.burn(transferTo, tokenId, 1, {from: transferTo}); //owner burn 1
      await token.burn(transferTo, tokenId, 1, {from: transferTo}); //owner burn 1,number of allBurned = 4

      const signature = await getSignature(tokenId, tokenURI, supply, creators([minter]), [], minter);
      let whiteListProxy = transferTo;
      await token.setApprovalForAll(whiteListProxy, true, {from: tokenOwner});
      await expectThrow(
        token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [signature]], transferTo, 2, {from: whiteListProxy})//mint 2 impossible 4+2>supply==5
      );
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [signature]], transferTo, 1, {from: whiteListProxy});//mint 1 possible 4+1<=supply==5
    });
  });

  describe("burn after mint ()", () => {
    it("Run mintAndTransfer = 5, burn = 2, mintAndTransfer by the same minter = 3, ok", async () => {
      let minter = tokenOwner;
      let anotherUser = accounts[5];
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "/uri";
      let supply = 5;
      let mint = 2;
      let secondMintValue = supply - mint;
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, {from: minter});
	  	assert.equal(await token.uri(tokenId), "ipfs:/" + tokenURI);
      assert.equal(await token.balanceOf(transferTo, tokenId), mint);
      assert.equal(await token.balanceOf(minter, tokenId), 0);

      await token.burn(transferTo, tokenId, mint, {from: transferTo});
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, secondMintValue, {from: minter});
      assert.equal(await token.balanceOf(transferTo, tokenId), secondMintValue);
    });
    it("Run mintAndTransfer = 5, burn = 2, mintAndTransfer by the same minter = 4, throw", async () => {
      let minter = tokenOwner;
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "/uri";
      let supply = 5;
      let mint = 2;
      let secondMintValue = 4; //more than tail
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, {from: minter});
	  	assert.equal(await token.uri(tokenId), "ipfs:/" + tokenURI);
      assert.equal(await token.balanceOf(transferTo, tokenId), mint);
      assert.equal(await token.balanceOf(minter, tokenId), 0);

      await token.burn(transferTo, tokenId, mint, {from: transferTo});
      await expectThrow(
        token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, secondMintValue, {from: minter})
      )
    });
    it("Run mintAndTransfer = 5, burn = 5, mintAndTransfer by the same minter = 1, throw", async () => {
      let minter = tokenOwner;
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "/uri";
      let supply = 5;
      let mint = 5;
      let secondMintValue = 1;
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, {from: minter});
	  	assert.equal(await token.uri(tokenId), "ipfs:/" + tokenURI);
      assert.equal(await token.balanceOf(transferTo, tokenId), mint);
      assert.equal(await token.balanceOf(minter, tokenId), 0);

      await token.burn(transferTo, tokenId, mint, {from: transferTo});
      await expectThrow(
        token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, secondMintValue, {from: minter})
      );
    });
    it("Run mintAndTransfer = 5, burn = 4, mintAndTransfer by the same minter = 1, throw", async () => {
      let minter = tokenOwner;
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "/uri";
      let supply = 5;
      let mint = 5;
      let secondMintValue = 1;
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, {from: minter});
	  	assert.equal(await token.uri(tokenId), "ipfs:/" + tokenURI);
      assert.equal(await token.balanceOf(transferTo, tokenId), mint);
      assert.equal(await token.balanceOf(minter, tokenId), 0);

      await token.burn(transferTo, tokenId, 4, {from: transferTo});
      await expectThrow(
        token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, secondMintValue, {from: minter})
      );
      assert.equal(await token.balanceOf(transferTo, tokenId), secondMintValue);
    });
    it("Run mintAndTransfer = 4, burn = 3, mintAndTransfer by the same minter = 1, ok", async () => {
      let minter = tokenOwner;
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "/uri";
      let supply = 5;
      let mint = 4;
      let secondMintValue = 1;
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, {from: minter});
	  	assert.equal(await token.uri(tokenId), "ipfs:/" + tokenURI);
      assert.equal(await token.balanceOf(transferTo, tokenId), mint);
      assert.equal(await token.balanceOf(minter, tokenId), 0);

      await token.burn(transferTo, tokenId, 3, {from: transferTo});
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, secondMintValue, {from: minter})
      assert.equal(await token.balanceOf(transferTo, tokenId), 2);
    });

    it("Run mintAndTransfer = 4, burn = 3, mintAndTransfer by the same minter = 2, throw", async () => {
      let minter = tokenOwner;
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "/uri";
      let supply = 5;
      let mint = 4;
      let secondMintValue = 2;
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, {from: minter});
	  	assert.equal(await token.uri(tokenId), "ipfs:/" + tokenURI);
      assert.equal(await token.balanceOf(transferTo, tokenId), mint);
      assert.equal(await token.balanceOf(minter, tokenId), 0);

      await token.burn(transferTo, tokenId, 3, {from: transferTo});
      await expectThrow(
        token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, secondMintValue, {from: minter})
      );
      assert.equal(await token.balanceOf(transferTo, tokenId), 1);
    });
  });

  describe("Mint and transfer ()", () => {
    it("mint and transfer by minter, token create by Factory", async () => {
      beacon = await UpgradeableBeacon.new(token.address);
      factory = await ERC1155Factory.new(beacon.address);
      resultCreateToken = await factory.createToken(name, "TST", "ipfs:/", "ipfs:/", [], {from: tokenOwner});
      truffleAssert.eventEmitted(resultCreateToken, 'Create1155RaribleUserProxy', (ev) => {
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