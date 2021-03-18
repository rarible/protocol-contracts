const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const ExchangeSimpleV2 = artifacts.require("ExchangeSimpleV2.sol");
const TestERC20 = artifacts.require("TestERC20.sol");
const TransferProxy = artifacts.require("TransferProxy.sol");
const ERC20TransferProxy = artifacts.require("ERC20TransferProxy.sol");
const LibOrderTest = artifacts.require("LibOrderTest.sol");
const ERC721LazyMintTest = artifacts.require("ERC721LazyMintTest.sol");
const ERC1155LazyMintTest = artifacts.require("ERC1155LazyMintTest.sol");
const ERC721LazyMintTransferProxy = artifacts.require("ERC721LazyMintTransferProxy.sol")
const ERC1155LazyMintTransferProxy = artifacts.require("ERC1155LazyMintTransferProxy.sol")

const { Order, Asset, sign } = require("../order");
const EIP712 = require("../EIP712");
const ZERO = "0x0000000000000000000000000000000000000000";
const { expectThrow, verifyBalanceChange } = require("@daonomic/tests-common");
const { ETH, ERC20, ERC721, ERC1155, enc, id } = require("../assets");

contract("Exchange with LazyMint proxies", accounts => {
	let testing;
	let transferProxy;
	let erc20TransferProxy;
	let t1;
	let libOrder;

	beforeEach(async () => {
		libOrder = await LibOrderTest.new();
		transferProxy = await TransferProxy.new();
		await transferProxy.__TransferProxy_init();
		erc20TransferProxy = await ERC20TransferProxy.new();
		await erc20TransferProxy.__ERC20TransferProxy_init();
		testing = await deployProxy(ExchangeSimpleV2, [transferProxy.address, erc20TransferProxy.address], { initializer: "__ExchangeSimpleV2_init" });
		await transferProxy.addOperator(testing.address);
		await erc20TransferProxy.addOperator(testing.address);
		t1 = await TestERC20.new();
	});

	it("setTransferProxy can be invoked only by owner", async () => {
		const proxy = await ERC721LazyMintTransferProxy.new();

		await expectThrow(
			testing.setTransferProxy(id("ERC721_LAZY"), proxy.address, { from: accounts[1] })
		);
	})

	it("lazy mint works for ERC-721", async () => {
		const erc721Test = await ERC721LazyMintTest.new();
		const proxy = await ERC721LazyMintTransferProxy.new();
		await testing.setTransferProxy(id("ERC721_LAZY"), proxy.address)

		await t1.mint(accounts[2], 100);
		await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[2] });

		const encodedMintData = await erc721Test.encode([1, "uri", [accounts[1], accounts[3]], [], []]);

		const left = Order(accounts[1], Asset(id("ERC721_LAZY"), encodedMintData, 1), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
		const right = Order(accounts[2], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(id("ERC721_LAZY"), encodedMintData, 1), 1, 0, 0, "0xffffffff", "0x");

		await testing.matchOrders(left, await getSignature(left, accounts[1]), right, await getSignature(right, accounts[2]));

		assert.equal(await erc721Test.ownerOf(1), accounts[2]);
		assert.equal(await t1.balanceOf(accounts[1]), 100);
	})
	
	it("lazy mint works for ERC-1155", async () => {
		const erc1155Test = await ERC1155LazyMintTest.new();
		const proxy = await ERC1155LazyMintTransferProxy.new();
		await testing.setTransferProxy(id("ERC1155_LAZY"), proxy.address)

		await t1.mint(accounts[2], 100);
		await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[2] });

		const encodedMintData = await erc1155Test.encode([1, "uri", 10, [accounts[1], accounts[3]], [], []]);

		const left = Order(accounts[1], Asset(id("ERC1155_LAZY"), encodedMintData, 5), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
		const right = Order(accounts[2], Asset(ERC20, enc(t1.address), 40), ZERO, Asset(id("ERC1155_LAZY"), encodedMintData, 2), 1, 0, 0, "0xffffffff", "0x");

		await testing.matchOrders(left, await getSignature(left, accounts[1]), right, await getSignature(right, accounts[2]));

		assert.equal(await erc1155Test.balanceOf(accounts[2], 1), 2);
		assert.equal(await t1.balanceOf(accounts[1]), 40);
	})

	async function getSignature(order, signer) {
		return sign(order, signer, Number(await testing.getChainId()), testing.address);
	}

});
