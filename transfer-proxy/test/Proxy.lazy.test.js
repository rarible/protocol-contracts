const ERC721LazyMintTest = artifacts.require("ERC721LazyMintTest.sol");
const ERC1155LazyMintTest = artifacts.require("ERC1155LazyMintTest.sol");
const ERC721LazyMintTransferProxy = artifacts.require("ERC721LazyMintTransferProxy.sol")
const ERC1155LazyMintTransferProxy = artifacts.require("ERC1155LazyMintTransferProxy.sol")

const { Asset } = require("../order");
const { expectThrow } = require("@daonomic/tests-common");
const { id } = require("../assets");

contract("Exchange with LazyMint proxies", accounts => {
  let erc721Test;
  let erc1155Test;

	beforeEach(async () => {
	  erc721Test = await ERC721LazyMintTest.new();
	  erc1155Test = await ERC1155LazyMintTest.new();
	});

	it("lazy mint proxyTransfer works for ERC-721", async () => {
		const proxy = await ERC721LazyMintTransferProxy.new();
		await proxy.__OperatorRole_init();
		await proxy.addOperator(accounts[1]);

		const encodedMintData = await erc721Test.encode([1, "uri", [[accounts[1], 0], [accounts[3], 0]], [], []]);
		//transfer by ERC721LazyMintTransferProxy.transfer
    proxy.transfer(Asset(id("ERC721_LAZY"), encodedMintData, 1), accounts[1], accounts[2], { from: accounts[1] });
    //check owner token after transfer
    assert.equal(await erc721Test.ownerOf(1), accounts[2]);
	})

	it("lazy mint proxyTransfer works for ERC-721, wrong operator, throw", async () => {
		const proxy = await ERC721LazyMintTransferProxy.new();
		await proxy.__OperatorRole_init();
		await proxy.addOperator(accounts[1]);

		const encodedMintData = await erc721Test.encode([1, "uri", [[accounts[1], 0], [accounts[3], 0]], [], []]);
		//transfer by ERC721LazyMintTransferProxy.transfer
		await expectThrow(
			proxy.transfer(Asset(id("ERC721_LAZY"), encodedMintData, 1), accounts[1], accounts[2], { from: accounts[4] })
		);
	})

	it("lazy mint proxyTransfer works for ERC-1155", async () => {
		const proxy = await ERC1155LazyMintTransferProxy.new();
		await proxy.__OperatorRole_init();
		await proxy.addOperator(accounts[1]);

	  const encodedMintData = await erc1155Test.encode([1, "uri", 10, [[accounts[1], 0], [accounts[3], 0]], [], []]);
		//transfer by ERC721LazyMintTransferProxy.transfer
    proxy.transfer(Asset(id("ERC1155_LAZY"), encodedMintData, 5), accounts[1], accounts[2], { from: accounts[1] });
    //check owner token after transfer
    assert.equal(await erc1155Test.balanceOf(accounts[2], 1), 5);
	})

	it("lazy mint proxyTransfer works for ERC-1155, wrong operator, throw", async () => {
		const proxy = await ERC1155LazyMintTransferProxy.new();
		await proxy.__OperatorRole_init();
		await proxy.addOperator(accounts[1]);

	  const encodedMintData = await erc1155Test.encode([1, "uri", 10, [[accounts[1], 0], [accounts[3], 0]], [], []]);
		//transfer by ERC721LazyMintTransferProxy.transfer
		await expectThrow(
      proxy.transfer(Asset(id("ERC1155_LAZY"), encodedMintData, 5), accounts[1], accounts[2], { from: accounts[5] })
    );
	})

});
