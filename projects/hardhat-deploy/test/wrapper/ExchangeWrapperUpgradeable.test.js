const { deployments, ethers } = require("hardhat");
const { expect } = require("chai");
const {
  ETH,
  ERC721,
  ERC1155,
  ORDER_DATA_V1,
  ORDER_DATA_V2,
  enc,
} = require("../../../../scripts/assets");
const { Order, Asset, sign } = require("../../../../scripts/order.js");
const {
  verifyBalanceChangeReturnTxEthers,
} = require("../../../../scripts/balance");

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

/* @dev this test-suite is a fork of the ExchangeWrapper set-suite but for the Upgradeable version of the contract */

describe("ExchangeBulkV2Upgradeable, sellerFee + buyerFee = 6%", function () {
  let accounts;
  let bulkExchange;
  let exchangeV2;
  let wrapperHelper;
  let transferProxy;
  let helper;
  const erc721TokenId1 = 55;
  const erc721TokenId2 = 56;
  const erc721TokenId3 = 57;
  const erc1155TokenId1 = 55;
  const erc1155TokenId2 = 56;
  const erc1155TokenId3 = 57;
  let erc721;
  let erc1155;
  let feeRecipienterUP;

  let deployed;

  before(async () => {
    accounts = await ethers.getSigners();
    feeRecipienterUP = accounts[6].address;

    deployed = await deployments.fixture(["all"]);

    const helperFactory = await ethers.getContractFactory("RaribleTestHelper");
    helper = await helperFactory.deploy();

    const wrapperHelperFactory = await ethers.getContractFactory(
      "WrapperHelper"
    );
    wrapperHelper = await wrapperHelperFactory.deploy();

    transferProxy = await ethers.getContractAt(
      "TransferProxy",
      deployed.TransferProxy.address
    );

    bulkExchange = await ethers.getContractAt(
      "RaribleExchangeWrapperUpgradeable",
      deployed.RaribleExchangeWrapperUpgradeable.address
    );
  });

  beforeEach(async () => {
    const erc721Factory = await ethers.getContractFactory("TestERC721");
    erc721 = await erc721Factory.deploy("Rarible", "RARI");
    const erc1155Factory = await ethers.getContractFactory("TestERC1155");
    erc1155 = await erc1155Factory.deploy();
  });

  describe("bulkPurchase Rarible orders", () => {
    it("Test bulkPurchase ExchangeV2 (num orders = 3, type ==V2, V1) orders are ready, ERC721<->ETH", async () => {
      const buyer = accounts[2].address;
      const seller1 = accounts[1].address;
      const seller2 = accounts[3].address;
      const seller3 = accounts[4].address;

      const erc721AsSeller1 = erc721.connect(accounts[1]);
      const erc721AsSeller2 = erc721.connect(accounts[3]);
      const erc721AsSeller3 = erc721.connect(accounts[4]);

      await erc721.mint(seller1, erc721TokenId1);
      await erc721AsSeller1.setApprovalForAll(transferProxy.address, true);

      await erc721.mint(seller2, erc721TokenId2);
      await erc721AsSeller2.setApprovalForAll(transferProxy.address, true);

      await erc721.mint(seller3, erc721TokenId3);
      await erc721AsSeller3.setApprovalForAll(transferProxy.address, true);

      exchangeV2 = await ethers.getContractAt(
        "ExchangeV2",
        deployed.ExchangeV2.address
      );

      // Set buyer in payouts
      const encDataLeft = await encDataV2([[], [], false]);
      const encDataLeftV1 = await encDataV1([[], []]);
      const encDataRight = await encDataV2([[[buyer, 10000]], [], false]);
      const encDataRightV1 = await encDataV1([[[buyer, 10000]], []]);

      const left1 = Order(
        seller1,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), 1),
        ZERO_ADDRESS,
        Asset(ETH, "0x", 100),
        1,
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const left2 = Order(
        seller2,
        Asset(ERC721, enc(erc721.address, erc721TokenId2), 1),
        ZERO_ADDRESS,
        Asset(ETH, "0x", 100),
        1,
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const left3 = Order(
        seller3,
        Asset(ERC721, enc(erc721.address, erc721TokenId3), 1),
        ZERO_ADDRESS,
        Asset(ETH, "0x", 100),
        1,
        0,
        0,
        ORDER_DATA_V1,
        encDataLeftV1
      );

      let signatureLeft1 = await getSignature(
        left1,
        seller1,
        exchangeV2.address
      );
      let signatureLeft2 = await getSignature(
        left2,
        seller2,
        exchangeV2.address
      );
      let signatureLeft3 = await getSignature(
        left3,
        seller3,
        exchangeV2.address
      );

      const directPurchaseParams1 = {
        sellOrderMaker: seller1,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId1),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO_ADDRESS,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft1,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      let dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(
        directPurchaseParams1
      );
      const tradeData1 = PurchaseData(
        0,
        100,
        await encodeFees(1500),
        dataForExchCall1
      ); //0 is Exch orders, 100 is amount + 0 protocolFee

      const directPurchaseParams2 = {
        sellOrderMaker: seller2,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId2),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO_ADDRESS,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft2,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      let dataForExchCall2 = await wrapperHelper.getDataDirectPurchase(
        directPurchaseParams2
      );
      const tradeData2 = PurchaseData(
        0,
        100,
        await encodeFees(1500),
        dataForExchCall2
      ); //0 is Exch orders, 100 is amount + 0 protocolFee

      const directPurchaseParams3 = {
        sellOrderMaker: seller3,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId3),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO_ADDRESS,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V1,
        sellOrderData: encDataLeftV1,
        sellOrderSignature: signatureLeft3,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRightV1,
      };

      let dataForExchCall3 = await wrapperHelper.getDataDirectPurchase(
        directPurchaseParams3
      );
      const tradeData3 = PurchaseData(
        0,
        100,
        await encodeFees(1500),
        dataForExchCall3
      ); //0 is Exch orders, 100 is amount + 0 protocolFee

      const bulkExchangeAsBuyer = bulkExchange.connect(accounts[2]);

      await verifyBalanceChangeReturnTxEthers(ethers, buyer, 345, async () =>
        verifyBalanceChangeReturnTxEthers(ethers, seller1, -100, async () =>
          verifyBalanceChangeReturnTxEthers(ethers, seller2, -100, async () =>
            verifyBalanceChangeReturnTxEthers(ethers, seller3, -100, async () =>
              verifyBalanceChangeReturnTxEthers(
                ethers,
                feeRecipienterUP,
                -45,
                () =>
                  bulkExchangeAsBuyer.bulkPurchase(
                    [tradeData1, tradeData2, tradeData3],
                    feeRecipienterUP,
                    ZERO_ADDRESS,
                    false,
                    { value: 400 }
                  )
              )
            )
          )
        )
      );

      expect(await erc721.balanceOf(seller1)).to.equal(0);
      expect(await erc721.balanceOf(seller2)).to.equal(0);
      expect(await erc721.balanceOf(seller3)).to.equal(0);
      expect(await erc721.balanceOf(accounts[2].address)).to.equal(3);
    });

    it("Test bulkPurchase ExchangeV2 (num orders = 3, type ==V2, V1) orders are ready, ERC1155<->ETH", async () => {
      const buyer = accounts[2].address;
      const seller1 = accounts[1].address;
      const seller2 = accounts[3].address;
      const seller3 = accounts[4].address;

      const erc1155AsSeller1 = erc1155.connect(accounts[1]);
      const erc1155AsSeller2 = erc1155.connect(accounts[3]);
      const erc1155AsSeller3 = erc1155.connect(accounts[4]);

      await erc1155.mint(seller1, erc1155TokenId1, 10);
      await erc1155AsSeller1.setApprovalForAll(transferProxy.address, true);

      await erc1155.mint(seller2, erc1155TokenId2, 10);
      await erc1155AsSeller2.setApprovalForAll(transferProxy.address, true);

      await erc1155.mint(seller3, erc1155TokenId3, 10);
      await erc1155AsSeller3.setApprovalForAll(transferProxy.address, true);

      exchangeV2 = await ethers.getContractAt(
        "ExchangeV2",
        deployed.ExchangeV2.address
      );

      // Set buyer in payouts
      const encDataLeft = await encDataV2([[], [], false]);
      const encDataLeftV1 = await encDataV1([[], []]);
      const encDataRight = await encDataV2([[[buyer, 10000]], [], false]);
      const encDataRightV1 = await encDataV1([[[buyer, 10000]], []]);

      const left1 = Order(
        seller1,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 10),
        ZERO_ADDRESS,
        Asset(ETH, "0x", 100),
        1,
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const left2 = Order(
        seller2,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId2), 10),
        ZERO_ADDRESS,
        Asset(ETH, "0x", 100),
        1,
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const left3 = Order(
        seller3,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId3), 10),
        ZERO_ADDRESS,
        Asset(ETH, "0x", 100),
        1,
        0,
        0,
        ORDER_DATA_V1,
        encDataLeftV1
      );

      let signatureLeft1 = await getSignature(
        left1,
        seller1,
        exchangeV2.address
      );
      let signatureLeft2 = await getSignature(
        left2,
        seller2,
        exchangeV2.address
      );
      let signatureLeft3 = await getSignature(
        left3,
        seller3,
        exchangeV2.address
      );

      const directPurchaseParams1 = {
        sellOrderMaker: seller1,
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(erc1155.address, erc1155TokenId1),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO_ADDRESS,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft1,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 6,
        buyOrderData: encDataRight,
      };

      let dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(
        directPurchaseParams1
      );
      const tradeData1 = PurchaseData(
        0,
        60,
        await encodeFees(1500),
        dataForExchCall1
      ); //0 is Exch orders, 100 is amount + 0 protocolFee

      const directPurchaseParams2 = {
        sellOrderMaker: seller2,
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(erc1155.address, erc1155TokenId2),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO_ADDRESS,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft2,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 8,
        buyOrderData: encDataRight,
      };

      let dataForExchCall2 = await wrapperHelper.getDataDirectPurchase(
        directPurchaseParams2
      );
      const tradeData2 = PurchaseData(
        0,
        80,
        await encodeFees(1500),
        dataForExchCall2
      ); //0 is Exch orders, 100 is amount + 0 protocolFee

      const directPurchaseParams3 = {
        sellOrderMaker: seller3,
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(erc1155.address, erc1155TokenId3),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO_ADDRESS,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V1,
        sellOrderData: encDataLeftV1,
        sellOrderSignature: signatureLeft3,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 10,
        buyOrderData: encDataRightV1,
      };

      let dataForExchCall3 = await wrapperHelper.getDataDirectPurchase(
        directPurchaseParams3
      );
      const tradeData3 = PurchaseData(
        0,
        100,
        await encodeFees(1500),
        dataForExchCall3
      ); //0 is Exch orders, 100 is amount + 0 protocolFee

      const bulkExchangeAsBuyer = bulkExchange.connect(accounts[2]);

      await verifyBalanceChangeReturnTxEthers(ethers, buyer, 276, async () =>
        verifyBalanceChangeReturnTxEthers(ethers, seller1, -60, async () =>
          verifyBalanceChangeReturnTxEthers(ethers, seller2, -80, async () =>
            verifyBalanceChangeReturnTxEthers(ethers, seller3, -100, async () =>
              verifyBalanceChangeReturnTxEthers(
                ethers,
                feeRecipienterUP,
                -36,
                () =>
                  bulkExchangeAsBuyer.bulkPurchase(
                    [tradeData1, tradeData2, tradeData3],
                    feeRecipienterUP,
                    ZERO_ADDRESS,
                    false,
                    { value: 400 }
                  )
              )
            )
          )
        )
      );

      expect(await erc1155.balanceOf(seller1, erc1155TokenId1)).to.equal(4);
      expect(await erc1155.balanceOf(seller2, erc1155TokenId2)).to.equal(2);
      expect(await erc1155.balanceOf(seller3, erc1155TokenId3)).to.equal(0);
      expect(
        await erc1155.balanceOf(accounts[2].address, erc1155TokenId1)
      ).to.equal(6);
      expect(
        await erc1155.balanceOf(accounts[2].address, erc1155TokenId2)
      ).to.equal(8);
      expect(
        await erc1155.balanceOf(accounts[2].address, erc1155TokenId3)
      ).to.equal(10);
    });
  });

  function encDataV2(tuple) {
    return helper.encodeV2(tuple);
  }

  function encDataV1(tuple) {
    return helper.encode(tuple);
  }

  function PurchaseData(marketId, amount, fees, data) {
    return { marketId, amount, fees, data };
  }

  async function getSignature(order, signer, exchangeContract) {
    return sign(order, signer, exchangeContract);
  }

  async function encodeFees(first = 0, second = 0) {
    const result = await wrapperHelper.encodeFees(first, second);
    return result.toString();
  }
});
