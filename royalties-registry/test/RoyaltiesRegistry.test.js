const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const RoyaltiesRegistry = artifacts.require("RoyaltiesRegistry.sol");
const RoyaltiesRegistryTest = artifacts.require("RoyaltiesRegistryTest.sol");
const TestERC721 = artifacts.require("TestERC721.sol");
const TestERC721RoyaltyV1OwnUpgrd = artifacts.require("TestERC721WithRoyaltiesV1OwnableUpgradeable");
const TestERC721RoyaltyV2OwnUpgrd = artifacts.require("TestERC721WithRoyaltiesV2OwnableUpgradeable");
const TestRoyaltiesProvider = artifacts.require("RoyaltiesProviderTest.sol");
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
