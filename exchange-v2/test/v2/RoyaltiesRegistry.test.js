const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const RoyaltiesRegistryTest = artifacts.require("RoyaltiesRegistry.sol");
const RaribleTransferManagerTest = artifacts.require("RaribleTransferManagerTest.sol");
const TestERC20 = artifacts.require("TestERC20.sol");
const TestERC721 = artifacts.require("TestERC721.sol");
const TransferProxy = artifacts.require("TransferProxy.sol");
const ERC20TransferProxy = artifacts.require("ERC20TransferProxy.sol");
const TestERC721RoyaltyV1OwnUpgrd = artifacts.require("TestERC721WithRoyaltiesV1OwnableUpgradeable");
const TestRoyaltiesProvider = artifacts.require("RoyaltiesProviderTest.sol");

const { Order, Asset, sign } = require("../order");
const EIP712 = require("../EIP712");
const ZERO = "0x0000000000000000000000000000000000000000";
const { expectThrow, verifyBalanceChange } = require("@daonomic/tests-common");
const { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, enc, id } = require("../assets");

contract("RoyaltiesRegistry, test metods", accounts => {
	let testing;
	let erc721;
  let erc1155;
  let transferProxy;
  let erc20TransferProxy;
  let royaltiesProviderTest;
  let t1;
  let t2;
	let protocol = accounts[9];
	let community = accounts[8];
	const eth = "0x0000000000000000000000000000000000000000";
	let erc721TokenId1 = 51;

	beforeEach(async () => {
		transferProxy = await TransferProxy.new();
		await transferProxy.__TransferProxy_init();
		erc20TransferProxy = await ERC20TransferProxy.new();
		await erc20TransferProxy.__ERC20TransferProxy_init();
		testing = await RaribleTransferManagerTest.new();
		royaltiesRegistry = await RoyaltiesRegistryTest.new();
		//await royaltiesRegistry.initializeRoyaltiesRegistry();
		await testing.__TransferManager_init(transferProxy.address, erc20TransferProxy.address, 300, 300, community, royaltiesRegistry.address);
		await transferProxy.addOperator(testing.address);
		await erc20TransferProxy.addOperator(testing.address);
		t1 = await TestERC20.new();
		t2 = await TestERC20.new();
		/*ETH*/
    await testing.setWalletForToken(eth, protocol);//
    await testing.setWalletForToken(t1.address, protocol);//
		/*ERC721 */
		erc721 = await TestERC721.new("Rarible", "RARI", "https://ipfs.rarible.com");
		testRoyaltiesProvider = await TestRoyaltiesProvider.new();
	});

	describe("Metods works:", () => {
		it("Transfer from ERC20 to ERC721v1_OwnableUpgradaeble, setRoyaltiesByToken, initialize by Owner", async () => {
			await royaltiesRegistry.initializeRoyaltiesRegistry();//initialize Owner
      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.new("Rarible", "RARI", "https://ipfs.rarible.com");
			await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, []);
    	await ERC721_V1OwnUpgrd.setApprovalForAll(transferProxy.address, true, {from: accounts[2]});
    	await royaltiesRegistry.setRoyaltiesByToken(ERC721_V1OwnUpgrd.address, [[accounts[3], 500], [accounts[4], 1000]]); //set royalties by token and tokenId

			await t1.mint(accounts[1], 105);
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
			const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC721, enc(ERC721_V1OwnUpgrd.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[2], Asset(ERC721, enc(ERC721_V1OwnUpgrd.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");

			await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [100, 1], left, right);

			assert.equal(await t1.balanceOf(accounts[1]), 2);
			assert.equal(await t1.balanceOf(accounts[2]), 82);
			assert.equal(await t1.balanceOf(accounts[3]), 5);
			assert.equal(await t1.balanceOf(accounts[4]), 10);
			assert.equal(await ERC721_V1OwnUpgrd.balanceOf(accounts[1]), 1);
			assert.equal(await ERC721_V1OwnUpgrd.balanceOf(accounts[2]), 0);
			assert.equal(await t1.balanceOf(protocol), 6);
		})

		it("Transfer from ERC20 to ERC721_V1OwnUpgrd, setRoyaltiesByToken, initialize by OwnableUpgradaeble(ERC721_V1OwnUpgrd).owner", async () => {
			let ownerErc721 = accounts[6];
      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.new("Rarible", "RARI", "https://ipfs.rarible.com", {from: ownerErc721 });
      await ERC721_V1OwnUpgrd.initialize( {from: ownerErc721});
			await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, []);
    	await ERC721_V1OwnUpgrd.setApprovalForAll(transferProxy.address, true, {from: accounts[2]});
    	await royaltiesRegistry.setRoyaltiesByToken(ERC721_V1OwnUpgrd.address, [[accounts[3], 500], [accounts[4], 1000]], {from: ownerErc721}); //set royalties by token and tokenId

			await t1.mint(accounts[1], 105);
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
			const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC721, enc(ERC721_V1OwnUpgrd.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[2], Asset(ERC721, enc(ERC721_V1OwnUpgrd.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");

			await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [100, 1], left, right);

			assert.equal(await t1.balanceOf(accounts[1]), 2);
			assert.equal(await t1.balanceOf(accounts[2]), 82);
			assert.equal(await t1.balanceOf(accounts[3]), 5);
			assert.equal(await t1.balanceOf(accounts[4]), 10);
			assert.equal(await ERC721_V1OwnUpgrd.balanceOf(accounts[1]), 1);
			assert.equal(await ERC721_V1OwnUpgrd.balanceOf(accounts[2]), 0);
			assert.equal(await t1.balanceOf(protocol), 6);
		})

		it("Transfer from ERC20 to ERC721_V1OwnUpgrd, setRoyaltiesByToken, initialize by owner and ownableUpgradaeble(ERC721_V1OwnUpgrd).owner", async () => {
			await royaltiesRegistry.initializeRoyaltiesRegistry();//initialize Owner
			let ownerErc721 = accounts[6];
      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.new("Rarible", "RARI", "https://ipfs.rarible.com", {from: ownerErc721 });
      await ERC721_V1OwnUpgrd.initialize( {from: ownerErc721});
			await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, []);
    	await ERC721_V1OwnUpgrd.setApprovalForAll(transferProxy.address, true, {from: accounts[2]});
    	await royaltiesRegistry.setRoyaltiesByToken(ERC721_V1OwnUpgrd.address, [[accounts[3], 500], [accounts[4], 1000]], {from: ownerErc721}); //set royalties by token and tokenId

			await t1.mint(accounts[1], 105);
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
			const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC721, enc(ERC721_V1OwnUpgrd.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[2], Asset(ERC721, enc(ERC721_V1OwnUpgrd.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");

			await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [100, 1], left, right);

			assert.equal(await t1.balanceOf(accounts[1]), 2);
			assert.equal(await t1.balanceOf(accounts[2]), 82);
			assert.equal(await t1.balanceOf(accounts[3]), 5);
			assert.equal(await t1.balanceOf(accounts[4]), 10);
			assert.equal(await ERC721_V1OwnUpgrd.balanceOf(accounts[1]), 1);
			assert.equal(await ERC721_V1OwnUpgrd.balanceOf(accounts[2]), 0);
			assert.equal(await t1.balanceOf(protocol), 6);
		})

		it("Transfer from ERC20 to ERC721_V1OwnUpgrd, setRoyaltiesByTokenandTokenId, initialize  by owner ", async () => {
			await royaltiesRegistry.initializeRoyaltiesRegistry();//initialize Owner
      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.new("Rarible", "RARI", "https://ipfs.rarible.com");
      await ERC721_V1OwnUpgrd.initialize();
			await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, []);
    	await ERC721_V1OwnUpgrd.setApprovalForAll(transferProxy.address, true, {from: accounts[2]});
    	await royaltiesRegistry.setRoyaltiesByTokenAndTokenId(ERC721_V1OwnUpgrd.address, erc721TokenId1, [[accounts[3], 600], [accounts[4], 1100]]); //set royalties by token and tokenId

			await t1.mint(accounts[1], 105);
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
			const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC721, enc(ERC721_V1OwnUpgrd.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[2], Asset(ERC721, enc(ERC721_V1OwnUpgrd.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");

			await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [100, 1], left, right);

			assert.equal(await t1.balanceOf(accounts[1]), 2);
			assert.equal(await t1.balanceOf(accounts[2]), 80);
			assert.equal(await t1.balanceOf(accounts[3]), 6);
			assert.equal(await t1.balanceOf(accounts[4]), 11);
			assert.equal(await ERC721_V1OwnUpgrd.balanceOf(accounts[1]), 1);
			assert.equal(await ERC721_V1OwnUpgrd.balanceOf(accounts[2]), 0);
			assert.equal(await t1.balanceOf(protocol), 6);
		})

		it("Transfer from ERC20 to ERC721_V1OwnUpgrd, setRoyaltiesByTokenandTokenId, initialize  by ownableUpgradaeble(ERC721_V1OwnUpgrd).owner ", async () => {
			let ownerErc721 = accounts[6];
      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.new("Rarible", "RARI", "https://ipfs.rarible.com", {from: ownerErc721});
      await ERC721_V1OwnUpgrd.initialize({from: ownerErc721});
			await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, []);
    	await ERC721_V1OwnUpgrd.setApprovalForAll(transferProxy.address, true, {from: accounts[2]});
    	await royaltiesRegistry.setRoyaltiesByTokenAndTokenId(ERC721_V1OwnUpgrd.address, erc721TokenId1, [[accounts[3], 600], [accounts[4], 1100]], {from: ownerErc721}); //set royalties by token and tokenId

			await t1.mint(accounts[1], 105);
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
			const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC721, enc(ERC721_V1OwnUpgrd.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[2], Asset(ERC721, enc(ERC721_V1OwnUpgrd.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");

			await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [100, 1], left, right);

			assert.equal(await t1.balanceOf(accounts[1]), 2);
			assert.equal(await t1.balanceOf(accounts[2]), 80);
			assert.equal(await t1.balanceOf(accounts[3]), 6);
			assert.equal(await t1.balanceOf(accounts[4]), 11);
			assert.equal(await ERC721_V1OwnUpgrd.balanceOf(accounts[1]), 1);
			assert.equal(await ERC721_V1OwnUpgrd.balanceOf(accounts[2]), 0);
			assert.equal(await t1.balanceOf(protocol), 6);
		})

		it("Transfer from ERC20 to ERC721_V1OwnUpgrd, setRoyaltiesByToken, royaltiesSum>100% throw detected", async () => {
			await royaltiesRegistry.initializeRoyaltiesRegistry();//initialize Owner
			let ownerErc721 = accounts[6];
      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.new("Rarible", "RARI", "https://ipfs.rarible.com", {from: ownerErc721 });
      await ERC721_V1OwnUpgrd.initialize( {from: ownerErc721});
			await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, []);
    	await ERC721_V1OwnUpgrd.setApprovalForAll(transferProxy.address, true, {from: accounts[2]});
    	await expectThrow(
    		 royaltiesRegistry.setRoyaltiesByToken(ERC721_V1OwnUpgrd.address, [[accounts[3], 500], [accounts[4], 9800]], {from: ownerErc721}) //set royalties by token and tokenId
    	);
		})

		it("Transfer from ERC20 to ERC721_V1OwnUpgrd, setRoyaltiesByTokenandTokenId, royaltiesSum>100% throw detected ", async () => {
			let ownerErc721 = accounts[6];
      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.new("Rarible", "RARI", "https://ipfs.rarible.com", {from: ownerErc721});
      await ERC721_V1OwnUpgrd.initialize({from: ownerErc721});
			await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, []);
    	await ERC721_V1OwnUpgrd.setApprovalForAll(transferProxy.address, true, {from: accounts[2]});
    	await expectThrow(
    		royaltiesRegistry.setRoyaltiesByTokenAndTokenId(ERC721_V1OwnUpgrd.address, erc721TokenId1, [[accounts[3], 9200], [accounts[4], 1100]], {from: ownerErc721}) //set royalties by token and tokenId
    	);
		})

		it("Transfer from ERC20 to ERC721_V1OwnUpgrd, Royalties NOT initialize  throw detected ", async () => {
      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.new("Rarible", "RARI", "https://ipfs.rarible.com");
			await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, []);
    	await ERC721_V1OwnUpgrd.setApprovalForAll(transferProxy.address, true, {from: accounts[2]});
    	await expectThrow(
    		royaltiesRegistry.setRoyaltiesByTokenAndTokenId(ERC721_V1OwnUpgrd.address, erc721TokenId1, [[accounts[3], 600], [accounts[4], 1100]]) //set royalties by token and tokenId
			);
		})

	})
	describe ("ExternalProviders test:", () => {
		it("Transfer from ERC20 to ERC721v1_OwnableUpgradaeble, setProviderByToken, initialize by Owner", async () => {

  		await royaltiesRegistry.initializeRoyaltiesRegistry();//initialize Owner

      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.new("Rarible", "RARI", "https://ipfs.rarible.com");
      await testRoyaltiesProvider.initializeProvider(ERC721_V1OwnUpgrd.address,[[accounts[3], 500], [accounts[4], 1000]]); //initialize royalties provider
  		await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, []);
    	await ERC721_V1OwnUpgrd.setApprovalForAll(transferProxy.address, true, {from: accounts[2]});
    	await royaltiesRegistry.setProviderByToken(ERC721_V1OwnUpgrd.address, testRoyaltiesProvider.address); 							//set royalties by token and tokenId

  		await t1.mint(accounts[1], 105);
  		await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
  		const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC721, enc(ERC721_V1OwnUpgrd.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
  		const right = Order(accounts[2], Asset(ERC721, enc(ERC721_V1OwnUpgrd.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");

  		await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [100, 1], left, right);

  		assert.equal(await t1.balanceOf(accounts[1]), 2);
  		assert.equal(await t1.balanceOf(accounts[2]), 82);
  		assert.equal(await t1.balanceOf(accounts[3]), 5);
  		assert.equal(await t1.balanceOf(accounts[4]), 10);
  		assert.equal(await ERC721_V1OwnUpgrd.balanceOf(accounts[1]), 1);
  		assert.equal(await ERC721_V1OwnUpgrd.balanceOf(accounts[2]), 0);
  		assert.equal(await t1.balanceOf(protocol), 6);
  	})

		it("Transfer from ERC20 to ERC721v1_OwnableUpgradaeble, setProviderByToken + ContractRoyalties, which not work, because royalties detect by provider, initialize by Owner", async () => {

  		await royaltiesRegistry.initializeRoyaltiesRegistry();																																//initialize Owner

      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.new("Rarible", "RARI", "https://ipfs.rarible.com");
      ERC721_V1OwnUpgrd.initialize(); 																																											//set V1 interface
      await testRoyaltiesProvider.initializeProvider(ERC721_V1OwnUpgrd.address,[[accounts[3], 500], [accounts[4], 1000]]); 	//initialize royalties provider
  		await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, [[accounts[5], 1000], [accounts[7], 1200]]);								//set royalties by contract
    	await ERC721_V1OwnUpgrd.setApprovalForAll(transferProxy.address, true, {from: accounts[2]});
    	await royaltiesRegistry.setProviderByToken(ERC721_V1OwnUpgrd.address, testRoyaltiesProvider.address); 								//set royalties by provider

  		await t1.mint(accounts[1], 105);
  		await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
  		const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC721, enc(ERC721_V1OwnUpgrd.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
  		const right = Order(accounts[2], Asset(ERC721, enc(ERC721_V1OwnUpgrd.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");

  		await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [100, 1], left, right);

  		assert.equal(await t1.balanceOf(accounts[1]), 2);
  		assert.equal(await t1.balanceOf(accounts[2]), 82);
  		assert.equal(await t1.balanceOf(accounts[3]), 5);
  		assert.equal(await t1.balanceOf(accounts[4]), 10);
  		assert.equal(await t1.balanceOf(accounts[5]), 0);
  		assert.equal(await t1.balanceOf(accounts[7]), 0);
  		assert.equal(await ERC721_V1OwnUpgrd.balanceOf(accounts[1]), 1);
  		assert.equal(await ERC721_V1OwnUpgrd.balanceOf(accounts[2]), 0);
  		assert.equal(await t1.balanceOf(protocol), 6);
  	})

		it("Transfer from ERC20 to ERC721_V1OwnUpgrd, setProviderByToken, initialize  by ownableUpgradaeble(ERC721_V1OwnUpgrd).owner ", async () => {
			let ownerErc721 = accounts[6];
      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.new("Rarible", "RARI", "https://ipfs.rarible.com", {from: ownerErc721});
      await testRoyaltiesProvider.initializeProvider(ERC721_V1OwnUpgrd.address,[[accounts[3], 600], [accounts[4], 1100]]); 				//initialize royalties provider
      await ERC721_V1OwnUpgrd.initialize({from: ownerErc721});
			await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, []);
    	await ERC721_V1OwnUpgrd.setApprovalForAll(transferProxy.address, true, {from: accounts[2]});
			await royaltiesRegistry.setProviderByToken(ERC721_V1OwnUpgrd.address, testRoyaltiesProvider.address, {from: ownerErc721}); //set royalties by provider

			await t1.mint(accounts[1], 105);
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
			const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC721, enc(ERC721_V1OwnUpgrd.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[2], Asset(ERC721, enc(ERC721_V1OwnUpgrd.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");

			await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [100, 1], left, right);

			assert.equal(await t1.balanceOf(accounts[1]), 2);
			assert.equal(await t1.balanceOf(accounts[2]), 80);
			assert.equal(await t1.balanceOf(accounts[3]), 6);
			assert.equal(await t1.balanceOf(accounts[4]), 11);
			assert.equal(await ERC721_V1OwnUpgrd.balanceOf(accounts[1]), 1);
			assert.equal(await ERC721_V1OwnUpgrd.balanceOf(accounts[2]), 0);
			assert.equal(await t1.balanceOf(protocol), 6);
		})

		it("Transfer from ERC20 to ERC721v1_OwnableUpgradaeble, setProviderByToken, initialize by Owner, but provider not IRoyaltiesRegistry", async () => {

  		await royaltiesRegistry.initializeRoyaltiesRegistry();//initialize Owner

      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.new("Rarible", "RARI", "https://ipfs.rarible.com");
      await testRoyaltiesProvider.initializeProvider(ERC721_V1OwnUpgrd.address,[[accounts[3], 500], [accounts[4], 1000]]); //initialize royalties provider
  		await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, []);
    	await ERC721_V1OwnUpgrd.setApprovalForAll(transferProxy.address, true, {from: accounts[2]});
    	await royaltiesRegistry.setProviderByToken(ERC721_V1OwnUpgrd.address, erc721.address); 														//set provider without IRoyaltiesRegistry

  		await t1.mint(accounts[1], 105);
  		await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
  		const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC721, enc(ERC721_V1OwnUpgrd.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
  		const right = Order(accounts[2], Asset(ERC721, enc(ERC721_V1OwnUpgrd.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");

  		await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [100, 1], left, right);

  		assert.equal(await t1.balanceOf(accounts[1]), 2);
  		assert.equal(await t1.balanceOf(accounts[2]), 97);
  		assert.equal(await t1.balanceOf(accounts[3]), 0);
  		assert.equal(await t1.balanceOf(accounts[4]), 0);
  		assert.equal(await ERC721_V1OwnUpgrd.balanceOf(accounts[1]), 1);
  		assert.equal(await ERC721_V1OwnUpgrd.balanceOf(accounts[2]), 0);
  		assert.equal(await t1.balanceOf(protocol), 6);
  	})

		it("Transfer from ERC20 to ERC721_V1OwnUpgrd, setProviderByToken, initialize not initialized, expect throw ", async () => {
			let ownerErc721 = accounts[6];
      ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.new("Rarible", "RARI", "https://ipfs.rarible.com", {from: ownerErc721});
      await testRoyaltiesProvider.initializeProvider(ERC721_V1OwnUpgrd.address,[[accounts[3], 600], [accounts[4], 1100]]);//initialize royalties provider
      await ERC721_V1OwnUpgrd.initialize({from: ownerErc721});
			await ERC721_V1OwnUpgrd.mint(accounts[2], erc721TokenId1, []);
    	await ERC721_V1OwnUpgrd.setApprovalForAll(transferProxy.address, true, {from: accounts[2]});
    	await expectThrow(
    		royaltiesRegistry.setProviderByToken(ERC721_V1OwnUpgrd.address, testRoyaltiesProvider.address) 									//set royalties by provider without ownerErc721
    	);

		})


	})
});
