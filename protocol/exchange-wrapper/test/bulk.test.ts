// <ai_context> TypeScript port of bulk.test.js. Tests RaribleExchangeWrapper batch purchase functionality across multiple marketplace protocols (Rarible V2, SeaPort, LooksRare, X2Y2, SudoSwap) with various fee configurations and failure scenarios.
// NOTE: Many tests are marked as .skip because they require external marketplace contract artifacts (Seaport, LooksRare, X2Y2, SudoSwap) that are not available in the TypeScript build. These contracts would need to be added to dependencies, compiled with Hardhat, and have TypeScript types generated via Typechain. The test structure is complete and ready to be enabled once those contracts are available. </ai_context>

import { expect } from "chai";
import { network } from "hardhat";
import type * as ethersTypes from "ethers";

const connection = await network.connect();
const { ethers } = connection;

import {
  type RaribleExchangeWrapper,
  RaribleExchangeWrapper__factory,
  type WrapperHelper,
  WrapperHelper__factory,
  type TransferProxy,
  TransferProxy__factory,
  type ERC20TransferProxy,
  ERC20TransferProxy__factory,
  type RoyaltiesRegistry,
  RoyaltiesRegistry__factory,
} from "../types/ethers-contracts/index.js";

import { Order, Asset, sign, type OrderStruct } from "@rarible/common-sdk/src/order";
import {
  ETH,
  ERC20,
  ERC721,
  ERC1155,
  ORDER_DATA_V1,
  ORDER_DATA_V2,
  TO_MAKER,
  TO_TAKER,
  PROTOCOL,
  ROYALTY,
  ORIGIN,
  PAYOUT,
  CRYPTO_PUNKS,
  COLLECTION,
  enc,
  id,
} from "@rarible/common-sdk/src/assets";
import { verifyBalanceChangeReturnTx } from "@rarible/common-sdk/src/balance";

// Import test token types (simple non-upgradeable versions)
import type { TestERC721, TestERC1155 } from "../types/ethers-contracts/@rarible/transfer-proxy/contracts/test/tokens";
import { TestERC721__factory, TestERC1155__factory } from "../types/ethers-contracts/factories/@rarible/transfer-proxy/contracts/test/tokens";

// Import Exchange V2 and helpers
import type { RaribleTestHelper } from "../types/ethers-contracts/@rarible/exchange-v2/contracts/test";
import { RaribleTestHelper__factory } from "../types/ethers-contracts/factories/@rarible/exchange-v2/contracts/test";

import { deployTransparentProxy } from "@rarible/common-sdk/src/deploy";

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const MARKET_MARKER_SELL = "0x68619b8adb206de04f676007b2437f99ff6129b672495a6951499c6c56bc2f10";

// Token IDs
const erc721TokenId1 = 55n;
const erc721TokenId2 = 56n;
const erc721TokenId3 = 57n;
const erc1155TokenId1 = 55n;
const erc1155TokenId2 = 56n;
const erc1155TokenId3 = 57n;
const tokenId = 12345n;

// -----------------------------------------------------------------------------
// Type Definitions
// -----------------------------------------------------------------------------
interface PurchaseDataStruct {
  marketId: number | bigint;
  amount: number | bigint;
  fees: number | bigint | string;
  data: string;
}

interface DirectPurchaseParamsStruct {
  sellOrderMaker: string;
  sellOrderNftAmount: number | bigint;
  nftAssetClass: string;
  nftData: string;
  sellOrderPaymentAmount: number | bigint;
  paymentToken: string;
  sellOrderSalt: number | bigint;
  sellOrderStart: number | bigint;
  sellOrderEnd: number | bigint;
  sellOrderDataType: string;
  sellOrderData: string;
  sellOrderSignature: string;
  buyOrderPaymentAmount: number | bigint;
  buyOrderNftAmount: number | bigint;
  buyOrderData: string;
}

