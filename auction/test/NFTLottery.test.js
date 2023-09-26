
const TestERC721 = artifacts.require("TestERC721.sol");
const NFTLottery = artifacts.require("NFTLottery");

const truffleAssert = require('truffle-assertions');

const { verifyBalanceChangeReturnTx } = require("../../scripts/balance")

const zeroAddress = "0x0000000000000000000000000000000000000000";

contract("AuctionHouse721", accounts => {
  let nftLottery;
  let erc721;

  before(async () => {
    nftLottery = await NFTLottery.new();
    erc721 = await TestERC721.new("Rarible", "Rari")
  });

  it("lottery works", async () => {
    const seller = accounts[1]
    const tokenId = 123;
    const price = "1000000000000000000"
    const amountOfTikects = 10;

    const id = 1;

    //prepare token
    await erc721.mint(seller, tokenId);
    await erc721.setApprovalForAll(nftLottery.address, true, { from: seller });
    assert.equal(await erc721.ownerOf(tokenId), seller)

    //start lottery
    const txStart = await nftLottery.startLottery(erc721.address, tokenId, price, amountOfTikects, {from: seller})

    let LotteryCreated;
    truffleAssert.eventEmitted(txStart, 'LotteryCreated', (ev) => {
      LotteryCreated = ev;
      return true;
    });
    //console.log("event", LotteryCreated)
    //console.log("storage", await nftLottery.lotteries(id))

    assert.equal(await erc721.ownerOf(tokenId), nftLottery.address)

    console.log(await nftLottery.getTicketsLeft(id))
    console.log(await nftLottery.isLotteryFinalised(id))
    console.log(await nftLottery.getBuyers(id))

    //first buyer
    const buyer1 = accounts[2]
    
    const txBuy1 = await nftLottery.buyTikects(id, 2, {from: buyer1, value: "200000000000000000"})

    let TicketsBought1;
    truffleAssert.eventEmitted(txBuy1, 'TicketsBought', (ev) => {
      TicketsBought1 = ev;
      return true;
    });
    //console.log(TicketsBought1)

    console.log(await nftLottery.getTicketsLeft(id))
    console.log(await nftLottery.isLotteryFinalised(id))
    console.log(await nftLottery.getBuyers(id))

    //second buyer
    const buyer2 = accounts[3]

    const txBuy2 = await nftLottery.buyTikects(id, 5, {from: buyer2, value: "500000000000000000"})

    let TicketsBought2;
    truffleAssert.eventEmitted(txBuy2, 'TicketsBought', (ev) => {
      TicketsBought2 = ev;
      return true;
    });
    //console.log(TicketsBought2)

    console.log(await nftLottery.getTicketsLeft(id))
    console.log(await nftLottery.isLotteryFinalised(id))
    console.log(await nftLottery.getBuyers(id))

    //third buyer
    const buyer3 = accounts[4]

    const txBuy3 = await nftLottery.buyTikects(id, 3, {from: buyer3, value: "300000000000000000"})

    let TicketsBought3;
    truffleAssert.eventEmitted(txBuy3, 'TicketsBought', (ev) => {
      TicketsBought3 = ev;
      return true;
    });
    //console.log(TicketsBought3)

    console.log(await nftLottery.getTicketsLeft(id))
    console.log(await nftLottery.isLotteryFinalised(id))
    console.log(await nftLottery.getBuyers(id))

    //finalising
    await nftLottery.finaliseLottery(id, {from: seller})
    
    console.log(await erc721.ownerOf(tokenId))
  })

});
