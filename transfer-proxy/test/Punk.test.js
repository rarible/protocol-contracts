const CryptoPunksMarket = artifacts.require("CryptoPunksMarket.sol");
const PunkTransferProxy = artifacts.require("PunkTransferProxy.sol")

const { Asset } = require("../order");
const { expectThrow } = require("@daonomic/tests-common");
const { id, enc } = require("../assets");
const truffleAssert = require('truffle-assertions');

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

    assert.equal(await cryptoPunksMarket.balanceOf(accounts[1]), 1); //punk owner accounts[1]
		const encodedPunkData = await enc(cryptoPunksMarket.address, punkIndex);

		let from, to, index;
    let res = await proxy.transfer(Asset(id("PUNK"), encodedPunkData, 1), accounts[1], accounts[2], { from: accounts[1] });
    assert.equal(await cryptoPunksMarket.balanceOf(accounts[1]), 0);
    assert.equal(await cryptoPunksMarket.balanceOf(proxy.address), 1);

    await cryptoPunksMarket.buyPunk(punkIndex, { from: accounts[2] });
    assert.equal(await cryptoPunksMarket.balanceOf(accounts[2]), 1);
    assert.equal(await cryptoPunksMarket.balanceOf(proxy.address), 0);
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
/*
Деплоим контракт с адреса CONTRACT_OWNER
  Вызываем функцию 'allInitialOwnersAssigned()' с адреса CONTRACT_OWNER. После этого панков можно брать за бесплатно пока они есть.

  С произвольных адресов USER_1 (USER_i) вызываем 'getPunk(PUNK_INDEX)' где PUNK_INDEX in [0; 9999);
    После этого USER_1 "владеет" панком PUNK_INDEX
    Например USER_1 взял панка №33.

  Продажа панка от владельца:
  USER_1 хочет продать панка №33
   Вызывает со своего адреса функцию 'offerPunkForSale(33, 100500)'
   --- Генерируется евент PunkOffered(33, 100500, 0x0)

  USER_2 хочет купить панка №33
   Вызывает со своего адреса функцию 'buyPunk(33)' и посылает на адрес контракта 100500 эфиров
   Контракт видит, что панк №33 на продаже за эту же сумму, и USER_2 становится владельцем.
   --- Генерируется евент PunkBought(33, 100500, USER_1 <seller>, USER_2 <buyer>)
*/