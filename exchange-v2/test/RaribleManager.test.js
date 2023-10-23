const RaribleTransferManagerTest = artifacts.require("RaribleTransferManagerTest.sol");
const TransferProxyTest = artifacts.require("TransferProxyTest.sol");
const TestRoyaltiesRegistry = artifacts.require("TestRoyaltiesRegistry.sol");
const ERC20TransferProxyTest = artifacts.require("ERC20TransferProxyTest.sol");

const TestERC20 = artifacts.require("TestERC20.sol");

const TestERC721RoyaltiesV1 = artifacts.require("TestERC721RoyaltiesV1.sol");
const TestERC721RoyaltiesV2 = artifacts.require("TestERC721RoyaltiesV2.sol");
const TestERC1155RoyaltiesV2 = artifacts.require("TestERC1155RoyaltiesV2.sol");
const TestERC1155RoyaltiesV1 = artifacts.require("TestERC1155RoyaltiesV1.sol");

const ERC721_V1_Error = artifacts.require("TestERC721WithRoyaltiesV1_InterfaceError.sol");
const ERC1155_V2_Error = artifacts.require("TestERC1155WithRoyaltiesV2_InterfaceError.sol");

const ERC721LazyMintTest = artifacts.require("ERC721LazyMintTest.sol");
const ERC1155LazyMintTest = artifacts.require("ERC1155LazyMintTest.sol");
const ERC721LazyMintTransferProxy = artifacts.require("ERC721LazyMintTransferProxyTest.sol")
const ERC1155LazyMintTransferProxy = artifacts.require("ERC1155LazyMintTransferProxyTest.sol")

const { Order, Asset } = require("../../scripts/order.js");
const ZERO = "0x0000000000000000000000000000000000000000";
const { expectThrow } = require("@daonomic/tests-common");
const { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, ORDER_DATA_V2, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, CRYPTO_PUNK, COLLECTION, enc, encDataV2, id } = require("../../scripts/assets.js");
const { verifyBalanceChangeReturnTx } = require("../../scripts/balance")

