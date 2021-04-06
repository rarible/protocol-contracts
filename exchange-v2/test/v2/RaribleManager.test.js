const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const RaribleTransferManagerTest = artifacts.require("RaribleTransferManagerTest.sol");
const TestERC20 = artifacts.require("TestERC20.sol");
const TestERC721 = artifacts.require("TestERC721.sol");
const TestERC1155 = artifacts.require("TestERC1155.sol");
const TransferProxy = artifacts.require("TransferProxy.sol");
const ERC20TransferProxy = artifacts.require("ERC20TransferProxy.sol");
const ERC721_V1 = artifacts.require("TestERC721WithRoyaltiesV1.sol");
const ERC721_V2 = artifacts.require("TestERC721WithRoyaltiesV2.sol");
const ERC1155_V1 = artifacts.require("TestERC1155WithRoyaltiesV1.sol");
const ERC1155_V2 = artifacts.require("TestERC1155WithRoyaltiesV2.sol");
const ERC721_V1_Error = artifacts.require("TestERC721WithRoyaltiesV1_InterfaceError.sol");
const ERC1155_V2_Error = artifacts.require("TestERC1155WithRoyaltiesV2_InterfaceError.sol");
const RoyaltiesRegistry = artifacts.require("RoyaltiesRegistry.sol");

const { Order, Asset, sign } = require("../order");
const EIP712 = require("../EIP712");
const ZERO = "0x0000000000000000000000000000000000000000";
const eth = "0x0000000000000000000000000000000000000000";
const { expectThrow, verifyBalanceChange } = require("@daonomic/tests-common");
const { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, enc, encDataV2, id } = require("../assets");

