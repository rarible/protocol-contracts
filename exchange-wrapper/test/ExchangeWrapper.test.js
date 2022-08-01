const ExchangeBulkV2 = artifacts.require("ExchangeWrapper.sol");
const WrapperHelper = artifacts.require("WrapperHelper.sol");

const TestERC721 = artifacts.require("TestERC721.sol");
const TestERC1155 = artifacts.require("TestERC1155.sol");
const TestERC20 = artifacts.require("TestERC20.sol");
const WETH9 = artifacts.require('WETH9');

//LOOKS RARE
const LooksRareTestHelper = artifacts.require("LooksRareTestHelper.sol");
const LooksRareExchange = artifacts.require("LooksRareExchange.sol");
const LR_currencyManager = artifacts.require("CurrencyManager.sol");
const LR_executionManager = artifacts.require("ExecutionManager.sol")
const LR_royaltyFeeManager =  artifacts.require("RoyaltyFeeManager.sol");
const WETH = artifacts.require("WETH9.sol");
const RoyaltyFeeRegistry = artifacts.require("RoyaltyFeeRegistry.sol");
const TransferSelectorNFT = artifacts.require("TransferSelectorNFT.sol");
const TransferManagerERC721 = artifacts.require("TransferManagerERC721.sol");
const TransferManagerERC1155 = artifacts.require("TransferManagerERC1155.sol");

//X2Y2
const ERC721Delegate = artifacts.require("ERC721Delegate.sol");
const X2Y2_r1 = artifacts.require("X2Y2_r1.sol");

const { Order, Asset, sign } = require("../../scripts/order.js");
const { expectThrow, verifyBalanceChange } = require("@daonomic/tests-common");
const { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, ORDER_DATA_V2, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, CRYPTO_PUNKS, COLLECTION, enc, id } = require("../../scripts/assets");
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

