const MarketTest = artifacts.require("MarketTest.sol");
const PunkTransferProxy = artifacts.require("PunkTransferProxy.sol")

const { Asset } = require("../order");
const { expectThrow } = require("@daonomic/tests-common");
const { id, enc } = require("../assets");

contract("Exchange with PunkTransfer proxies", accounts => {
  let marketTest;
  let punkIndex = 256;

	beforeEach(async () => {
	  marketTest = await MarketTest.new();
	});

	it("Proxy punk test", async () => {
		const proxy = await PunkTransferProxy.new();
		await proxy.__OperatorRole_init();
		await proxy.addOperator(accounts[1]);

		const encodedPunkData = await enc(marketTest.address, punkIndex);

		//transfer by PunkTransferProxy.transfer
    proxy.transfer(Asset(id("PUNK"), encodedPunkData, 1), accounts[1], accounts[2], { from: accounts[1] });
    //check owner token after transfer
//    assert.equal(await marketTest.ownerOf(1), accounts[2]);
	})

});
