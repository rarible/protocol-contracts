const CryptoPunksMarket = artifacts.require("CryptoPunksMarket.sol");
const PunkTransferProxy = artifacts.require("PunkTransferProxy.sol")

const { Asset } = require("../order");
const { expectThrow } = require("@daonomic/tests-common");
const { id, enc } = require("../assets");
const truffleAssert = require('truffle-assertions');
/*Proxy  buy punk, sfter Proxy transfer punk to buyer */
contract("Exchange with PunkTransfer proxies", accounts => {
  let marketTest;
  let punkIndex = 256;

	beforeEach(async () => {
	  cryptoPunksMarket = await CryptoPunksMarket.new();
	  await cryptoPunksMarket.allInitialOwnersAssigned(); //allow test contract work with Punk CONTRACT_OWNER accounts[0]
	});

	it("Proxy transfer punk", async () => {
		const proxy = await PunkTransferProxy.new();

    await cryptoPunksMarket.getPunk(punkIndex, { from: accounts[1] }); //accounts[1] - owner punk with punkIndex
    await cryptoPunksMarket.offerPunkForSaleToAddress(punkIndex, 0, proxy.address, { from: accounts[1] }); //accounts[1] - wants to sell punk with punkIndex, min price 0 wei

    assert.equal(await cryptoPunksMarket.balanceOf(accounts[1]), 1); //punk owner - accounts[1]
		const encodedPunkData = await enc(cryptoPunksMarket.address, punkIndex);

		let from, to, index;
    let res = await proxy.transfer(Asset(id("PUNK"), encodedPunkData, 1), accounts[1], accounts[2], { from: accounts[1] });
    assert.equal(await cryptoPunksMarket.balanceOf(accounts[1]), 0);
    assert.equal(await cryptoPunksMarket.balanceOf(proxy.address), 0);
    assert.equal(await cryptoPunksMarket.balanceOf(accounts[2]), 1);//punk owner - accounts[2]
	})

	it("Try to transfer punk, which not offer to sale, throw", async () => {
		const proxy = await PunkTransferProxy.new();

    await cryptoPunksMarket.getPunk(punkIndex, { from: accounts[1] }); //accounts[1] - owner punk with punkIndex
    await cryptoPunksMarket.offerPunkForSaleToAddress(punkIndex, 0, proxy.address, { from: accounts[1] }); //accounts[1] - wants to sell punk to proxy with punkIndex, min price 0 wei
    let anotherPunkIndex = 300;
    assert.equal(await cryptoPunksMarket.balanceOf(accounts[1]), 1); //punk owner accounts[1]
		const encodedPunkData = await enc(cryptoPunksMarket.address, anotherPunkIndex);

		await expectThrow(
    	proxy.transfer(Asset(id("PUNK"), encodedPunkData, 1), accounts[1], accounts[2], { from: accounts[1] })
    );
	})

	it("Try to transfer punk, which offer not for proxy.address, throw", async () => {
		const proxy = await PunkTransferProxy.new();

    await cryptoPunksMarket.getPunk(punkIndex, { from: accounts[1] }); //accounts[1] - owner punk with punkIndex
    await cryptoPunksMarket.offerPunkForSaleToAddress(punkIndex, 0, accounts[2], { from: accounts[1] }); //accounts[1] - wants to sell punk to accounts[2]  with punkIndex, min price 0 wei

    assert.equal(await cryptoPunksMarket.balanceOf(accounts[1]), 1); //punk owner accounts[1]
		const encodedPunkData = await enc(cryptoPunksMarket.address, punkIndex);

		let from, to, index;
		await expectThrow(
    	proxy.transfer(Asset(id("PUNK"), encodedPunkData, 1), accounts[1], accounts[2], { from: accounts[1] })
    );
	})

	it("Check punk event", async () => {
		const proxy = await PunkTransferProxy.new();

    await cryptoPunksMarket.getPunk(punkIndex, { from: accounts[1] }); //accounts[1] - owner punk with punkIndex
    let addresTo;
    let index;
    let price;
    let resOffer = await cryptoPunksMarket.offerPunkForSaleToAddress(punkIndex, 5, proxy.address, { from: accounts[1] }); //accounts[1] - wants to sell punk with punkIndex, min price 0 wei
    truffleAssert.eventEmitted(resOffer, 'PunkOffered', (ev) => {
    	addresTo = ev.toAddress;
    	index = ev.punkIndex;
    	price = ev.minValue;
      return true;
    });
    assert.equal(addresTo, proxy.address);
    assert.equal(index, punkIndex);
    assert.equal(price, 5);
	})

});