contract("RaribleTransferManagerTest:doTransferTest()", accounts => {
  let RTM;
  let transferProxy;
  let erc20TransferProxy;
  let royaltiesRegistry;

  const protocol = accounts[9];
  const community = accounts[8];
  const erc721TokenId0 = 52;
  const erc721TokenId1 = 53;
  const erc1155TokenId1 = 54;
  const erc1155TokenId2 = 55;

  before(async () => {
    transferProxy = await TransferProxyTest.new();
    erc20TransferProxy = await ERC20TransferProxyTest.new();
    RTM = await RaribleTransferManagerTest.new();
    royaltiesRegistry = await TestRoyaltiesRegistry.new();

    await RTM.init____(transferProxy.address, erc20TransferProxy.address, 0, ZERO, royaltiesRegistry.address);
  });

  describe("Check doTransfersExternal()", () => {

    it("Transfer from ETH to ERC1155, protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
      const erc1155 = await prepareERC1155(accounts[2], 10)

      const left = Order(accounts[0], Asset(ETH, "0x", 100), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(accounts[2], Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7), ZERO, Asset(ETH, "0x", 100), 1, 0, 0, "0xffffffff", "0x");

      await verifyBalanceChangeReturnTx(web3, accounts[0], 100, () =>
        verifyBalanceChangeReturnTx(web3, accounts[2], -100, () =>
          verifyBalanceChangeReturnTx(web3, protocol, 0, () =>
            RTM.doTransfersExternal(left, right,
              { value: 100, from: accounts[0]}
            )
          )
        )
      );
      assert.equal(await erc1155.balanceOf(accounts[0], erc1155TokenId1), 7);
      assert.equal(await erc1155.balanceOf(accounts[2], erc1155TokenId1), 3);
    })

    it("Transfer from ERC721 to ERC721", async () => {
      const erc721 = await prepareERC721(accounts[1]);

      await erc721.mint(accounts[2], erc721TokenId0, []);
      await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[2] });

      let data = await encDataV1([[], []]);
      const left = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId0), 1), 1, 0, 0, ORDER_DATA_V1, data);
      const right = Order(accounts[2], Asset(ERC721, enc(erc721.address, erc721TokenId0), 1), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, data);

      await RTM.doTransfersExternal(left, right);
      assert.equal(await erc721.ownerOf(erc721TokenId1), accounts[2]);
      assert.equal(await erc721.ownerOf(erc721TokenId0), accounts[1]);
    })

    it("Transfer from ERC721 to ERC1155, (buyerFee3%, sallerFee3% = 6%) of ERC1155 transfer to community, orders dataType == V1", async () => {
      const erc721 = await prepareERC721(accounts[1])
      const erc1155 = await prepareERC1155(accounts[2], 120)
      /*in this: accounts[3] - address originLeftOrder, 100 - originLeftOrderFee(bp%)*/
      let addrOriginLeft = [[accounts[3], 100], [accounts[5], 300]];
      let addrOriginRight = [[accounts[4], 200], [accounts[6], 400]];
      let encDataLeft = await encDataV1([[[accounts[1], 10000]], addrOriginLeft]);
      let encDataRight = await encDataV1([[[accounts[2], 10000]], addrOriginRight]);
      const left = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
      const right = Order(accounts[2], Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataRight);

      await RTM.doTransfersExternal(left, right);

      assert.equal(await erc721.balanceOf(accounts[1]), 0);
      assert.equal(await erc721.balanceOf(accounts[2]), 1);
      assert.equal(await erc1155.balanceOf(accounts[1], erc1155TokenId1), 96);
      assert.equal(await erc1155.balanceOf(accounts[2], erc1155TokenId1), 14);
      assert.equal(await erc1155.balanceOf(community, erc1155TokenId1), 0);
    })

    it("Transfer from ERC1155 to ERC1155: 2 to 10, 50% 50% for payouts", async () => {

      const erc1155 = await prepareERC1155(accounts[1], 100)
      await erc1155.mint(accounts[2], erc1155TokenId2, 100, []);
      await erc1155.setApprovalForAll(transferProxy.address, true, { from: accounts[2] });

      let encDataLeft = await encDataV1([[[accounts[3], 5000], [accounts[5], 5000]], []]);
      let encDataRight = await encDataV1([[[accounts[4], 5000], [accounts[6], 5000]], []]);
      const left = Order(accounts[1], Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 2), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId2), 10), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
      const right = Order(accounts[2], Asset(ERC1155, enc(erc1155.address, erc1155TokenId2), 10), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 2), 1, 0, 0, ORDER_DATA_V1, encDataRight);

      await RTM.doTransfersExternal(left, right);

      assert.equal(await erc1155.balanceOf(accounts[1], erc1155TokenId1), 98);
      assert.equal(await erc1155.balanceOf(accounts[2], erc1155TokenId1), 0);
      assert.equal(await erc1155.balanceOf(accounts[1], erc1155TokenId2), 0);
      assert.equal(await erc1155.balanceOf(accounts[2], erc1155TokenId2), 90);

      assert.equal(await erc1155.balanceOf(accounts[3], erc1155TokenId2), 5);
      assert.equal(await erc1155.balanceOf(accounts[5], erc1155TokenId2), 5);
      assert.equal(await erc1155.balanceOf(accounts[4], erc1155TokenId1), 1);
      assert.equal(await erc1155.balanceOf(accounts[6], erc1155TokenId1), 1);
    });

    it("rounding error Transfer from ERC1155 to ERC1155: 1 to 5, 50% 50% for payouts", async () => {
      const erc1155 = await prepareERC1155(accounts[1], 100)

			await erc1155.mint(accounts[2], erc1155TokenId2, 100, []);
			await erc1155.setApprovalForAll(transferProxy.address, true, {from: accounts[2]});
			let encDataLeft = await encDataV1([ [[accounts[3], 5000], [accounts[5], 5000]], []]);
			let encDataRight = await encDataV1([ [[accounts[4], 5000], [accounts[6], 5000]], []]);
			const left = Order(accounts[1], Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 1), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId2), 5), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[2], Asset(ERC1155, enc(erc1155.address, erc1155TokenId2), 5), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataRight);
      
      // left.makeAsset.value = 1;
      // left.takeAsset.value = 5;
      await RTM.doTransfersExternal(left, right);

      assert.equal(await erc1155.balanceOf(accounts[1], erc1155TokenId1), 99);
      assert.equal(await erc1155.balanceOf(accounts[2], erc1155TokenId1), 0);
      assert.equal(await erc1155.balanceOf(accounts[1], erc1155TokenId2), 0);
      assert.equal(await erc1155.balanceOf(accounts[2], erc1155TokenId2), 95);

      assert.equal(await erc1155.balanceOf(accounts[3], erc1155TokenId2), 2);
      assert.equal(await erc1155.balanceOf(accounts[5], erc1155TokenId2), 3);
      assert.equal(await erc1155.balanceOf(accounts[4], erc1155TokenId1), 0);
      assert.equal(await erc1155.balanceOf(accounts[6], erc1155TokenId1), 1);
      assert.equal(await erc1155.balanceOf(community, erc1155TokenId1), 0);
    });

    it("Transfer from ERC1155 to ERC721, (buyerFee3%, sallerFee3% = 6%) of ERC1155 protocol (buyerFee3%, sallerFee3%)", async () => {
      const erc721 = await prepareERC721(accounts[2])
      const erc1155 = await prepareERC1155(accounts[1], 105)

      const left = Order(accounts[1], Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(accounts[2], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), 1, 0, 0, "0xffffffff", "0x");

      await RTM.doTransfersExternal(left, right);

      assert.equal(await erc721.balanceOf(accounts[2]), 0);
      assert.equal(await erc721.balanceOf(accounts[1]), 1);
      assert.equal(await erc1155.balanceOf(accounts[2], erc1155TokenId1), 100);
      assert.equal(await erc1155.balanceOf(accounts[1], erc1155TokenId1), 5);
      assert.equal(await erc1155.balanceOf(protocol, erc1155TokenId1), 0);
    })

    it("Transfer from ERC20 to ERC1155, protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
      const erc20 = await prepareERC20(accounts[1], 105);
      const erc1155 = await prepareERC1155(accounts[2], 10)

      const left = Order(accounts[1], Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(accounts[2], Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, "0xffffffff", "0x");

      await RTM.doTransfersExternal(left, right);

      assert.equal(await erc20.balanceOf(accounts[1]), 5);
      assert.equal(await erc20.balanceOf(accounts[2]), 100);
      assert.equal(await erc1155.balanceOf(accounts[1], erc1155TokenId1), 7);
      assert.equal(await erc1155.balanceOf(accounts[2], erc1155TokenId1), 3);
      assert.equal(await erc20.balanceOf(protocol), 0);
    })

    it("Transfer from ERC1155 to ERC20, protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
      const erc20 = await prepareERC20(accounts[4], 105);
      const erc1155 = await prepareERC1155(accounts[3], 10, erc1155TokenId2)

      const left = Order(accounts[3], Asset(ERC1155, enc(erc1155.address, erc1155TokenId2), 7), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(accounts[4], Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId2), 7), 1, 0, 0, "0xffffffff", "0x");

      await RTM.doTransfersExternal(left, right);

      assert.equal(await erc20.balanceOf(accounts[3]), 100);
      assert.equal(await erc20.balanceOf(accounts[4]), 5);
      assert.equal(await erc1155.balanceOf(accounts[3], erc1155TokenId2), 3);
      assert.equal(await erc1155.balanceOf(accounts[4], erc1155TokenId2), 7);
      assert.equal(await erc20.balanceOf(protocol), 0);
    })

    it("Transfer from ERC20 to ERC721, protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
      const erc20 = await prepareERC20(accounts[1], 105);
      const erc721 = await prepareERC721(accounts[2])

      const left = Order(accounts[1], Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(accounts[2], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, "0xffffffff", "0x");

      await RTM.doTransfersExternal(left, right);

      assert.equal(await erc20.balanceOf(accounts[1]), 5);
      assert.equal(await erc20.balanceOf(accounts[2]), 100);
      assert.equal(await erc721.balanceOf(accounts[1]), 1);
      assert.equal(await erc721.balanceOf(accounts[2]), 0);
      assert.equal(await erc20.balanceOf(protocol), 0);
    })

    it("Transfer from ERC721 to ERC20, protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
      const erc20 = await prepareERC20(accounts[2], 105);
      const erc721 = await prepareERC721(accounts[1])

      const left = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(accounts[2], Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");

      await RTM.doTransfersExternal(left, right);

      assert.equal(await erc20.balanceOf(accounts[1]), 100);
      assert.equal(await erc20.balanceOf(accounts[2]), 5);
      assert.equal(await erc721.balanceOf(accounts[1]), 0);
      assert.equal(await erc721.balanceOf(accounts[2]), 1);
      assert.equal(await erc20.balanceOf(protocol), 0);
    })

    it("Transfer from ERC20 to ERC20, protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
      const erc20 = await prepareERC20(accounts[1], 105);
      const t2 = await prepareERC20(accounts[2], 220)

      const left = Order(accounts[1], Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC20, enc(t2.address), 200), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(accounts[2], Asset(ERC20, enc(t2.address), 200), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, "0xffffffff", "0x");

      await RTM.doTransfersExternal(left, right);

      assert.equal(await erc20.balanceOf(accounts[1]), 5);
      assert.equal(await erc20.balanceOf(accounts[2]), 100);
      assert.equal(await t2.balanceOf(accounts[1]), 200);
      assert.equal(await t2.balanceOf(accounts[2]), 20);
      assert.equal(await erc20.balanceOf(protocol), 0);
    })

  })

  describe("Check lazy with royalties", () => {
    it("Transfer from  ERC721lazy to ERC20 ", async () => {
      const erc721Test = await ERC721LazyMintTest.new();
      const proxy = await ERC721LazyMintTransferProxy.new();
      await proxy.__OperatorRole_init();
      await proxy.addOperator(RTM.address);
      await RTM.setTransferProxy(id("ERC721_LAZY"), proxy.address)

      const erc20 = await prepareERC20(accounts[2], 106)

      const encodedMintData = await erc721Test.encode([1, "uri", [[accounts[1], 0]], [[accounts[5], 2000], [accounts[6], 1000]], []]);

      const left = Order(accounts[1], Asset(id("ERC721_LAZY"), encodedMintData, 1), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(accounts[2], Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(id("ERC721_LAZY"), encodedMintData, 1), 1, 0, 0, "0xffffffff", "0x");

      await RTM.doTransfersExternal(left, right);

      assert.equal(await erc721Test.ownerOf(1), accounts[2]);
      assert.equal(await erc20.balanceOf(accounts[1]), 70);
      assert.equal(await erc20.balanceOf(accounts[2]), 6);
      assert.equal(await erc20.balanceOf(accounts[5]), 20);
      assert.equal(await erc20.balanceOf(accounts[6]), 10);
    })

    it("Transfer from  ERC1155lazy to ERC20 ", async () => {
      const erc1155Test = await ERC1155LazyMintTest.new();
      const proxy = await ERC1155LazyMintTransferProxy.new();
      await proxy.__OperatorRole_init();
      await proxy.addOperator(RTM.address);
      await RTM.setTransferProxy(id("ERC1155_LAZY"), proxy.address)

      const erc20 = await prepareERC20(accounts[2], 106)

      const encodedMintData = await erc1155Test.encode([1, "uri", 5, [[accounts[1], 0]], [[accounts[5], 2000], [accounts[6], 1000]], []]);

      const left = Order(accounts[1], Asset(id("ERC1155_LAZY"), encodedMintData, 5), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(accounts[2], Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(id("ERC1155_LAZY"), encodedMintData, 5), 1, 0, 0, "0xffffffff", "0x");

      await RTM.doTransfersExternal(left, right);

      assert.equal(await erc1155Test.balanceOf(accounts[2], 1), 5);
      assert.equal(await erc20.balanceOf(accounts[1]), 70);
      assert.equal(await erc20.balanceOf(accounts[2]), 6);
      assert.equal(await erc20.balanceOf(accounts[5]), 20);
      assert.equal(await erc20.balanceOf(accounts[6]), 10);
    })

    it("Transfer from ETH to ERC721Lazy", async () => {
      const erc721Test = await ERC721LazyMintTest.new();
      const proxy = await ERC721LazyMintTransferProxy.new();
      await proxy.__OperatorRole_init();
      await proxy.addOperator(RTM.address);
      await RTM.setTransferProxy(id("ERC721_LAZY"), proxy.address)
      const encodedMintData = await erc721Test.encode([1, "uri", [[accounts[2], 0]], [[accounts[5], 2000], [accounts[6], 1000]], []]);

      const left = Order(accounts[1], Asset(ETH, "0x", 100), ZERO, Asset(id("ERC721_LAZY"), encodedMintData, 1), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(accounts[2], Asset(id("ERC721_LAZY"), encodedMintData, 1), ZERO, Asset(ETH, "0x", 100), 1, 0, 0, "0xffffffff", "0x");

      await verifyBalanceChangeReturnTx(web3, accounts[1], 100, () =>
        verifyBalanceChangeReturnTx(web3, accounts[2], -70, () =>
          verifyBalanceChangeReturnTx(web3, accounts[5], -20, () =>
            verifyBalanceChangeReturnTx(web3, accounts[6], -10, () =>
              verifyBalanceChangeReturnTx(web3, protocol, 0, () =>
                RTM.doTransfersExternal(left, right,
                  { value: 100, from: accounts[1]}
                )
              )
            )
          )
        )
      );
      assert.equal(await erc721Test.ownerOf(1), accounts[1]);
    })

    it("Transfer from ETH to ERC1155Lazy", async () => {
      const erc1155Test = await ERC1155LazyMintTest.new();
      const proxy = await ERC1155LazyMintTransferProxy.new();
      await proxy.__OperatorRole_init();
      await proxy.addOperator(RTM.address);
      await RTM.setTransferProxy(id("ERC1155_LAZY"), proxy.address)
      const encodedMintData = await erc1155Test.encode([1, "uri", 5, [[accounts[2], 0]], [[accounts[5], 2000], [accounts[6], 1000]], []]);

      const left = Order(accounts[1], Asset(ETH, "0x", 100), ZERO, Asset(id("ERC1155_LAZY"), encodedMintData, 5), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(accounts[2], Asset(id("ERC1155_LAZY"), encodedMintData, 5), ZERO, Asset(ETH, "0x", 100), 1, 0, 0, "0xffffffff", "0x");

      await verifyBalanceChangeReturnTx(web3, accounts[1], 100, () =>
        verifyBalanceChangeReturnTx(web3, accounts[2], -70, () =>
          verifyBalanceChangeReturnTx(web3, accounts[5], -20, () =>
            verifyBalanceChangeReturnTx(web3, accounts[6], -10, () =>
              verifyBalanceChangeReturnTx(web3, protocol, 0, () =>
                RTM.doTransfersExternal(left, right,
                  { value: 100, from: accounts[1]}
                )
              )
            )
          )
        )
      );
      assert.equal(await erc1155Test.balanceOf(accounts[1], 1), 5);
    })

  })

  describe("Check doTransfersExternal() with Royalties fees", () => {

    it("Transfer from ERC721(RoyaltiesV1) to ERC20 , protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
      const erc721V1 = await TestERC721RoyaltiesV1.new()
      await erc721V1.initialize();

      await erc721V1.mint(accounts[0], erc721TokenId1, []);
      await erc721V1.setApprovalForAll(transferProxy.address, true, { from: accounts[0] });

      const erc20 = await prepareERC20(accounts[1], 105)

      await royaltiesRegistry.setRoyaltiesByToken(erc721V1.address, [[accounts[2], 1000], [accounts[3], 500]]); //set royalties by token
      
      const left = Order(accounts[0], Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(accounts[1], Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");

      await RTM.doTransfersExternal(left, right);

      assert.equal(await erc20.balanceOf(accounts[1]), 5);
      assert.equal(await erc20.balanceOf(accounts[0]), 85);
      assert.equal(await erc20.balanceOf(accounts[2]), 10);
      assert.equal(await erc20.balanceOf(accounts[3]), 5);
      assert.equal(await erc721V1.balanceOf(accounts[1]), 1);
      assert.equal(await erc721V1.balanceOf(accounts[0]), 0);
      assert.equal(await erc20.balanceOf(protocol), 0);
    })

    it("Transfer from ERC20 to ERC721(RoyaltiesV2), protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
      const erc20 = await prepareERC20(accounts[1], 105);
      const erc721V2 = await prepareERC721(accounts[0], erc721TokenId1, [])

      await royaltiesRegistry.setRoyaltiesByToken(erc721V2.address, [[accounts[2], 1000], [accounts[3], 500]]);

      const left = Order(accounts[1], Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC721, enc(erc721V2.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(accounts[0], Asset(ERC721, enc(erc721V2.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, "0xffffffff", "0x");

      await RTM.doTransfersExternal(left, right);

      assert.equal(await erc20.balanceOf(accounts[1]), 5);
      assert.equal(await erc20.balanceOf(accounts[0]), 85);
      assert.equal(await erc20.balanceOf(accounts[2]), 10);
      assert.equal(await erc20.balanceOf(accounts[3]), 5);
      assert.equal(await erc721V2.balanceOf(accounts[1]), 1);
      assert.equal(await erc721V2.balanceOf(accounts[0]), 0);
      assert.equal(await erc20.balanceOf(protocol), 0);
    })

    it("Transfer from ERC1155(RoyaltiesV1) to ERC20, protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
      const erc1155V1 = await TestERC1155RoyaltiesV1.new()
      await erc1155V1.initialize()
      await erc1155V1.mint(accounts[0], erc1155TokenId1, [], 8);
      await erc1155V1.setApprovalForAll(transferProxy.address, true, { from: accounts[0] });
      
      const erc20 = await prepareERC20(accounts[1], 105);

      await royaltiesRegistry.setRoyaltiesByToken(erc1155V1.address, [[accounts[2], 1000], [accounts[3], 500]]); //set royalties by token
      const left = Order(accounts[0], Asset(ERC1155, enc(erc1155V1.address, erc1155TokenId1), 5), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(accounts[1], Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC1155, enc(erc1155V1.address, erc1155TokenId1), 5), 1, 0, 0, "0xffffffff", "0x");

      await RTM.doTransfersExternal(left, right);

      assert.equal(await erc20.balanceOf(accounts[1]), 5);
      assert.equal(await erc20.balanceOf(accounts[0]), 85);
      assert.equal(await erc20.balanceOf(accounts[2]), 10);
      assert.equal(await erc20.balanceOf(accounts[3]), 5);
      assert.equal(await erc1155V1.balanceOf(accounts[1], erc1155TokenId1), 5);
      assert.equal(await erc1155V1.balanceOf(accounts[0], erc1155TokenId1), 3);
      assert.equal(await erc20.balanceOf(protocol), 0);
    })

    it("Transfer from ERC20 to ERC1155(RoyaltiesV2), protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
      const erc20 = await prepareERC20(accounts[1], 105);
      const erc1155V2 = await prepareERC1155(accounts[0],8)

      await royaltiesRegistry.setRoyaltiesByToken(erc1155V2.address, [[accounts[2], 1000], [accounts[3], 500]]); //set royalties by token
      
      const left = Order(accounts[1], Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC1155, enc(erc1155V2.address, erc1155TokenId1), 6), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(accounts[0], Asset(ERC1155, enc(erc1155V2.address, erc1155TokenId1), 6), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, "0xffffffff", "0x");

      await RTM.doTransfersExternal(left, right);

      assert.equal(await erc20.balanceOf(accounts[1]), 5);
      assert.equal(await erc20.balanceOf(accounts[0]), 85);
      assert.equal(await erc20.balanceOf(accounts[2]), 10);
      assert.equal(await erc20.balanceOf(accounts[3]), 5);
      assert.equal(await erc1155V2.balanceOf(accounts[1], erc1155TokenId1), 6);
      assert.equal(await erc1155V2.balanceOf(accounts[0], erc1155TokenId1), 2);
      assert.equal(await erc20.balanceOf(protocol), 0);
    })

    it("Transfer from ERC20 to ERC1155(RoyaltiesV2), royalties are too high", async () => {
      const erc20 = await prepareERC20(accounts[1], 105);
      const erc1155V2 = await prepareERC1155(accounts[0],8)

      await royaltiesRegistry.setRoyaltiesByToken(erc1155V2.address, [[accounts[2], 2000], [accounts[3], 3001]]); //set royalties by token
      const left = Order(accounts[1], Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC1155, enc(erc1155V2.address, erc1155TokenId1), 6), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(accounts[0], Asset(ERC1155, enc(erc1155V2.address, erc1155TokenId1), 6), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, "0xffffffff", "0x");

      await expectThrow(
        RTM.doTransfersExternal(left, right)
      );
    })

    it("Transfer from ETH to ERC1155V2, protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
      const erc1155V2 = await prepareERC1155(accounts[1], 10)

      await royaltiesRegistry.setRoyaltiesByToken(erc1155V2.address, [[accounts[2], 1000], [accounts[3], 500]]); //set royalties by token
      
      const left = Order(accounts[0], Asset(ETH, "0x", 100), ZERO, Asset(ERC1155, enc(erc1155V2.address, erc1155TokenId1), 7), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(accounts[1], Asset(ERC1155, enc(erc1155V2.address, erc1155TokenId1), 7), ZERO, Asset(ETH, "0x", 100), 1, 0, 0, "0xffffffff", "0x");

      await verifyBalanceChangeReturnTx(web3, accounts[0], 100, () =>
        verifyBalanceChangeReturnTx(web3, accounts[1], -85, () =>
          verifyBalanceChangeReturnTx(web3, accounts[2], -10, () =>
            verifyBalanceChangeReturnTx(web3, accounts[3], -5, () =>
              verifyBalanceChangeReturnTx(web3, protocol, 0, () =>
                RTM.doTransfersExternal(left, right,
                  { value: 100, from: accounts[0]}
                )
              )
            )
          )
        )
      );
      assert.equal(await erc1155V2.balanceOf(accounts[0], erc1155TokenId1), 7);
      assert.equal(await erc1155V2.balanceOf(accounts[1], erc1155TokenId1), 3);
    })

    it("Transfer from ERC20 to ERC721(RoyaltiesV1 With Error), protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
      const erc20 = await prepareERC20(accounts[1], 105);

      const erc721V1_Error = await ERC721_V1_Error.new("Rarible", "RARI", "https://ipfs.rarible.com");      
      await erc721V1_Error.mint(accounts[0], erc721TokenId1, [[accounts[2], 1000], [accounts[3], 500]]);
      await erc721V1_Error.setApprovalForAll(transferProxy.address, true, { from: accounts[0] });

      const left = Order(accounts[1], Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC721, enc(erc721V1_Error.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(accounts[0], Asset(ERC721, enc(erc721V1_Error.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, "0xffffffff", "0x");

      await RTM.doTransfersExternal(left, right);

      assert.equal(await erc20.balanceOf(accounts[1]), 5);
      assert.equal(await erc20.balanceOf(accounts[0]), 100);
      assert.equal(await erc20.balanceOf(accounts[2]), 0);
      assert.equal(await erc20.balanceOf(accounts[3]), 0);
      assert.equal(await erc721V1_Error.balanceOf(accounts[1]), 1);
      assert.equal(await erc721V1_Error.balanceOf(accounts[0]), 0);
      assert.equal(await erc20.balanceOf(protocol), 0);
    })

    it("Transfer from ERC1155(RoyaltiesV2 With Error) to ERC20, protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
      const erc1155V2_Error = await ERC1155_V2_Error.new("https://ipfs.rarible.com");
      await erc1155V2_Error.mint(accounts[0], erc1155TokenId1, [[accounts[2], 1000], [accounts[3], 500]], 12);
      await erc1155V2_Error.setApprovalForAll(transferProxy.address, true, { from: accounts[0] });
      
      const erc20 = await prepareERC20(accounts[1], 105);

      const left = Order(accounts[0], Asset(ERC1155, enc(erc1155V2_Error.address, erc1155TokenId1), 5), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(accounts[1], Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ERC1155, enc(erc1155V2_Error.address, erc1155TokenId1), 5), 1, 0, 0, "0xffffffff", "0x");

      await RTM.doTransfersExternal(left, right);

      assert.equal(await erc20.balanceOf(accounts[1]), 5);
      assert.equal(await erc20.balanceOf(accounts[0]), 100);
      assert.equal(await erc20.balanceOf(accounts[2]), 0);
      assert.equal(await erc20.balanceOf(accounts[3]), 0);
      assert.equal(await erc1155V2_Error.balanceOf(accounts[1], erc1155TokenId1), 5);
      assert.equal(await erc1155V2_Error.balanceOf(accounts[0], erc1155TokenId1), 7);
      assert.equal(await erc20.balanceOf(protocol), 0);
    })

  })

  describe("Protocol Fee", () => {

    it("protocol fee in V2 order", async () => {

      const makerLeft = accounts[1]
      const makerRight = accounts[2]
      // minting NFT
      const erc721 = await prepareERC721(makerLeft);

      //setting protocol fee
      assert.equal(await RTM.protocolFee(), 0)

      await RTM.setProtocolFee(300)
      assert.equal(await RTM.protocolFee(), 300)

      //setting fee reciever
      assert.equal(await RTM.defaultFeeReceiver(), ZERO)

      await RTM.setDefaultFeeReceiver(protocol)
      assert.equal(await RTM.defaultFeeReceiver(), protocol)

      const encDataLeft = await RTM.encodeV2([[], [], true]);
      const encDataRight = await RTM.encodeV2([[], [], false]);

      const left = Order(makerLeft, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 1000), 1, 0, 0, ORDER_DATA_V2, encDataLeft);
      const right = Order(makerRight, Asset(ETH, "0x", 1000), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V2, encDataRight);

      await verifyBalanceChangeReturnTx(web3, makerRight, 1030, () =>
        verifyBalanceChangeReturnTx(web3, makerLeft, -1000, () =>
          verifyBalanceChangeReturnTx(web3, protocol, -30, () =>
            RTM.doTransfersExternal(left, right,
              { value: 1030, from: makerRight}
            )
          )
        )
      );

      assert.equal(await erc721.ownerOf(erc721TokenId1), makerRight);
    })

  })
  function encDataV1(tuple) {
    return RTM.encode(tuple)
  }

  async function prepareERC20(user, value = 1000) {
    const erc20Token = await TestERC20.new();

    await erc20Token.mint(user, value);
    await erc20Token.approve(erc20TransferProxy.address, value, { from: user });
    return erc20Token;
  }

  async function prepareERC721(user, tokenId = erc721TokenId1, royalties = []) {
    const erc721 = await TestERC721RoyaltiesV2.new();
    await erc721.initialize();

    await erc721.mint(user, tokenId, royalties);
    await erc721.setApprovalForAll(transferProxy.address, true, { from: user });
    return erc721;
  }

  async function prepareERC1155(user, value = 100, tokenId = erc1155TokenId1, royalties = []) {
    const erc1155 = await TestERC1155RoyaltiesV2.new();
    await erc1155.initialize();

    await erc1155.mint(user, tokenId, value, royalties);
    await erc1155.setApprovalForAll(transferProxy.address, true, { from: user });
    return erc1155;
  }

});