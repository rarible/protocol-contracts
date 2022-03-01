const WyvernExchangeProxy = artifacts.require("WyvernExchangeProxy.sol");
//const order = require("../../exchange-v2/test/order.js");
//const { enc, ETH, ERC20, ERC721, ERC721_LAZY, ERC1155, ERC1155_LAZY, COLLECTION, id } = require("../../exchange-v2/test/assets.js");

contract("WyvernExchangeProxy", accounts => {
  let wyvernExchangeProxy;
  const feeReciever = accounts[3];

  beforeEach(async () => {
    wyvernExchangeProxy = await WyvernExchangeProxy.new();
    await wyvernExchangeProxy.setFeeReceiver(feeReciever);
  });

  describe("Check methods through wyvernExchange emulator ", () => {
    it("NFT <-> ETH  matches and transfer", async () => {
    });

  })
});