// -----------------------------------------------------------------------------
// Main Test Suite
// -----------------------------------------------------------------------------
describe("RaribleExchangeWrapper default cases", function () {
  let bulkExchange: RaribleExchangeWrapper;
  let wrapperHelper: WrapperHelper;
  let helper: RaribleTestHelper;

  // Marketplace contracts - using ethers.Contract for those not available as TypeScript types
  let exchangeV2: ethersTypes.Contract;
  let seaport: ethersTypes.Contract | null = null;
  let transferManagerERC721: ethersTypes.Contract | null = null;
  let transferSelectorNFT: ethersTypes.Contract | null = null;
  let transferManagerERC1155: ethersTypes.Contract | null = null;
  let lr_strategy: ethersTypes.Contract | null = null;
  let looksRareExchange: ethersTypes.Contract | null = null;
  let weth: ethersTypes.Contract | null = null;
  let x2y2: ethersTypes.Contract | null = null;
  let erc721delegate: ethersTypes.Contract | null = null;
  let factorySudoSwap: ethersTypes.Contract | null = null;
  let routerSudoSwap: ethersTypes.Contract | null = null;
  let exp: ethersTypes.Contract | null = null;
  let lin: ethersTypes.Contract | null = null;

  // Rarible protocol contracts
  let transferProxy: TransferProxy;
  let erc20TransferProxy: ERC20TransferProxy;
  let royaltiesRegistry: RoyaltiesRegistry;

  // Test tokens
  let erc721: TestERC721;
  let erc1155: TestERC1155;

  let accounts: ethersTypes.Signer[];
  let deployer: ethersTypes.Signer;
  let protocol: string;
  let feeRecipienterUP: string;
  let zoneAddr: string;

  // -----------------------------------------------------------------------------
  // Setup
  // -----------------------------------------------------------------------------
  before(async () => {
    accounts = await ethers.getSigners();
    [deployer] = accounts;

    protocol = await accounts[9].getAddress();
    feeRecipienterUP = await accounts[6].getAddress();
    zoneAddr = await accounts[2].getAddress();

    // Deploy test helpers
    helper = await new RaribleTestHelper__factory(deployer).deploy();
    await helper.waitForDeployment();

    wrapperHelper = await new WrapperHelper__factory(deployer).deploy();
    await wrapperHelper.waitForDeployment();

    // Deploy Rarible protocol contracts
    const { instance: transferProxyInstance } = await deployTransparentProxy<TransferProxy>(ethers, {
      contractName: "TransferProxy",
      initFunction: "__TransferProxy_init",
      initArgs: [await deployer.getAddress()],
      proxyOwner: await deployer.getAddress(),
    });
    transferProxy = transferProxyInstance;

    const { instance: erc20TransferProxyInstance } = await deployTransparentProxy<ERC20TransferProxy>(ethers, {
      contractName: "ERC20TransferProxy",
      initFunction: "__ERC20TransferProxy_init",
      initArgs: [await deployer.getAddress()],
      proxyOwner: await deployer.getAddress(),
    });
    erc20TransferProxy = erc20TransferProxyInstance;

    const { instance: royaltiesRegistryInstance } = await deployTransparentProxy<RoyaltiesRegistry>(ethers, {
      contractName: "RoyaltiesRegistry",
      initFunction: "__RoyaltiesRegistry_init",
      initArgs: [], // No arguments - uses _msgSender() internally
      proxyOwner: await deployer.getAddress(),
    });
    royaltiesRegistry = royaltiesRegistryInstance;
  });

  beforeEach(async () => {
    // Deploy fresh test tokens for each test (simple non-upgradeable versions)
    erc721 = await new TestERC721__factory(deployer).deploy();
    await erc721.waitForDeployment();

    erc1155 = await new TestERC1155__factory(deployer).deploy();
    await erc1155.waitForDeployment();

    // Deploy Rarible Exchange V2
    await deployRarible();

    // TODO: Deploy marketplace contracts when artifacts are available
    // - Seaport (ConduitController, Seaport)
    // - LooksRare (full setup with CurrencyManager, ExecutionManager, etc.)
    // - X2Y2 (X2Y2_r1, ERC721Delegate)
    // - SudoSwap (Factory, Router, Curves)

    // Deploy bulk exchange wrapper
    const marketplaces = [
      ZERO_ADDRESS, // 0
      await exchangeV2.getAddress(), // 1 - Rarible V2
      ZERO_ADDRESS, // 2 - Seaport (fulfillBasicOrder) - TODO: add when available
      ZERO_ADDRESS, // 3 - X2Y2 - TODO: add when available
      ZERO_ADDRESS, // 4 - LooksRare - TODO: add when available
      ZERO_ADDRESS, // 5 - SudoSwap - TODO: add when available
      ZERO_ADDRESS, // 6 - Seaport (fulfillBasicOrder_efficient_6GL6yc) - TODO: add when available
      ZERO_ADDRESS, // 7
      ZERO_ADDRESS, // 8
      ZERO_ADDRESS, // 9 - Seaport (fulfillOrder) - TODO: add when available
      ZERO_ADDRESS, // 10 - Seaport (fulfillAdvancedOrder) - TODO: add when available
    ];

    bulkExchange = await new RaribleExchangeWrapper__factory(deployer).deploy(
      marketplaces,
      ZERO_ADDRESS, // weth
      [], // transferProxies
      await deployer.getAddress(), // owner
    );
    await bulkExchange.waitForDeployment();
  });

  // ---------------------------------------------------------------------------
  // Helper Functions
  // ---------------------------------------------------------------------------

  async function deployRarible() {
    // Deploy ExchangeV2 via transparent proxy
    const { instance: exchangeV2Instance } = await deployTransparentProxy(ethers, {
      contractName: "ExchangeV2",
      initFunction: "__ExchangeV2_init",
      initArgs: [
        await transferProxy.getAddress(),
        await erc20TransferProxy.getAddress(),
        0, // protocol fee
        protocol, // default fee receiver
        await royaltiesRegistry.getAddress(),
        await deployer.getAddress(), // initial owner
      ],
      proxyOwner: await deployer.getAddress(),
    });
    exchangeV2 = exchangeV2Instance as any;

    await transferProxy.addOperator(await exchangeV2.getAddress());
    await erc20TransferProxy.addOperator(await exchangeV2.getAddress());
  }

  function PurchaseData(
    marketId: number | bigint,
    amount: number | bigint,
    fees: number | bigint | string,
    data: string,
  ): PurchaseDataStruct {
    return { marketId, amount, fees, data };
  }

  async function encDataV2(tuple: [Array<[string, number]>, Array<[string, number]>, boolean]): Promise<string> {
    // tuple format: [payouts, originFees, isMakeFill]
    // Each payout/originFee is [account, value] where value is basis points (10000 = 100%)
    const dataV2 = {
      payouts: tuple[0].map(([account, value]) => ({ account, value })),
      originFees: tuple[1].map(([account, value]) => ({ account, value })),
      isMakeFill: tuple[2],
    };
    return helper.encodeV2(dataV2);
  }

  async function getSignature(
    order: OrderStruct,
    signer: ethersTypes.Signer,
    exchangeContract: string,
  ): Promise<string> {
    return sign(signer, order, exchangeContract);
  }

  async function encodeFees(first = 0, second = 0): Promise<string> {
    const result = await wrapperHelper.encodeFees(first, second);
    return result.toString();
  }

  async function encodeDataTypeAndFees(dataType = 0, first = 0, second = 0): Promise<string> {
    const result = await wrapperHelper.encodeFeesPlusDataType(dataType, first, second);
    return result.toString();
  }

  async function encodeBpPlusAccountTest(bp = 0, account = ZERO_ADDRESS): Promise<string> {
    const result = await wrapperHelper.encodeBpPlusAccount(bp, account);
    return result.toString();
  }

  async function checkExecutions(tx: ethersTypes.ContractTransactionResponse, expectedResults: boolean[]) {
    const receipt = await tx.wait();
    if (!receipt) {
      throw new Error("Transaction receipt not found");
    }

    // Get Execution events
    const events = await bulkExchange.queryFilter(
      bulkExchange.filters.Execution(),
      receipt.blockNumber,
      receipt.blockNumber,
    );

    expect(events.length).to.equal(expectedResults.length, "Number of Execution events mismatch");

    for (let i = 0; i < events.length; i++) {
      expect(events[i].args.result).to.equal(expectedResults[i], `Execution ${i} result mismatch`);
    }
  }

  // ---------------------------------------------------------------------------
  // Tests - Simple Batch Orders (Rarible V2 only)
  // ---------------------------------------------------------------------------
  describe("batch orders - Rarible V2", () => {
    it("batch two Rarible V2 orders with 5%+10% fees", async function () {
      const seller = await accounts[1].getAddress();
      const buyer = await accounts[2].getAddress();
      const feeRecipientSecond = await accounts[7].getAddress();

      // ===== RARIBLE V2 ORDER 1 =====
      await erc721.mint(seller, erc721TokenId1);
      await erc721.connect(accounts[1]).setApprovalForAll(await transferProxy.getAddress(), true);

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[buyer, 10000]], [], false]);

      const left = Order(
        seller,
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId1), 1n),
        ZERO_ADDRESS,
        Asset(ETH, "0x", 100n),
        1n,
        0n,
        0n,
        ORDER_DATA_V2,
        encDataLeft,
      );

      const directPurchaseParams: DirectPurchaseParamsStruct = {
        sellOrderMaker: seller,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId1),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO_ADDRESS,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: await getSignature(left, accounts[1], await exchangeV2.getAddress()),
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const data = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData = PurchaseData(0, 100, await encodeFees(500, 1000), data); // marketId 0 = ExchangeV2

      // ===== RARIBLE V2 ORDER 2 =====
      await erc721.mint(seller, erc721TokenId2);
      await erc721.connect(accounts[1]).setApprovalForAll(await transferProxy.getAddress(), true);

      const left1 = Order(
        seller,
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId2), 1n),
        ZERO_ADDRESS,
        Asset(ETH, "0x", 100n),
        2n,
        0n,
        0n,
        ORDER_DATA_V2,
        encDataLeft,
      );

      const directPurchaseParams1: DirectPurchaseParamsStruct = {
        sellOrderMaker: seller,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId2),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO_ADDRESS,
        sellOrderSalt: 2,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: await getSignature(left1, accounts[1], await exchangeV2.getAddress()),
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const data1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams1);
      const tradeData1 = PurchaseData(0, 100, await encodeFees(500, 1000), data1); // marketId 0 = ExchangeV2

      // ===== EXECUTE BULK PURCHASE =====
      const provider = accounts[2].provider!;
      const tx = await verifyBalanceChangeReturnTx(provider, buyer, 230n, async () =>
        verifyBalanceChangeReturnTx(provider, seller, -200n, async () =>
          verifyBalanceChangeReturnTx(provider, feeRecipienterUP, -10n, () =>
            verifyBalanceChangeReturnTx(provider, feeRecipientSecond, -20n, () =>
              bulkExchange
                .connect(accounts[2])
                .bulkPurchase([tradeData, tradeData1], feeRecipienterUP, feeRecipientSecond, false, { value: 230n }),
            ),
          ),
        ),
      );

      await checkExecutions(tx, [true, true]);

      // Verify ownership
      expect(await erc721.ownerOf(erc721TokenId1)).to.equal(buyer);
      expect(await erc721.ownerOf(erc721TokenId2)).to.equal(buyer);
    });

    it("batch two Rarible V2 orders, one with invalid signature fails with allowFail=true", async function () {
      const seller = await accounts[1].getAddress();
      const buyer = await accounts[2].getAddress();
      const feeRecipientSecond = await accounts[7].getAddress();

      // ===== VALID RARIBLE V2 ORDER =====
      await erc721.mint(seller, erc721TokenId1);
      await erc721.connect(accounts[1]).setApprovalForAll(await transferProxy.getAddress(), true);

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[buyer, 10000]], [], false]);

      const left = Order(
        seller,
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId1), 1n),
        ZERO_ADDRESS,
        Asset(ETH, "0x", 100n),
        1n,
        0n,
        0n,
        ORDER_DATA_V2,
        encDataLeft,
      );

      const directPurchaseParams: DirectPurchaseParamsStruct = {
        sellOrderMaker: seller,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId1),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO_ADDRESS,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: await getSignature(left, accounts[1], await exchangeV2.getAddress()),
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const data = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData = PurchaseData(0, 100, await encodeFees(500, 1000), data); // marketId 0 = ExchangeV2

      // ===== INVALID RARIBLE V2 ORDER (wrong signature) =====
      await erc721.mint(seller, erc721TokenId2);
      await erc721.connect(accounts[1]).setApprovalForAll(await transferProxy.getAddress(), true);

      const left1 = Order(
        seller,
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId2), 1n),
        ZERO_ADDRESS,
        Asset(ETH, "0x", 100n),
        2n,
        0n,
        0n,
        ORDER_DATA_V2,
        encDataLeft,
      );

      const directPurchaseParams1: DirectPurchaseParamsStruct = {
        sellOrderMaker: seller,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId2),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO_ADDRESS,
        sellOrderSalt: 2,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: "0x00", // INVALID SIGNATURE
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const data1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams1);
      const tradeData1 = PurchaseData(0, 100, await encodeFees(500, 1000), data1); // marketId 0 = ExchangeV2

      // ===== SHOULD FAIL with allowFail=false =====
      await expect(
        bulkExchange
          .connect(accounts[2])
          .bulkPurchase([tradeData, tradeData1], feeRecipienterUP, feeRecipientSecond, false, { value: 230n }),
      ).to.be.revert(ethers);

      // ===== SHOULD SUCCEED with allowFail=true (only first order succeeds) =====
      const provider = accounts[2].provider!;
      const tx = await verifyBalanceChangeReturnTx(provider, buyer, 115n, async () =>
        verifyBalanceChangeReturnTx(provider, seller, -100n, async () =>
          verifyBalanceChangeReturnTx(provider, feeRecipienterUP, -5n, () =>
            verifyBalanceChangeReturnTx(provider, feeRecipientSecond, -10n, () =>
              bulkExchange.connect(accounts[2]).bulkPurchase(
                [tradeData, tradeData1],
                feeRecipienterUP,
                feeRecipientSecond,
                true, // allowFail = true
                { value: 230n },
              ),
            ),
          ),
        ),
      );

      await checkExecutions(tx, [true, false]);

      // Verify ownership - only first NFT transferred
      expect(await erc721.ownerOf(erc721TokenId1)).to.equal(buyer);
      expect(await erc721.ownerOf(erc721TokenId2)).to.equal(seller); // Still with seller
    });
  });

  // ---------------------------------------------------------------------------
  // Tests - Full Marketplace Integration (requires external contracts)
  // ---------------------------------------------------------------------------
  describe.skip("batch orders - Full Marketplace Integration", () => {
    /*
     * These tests require external marketplace contract artifacts that are not available:
     * - Seaport: npm install @opensea/seaport-core (or similar)
     * - LooksRare: Need full LooksRare contract suite
     * - X2Y2: Need X2Y2 contract artifacts
     * - SudoSwap: Need SudoSwap protocol contracts
     *
     * Once these are added, compiled, and TypeScript types generated:
     * 1. Uncomment the deployment logic in beforeEach()
     * 2. Remove the .skip from this describe block
     * 3. Implement the order creation logic for each marketplace
     */

    it("batch all cases 5%+10% fees for all (raribleV2, RaribleV2, seaPort, x2y2, looksRare, sudoswap)", async function () {
      // Full implementation available in bulk.test.js
      // Requires all marketplace contracts to be deployed
    });

    it("batch all cases 5%+10% fees for all, 1 request fails", async function () {
      // Test with one marketplace order failing
      // Verify allowFail behavior
    });

    it("batch all cases 5%+10% fees for all, all fail = revert", async function () {
      // Test with all orders initially failing
      // Then add one valid order and verify it succeeds with allowFail=true
    });

    it("batch all cases 5%+10% fees for all except rarible and sudo", async function () {
      // Test with varying fee configurations per marketplace
    });

    it("batch all cases 5%+10% fees for all sudoswap fails, no royalties", async function () {
      // Test SudoSwap failure with royalty configuration
    });
  });
});
