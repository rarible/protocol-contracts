const WyvernExchangeProxy = artifacts.require("WyvernExchangeProxy.sol");
const WyvernExchangeWithBulkCancellations = artifacts.require("WyvernExchangeWithBulkCancellations");
const TokenTransferProxy = artifacts.require("TokenTransferProxy");
const ProxyRegistry = artifacts.require("ProxyRegistry");
const ERC20 = artifacts.require("ERC20");
const TestERC20 = artifacts.require("TestERC20.sol");
const { expectThrow, verifyBalanceChange } = require("@daonomic/tests-common");
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

//const order = require("../../exchange-v2/test/order.js");
//const { enc, ETH, ERC20, ERC721, ERC721_LAZY, ERC1155, ERC1155_LAZY, COLLECTION, id } = require("../../exchange-v2/test/assets.js");

contract("WyvernExchangeProxy", accounts => {
  let wyvernExchangeProxy;
  let wyvernExchangeWithBulkCancellations;
  let proxyRegistry;
  let tokenTransferProxy;
  let erc20;
  let testERC20;
  const feeProtocolRecieverETH = accounts[3];
  const feeProtocolRecieverERC20 = accounts[4];
  const wyvernProtocolFeeAddress = accounts[1];

  beforeEach(async () => {
//        ProxyRegistry registryAddress,
//        TokenTransferProxy tokenTransferProxyAddress,
//        ERC20 tokenAddress,
//        address protocolFeeAddress
    proxyRegistry = await ProxyRegistry.new();
    tokenTransferProxy = await TokenTransferProxy.new();
//    erc20 = await ERC20.new(); //todo understand problems with deploy
    testERC20 = await TestERC20.new();
    wyvernExchangeWithBulkCancellations = await WyvernExchangeWithBulkCancellations.new(proxyRegistry.address, tokenTransferProxy.address, ZERO_ADDRESS, wyvernProtocolFeeAddress);
    wyvernExchangeProxy = await WyvernExchangeProxy.new();
    wyvernExchangeProxy.__WyvernExchangeProxy_init(wyvernExchangeWithBulkCancellations.address, feeProtocolRecieverETH, feeProtocolRecieverERC20, 300);
    await wyvernExchangeProxy.setFeeReceiverETH(feeProtocolRecieverETH, {from: accounts[0]});
    await wyvernExchangeProxy.setFee(300);

  });

  describe("Check methods through wyvernExchange emulator ", () => {
    it("NFT <-> ETH  matches and transfer", async () => {
      sellFeeRecipient = accounts[5];
      console.log("sellFeeRecipient addr:", sellFeeRecipient);
      const{addrs, uints, feeMethodsSidesKindsHowToCalls, calldataBuy, calldataSell, replacementPatternBuy, replacementPatternSell, staticExtradataBuy, staticExtradataSell, vs, rssMetadata} = await prepareWywernNFT_ETH(sellFeeRecipient);
//      console.log("uints", uints[13]);
      await verifyBalanceChange(feeProtocolRecieverETH, -3, () =>
         verifyBalanceChange(sellFeeRecipient, -12, () =>
            wyvernExchangeProxy.atomicMatch_(addrs, uints, feeMethodsSidesKindsHowToCalls, calldataBuy, calldataSell, replacementPatternBuy, replacementPatternSell, staticExtradataBuy, staticExtradataSell, vs, rssMetadata,
              {value: 103, from: accounts[0], gasPrice: 0}
            )
         )
      );

    });
    async function prepareWywernNFT_ETH(_feeRecipient) {
    	const addrs = [
    	    "0x5206e78b21ce315ce284fb24cf05e0585a93b1d9",
          "0x3b7c5d4925b5e2ed0cf51b248bdeaaa3d1f5904f",
          "0x9133d618c4f756dc231462a70701757d0af9f1bb",
          "0x0000000000000000000000000000000000000000", //addr1 (3)
          "0x45b594792a5cdc008d0de1c1d69faa3d16b3ddc1",
          "0x0000000000000000000000000000000000000000",
          "0x0000000000000000000000000000000000000000",
          "0x5206e78b21ce315ce284fb24cf05e0585a93b1d9",
          "0x9133d618c4f756dc231462a70701757d0af9f1bb",
          "0x0000000000000000000000000000000000000000",
          _feeRecipient,//"0x5b3256965e7c3cf26e11fcaf296dfc8807c01073", //addr2 (10)
          "0x45b594792a5cdc008d0de1c1d69faa3d16b3ddc1",
          "0x0000000000000000000000000000000000000000",
          "0x0000000000000000000000000000000000000000"
    	];
    	const uints = [
        1250,
        0,
        0,
        0,
        100, //price(4)
        0,
        1644921132,
        0,
        78,//7808363378110069269429576006778471314492080592927804318730676593877089017422, salt
        1250,
        0,
        0,
        0,
        100, //price(13)
        0,
        1644904254,
        1645509143,
        95//95144179924824683514752879284650766319723498665295994162030050771481728005307 salt
    	];
    	const feeMethodsSidesKindsHowToCalls = [
    	    1,
          0,
          0,
          1,
          1,
          1,
          0,
          1
      ];
      const calldataBuy = "0xfb16a59500000000000000000000000000000000000000000000000000000000000000000000000000000000000000003b7c5d4925b5e2ed0cf51b248bdeaaa3d1f5904f00000000000000000000000065701542a5866bd5273f4b38e3fb7984fcf564740000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000";
      const calldataSell = "0xfb16a5950000000000000000000000009133d618c4f756dc231462a70701757d0af9f1bb000000000000000000000000000000000000000000000000000000000000000000000000000000000000000065701542a5866bd5273f4b38e3fb7984fcf564740000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000";
      const replacementPatternBuy = "0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
      const replacementPatternSell = "0x000000000000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
      const staticExtradataBuy = "0x";
      const staticExtradataSell = "0x";
      const vs = [
        28,
        28
      ];
      const rssMetadata = [
        "0x991d85b29321ba7f317b5c4cd074cb902b9e362a6983d3f5bd1ec9087a1ad46d",
        "0x36dd0be4d10c3e6694cb0f4bfdcf59f57364d4cf32f491d3cbe454699b91c735",
        "0x991d85b29321ba7f317b5c4cd074cb902b9e362a6983d3f5bd1ec9087a1ad46d",
        "0x36dd0be4d10c3e6694cb0f4bfdcf59f57364d4cf32f491d3cbe454699b91c735",
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      ];

    	return { addrs, uints, feeMethodsSidesKindsHowToCalls, calldataBuy, calldataSell, replacementPatternBuy, replacementPatternSell, staticExtradataBuy, staticExtradataSell, vs, rssMetadata};
    }

//    it("NFT <-> ERC20  matches and transfer", async () => {
//      let buyMaker = accounts[5];
//      await testERC20.mint(buyMaker, 200);
//      await testERC20.approve(wyvernExchangeProxy.address, 10000000, { from: buyMaker });
//
//      const{addrs, uints, feeMethodsSidesKindsHowToCalls, calldataBuy, calldataSell, replacementPatternBuy, replacementPatternSell, staticExtradataBuy, staticExtradataSell, vs, rssMetadata} = await prepareWywernNFT_ERC20(buyMaker);
////      console.log("uints", uints[13]);
//      await wyvernExchangeProxy.atomicMatch_(addrs, uints, feeMethodsSidesKindsHowToCalls, calldataBuy, calldataSell, replacementPatternBuy, replacementPatternSell, staticExtradataBuy, staticExtradataSell, vs, rssMetadata);
//      assert.equal(await testERC20.balanceOf(buyMaker), 197);
//      assert.equal(await testERC20.balanceOf(feeProtocolRecieverERC20), 3);
//    });
//    async function prepareWywernNFT_ERC20(_buyMaker) {
//    	const addrs = [
//    	    "0x5206e78b21ce315ce284fb24cf05e0585a93b1d9",
//          _buyMaker,//buy maker
//          "0x9133d618c4f756dc231462a70701757d0af9f1bb",
//          "0x0000000000000000000000000000000000000000", //buy feeRecipient (3)
//          "0x45b594792a5cdc008d0de1c1d69faa3d16b3ddc1",
//          "0x0000000000000000000000000000000000000000",
//          "0x0000000000000000000000000000000000000000",
//          "0x5206e78b21ce315ce284fb24cf05e0585a93b1d9",
//          "0x9133d618c4f756dc231462a70701757d0af9f1bb",
//          "0x0000000000000000000000000000000000000000",
//          "0x5b3256965e7c3cf26e11fcaf296dfc8807c01073", //sell feeRecipient (10)
//          "0x45b594792a5cdc008d0de1c1d69faa3d16b3ddc1",
//          "0x0000000000000000000000000000000000000000",
//          testERC20.address //token
//    	];
//    	const uints = [
//        1250,
//        0,
//        0,
//        0,
//        100, //price(4)
//        0,
//        1644921132,
//        0,
//        78,//7808363378110069269429576006778471314492080592927804318730676593877089017422, salt
//        1250,
//        0,
//        0,
//        0,
//        100, //price(13)
//        0,
//        1644904254,
//        1645509143,
//        95//95144179924824683514752879284650766319723498665295994162030050771481728005307 salt
//    	];
//    	const feeMethodsSidesKindsHowToCalls = [
//    	    1,
//          0,
//          0,
//          1,
//          1,
//          1,
//          0,
//          1
//      ];
//      const calldataBuy = "0xfb16a59500000000000000000000000000000000000000000000000000000000000000000000000000000000000000003b7c5d4925b5e2ed0cf51b248bdeaaa3d1f5904f00000000000000000000000065701542a5866bd5273f4b38e3fb7984fcf564740000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000";
//      const calldataSell = "0xfb16a5950000000000000000000000009133d618c4f756dc231462a70701757d0af9f1bb000000000000000000000000000000000000000000000000000000000000000000000000000000000000000065701542a5866bd5273f4b38e3fb7984fcf564740000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000";
//      const replacementPatternBuy = "0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
//      const replacementPatternSell = "0x000000000000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
//      const staticExtradataBuy = "0x";
//      const staticExtradataSell = "0x";
//      const vs = [
//        28,
//        28
//      ];
//      const rssMetadata = [
//        "0x991d85b29321ba7f317b5c4cd074cb902b9e362a6983d3f5bd1ec9087a1ad46d",
//        "0x36dd0be4d10c3e6694cb0f4bfdcf59f57364d4cf32f491d3cbe454699b91c735",
//        "0x991d85b29321ba7f317b5c4cd074cb902b9e362a6983d3f5bd1ec9087a1ad46d",
//        "0x36dd0be4d10c3e6694cb0f4bfdcf59f57364d4cf32f491d3cbe454699b91c735",
//        "0x0000000000000000000000000000000000000000000000000000000000000000"
//      ];
//
//    	return { addrs, uints, feeMethodsSidesKindsHowToCalls, calldataBuy, calldataSell, replacementPatternBuy, replacementPatternSell, staticExtradataBuy, staticExtradataSell, vs, rssMetadata};
//    }
//
//    it("Detect price", async () => {
//      const price = await wyvernExchangeProxy.calculateFinalPrice.call(1, 0, 100, 0,0,0);
//      assert.equal(price, 103);
//    });

  })
});
