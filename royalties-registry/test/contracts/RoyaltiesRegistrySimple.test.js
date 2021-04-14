const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const RoyaltiesRegistryTest = artifacts.require("RoyaltiesRegistry.sol");
const TestERC721RoyaltyV1OwnUpgrd = artifacts.require("TestERC721WithRoyaltiesV1OwnableUpgradeable");
const TestRoyaltiesProvider = artifacts.require("RoyaltiesProviderTest.sol");

const { expectThrow, verifyBalanceChange } = require("@daonomic/tests-common");

contract("RoyaltiesRegistry, test metods", accounts => {
	let erc721TokenId1 = 51;

	beforeEach(async () => {
		royaltiesRegistry = await RoyaltiesRegistryTest.new();
		testRoyaltiesProvider = await TestRoyaltiesProvider.new();
	});

	describe("RoyaltiesRegistry metods works:", () => {

		it("SetRoyaltiesByTokenAndTokenId, initialize by Owner", async () => {
			await royaltiesRegistry.initialize();//initialize Owner
    	await royaltiesRegistry.setRoyaltiesByTokenAndTokenId(accounts[5], erc721TokenId1, [[accounts[3], 600], [accounts[4], 1100]]); //set royalties by token and tokenId
    	part = await royaltiesRegistry.getRoyalties(accounts[5], erc721TokenId1);
    	console.log ("Console log result getRoyalties:" + JSON.stringify(part));
			assert.equal(part[0].value, 600);
			assert.equal(part[1].value, 1100);
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

		it("Transfer from ERC20 to ERC721_V1OwnUpgrd, setProviderByToken, initialize not initialized, expect throw ", async () => {
			let ownerErc721 = accounts[6];
      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.new("Rarible", "RARI", "https://ipfs.rarible.com", {from: ownerErc721});
      await testRoyaltiesProvider.initializeProvider(ERC721_V1OwnUpgrd.address,[[accounts[3], 600], [accounts[4], 1100]]);//initialize royalties provider
      await ERC721_V1OwnUpgrd.initialize({from: ownerErc721});
			await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, []);
    	await expectThrow(
    		royaltiesRegistry.setProviderByToken(ERC721_V1OwnUpgrd.address, testRoyaltiesProvider.address) 									//set royalties by provider without ownerErc721
    	);
		})
	})
});
