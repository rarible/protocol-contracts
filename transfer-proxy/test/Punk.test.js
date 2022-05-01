const CryptoPunksMarket = artifacts.require("CryptoPunksMarket.sol");
const PunkTransferProxy = artifacts.require("PunkTransferProxy.sol")

const { Asset } = require("../../scripts/order.js");
const { expectThrow } = require("@daonomic/tests-common");
const { id, enc } = require("../../scripts/assets.js");
const truffleAssert = require('truffle-assertions');

/*Proxy  buy punk, sfter Proxy transfer punk to buyer */
contract("Exchange with PunkTransfer proxies", accounts => {
  let punkIndex = 256;
  let proxy;
  const operator = accounts[1]

  beforeEach(async () => {
    cryptoPunksMarket = await CryptoPunksMarket.new();
    await cryptoPunksMarket.allInitialOwnersAssigned(); //allow test contract work with Punk CONTRACT_OWNER accounts[0]
    proxy = await PunkTransferProxy.new();;
    await proxy.__OperatorRole_init();
    await proxy.addOperator(operator)
  });

	it("Proxy transfer punk", async () => {
    await cryptoPunksMarket.getPunk(punkIndex, { from: accounts[1] }); //accounts[1] - owner punk with punkIndex
    await cryptoPunksMarket.offerPunkForSaleToAddress(punkIndex, 0, proxy.address, { from: accounts[1] }); //accounts[1] - wants to sell punk with punkIndex, min price 0 wei

    assert.equal(await cryptoPunksMarket.balanceOf(accounts[1]), 1); //punk owner - accounts[1]
    const encodedPunkData = await enc(cryptoPunksMarket.address, punkIndex);

    await proxy.transfer(Asset(id("PUNK"), encodedPunkData, 1), accounts[1], accounts[2], { from: operator });
    assert.equal(await cryptoPunksMarket.balanceOf(accounts[1]), 0);
    assert.equal(await cryptoPunksMarket.balanceOf(proxy.address), 0);
    assert.equal(await cryptoPunksMarket.balanceOf(accounts[2]), 1);//punk owner - accounts[2]
  })

  it("Try to transfer punk, which not offer to sale, throw", async () => {
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
    await cryptoPunksMarket.getPunk(punkIndex, { from: accounts[1] }); //accounts[1] - owner punk with punkIndex
    await cryptoPunksMarket.offerPunkForSaleToAddress(punkIndex, 0, accounts[2], { from: accounts[1] }); //accounts[1] - wants to sell punk to accounts[2]  with punkIndex, min price 0 wei

    assert.equal(await cryptoPunksMarket.balanceOf(accounts[1]), 1); //punk owner accounts[1]
    const encodedPunkData = await enc(cryptoPunksMarket.address, punkIndex);

    await expectThrow(
      proxy.transfer(Asset(id("PUNK"), encodedPunkData, 1), accounts[1], accounts[2], { from: accounts[1] })
    );
  })

  it("Check punk event", async () => {
    await cryptoPunksMarket.getPunk(punkIndex, { from: accounts[1] }); //accounts[1] - owner punk with punkIndex
    let addressTo;
    let index;
    let price;
    let resOffer = await cryptoPunksMarket.offerPunkForSaleToAddress(punkIndex, 5, proxy.address, { from: accounts[1] }); //accounts[1] - wants to sell punk with punkIndex, min price 0 wei
    truffleAssert.eventEmitted(resOffer, 'PunkOffered', (ev) => {
      addressTo = ev.toAddress;
      index = ev.punkIndex;
      price = ev.minValue;
      return true;
    });
    assert.equal(addressTo, proxy.address);
    assert.equal(index, punkIndex);
    assert.equal(price, 5);
  })
});