contract("ExchangeBulkV2, sellerFee + buyerFee =  6%,", accounts => {
  let bulkExchange;
  let exchangeV2;
  let wrapperHelper;
  let transferProxy;
  let helper;
  const eth = "0x0000000000000000000000000000000000000000";
  let erc721;
  let erc1155;
  let seller = accounts[1];
  const tokenId = 12345;

  before(async () => {
    wrapperHelper = await WrapperHelper.new();
    bulkExchange = await ExchangeBulkV2.deployed();
  })

  beforeEach(async () => {
    /*ERC721 */
    erc721 = await TestERC721.new("Rarible", "RARI", "https://ipfs.rarible.com");
    /*ERC1155*/
    erc1155 = await TestERC1155.new("https://ipfs.rarible.com");
  });

  describe("purcahase LooksRare orders", () => {
    it("wrapper call matchAskWithTakerBidUsingETHAndWETH  ETH<->ERC721", async () => {
      const buyerLocal1 = accounts[2];
      const LR_protocolFeeRecipient = accounts[3];
      const lr_currencyManager = await LR_currencyManager.new();
      const lr_executionManager = await LR_executionManager.new();
      const LR_royaltyFeeRegistry = await RoyaltyFeeRegistry.new(9000);
      const lr_royaltyFeeManager = await LR_royaltyFeeManager.new(LR_royaltyFeeRegistry.address);
      const weth = await WETH.new();
      const looksRareExchange = await LooksRareExchange.new(lr_currencyManager.address, lr_executionManager.address, lr_royaltyFeeManager.address, weth.address, LR_protocolFeeRecipient);
      const transferManagerERC721 = await TransferManagerERC721.new(looksRareExchange.address);
      const transferManagerERC1155 = await TransferManagerERC1155.new(looksRareExchange.address);
      const transferSelectorNFT = await TransferSelectorNFT.new(transferManagerERC721.address, transferManagerERC1155.address);// transfer721, transfer1155

      await looksRareExchange.updateTransferSelectorNFT(transferSelectorNFT.address);
      await lr_currencyManager.addCurrency(weth.address);
      const lr_strategy = await LooksRareTestHelper.new(0);
      await lr_executionManager.addStrategy(lr_strategy.address);

      await bulkExchange.setLooksRare(looksRareExchange.address);

      const token = await TestERC721.new();
      await token.mint(seller, tokenId)
      await token.setApprovalForAll(transferManagerERC721.address, true, {from: seller});
      await transferSelectorNFT.addCollectionTransferManager(token.address, transferManagerERC721.address);

      const takerBid = {
        isOrderAsk: false,
        taker: bulkExchange.address,
        price: 10000,
        tokenId: '0x3039',
        minPercentageToAsk: 8000,
        params: '0x'
      }
      const makerAsk = {
        isOrderAsk: true,
        signer: seller,
        collection: token.address,
        price: 10000,
        tokenId: '0x3039',
        amount: 1,
        strategy: lr_strategy.address,
        currency: weth.address,
        nonce: 16,
        startTime: 0,
        endTime: '0xff00000000000000000000000000',
        minPercentageToAsk: 8000,
        params: '0x',
        v: 28,
        r: '0x66719130e732d87a2fd63e4b5360f627d013b93a9c6768ab3fa305c178c84388',
        s: '0x6f56a6089adf5af7cc45885d4294ebfd7ea9326a42aa977fc0732677e007cdd3'
      }
      console.log("LooksRare: ETH <=> ERC721")

      assert.equal(await token.balanceOf(buyerLocal1), 0);
      let dataForLooksRare = await wrapperHelper.getDataWrapperMatchAskWithTakerBidUsingETHAndWETH(takerBid, makerAsk, ERC721);
      const tradeDataSeaPort = PurchaseData(5, 10000, dataForLooksRare);
      let feesUP = [];

      const tx = await bulkExchange.singlePurchase(tradeDataSeaPort, feesUP, {from: buyerLocal1, value: 10000})
      console.log("wrapper call LooksRare: ETH <=> ERC721", tx.receipt.gasUsed)
      assert.equal(await token.balanceOf(buyerLocal1), 1);
      assert.equal(await weth.balanceOf(seller), 10000);
    })

    it("wrapper call matchAskWithTakerBidUsingETHAndWETH  ETH<->ERC1155", async () => {
      const buyerLocal1 = accounts[2];
      const LR_protocolFeeRecipient = accounts[3];
      const lr_currencyManager = await LR_currencyManager.new();
      const lr_executionManager = await LR_executionManager.new();
      const LR_royaltyFeeRegistry = await RoyaltyFeeRegistry.new(9000);
      const lr_royaltyFeeManager = await LR_royaltyFeeManager.new(LR_royaltyFeeRegistry.address);
      const weth = await WETH.new();
      const looksRareExchange = await LooksRareExchange.new(lr_currencyManager.address, lr_executionManager.address, lr_royaltyFeeManager.address, weth.address, LR_protocolFeeRecipient);
      const transferManagerERC721 = await TransferManagerERC721.new(looksRareExchange.address);
      const transferManagerERC1155 = await TransferManagerERC1155.new(looksRareExchange.address);
      const transferSelectorNFT = await TransferSelectorNFT.new(transferManagerERC721.address, transferManagerERC1155.address);// transfer721, transfer1155

      await looksRareExchange.updateTransferSelectorNFT(transferSelectorNFT.address);
      await lr_currencyManager.addCurrency(weth.address);
      const lr_strategy = await LooksRareTestHelper.new(0);
      await lr_executionManager.addStrategy(lr_strategy.address);

      await bulkExchange.setLooksRare(looksRareExchange.address);

      const token = await TestERC1155.new();
      await token.mint(seller, tokenId, 10)
      await token.setApprovalForAll(transferManagerERC1155.address, true, {from: seller});
      await transferSelectorNFT.addCollectionTransferManager(token.address, transferManagerERC1155.address);

      const takerBid = {
        isOrderAsk: false,
        taker: bulkExchange.address,
        price: 10000,
        tokenId: '0x3039',
        minPercentageToAsk: 8000,
        params: '0x'
      }
      const makerAsk = {
        isOrderAsk: true,
        signer: seller,
        collection: token.address,
        price: 10000,
        tokenId: '0x3039',
        amount: 10,
        strategy: lr_strategy.address,
        currency: weth.address,
        nonce: 16,
        startTime: 0,
        endTime: '0xff00000000000000000000000000',
        minPercentageToAsk: 8000,
        params: '0x',
        v: 28,
        r: '0x66719130e732d87a2fd63e4b5360f627d013b93a9c6768ab3fa305c178c84388',
        s: '0x6f56a6089adf5af7cc45885d4294ebfd7ea9326a42aa977fc0732677e007cdd3'
      }
      console.log("LooksRare: ETH <=> ERC1155")

      assert.equal(await token.balanceOf(buyerLocal1, tokenId), 0);
      let dataForLooksRare = await wrapperHelper.getDataWrapperMatchAskWithTakerBidUsingETHAndWETH(takerBid, makerAsk, ERC1155);
      const tradeDataSeaPort = PurchaseData(5, 10000, dataForLooksRare);
      let feesUP = [];

      const tx = await bulkExchange.singlePurchase(tradeDataSeaPort, feesUP, {from: buyerLocal1, value: 10000})
      console.log("wrapper call LooksRare: ETH <=> ERC1155 = ", tx.receipt.gasUsed)
      assert.equal(await token.balanceOf(buyerLocal1, tokenId), 10);
      assert.equal(await weth.balanceOf(seller), 10000);
    })
  });

  describe ("x2y2", () => {
    it("x2y2 single", async () => {
      const seller = accounts[1];
      const buyer = accounts[2];
      const weth = await WETH9.new()

      const x2y2 = await X2Y2_r1.new()
      await x2y2.initialize(120000, weth.address)

      const erc721delegate = await ERC721Delegate.new();
      await erc721delegate.grantRole("0x7630198b183b603be5df16e380207195f2a065102b113930ccb600feaf615331", x2y2.address);
      await x2y2.updateDelegates([erc721delegate.address], [])

      await bulkExchange.setX2Y2(x2y2.address)

      await erc721.mint(seller, tokenId)
      await erc721.setApprovalForAll(erc721delegate.address, true, {from: seller})

      const tokenDataToEncode = [
        {
          token: erc721.address,
          tokenId: tokenId
        }
      ]

      const data = await wrapperHelper.encodeData(tokenDataToEncode)
      const orderItem = {
        price: 1000,
        data: data
      }

      const order = {
        "salt": "216015207580153061888244896739707431392",
        "user": seller,
        "network": "1337",
        "intent": "1",
        "delegateType": "1",
        "deadline": "1758351144",
        "currency": "0x0000000000000000000000000000000000000000",
        "dataMask": "0x",
        "items": [
          orderItem
        ],
        "r": "0x280849c314a4d9b00804aba77c3434754166aea1a4973f4ec1e89d22f4bd335c",
        "s": "0x0b9902ec5b79551d583e82b732cff01ec28fb8831587f8fe4f2e8249f7f4f49e",
        "v": 27,
        "signVersion": 1
      }
  
      const itemHash = await wrapperHelper.hashItem(order, orderItem)
      
      const input = 
      {
        "orders": [
          order
        ],
        "details": [
          {
            "op": 1,
            "orderIdx": "0",
            "itemIdx": "0",
            "price": "1000",
            "itemHash": itemHash,
            "executionDelegate": erc721delegate.address,
            "dataReplacement": "0x",
            "bidIncentivePct": "0",
            "aucMinIncrementPct": "0",
            "aucIncDurationSecs": "0",
            "fees": [
              {
                "percentage": "5000",
                "to": "0xd823c605807cc5e6bd6fc0d7e4eea50d3e2d66cd"
              }
            ]
          }
        ],
        "shared": {
          "salt": "427525989460197",
          "deadline": "1758363251",
          "amountToEth": "0",
          "amountToWeth": "0",
          "user": bulkExchange.address,
          "canFail": false
        },
        "r": "0xc0f030ffba87896654c2981bda9c5ef0849c33a2b637fea7a777c8019ca13427",
        "s": "0x26b893c0b10eb13815aae1e899ecb02dd1b2ed1995c21e4f1eb745e14f49f51f",
        "v": 28
      }

      const tradeData = PurchaseData(4, 1000, await wrapperHelper.encodeX2Y2Call(input))

      const tx = await bulkExchange.singlePurchase(tradeData, [], {from: buyer, value: 1000})

      console.log(tx.receipt.gasUsed)
      assert.equal(await erc721.ownerOf(tokenId), buyer, "buyer has tokenId");
    })
  })

  function PurchaseData(marketId, amount, data) {
    return {marketId, amount, data};
  };

});