contract("RaribleTransferManagerTest:doTransferTest()", accounts => {
	let testing;
	let transferProxy;
	let erc20TransferProxy;
	let t1;
	let t2;
	let protocol = accounts[9];
	let community = accounts[8];
	let erc721;
	let erc1155;
	let erc721V1;
	let erc721V2;
	let erc1155V1;
	let erc1155V2;
	let erc721V1_Error;
	let erc1155V2_Error;
	let erc721TokenId0 = 52;
	let erc721TokenId1 = 53;
	let erc1155TokenId1 = 54;
	let erc1155TokenId2 = 55;
	let royaltiesRegistry;

	function encDataV1(tuple) {
		return testing.encode(tuple)
	}

	beforeEach(async () => {
		transferProxy = await TransferProxy.new();
		await transferProxy.__TransferProxy_init();
		erc20TransferProxy = await ERC20TransferProxy.new();
		await erc20TransferProxy.__ERC20TransferProxy_init();
		testing = await RaribleTransferManagerTest.new();
		royaltiesRegistry = await RoyaltiesRegistry.new();
		await testing.__TransferManager_init(transferProxy.address, erc20TransferProxy.address, 300, 300, community, royaltiesRegistry.address);
		await transferProxy.addOperator(testing.address);
		await erc20TransferProxy.addOperator(testing.address);
		t1 = await TestERC20.new();
		t2 = await TestERC20.new();
		/*ERC721 */
		erc721 = await TestERC721.new("Rarible", "RARI", "https://ipfs.rarible.com");
		/*ERC1155*/
		erc1155 = await TestERC1155.new("https://ipfs.rarible.com");
		await testing.setWalletForToken(t1.address, protocol);//
    /*ETH*/
    await testing.setWalletForToken(eth, protocol);//
    /*NFT 721 RoyalitiesV1*/
    erc721V1 = await ERC721_V1.new("Rarible", "RARI", "https://ipfs.rarible.com");
    await erc721V1.initialize();
    /*NFT 721 RoyalitiesV2*/
    erc721V2 = await ERC721_V2.new("Rarible", "RARI", "https://ipfs.rarible.com");
    await erc721V2.initialize();
    /*1155 RoyalitiesV1*/
    erc1155V1 = await ERC1155_V1.new("https://ipfs.rarible.com");
    await erc1155V1.initialize();
    /*1155 RoyalitiesV2*/
    erc1155V2 = await ERC1155_V2.new("https://ipfs.rarible.com");
    await erc1155V2.initialize();
		/*NFT 721 RoyalitiesV1 with interface error*/
		erc721V1_Error = await ERC721_V1_Error.new("Rarible", "RARI", "https://ipfs.rarible.com");
		/*NFT 1155 RoyalitiesV2 with interface error*/
		erc1155V2_Error = await ERC1155_V2_Error.new("https://ipfs.rarible.com");
	});

	describe("Check doTransfers()", () => {

		it("Transfer from ETH to ERC1155, protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
			const { left, right } = await prepareETH_1155Orders(10)

      await verifyBalanceChange(accounts[0], 103, () =>
      	verifyBalanceChange(accounts[2], -97, () =>
        	verifyBalanceChange(protocol, -6, () =>
          	testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [100, 7], left, right,
            	{value: 103, from: accounts[0], gasPrice: 0}
            )
          )
        )
      );
			assert.equal(await erc1155.balanceOf(accounts[0], erc1155TokenId1), 7);
			assert.equal(await erc1155.balanceOf(accounts[2], erc1155TokenId1), 3);
		})

		async function prepareETH_1155Orders(t2Amount  = 10) {
			await erc1155.mint(accounts[2], erc1155TokenId1, t2Amount);
			await erc1155.setApprovalForAll(transferProxy.address, true, {from: accounts[2]});

			const left = Order(accounts[0], Asset(ETH, "0x", 100), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[2], Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7), ZERO, Asset(ETH, "0x", 100), 1, 0, 0, "0xffffffff", "0x");
			return { left, right }
		}

    it("Transfer from  ERC721 to ERC1155, (buyerFee3%, sallerFee3% = 6%) of ERC1155 transfer to community, orders dataType == V1", async () => {
			const { left, right } = await prepare721_1155Orders(110)

			await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [1, 100], left, right);

			assert.equal(await erc721.balanceOf(accounts[1]), 0);
			assert.equal(await erc721.balanceOf(accounts[2]), 1);
			assert.equal(await erc1155.balanceOf(accounts[1], erc1155TokenId1), 93);
			assert.equal(await erc1155.balanceOf(accounts[2], erc1155TokenId1), 1);
			assert.equal(await erc1155.balanceOf(community, erc1155TokenId1), 6);
		})

		async function prepare721_1155Orders(t2Amount = 105) {
			await erc721.mint(accounts[1], erc721TokenId1);
			await erc1155.mint(accounts[2], erc1155TokenId1, t2Amount);
			await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
			await erc1155.setApprovalForAll(transferProxy.address, true, {from: accounts[2]});
			/*in this: accounts[3] - address originLeftOrder, 100 - originLeftOrderFee(bp%)*/
			let addrOriginLeft = [[accounts[3], 100], [accounts[5], 300]];
			let addrOriginRight = [[accounts[4], 200], [accounts[6], 400]];
			let encDataLeft = await encDataV1([ [[accounts[1], 10000]], addrOriginLeft]);
			let encDataRight = await encDataV1([ [[accounts[2], 10000]], addrOriginRight]);
			const left = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[2], Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataRight);
			return { left, right }
		}

    it("Transfer from ERC1155 to ERC721, (buyerFee3%, sallerFee3% = 6%) of ERC1155 protocol (buyerFee3%, sallerFee3%)", async () => {
			const { left, right } = await prepare1155O_721rders(105)

			await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [100, 1], left, right);

			assert.equal(await erc721.balanceOf(accounts[2]), 0);
			assert.equal(await erc721.balanceOf(accounts[1]), 1);
			assert.equal(await erc1155.balanceOf(accounts[2], erc1155TokenId1), 97);
			assert.equal(await erc1155.balanceOf(accounts[1], erc1155TokenId1), 2);
			assert.equal(await erc1155.balanceOf(protocol, erc1155TokenId1), 6);
		})

		async function prepare1155O_721rders(t2Amount  = 105) {
			await erc1155.mint(accounts[1], erc1155TokenId1, t2Amount);
			await erc721.mint(accounts[2], erc721TokenId1);
			await erc1155.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
			await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[2]});
			await testing.setWalletForToken(erc1155.address, protocol);
			const left = Order(accounts[1], Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
			const right =Order(accounts[2], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), 1, 0, 0, "0xffffffff", "0x");
			return { left, right }
		}

    it("Transfer from   ERC20 to ERC1155, protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
			const { left, right } = await prepare20_1155Orders(105, 10)

			await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [100, 7], left, right);

			assert.equal(await t1.balanceOf(accounts[1]), 2);
			assert.equal(await t1.balanceOf(accounts[2]), 97);
			assert.equal(await erc1155.balanceOf(accounts[1], erc1155TokenId1), 7);
			assert.equal(await erc1155.balanceOf(accounts[2], erc1155TokenId1), 3);
			assert.equal(await t1.balanceOf(protocol), 6);
		})

		async function prepare20_1155Orders(t1Amount = 105, t2Amount  = 10) {
			await t1.mint(accounts[1], t1Amount);
			await erc1155.mint(accounts[2], erc1155TokenId1, t2Amount);
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
			await erc1155.setApprovalForAll(transferProxy.address, true, {from: accounts[2]});

			const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[2], Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
			return { left, right }
		}

		it("Transfer from ERC1155 to ERC20, protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
			const { left, right } = await prepare1155_20Orders(10, 105)

			await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [7, 100], left, right);

			assert.equal(await t1.balanceOf(accounts[3]), 97);
			assert.equal(await t1.balanceOf(accounts[4]), 2);
			assert.equal(await erc1155.balanceOf(accounts[3], erc1155TokenId2), 3);
			assert.equal(await erc1155.balanceOf(accounts[4], erc1155TokenId2), 7);
			assert.equal(await t1.balanceOf(protocol), 6);
		})

		async function prepare1155_20Orders(t1Amount = 10, t2Amount  = 105) {
			await erc1155.mint(accounts[3], erc1155TokenId2, t1Amount);
			await t1.mint(accounts[4], t2Amount);
			await erc1155.setApprovalForAll(transferProxy.address, true, {from: accounts[3]});
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[4] });

			const left = Order(accounts[3], Asset(ERC1155, enc(erc1155.address, erc1155TokenId2), 7), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[4], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId2), 7), 1, 0, 0, "0xffffffff", "0x");
			return { left, right }
		}

		it("Transfer from ERC20 to ERC721, protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
			const { left, right } = await prepare20_721Orders()

			await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [100, 1], left, right);

			assert.equal(await t1.balanceOf(accounts[1]), 2);
			assert.equal(await t1.balanceOf(accounts[2]), 97);
			assert.equal(await erc721.balanceOf(accounts[1]), 1);
			assert.equal(await erc721.balanceOf(accounts[2]), 0);
			assert.equal(await t1.balanceOf(protocol), 6);
		})

		async function prepare20_721Orders(t1Amount = 105) {
			await t1.mint(accounts[1], t1Amount);
			await erc721.mint(accounts[2], erc721TokenId1);
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
			await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[2]});

			const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[2], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
			return { left, right }
		}

		it("Transfer from ERC721 to ERC20, protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
			const { left, right } = await prepare721_20Orders()

			await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [1, 100], left, right);

			assert.equal(await t1.balanceOf(accounts[1]), 97);
			assert.equal(await t1.balanceOf(accounts[2]), 2);
			assert.equal(await erc721.balanceOf(accounts[1]), 0);
			assert.equal(await erc721.balanceOf(accounts[2]), 1);
			assert.equal(await t1.balanceOf(protocol), 6);
		})

		async function prepare721_20Orders(t1Amount = 105) {
			await erc721.mint(accounts[1], erc721TokenId1);
			await t1.mint(accounts[2], t1Amount);
			await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[2] });

			const left = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[2], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
			return { left, right }
		}

		it("Transfer from ERC20 to ERC20, protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
			const { left, right } = await prepare2Orders()

			await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [100, 200], left, right);

			assert.equal(await t1.balanceOf(accounts[1]), 2);
			assert.equal(await t1.balanceOf(accounts[2]), 97);
			assert.equal(await t2.balanceOf(accounts[1]), 200);
			assert.equal(await t2.balanceOf(accounts[2]), 20);
			assert.equal(await t1.balanceOf(protocol), 6);
		})
    async function prepare2Orders(t1Amount = 105, t2Amount = 220) {
    	await t1.mint(accounts[1], t1Amount);
      await t2.mint(accounts[2], t2Amount);
      await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
      await t2.approve(erc20TransferProxy.address, 10000000, { from: accounts[2] });

      const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC20, enc(t2.address), 200), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(accounts[2], Asset(ERC20, enc(t2.address), 200), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
      return { left, right }
    }
	})

  describe("Check doTransfers() with Royalties fees", () => {

		it("Transfer from ERC721(RoyaltiesV1) to ERC20 , protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
			const { left, right } = await prepare721V1_20Orders(105)

			await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [1, 100], left, right);

			assert.equal(await t1.balanceOf(accounts[1]), 2);
			assert.equal(await t1.balanceOf(accounts[0]), 82);
			assert.equal(await t1.balanceOf(accounts[2]), 10);
			assert.equal(await t1.balanceOf(accounts[3]), 5);
			assert.equal(await erc721V1.balanceOf(accounts[1]), 1);
			assert.equal(await erc721V1.balanceOf(accounts[0]), 0);
			assert.equal(await t1.balanceOf(protocol), 6);
		})

		async function prepare721V1_20Orders(t1Amount = 105) {
			await erc721V1.mint(accounts[0], erc721TokenId1, [[accounts[2], 1000], [accounts[3], 500]]);
			await t1.mint(accounts[1], t1Amount);
			await erc721V1.setApprovalForAll(transferProxy.address, true, {from: accounts[0]});
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });

			const left = Order(accounts[0], Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
			return { left, right }
		}

		it("Transfer from ERC20 to ERC721(RoyaltiesV2), protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
			const { left, right } = await prepare20_721V2Orders(105)

			await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [100, 1], left, right);

			assert.equal(await t1.balanceOf(accounts[1]), 2);
			assert.equal(await t1.balanceOf(accounts[0]), 82);
			assert.equal(await t1.balanceOf(accounts[2]), 10);
			assert.equal(await t1.balanceOf(accounts[3]), 5);
			assert.equal(await erc721V2.balanceOf(accounts[1]), 1);
			assert.equal(await erc721V2.balanceOf(accounts[0]), 0);
			assert.equal(await t1.balanceOf(protocol), 6);
		})

		async function prepare20_721V2Orders(t1Amount = 105) {
			await t1.mint(accounts[1], t1Amount);
			await erc721V2.mint(accounts[0], erc721TokenId1, [[accounts[2], 1000], [accounts[3], 500]]);
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
			await erc721V2.setApprovalForAll(transferProxy.address, true, {from: accounts[0]});

			const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC721, enc(erc721V2.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[0], Asset(ERC721, enc(erc721V2.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
			return { left, right }
		}

		it("Transfer from  ERC1155(RoyaltiesV1) to ERC20, protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
			const { left, right } = await prepare1155V1_20Orders(8, 105)

			await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [5, 100], left, right);

			assert.equal(await t1.balanceOf(accounts[1]), 2);
			assert.equal(await t1.balanceOf(accounts[0]), 82);
			assert.equal(await t1.balanceOf(accounts[2]), 10);
			assert.equal(await t1.balanceOf(accounts[3]), 5);
			assert.equal(await erc1155V1.balanceOf(accounts[1], erc1155TokenId1), 5);
			assert.equal(await erc1155V1.balanceOf(accounts[0], erc1155TokenId1), 3);
			assert.equal(await t1.balanceOf(protocol), 6);
		})

		async function prepare1155V1_20Orders(t1Amount = 10, t2Amount = 105) {
			await erc1155V1.mint(accounts[0], erc1155TokenId1, [[accounts[2], 1000], [accounts[3], 500]], t1Amount);
			await t1.mint(accounts[1], t2Amount);
			await erc1155V1.setApprovalForAll(transferProxy.address, true, {from: accounts[0]});
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });

			const left = Order(accounts[0], Asset(ERC1155, enc(erc1155V1.address, erc1155TokenId1), 5), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC1155, enc(erc1155V1.address, erc1155TokenId1), 5), 1, 0, 0, "0xffffffff", "0x");
			return { left, right }
		}

		it("Transfer from ERC20 to ERC1155(RoyaltiesV2), protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
			const { left, right } = await prepare20_1155V2Orders(105, 8)

			await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [100, 6], left, right);

			assert.equal(await t1.balanceOf(accounts[1]), 2);
			assert.equal(await t1.balanceOf(accounts[0]), 82);
			assert.equal(await t1.balanceOf(accounts[2]), 10);
			assert.equal(await t1.balanceOf(accounts[3]), 5);
			assert.equal(await erc1155V2.balanceOf(accounts[1], erc1155TokenId1), 6);
			assert.equal(await erc1155V2.balanceOf(accounts[0], erc1155TokenId1), 2);
			assert.equal(await t1.balanceOf(protocol), 6);
		})

		async function prepare20_1155V2Orders(t1Amount = 105, t2Amount = 10) {
			await t1.mint(accounts[1], t1Amount);
			await erc1155V2.mint(accounts[0], erc1155TokenId1, [[accounts[2], 1000], [accounts[3], 500]], t2Amount);
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
			await erc1155V2.setApprovalForAll(transferProxy.address, true, {from: accounts[0]});

			const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC1155, enc(erc1155V2.address, erc1155TokenId1), 6), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[0], Asset(ERC1155, enc(erc1155V2.address, erc1155TokenId1), 6), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");

			return { left, right }
		}

		it("Transfer from ETH to ERC1155V2, protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
			const { left, right } = await prepareETH_1155V2Orders(10)

      	await verifyBalanceChange(accounts[0], 103, () =>
        	verifyBalanceChange(accounts[1], -82, () =>
        		verifyBalanceChange(accounts[2], -10, () =>
        			verifyBalanceChange(accounts[3], -5, () =>
          			verifyBalanceChange(protocol, -6, () =>
             			testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [100, 7], left, right,
              			{value: 103, from: accounts[0], gasPrice: 0}
              		)
        				)
        			)
        		)
       		)
      	);
			assert.equal(await erc1155V2.balanceOf(accounts[0], erc1155TokenId1), 7);
			assert.equal(await erc1155V2.balanceOf(accounts[1], erc1155TokenId1), 3);
		})

		async function prepareETH_1155V2Orders(t2Amount  = 10) {
			await erc1155V2.mint(accounts[1], erc1155TokenId1, [[accounts[2], 1000], [accounts[3], 500]], t2Amount);
			await erc1155V2.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});

			const left = Order(accounts[0], Asset(ETH, "0x", 100), ZERO, Asset(ERC1155, enc(erc1155V2.address, erc1155TokenId1), 7), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[1], Asset(ERC1155, enc(erc1155V2.address, erc1155TokenId1), 7), ZERO, Asset(ETH, "0x", 100), 1, 0, 0, "0xffffffff", "0x");
			return { left, right }
		}

		it("Transfer from ERC20 to ERC721(RoyaltiesV1 With Error), protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
			const { left, right } = await prepare20_721V1ErOrders(105)

			await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [100, 1], left, right);

			assert.equal(await t1.balanceOf(accounts[1]), 2);
			assert.equal(await t1.balanceOf(accounts[0]), 97);
			assert.equal(await t1.balanceOf(accounts[2]), 0);
			assert.equal(await t1.balanceOf(accounts[3]), 0);
			assert.equal(await erc721V1_Error.balanceOf(accounts[1]), 1);
			assert.equal(await erc721V1_Error.balanceOf(accounts[0]), 0);
			assert.equal(await t1.balanceOf(protocol), 6);
		})

		async function prepare20_721V1ErOrders(t1Amount = 105) {
			await t1.mint(accounts[1], t1Amount);
			await erc721V1_Error.mint(accounts[0], erc721TokenId1, [[accounts[2], 1000], [accounts[3], 500]]);
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
			await erc721V1_Error.setApprovalForAll(transferProxy.address, true, {from: accounts[0]});

			const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC721, enc(erc721V1_Error.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[0], Asset(ERC721, enc(erc721V1_Error.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
			return { left, right }
		}

		it("Transfer from ERC1155(RoyaltiesV2 With Error) to ERC20, protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
			const { left, right } = await prepare1155V2_20ErOrders(12, 105)

			await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [5, 100], left, right);

			assert.equal(await t1.balanceOf(accounts[1]), 2);
			assert.equal(await t1.balanceOf(accounts[0]), 97);
			assert.equal(await t1.balanceOf(accounts[2]), 0);
			assert.equal(await t1.balanceOf(accounts[3]), 0);
			assert.equal(await erc1155V2_Error.balanceOf(accounts[1], erc1155TokenId1), 5);
			assert.equal(await erc1155V2_Error.balanceOf(accounts[0], erc1155TokenId1), 7);
			assert.equal(await t1.balanceOf(protocol), 6);
		})

		async function prepare1155V2_20ErOrders(t1Amount = 12, t2Amount = 105) {
			await erc1155V2_Error.mint(accounts[0], erc1155TokenId1, [[accounts[2], 1000], [accounts[3], 500]], t1Amount);
			await t1.mint(accounts[1], t2Amount);
			await erc1155V2_Error.setApprovalForAll(transferProxy.address, true, {from: accounts[0]});
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });

			const left = Order(accounts[0], Asset(ERC1155, enc(erc1155V2_Error.address, erc1155TokenId1), 5), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC1155, enc(erc1155V2_Error.address, erc1155TokenId1), 5), 1, 0, 0, "0xffffffff", "0x");
			return { left, right }
		}

	})
});
