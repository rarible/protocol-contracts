const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const RoyaltiesRegistry = artifacts.require("RoyaltiesRegistry.sol");
const RoyaltiesRegistryTest = artifacts.require("RoyaltiesRegistryTest.sol");
const TestERC721 = artifacts.require("TestERC721.sol");
const TestERC721RoyaltyV1OwnUpgrd = artifacts.require("TestERC721WithRoyaltiesV1OwnableUpgradeable");
const TestERC721RoyaltyV2OwnUpgrd = artifacts.require("TestERC721WithRoyaltiesV2OwnableUpgradeable");
const TestRoyaltiesProvider = artifacts.require("RoyaltiesProviderTest.sol");
const TestERC721RoyaltyV2Legacy = artifacts.require("TestERC721RoyaltyV2Legacy.sol");
const RoyaltiesProviderV2Legacy = artifacts.require("RoyaltiesProviderV2Legacy.sol");
const TestERC721ArtBlocks = artifacts.require("TestERC721ArtBlocks.sol");
const RoyaltiesProviderArtBlocks = artifacts.require("RoyaltiesProviderArtBlocks.sol");

const truffleAssert = require('truffle-assertions');

const { expectThrow, verifyBalanceChange } = require("@daonomic/tests-common");

contract("RoyaltiesRegistry, test methods", accounts => {
	let erc721TokenId1 = 51;
	let erc721TokenId2 = 52;
	let erc721;

	beforeEach(async () => {
		royaltiesRegistry = await RoyaltiesRegistry.new();
		royaltiesRegistryTest = await RoyaltiesRegistryTest.new();
		testRoyaltiesProvider = await TestRoyaltiesProvider.new();
		erc721 = await TestERC721.new("Rarible", "RARI", "https://ipfs.rarible.com");
	});

	describe("RoyaltiesRegistry methods works:", () => {

		it("simple V1 royalties", async () => {
  		await royaltiesRegistry.__RoyaltiesRegistry_init();											//initialize Owner
      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.new("Rarible", "RARI", "https://ipfs.rarible.com");
      ERC721_V1OwnUpgrd.initialize(); 																				//set V1 interface
  		await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, [[accounts[5], 1000], [accounts[7], 1200]]);								//set royalties by contract
    	part = await royaltiesRegistryTest._getRoyalties(royaltiesRegistry.address, ERC721_V1OwnUpgrd.address, erc721TokenId1);
			let royalties;
      truffleAssert.eventEmitted(part, 'getRoyaltiesTest', (ev) => {
      	royalties = ev.royalties;
        return true;
      });
			assert.equal(royalties[0].value, 1000);
			assert.equal(royalties[1].value, 1200);
			assert.equal(royalties.length, 2);
  	})

  	it("simple V1 royalties, set empty, check empty", async () => {
  		await royaltiesRegistry.__RoyaltiesRegistry_init();                     //initialize Owner
      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.new("Rarible", "RARI", "https://ipfs.rarible.com");
      ERC721_V1OwnUpgrd.initialize();                                         //set V1 interface
  		await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, []);					//set royalties by contract empty
    	part = await royaltiesRegistryTest._getRoyalties(royaltiesRegistry.address, ERC721_V1OwnUpgrd.address, erc721TokenId1);
			let royalties;
      truffleAssert.eventEmitted(part, 'getRoyaltiesTest', (ev) => {
      	royalties = ev.royalties;
        return true;
      });
			assert.equal(royalties.length, 0);
  	})

		it("simple V2 royalties", async () => {
  		await royaltiesRegistry.__RoyaltiesRegistry_init();               	//initialize Owner
      ERC721_V2OwnUpgrd = await TestERC721RoyaltyV2OwnUpgrd.new("Rarible", "RARI", "https://ipfs.rarible.com");
      ERC721_V2OwnUpgrd.initialize();                                   	//set V2 interface
  		await ERC721_V2OwnUpgrd.mint(accounts[2], erc721TokenId1, [[accounts[5], 700], [accounts[6], 800], [accounts[7], 900], [accounts[8], 1000]]);  //set royalties by contract
    	part = await royaltiesRegistryTest._getRoyalties(royaltiesRegistry.address, ERC721_V2OwnUpgrd.address, erc721TokenId1);
			let royalties;
      truffleAssert.eventEmitted(part, 'getRoyaltiesTest', (ev) => {
      	royalties = ev.royalties;
        return true;
      });
			assert.equal(royalties[0].value, 700);
			assert.equal(royalties[1].value, 800);
			assert.equal(royalties[2].value, 900);
			assert.equal(royalties[3].value, 1000);
			assert.equal(royalties.length, 4);
  	})

  	it("simple V2 royalties, set empty, check empty", async () => {
  		await royaltiesRegistry.__RoyaltiesRegistry_init();                   //initialize Owner
      ERC721_V2OwnUpgrd = await TestERC721RoyaltyV2OwnUpgrd.new("Rarible", "RARI", "https://ipfs.rarible.com");
      ERC721_V2OwnUpgrd.initialize();                                       //set V2 interface
  		await ERC721_V2OwnUpgrd.mint(accounts[2], erc721TokenId1, []);        //set royalties by contract empty
    	part = await royaltiesRegistryTest._getRoyalties(royaltiesRegistry.address, ERC721_V2OwnUpgrd.address, erc721TokenId1);
			let royalties;
      truffleAssert.eventEmitted(part, 'getRoyaltiesTest', (ev) => {
      	royalties = ev.royalties;
        return true;
      });
			assert.equal(royalties.length, 0);
  	})

		it("SetRoyaltiesByTokenAndTokenId, initialize by Owner, emit get", async () => {
			await royaltiesRegistry.__RoyaltiesRegistry_init();//initialize Owner
    	await royaltiesRegistry.setRoyaltiesByTokenAndTokenId(accounts[5], erc721TokenId1, [[accounts[3], 600], [accounts[4], 1100]]); //set royalties by token and tokenId
    	part = await royaltiesRegistryTest._getRoyalties(royaltiesRegistry.address, accounts[5], erc721TokenId1);
    	let royalties;
    	truffleAssert.eventEmitted(part, 'getRoyaltiesTest', (ev) => {
    		royalties = ev.royalties;
      	return true;
     	});
			assert.equal(royalties[0].value, 600);
			assert.equal(royalties[1].value, 1100);
		})

		it("SetRoyaltiesByToken, initialize by Owner, emit get", async () => {
			await royaltiesRegistry.__RoyaltiesRegistry_init();//initialize Owner
    	await royaltiesRegistry.setRoyaltiesByToken(accounts[5], [[accounts[3], 600], [accounts[4], 1100]]); //set royalties by token and tokenId
    	await royaltiesRegistry.setRoyaltiesByToken(accounts[5], [[accounts[3], 600], [accounts[4], 1100]]); //set royalties by token and tokenId
    	part = await royaltiesRegistryTest._getRoyalties(royaltiesRegistry.address, accounts[5], erc721TokenId1);
    	let royalties;
    	truffleAssert.eventEmitted(part, 'getRoyaltiesTest', (ev) => {
    		royalties = ev.royalties;
      		return true;
      });
      assert.equal(royalties.length, 2);
			assert.equal(royalties[0].value, 600);
			assert.equal(royalties[1].value, 1100);
		})

		it("SetRoyaltiesByToken, initialize by OwnableUpgradaeble(ERC721_V1OwnUpgrd).owner", async () => {
			let ownerErc721 = accounts[6];
      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.new("Rarible", "RARI", "https://ipfs.rarible.com", {from: ownerErc721 });
      await ERC721_V1OwnUpgrd.initialize( {from: ownerErc721});
			await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, []);
    	await royaltiesRegistry.setRoyaltiesByToken(ERC721_V1OwnUpgrd.address, [[accounts[3], 500], [accounts[4], 1000]], {from: ownerErc721}); //set royalties by token and tokenId
			part = await royaltiesRegistryTest._getRoyalties(royaltiesRegistry.address, ERC721_V1OwnUpgrd.address, erc721TokenId1);
			let royalties;
      truffleAssert.eventEmitted(part, 'getRoyaltiesTest', (ev) => {
      	royalties = ev.royalties;
        return true;
      });
			assert.equal(royalties[0].value, 500);
			assert.equal(royalties[1].value, 1000);
		})

		it("SetRoyaltiesByTokenAndTokenId, initialize by OwnableUpgradaeble(ERC721_V1OwnUpgrd).owner", async () => {
			let ownerErc721 = accounts[6];
      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.new("Rarible", "RARI", "https://ipfs.rarible.com", {from: ownerErc721 });
      await ERC721_V1OwnUpgrd.initialize( {from: ownerErc721});
			await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, []);
    	await royaltiesRegistry.setRoyaltiesByTokenAndTokenId(ERC721_V1OwnUpgrd.address, erc721TokenId1,[[accounts[3], 500], [accounts[4], 1000]], {from: ownerErc721}); //set royalties by token and tokenId
    	await royaltiesRegistry.setRoyaltiesByTokenAndTokenId(ERC721_V1OwnUpgrd.address, erc721TokenId1,[[accounts[3], 500], [accounts[4], 1000]], {from: ownerErc721}); //set royalties by token and tokenId
			part = await royaltiesRegistryTest._getRoyalties(royaltiesRegistry.address, ERC721_V1OwnUpgrd.address, erc721TokenId1);
			let royalties;
      truffleAssert.eventEmitted(part, 'getRoyaltiesTest', (ev) => {
      	royalties = ev.royalties;
        return true;
      });
      assert.equal(royalties.length, 2);
			assert.equal(royalties[0].value, 500);
			assert.equal(royalties[1].value, 1000);
		})

		it("SetRoyaltiesByTokenandTokenId, royaltiesSum>100% throw detected ", async () => {
			let ownerErc721 = accounts[6];
      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.new("Rarible", "RARI", "https://ipfs.rarible.com", {from: ownerErc721});
      await ERC721_V1OwnUpgrd.initialize({from: ownerErc721});
			await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, []);
    	await expectThrow(
    		royaltiesRegistry.setRoyaltiesByTokenAndTokenId(ERC721_V1OwnUpgrd.address, erc721TokenId1, [[accounts[3], 9200], [accounts[4], 1100]], {from: ownerErc721}) //set royalties by token and tokenId
    	);
		})

		it("Royalties NOT initialize  throw detected ", async () => {
      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.new("Rarible", "RARI", "https://ipfs.rarible.com");
			await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, []);
    	await expectThrow(
    		royaltiesRegistry.setRoyaltiesByTokenAndTokenId(ERC721_V1OwnUpgrd.address, erc721TokenId1, [[accounts[3], 600], [accounts[4], 1100]]) //set royalties by token and tokenId
			);
		})

	})

	describe ("ExternalProviders test:", () => {

		it("using royaltiesProvider v2 legacy", async () => {
			await royaltiesRegistry.__RoyaltiesRegistry_init();

			const token = await TestERC721RoyaltyV2Legacy.new("Rarible", "RARI", "https://ipfs.rarible.com");
			const provider = await RoyaltiesProviderV2Legacy.new();

			await royaltiesRegistry.setProviderByToken(token.address, provider.address);

			const royaltiesToSet = [[accounts[1], 1000]]
			await token.mint(accounts[2], erc721TokenId1);
			await token._saveRoyalties(erc721TokenId1, royaltiesToSet)

			let event;
			const tx = await royaltiesRegistry.getRoyalties(token.address, erc721TokenId1)
			truffleAssert.eventEmitted(tx, 'RoyaltiesSetForToken', (ev) => {
				event = ev;
				return true;
			});

			assert.equal(event["token"], token.address, "token address");
			assert.equal(event["tokenId"], erc721TokenId1, "token id");
			assert.equal(event.royalties[0][0], royaltiesToSet[0][0], "royalty recepient 0");
			assert.equal(event.royalties[0][1], royaltiesToSet[0][1], "token address 0");

		})
		
		it("using royaltiesProvider artBlocks", async () => {
			await royaltiesRegistry.__RoyaltiesRegistry_init();

			const artBlocksAddr = accounts[5];
			const artistAdrr = accounts[2];
			const addPayeeAddr = accounts[4];

			//deploying contracts
			const token = await TestERC721ArtBlocks.new("Rarible", "RARI", "https://ipfs.rarible.com");
			const provider = await RoyaltiesProviderArtBlocks.new({from: artBlocksAddr});

			const owner = await provider.owner();
			assert.equal(owner, artBlocksAddr, "owner")

			const artblocksPercentage = await provider.artblocksPercentage();
			assert.equal(artblocksPercentage, 250, "artblocksPercentage")

			//setting provider in registry
			await royaltiesRegistry.setProviderByToken(token.address, provider.address);

			//creating token and setting royalties
			await token.mint(artistAdrr, erc721TokenId1);
			await token.updateProjectAdditionalPayeeInfo(erc721TokenId1, addPayeeAddr, 44);
			await token.updateProjectSecondaryMarketRoyaltyPercentage(erc721TokenId1, 15);

			//getting royalties for token
			const royaltiesFromProvider = await provider.getRoyalties(token.address, erc721TokenId1);

			assert.equal(royaltiesFromProvider[0].account, artBlocksAddr, "artBlocks royalty address")
			assert.equal(royaltiesFromProvider[0].value, 250, "artBlocks royalty percentage")

			assert.equal(royaltiesFromProvider[1].account, artistAdrr, "artist royalty address")
			assert.equal(royaltiesFromProvider[1].value, 840, "artBlocks royalty percentage")

			assert.equal(royaltiesFromProvider[2].account, addPayeeAddr, "additional payee royalty address")
			assert.equal(royaltiesFromProvider[2].value, 660, "additional payee royalty percentage")
			
			//changing artBlocksAddr
			const newArtBlocksAddr = accounts[6]
			let eventSetAddr;
			const txSetAddr = await provider.transferOwnership(newArtBlocksAddr, {from: artBlocksAddr})
			truffleAssert.eventEmitted(txSetAddr, 'OwnershipTransferred', (ev) => {
				eventSetAddr = ev;
				return true;
			});
			assert.equal(eventSetAddr.previousOwner, artBlocksAddr, "from artBlocks addr");
			assert.equal(eventSetAddr.newOwner, newArtBlocksAddr, "to artBlocks addr");

			await expectThrow(
				provider.transferOwnership(artBlocksAddr, {from: artBlocksAddr})
			);

			//checking royalties
			let event;
			const tx = await royaltiesRegistry.getRoyalties(token.address, erc721TokenId1)
			truffleAssert.eventEmitted(tx, 'RoyaltiesSetForToken', (ev) => {
				event = ev;
				return true;
			});
			assert.equal(event["token"], token.address, "token address");
			assert.equal(event["tokenId"], erc721TokenId1, "token id");

			assert.equal(event.royalties[0].account, newArtBlocksAddr, "artBlocks addr");
			assert.equal(event.royalties[0].value, 250, "artBlocks value");

			assert.equal(event.royalties[1].account, artistAdrr, "artist addr");
			assert.equal(event.royalties[1].value, 840, "artist value");

			assert.equal(event.royalties[2].account, addPayeeAddr, "additional payee addr");
			assert.equal(event.royalties[2].value, 660, "additional payee value");

			//setting new artblocksPercentage
			let eventChangePercentage;
			const txChangePercentage = await provider.setArtblocksPercentage(300, {from: newArtBlocksAddr})
			truffleAssert.eventEmitted(txChangePercentage, 'ArtblocksPercentageChanged', (ev) => {
				eventChangePercentage = ev;
				return true;
			});
			assert.equal(eventChangePercentage._who, newArtBlocksAddr, "from artBlocks addr");
			assert.equal(eventChangePercentage._old, 250, "old percentage");
			assert.equal(eventChangePercentage._new, 300, "new percentage");

			//only owner can set %
			await expectThrow(
				provider.setArtblocksPercentage(0, {from: artBlocksAddr})
			);

			// _artblocksPercentage can't be over 10000
			await expectThrow(
				provider.setArtblocksPercentage(100000, {from: newArtBlocksAddr})
			);
		})

		it("using royaltiesProvider artBlocks royalties edge cases", async () => {
			await royaltiesRegistry.__RoyaltiesRegistry_init();

			const artBlocksAddr = accounts[5];
			const artistAdrr = accounts[2];
			const addPayeeAddr = accounts[4];

			//deploying contracts
			const token = await TestERC721ArtBlocks.new("Rarible", "RARI", "https://ipfs.rarible.com");
			const provider = await RoyaltiesProviderArtBlocks.new({from: artBlocksAddr});

			const owner = await provider.owner();
			assert.equal(owner, artBlocksAddr, "owner")

			const artblocksPercentage = await provider.artblocksPercentage();
			assert.equal(artblocksPercentage, 250, "artblocksPercentage")

			//setting provider in registry
			await royaltiesRegistry.setProviderByToken(token.address, provider.address);

			//creating token and setting royalties
			await token.mint(artistAdrr, erc721TokenId1);
			await token.updateProjectAdditionalPayeeInfo(erc721TokenId1, addPayeeAddr, 0);
			await token.updateProjectSecondaryMarketRoyaltyPercentage(erc721TokenId1, 15);

			//getting royalties for token
			//case artist = 15% additionalPatee = 0
			const royaltiesFromProvider = await provider.getRoyalties(token.address, erc721TokenId1);
			assert.equal(royaltiesFromProvider[0].account, artBlocksAddr, "artBlocks royalty address")
			assert.equal(royaltiesFromProvider[0].value, 250, "artBlocks royalty percentage")

			assert.equal(royaltiesFromProvider[1].account, artistAdrr, "artist royalty address")
			assert.equal(royaltiesFromProvider[1].value, 1500, "artBlocks royalty percentage")

			assert.equal(royaltiesFromProvider.length, 2, "should be 2 royalties")

			//case artist = 15%, additionalPayee = 100% of 15%
			await token.updateProjectAdditionalPayeeInfo(erc721TokenId1, addPayeeAddr, 100);
			const royaltiesFromProvider2 = await provider.getRoyalties(token.address, erc721TokenId1);

			assert.equal(royaltiesFromProvider2[0].account, artBlocksAddr, "artBlocks royalty address")
			assert.equal(royaltiesFromProvider2[0].value, 250, "artBlocks royalty percentage")

			assert.equal(royaltiesFromProvider2[1].account, addPayeeAddr, "artist royalty address")
			assert.equal(royaltiesFromProvider2[1].value, 1500, "artBlocks royalty percentage")

			assert.equal(royaltiesFromProvider2.length, 2, "should be 2 royalties")

			//case additionalPayee > 100
			await token.updateProjectAdditionalPayeeInfo(erc721TokenId1, addPayeeAddr, 110);
			await expectThrow(
				provider.getRoyalties(token.address, erc721TokenId1)
			);
			await token.updateProjectAdditionalPayeeInfo(erc721TokenId1, addPayeeAddr, 0);

			//case artist > 100
			await token.updateProjectSecondaryMarketRoyaltyPercentage(erc721TokenId1, 110);
			await expectThrow(
				provider.getRoyalties(token.address, erc721TokenId1)
			);
			await token.updateProjectSecondaryMarketRoyaltyPercentage(erc721TokenId1, 0);

			//case artist = 0, additionalPayee = 0
			const royaltiesFromProvider3 = await provider.getRoyalties(token.address, erc721TokenId1);
			assert.equal(royaltiesFromProvider3[0].account, artBlocksAddr, "artBlocks royalty address")
			assert.equal(royaltiesFromProvider3[0].value, 250, "artBlocks royalty percentage")
			assert.equal(royaltiesFromProvider3.length, 1, "should be 1 royalties")

			//case artist = 0, additionalPayee = 0, artBlocks = 0
			await provider.setArtblocksPercentage(0, {from: artBlocksAddr})
			const royaltiesFromProvider4 = await provider.getRoyalties(token.address, erc721TokenId1);
			assert.equal(royaltiesFromProvider4.length, 0, "should be 0 royalties")
			
		})

		it("SetProviderByToken, initialize by Owner", async () => {
  		await royaltiesRegistry.__RoyaltiesRegistry_init();//initialize Owner
      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.new("Rarible", "RARI", "https://ipfs.rarible.com");
      await testRoyaltiesProvider.initializeProvider(ERC721_V1OwnUpgrd.address, erc721TokenId1, [[accounts[3], 500], [accounts[4], 1000]]); //initialize royalties provider
  		await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, []);
    	await royaltiesRegistry.setProviderByToken(ERC721_V1OwnUpgrd.address, testRoyaltiesProvider.address); 							//set royalties by provider
			part = await royaltiesRegistryTest._getRoyalties(royaltiesRegistry.address, ERC721_V1OwnUpgrd.address, erc721TokenId1);
			let royalties;
      truffleAssert.eventEmitted(part, 'getRoyaltiesTest', (ev) => {
      	royalties = ev.royalties;
        return true;
      });
			assert.equal(royalties[0].value, 500);
			assert.equal(royalties[1].value, 1000);
		})

		it("SetProviderByToken + ContractRoyalties, which not work, because royalties detect by provider, initialize by Owner", async () => {
  		await royaltiesRegistry.__RoyaltiesRegistry_init();																																//initialize Owner
      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.new("Rarible", "RARI", "https://ipfs.rarible.com");
      ERC721_V1OwnUpgrd.initialize(); 																																											//set V1 interface
      await testRoyaltiesProvider.initializeProvider(ERC721_V1OwnUpgrd.address, erc721TokenId1, [[accounts[3], 500], [accounts[4], 1000]]); 	//initialize royalties provider
  		await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, [[accounts[5], 1000], [accounts[7], 1200]]);								//set royalties by contract
    	await royaltiesRegistry.setProviderByToken(ERC721_V1OwnUpgrd.address, testRoyaltiesProvider.address); 								//set royalties by provider
    	part = await royaltiesRegistryTest._getRoyalties(royaltiesRegistry.address, ERC721_V1OwnUpgrd.address, erc721TokenId1);
			let royalties;
      truffleAssert.eventEmitted(part, 'getRoyaltiesTest', (ev) => {
      	royalties = ev.royalties;
        return true;
      });
			assert.equal(royalties[0].value, 500);
			assert.equal(royalties[1].value, 1000);
			assert.equal(royalties.length, 2);
  	})

		it("SetProviderByToken, initialize  by ownableUpgradaeble(ERC721_V1OwnUpgrd).owner ", async () => {
			let ownerErc721 = accounts[6];
      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.new("Rarible", "RARI", "https://ipfs.rarible.com", {from: ownerErc721});
      await testRoyaltiesProvider.initializeProvider(ERC721_V1OwnUpgrd.address, erc721TokenId1, [[accounts[3], 600], [accounts[4], 1100]]); 				//initialize royalties provider
      await ERC721_V1OwnUpgrd.initialize({from: ownerErc721});
			await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, []);
			await royaltiesRegistry.setProviderByToken(ERC721_V1OwnUpgrd.address, testRoyaltiesProvider.address, {from: ownerErc721}); //set royalties by provider
			part = await royaltiesRegistryTest._getRoyalties(royaltiesRegistry.address, ERC721_V1OwnUpgrd.address, erc721TokenId1);
			let royalties;
      truffleAssert.eventEmitted(part, 'getRoyaltiesTest', (ev) => {
      	royalties = ev.royalties;
        return true;
      });
			assert.equal(royalties[0].value, 600);
			assert.equal(royalties[1].value, 1100);
			assert.equal(royalties.length, 2);
		})

		it("SetProviderByToken, initialize by ownableUpgradaeble(ERC721_V1OwnUpgrd).owner, royalties for erc721TokenId2 should be empty", async () => {
			let ownerErc721 = accounts[6];
      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.new("Rarible", "RARI", "https://ipfs.rarible.com", {from: ownerErc721});
      await testRoyaltiesProvider.initializeProvider(ERC721_V1OwnUpgrd.address, erc721TokenId1, [[accounts[3], 600], [accounts[4], 1100]]); 				//initialize royalties provider
      await ERC721_V1OwnUpgrd.initialize({from: ownerErc721});
			await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId2, []);
			await royaltiesRegistry.setProviderByToken(ERC721_V1OwnUpgrd.address, testRoyaltiesProvider.address, {from: ownerErc721}); //set royalties by provider
			part = await royaltiesRegistryTest._getRoyalties(royaltiesRegistry.address, ERC721_V1OwnUpgrd.address, erc721TokenId2);
			let royalties;
      truffleAssert.eventEmitted(part, 'getRoyaltiesTest', (ev) => {
      	royalties = ev.royalties;
        return true;
      });
			assert.equal(royalties.length, 0);
		})

		it("SetProviderByToken, initialize by Owner, but provider not IRoyaltiesRegistry, result - no royalties", async () => {
  		await royaltiesRegistry.__RoyaltiesRegistry_init();//initialize Owner
      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.new("Rarible", "RARI", "https://ipfs.rarible.com");
      await testRoyaltiesProvider.initializeProvider(ERC721_V1OwnUpgrd.address, erc721TokenId1, [[accounts[3], 500], [accounts[4], 1000]]); //initialize royalties provider
  		await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, []);
    	await royaltiesRegistry.setProviderByToken(ERC721_V1OwnUpgrd.address, erc721.address); 														//set provider without IRoyaltiesRegistry
			part = await royaltiesRegistryTest._getRoyalties(royaltiesRegistry.address, ERC721_V1OwnUpgrd.address, erc721TokenId1);
			let royalties;
      truffleAssert.eventEmitted(part, 'getRoyaltiesTest', (ev) => {
      	royalties = ev.royalties;
        return true;
      });
			assert.equal(royalties.length, 0);
  	})

		it("SetProviderByToken, initialize not initialized, expect throw ", async () => {
			let ownerErc721 = accounts[6];
      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.new("Rarible", "RARI", "https://ipfs.rarible.com", {from: ownerErc721});
      await testRoyaltiesProvider.initializeProvider(ERC721_V1OwnUpgrd.address,erc721TokenId1,[[accounts[3], 600], [accounts[4], 1100]]);//initialize royalties provider
      await ERC721_V1OwnUpgrd.initialize({from: ownerErc721});
			await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, []);
    	await expectThrow(
    		royaltiesRegistry.setProviderByToken(ERC721_V1OwnUpgrd.address, testRoyaltiesProvider.address) 									//set royalties by provider without ownerErc721
    	);
		})
	})
});
