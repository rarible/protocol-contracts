const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const ExchangeV2 = artifacts.require("ExchangeBulkV2.sol");
const TestERC20 = artifacts.require("TestERC20.sol");
const TestERC721 = artifacts.require("TestERC721.sol");
const TransferProxyTest = artifacts.require("TransferProxyTest.sol");
const ERC20TransferProxyTest = artifacts.require("ERC20TransferProxyTest.sol");
const truffleAssert = require('truffle-assertions');
const TestRoyaltiesRegistry = artifacts.require("TestRoyaltiesRegistry.sol");

const { Order, Asset, sign } = require("../order");
const EIP712 = require("../EIP712");
const ZERO = "0x0000000000000000000000000000000000000000";
const { expectThrow, verifyBalanceChange } = require("@daonomic/tests-common");
const { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, ORDER_DATA_V2, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, CRYPTO_PUNKS, COLLECTION, enc, id } = require("../assets");

contract("ExchangeBulkV2, sellerFee + buyerFee =  6%,", accounts => {
	let testing;
	let transferProxy;
	let erc20TransferProxy;
	let t1;
	let t2;
	let protocol = accounts[9];
	let community = accounts[8];
	const eth = "0x0000000000000000000000000000000000000000";
	let erc721TokenId0 = 52;
  let erc721TokenId1 = 53;
  let erc721TokenId2 = 54;
  let erc721TokenId3 = 55;
  let erc721TokenId4 = 56;
  let erc721TokenId5 = 57;
  let royaltiesRegistry;

	beforeEach(async () => {
//		libOrder = await LibOrderTest.new();
		transferProxy = await TransferProxyTest.new();
		erc20TransferProxy = await ERC20TransferProxyTest.new();
		royaltiesRegistry = await TestRoyaltiesRegistry.new();
		testing = await deployProxy(ExchangeV2, [transferProxy.address, erc20TransferProxy.address, 300, community, royaltiesRegistry.address], { initializer: "__ExchangeV2_init" });
		t1 = await TestERC20.new();
		t2 = await TestERC20.new();
    /*ETH*/
    await testing.setFeeReceiver(eth, protocol);
    await testing.setFeeReceiver(t1.address, protocol);
 		/*ERC721 */
 		erc721 = await TestERC721.new("Rarible", "RARI", "https://ipfs.rarible.com");
	});
	describe("matchOrders Bulk", () => {
		it("Test Bulk2 (num = 3) with ERC721<->ETH ", async () => {
		  const buyer = accounts[2];
		  await erc721.mint(accounts[1], erc721TokenId1);
		  await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
		  await erc721.mint(accounts[3], erc721TokenId2);
		  await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[3]});
		  await erc721.mint(accounts[4], erc721TokenId3);
		  await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[4]});

		  const left1 = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 100), 1, 0, 0, "0xffffffff", "0x");
		  const left2 = Order(accounts[3], Asset(ERC721, enc(erc721.address, erc721TokenId2), 1), ZERO, Asset(ETH, "0x", 100), 1, 0, 0, "0xffffffff", "0x");
		  const left3 = Order(accounts[4], Asset(ERC721, enc(erc721.address, erc721TokenId3), 1), ZERO, Asset(ETH, "0x", 100), 1, 0, 0, "0xffffffff", "0x");
		  let signatureLeft1 = await getSignature(left1, accounts[1]);
		  let signatureLeft2 = await getSignature(left2, accounts[3]);
		  let signatureLeft3 = await getSignature(left3, accounts[4]);

//    	await verifyBalanceChange(buyer, 309, async () =>
//    		verifyBalanceChange(accounts[1], -97, async () =>
//    		  verifyBalanceChange(accounts[3], -97, async () =>
//    		    verifyBalanceChange(accounts[4], -97, async () =>
//    			    verifyBalanceChange(protocol, -18, () =>
//    				    testing.matchOrdersBulk([left1, left2, left3], [signatureLeft1, signatureLeft2, signatureLeft3], buyer, { from: buyer, value: 400, gasPrice: 0 })
//    				  )
//    				)
//    			)
//    		)
//    	);
    	const tx = await testing.matchOrdersBulk([left1, left2, left3], [signatureLeft1, signatureLeft2, signatureLeft3], buyer, { from: buyer, value: 1000, gasPrice: 0 });
    	console.log("Bulk2, ERC721<->ETH (num = 3), Gas consumption :",tx.receipt.gasUsed);
    	assert.equal(await erc721.balanceOf(accounts[1]), 0);
    	assert.equal(await erc721.balanceOf(accounts[2]), 3); //transfer all
    })

		it("Test Bulk2 (num = 3) with ERC721<->ERC20", async () => {
			const { left1,left2,left3, signatureLeft1, signatureLeft2, signatureLeft3 } = await prepare721DV1_2Array0rders3();
      const buyer = accounts[2];
			const tx = await testing.matchOrdersBulk([left1,left2,left3], [signatureLeft1, signatureLeft2, signatureLeft3], buyer, { from: accounts[2] });
      console.log("ERC721<->ERC20 (num = 3), Gas consumption :", tx.receipt.gasUsed);
//			assert.equal(await t2.balanceOf(accounts[1]), 97);	//=100 - 3sellerFee
//			assert.equal(await t2.balanceOf(accounts[2]), 2);		//=105 - (100amount + 3byuerFee )
//			assert.equal(await erc721.balanceOf(accounts[1]), 0);
//			assert.equal(await erc721.balanceOf(accounts[2]), 1);
//			assert.equal(await t2.balanceOf(community), 6);
		})

		async function prepare721DV1_2Array0rders3(t2Amount = 105) {
			await erc721.mint(accounts[1], erc721TokenId1);
			await erc721.mint(accounts[3], erc721TokenId2);
			await erc721.mint(accounts[4], erc721TokenId3);
			await t2.mint(accounts[2], t2Amount*3);
			await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
			await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[3]});
			await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[4]});
			await t2.approve(erc20TransferProxy.address, 10000000, { from: accounts[2] });
			const left1 = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(t2.address), 100), 1, 0, 0, "0xffffffff", "0x");
			const left2 = Order(accounts[3], Asset(ERC721, enc(erc721.address, erc721TokenId2), 1), ZERO, Asset(ERC20, enc(t2.address), 100), 1, 0, 0, "0xffffffff", "0x");
			const left3 = Order(accounts[4], Asset(ERC721, enc(erc721.address, erc721TokenId3), 1), ZERO, Asset(ERC20, enc(t2.address), 100), 1, 0, 0, "0xffffffff", "0x");
			let signatureLeft1 = await getSignature(left1, accounts[1]);
      let signatureLeft2 = await getSignature(left2, accounts[3]);
      let signatureLeft3 = await getSignature(left3, accounts[4]);
			return { left1, left2, left3, signatureLeft1, signatureLeft2, signatureLeft3 };
		}

  });

	async function getSignature(order, signer) {
		return sign(order, signer, testing.address);
	}
});
