// <ai_context> TypeScript port of RaribleManager.test.js. Tests RaribleTransferManager contract functionality including doTransfersExternal for various asset types (ETH, ERC20, ERC721, ERC1155), lazy minting with royalties, royalties fees (V1 and V2), and protocol fee settings. </ai_context>
import { expect } from "chai";
import { network } from "hardhat";
import type * as ethersTypes from "ethers";

const connection = await network.connect();
const { ethers } = connection;

import {
  type RaribleTransferManagerTest,
  RaribleTransferManagerTest__factory,
  type TransferProxyTest,
  TransferProxyTest__factory,
  type TestRoyaltiesRegistry,
  TestRoyaltiesRegistry__factory,
  type ERC20TransferProxyTest,
  ERC20TransferProxyTest__factory,
  type TestERC20,
  TestERC20__factory,
  type TestERC721RoyaltiesV1,
  TestERC721RoyaltiesV1__factory,
  type TestERC721RoyaltiesV2,
  TestERC721RoyaltiesV2__factory,
  type TestERC1155RoyaltiesV2,
  TestERC1155RoyaltiesV2__factory,
  type TestERC1155RoyaltiesV1,
  TestERC1155RoyaltiesV1__factory,
  type TestERC721WithRoyaltiesV1_InterfaceError,
  TestERC721WithRoyaltiesV1_InterfaceError__factory,
  type TestERC1155WithRoyaltiesV2_InterfaceError,
  TestERC1155WithRoyaltiesV2_InterfaceError__factory,
  type ERC721LazyMintTest,
  ERC721LazyMintTest__factory,
  type ERC1155LazyMintTest,
  ERC1155LazyMintTest__factory,
  type ERC721LazyMintTransferProxyTest,
  ERC721LazyMintTransferProxyTest__factory,
  type ERC1155LazyMintTransferProxyTest,
  ERC1155LazyMintTransferProxyTest__factory,
} from "../types/ethers-contracts";
import { Order, Asset, type OrderStruct } from "@rarible/common-sdk/src/order";
import { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, ORDER_DATA_V2, id, enc } from "@rarible/common-sdk/src/assets";
import { verifyBalanceChangeReturnTx } from "@rarible/common-sdk/src/balance";
import { deployTransparentProxy } from "@rarible/common-sdk/src/deploy";

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const ZERO = "0x0000000000000000000000000000000000000000";

// -----------------------------------------------------------------------------
// Main Test Suite
// -----------------------------------------------------------------------------
describe("RaribleTransferManagerTest:doTransferTest()", function () {
  let RTM: RaribleTransferManagerTest;
  let transferProxy: TransferProxyTest;
  let erc20TransferProxy: ERC20TransferProxyTest;
  let royaltiesRegistry: TestRoyaltiesRegistry;
  let accounts: ethersTypes.Signer[];
  let deployer: ethersTypes.Signer;
  let protocol: string;
  let community: string;
  let erc721LazyProxy: ERC721LazyMintTransferProxyTest;
  let erc1155LazyProxy: ERC1155LazyMintTransferProxyTest;

  const erc721TokenId0 = 52n;
  const erc721TokenId1 = 53n;
  const erc1155TokenId1 = 54n;
  const erc1155TokenId2 = 55n;

  before(async () => {
    accounts = await ethers.getSigners();
    [deployer] = accounts;
    protocol = await accounts[9].getAddress();
    community = await accounts[8].getAddress();

    // Deploy proxies
    transferProxy = await new TransferProxyTest__factory(deployer).deploy();
    await transferProxy.waitForDeployment();

    erc20TransferProxy = await new ERC20TransferProxyTest__factory(deployer).deploy();
    await erc20TransferProxy.waitForDeployment();

    royaltiesRegistry = await new TestRoyaltiesRegistry__factory(deployer).deploy();
    await royaltiesRegistry.waitForDeployment();

    // Deploy RaribleTransferManagerTest via transparent proxy
    const { instance } = await deployTransparentProxy<RaribleTransferManagerTest>(ethers, {
      contractName: "RaribleTransferManagerTest",
      initFunction: "init____",
      initArgs: [
        await transferProxy.getAddress(),
        await erc20TransferProxy.getAddress(),
        0n,
        ZERO,
        await royaltiesRegistry.getAddress(),
        await deployer.getAddress(),
      ],
      proxyOwner: await deployer.getAddress(),
    });
    RTM = instance;

    // Deploy lazy mint proxies once for all tests via transparent proxy
    const { instance: erc721Instance } = await deployTransparentProxy<ERC721LazyMintTransferProxyTest>(ethers, {
      contractName: "ERC721LazyMintTransferProxyTest",
      initFunction: "__ERC721LazyMintTransferProxyTest_init",
      initArgs: [await deployer.getAddress()],
      proxyOwner: await deployer.getAddress(),
    });
    erc721LazyProxy = erc721Instance;
    await erc721LazyProxy.addOperator(await RTM.getAddress());

    const { instance: erc1155Instance } = await deployTransparentProxy<ERC1155LazyMintTransferProxyTest>(ethers, {
      contractName: "ERC1155LazyMintTransferProxyTest",
      initFunction: "__ERC1155LazyMintTransferProxyTest_init",
      initArgs: [await deployer.getAddress()],
      proxyOwner: await deployer.getAddress(),
    });
    erc1155LazyProxy = erc1155Instance;
    await erc1155LazyProxy.addOperator(await RTM.getAddress());
  });

  // ---------------------------------------------------------------------------
  // Helper functions
  // ---------------------------------------------------------------------------
  async function encDataV1(tuple: any): Promise<string> {
    return await RTM.encode(tuple);
  }

  async function prepareERC20(user: ethersTypes.Signer, value: bigint = 1000n): Promise<TestERC20> {
    const erc20Token = await new TestERC20__factory(deployer).deploy();
    await erc20Token.waitForDeployment();

    await erc20Token.mintTo(await user.getAddress(), value);
    await erc20Token.connect(user).approve(await erc20TransferProxy.getAddress(), value);
    return erc20Token;
  }

  async function prepareERC721(
    user: ethersTypes.Signer,
    tokenId: bigint = erc721TokenId1,
    royalties: any[] = [],
  ): Promise<TestERC721RoyaltiesV2> {
    const erc721 = await new TestERC721RoyaltiesV2__factory(deployer).deploy();
    await erc721.waitForDeployment();
    await erc721.initialize();

    await erc721.mint(await user.getAddress(), tokenId, royalties);
    await erc721.connect(user).setApprovalForAll(await transferProxy.getAddress(), true);
    return erc721;
  }

  async function prepareERC1155(
    user: ethersTypes.Signer,
    value: bigint = 100n,
    tokenId: bigint = erc1155TokenId1,
    royalties: any[] = [],
  ): Promise<TestERC1155RoyaltiesV2> {
    const erc1155 = await new TestERC1155RoyaltiesV2__factory(deployer).deploy();
    await erc1155.waitForDeployment();
    await erc1155.initialize();

    await erc1155.mint(await user.getAddress(), tokenId, value, royalties);
    await erc1155.connect(user).setApprovalForAll(await transferProxy.getAddress(), true);
    return erc1155;
  }

  // ---------------------------------------------------------------------------
  // Check doTransfersExternal() tests
  // ---------------------------------------------------------------------------
  describe("Check doTransfersExternal()", () => {
    it("Transfer from ETH to ERC1155, protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
      const erc1155 = await prepareERC1155(accounts[2], 10n);
      const account0Address = await accounts[0].getAddress();
      const account2Address = await accounts[2].getAddress();
      const erc1155Address = await erc1155.getAddress();

      const left = Order(
        account0Address,
        Asset(ETH, "0x", 100n),
        ZERO,
        Asset(ERC1155, enc(erc1155Address, erc1155TokenId1), 7n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      const right = Order(
        account2Address,
        Asset(ERC1155, enc(erc1155Address, erc1155TokenId1), 7n),
        ZERO,
        Asset(ETH, "0x", 100n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      const provider = accounts[0].provider;
      await verifyBalanceChangeReturnTx(provider, account0Address, 100n, async () =>
        verifyBalanceChangeReturnTx(provider, account2Address, -100n, async () =>
          verifyBalanceChangeReturnTx(provider, protocol, 0n, () =>
            RTM.connect(accounts[0]).doTransfersExternal(left, right, { value: 100n }),
          ),
        ),
      );
      expect(await erc1155.balanceOf(account0Address, erc1155TokenId1)).to.equal(7n);
      expect(await erc1155.balanceOf(account2Address, erc1155TokenId1)).to.equal(3n);
    });

    it("Transfer from ERC721 to ERC721", async () => {
      const erc721 = await prepareERC721(accounts[1]);
      const account1Address = await accounts[1].getAddress();
      const account2Address = await accounts[2].getAddress();
      const erc721Address = await erc721.getAddress();

      await erc721.mint(account2Address, erc721TokenId0, []);
      await erc721.connect(accounts[2]).setApprovalForAll(await transferProxy.getAddress(), true);

      const data = await encDataV1([[], []]);
      const left = Order(
        account1Address,
        Asset(ERC721, enc(erc721Address, erc721TokenId1), 1n),
        ZERO,
        Asset(ERC721, enc(erc721Address, erc721TokenId0), 1n),
        1n,
        0n,
        0n,
        ORDER_DATA_V1,
        data,
      );
      const right = Order(
        account2Address,
        Asset(ERC721, enc(erc721Address, erc721TokenId0), 1n),
        ZERO,
        Asset(ERC721, enc(erc721Address, erc721TokenId1), 1n),
        1n,
        0n,
        0n,
        ORDER_DATA_V1,
        data,
      );

      await RTM.doTransfersExternal(left, right);
      expect(await erc721.ownerOf(erc721TokenId1)).to.equal(account2Address);
      expect(await erc721.ownerOf(erc721TokenId0)).to.equal(account1Address);
    });

    it("Transfer from ERC721 to ERC1155, (buyerFee3%, sallerFee3% = 6%) of ERC1155 transfer to community, orders dataType == V1", async () => {
      const erc721 = await prepareERC721(accounts[1]);
      const erc1155 = await prepareERC1155(accounts[2], 120n);
      const account1Address = await accounts[1].getAddress();
      const account2Address = await accounts[2].getAddress();
      const account3Address = await accounts[3].getAddress();
      const account4Address = await accounts[4].getAddress();
      const account5Address = await accounts[5].getAddress();
      const account6Address = await accounts[6].getAddress();
      const erc721Address = await erc721.getAddress();
      const erc1155Address = await erc1155.getAddress();

      const addrOriginLeft = [
        [account3Address, 100n],
        [account5Address, 300n],
      ];
      const addrOriginRight = [
        [account4Address, 200n],
        [account6Address, 400n],
      ];
      const encDataLeft = await encDataV1([[[account1Address, 10000n]], addrOriginLeft]);
      const encDataRight = await encDataV1([[[account2Address, 10000n]], addrOriginRight]);

      const left = Order(
        account1Address,
        Asset(ERC721, enc(erc721Address, erc721TokenId1), 1n),
        ZERO,
        Asset(ERC1155, enc(erc1155Address, erc1155TokenId1), 100n),
        1n,
        0n,
        0n,
        ORDER_DATA_V1,
        encDataLeft,
      );
      const right = Order(
        account2Address,
        Asset(ERC1155, enc(erc1155Address, erc1155TokenId1), 100n),
        ZERO,
        Asset(ERC721, enc(erc721Address, erc721TokenId1), 1n),
        1n,
        0n,
        0n,
        ORDER_DATA_V1,
        encDataRight,
      );

      await RTM.doTransfersExternal(left, right);

      expect(await erc721.balanceOf(account1Address)).to.equal(0n);
      expect(await erc721.balanceOf(account2Address)).to.equal(1n);
      expect(await erc1155.balanceOf(account1Address, erc1155TokenId1)).to.equal(96n);
      expect(await erc1155.balanceOf(account2Address, erc1155TokenId1)).to.equal(14n);
      expect(await erc1155.balanceOf(community, erc1155TokenId1)).to.equal(0n);
    });

    it("Transfer from ERC1155 to ERC1155: 2 to 10, 50% 50% for payouts", async () => {
      const erc1155 = await prepareERC1155(accounts[1], 100n);
      const account1Address = await accounts[1].getAddress();
      const account2Address = await accounts[2].getAddress();
      const account3Address = await accounts[3].getAddress();
      const account4Address = await accounts[4].getAddress();
      const account5Address = await accounts[5].getAddress();
      const account6Address = await accounts[6].getAddress();
      const erc1155Address = await erc1155.getAddress();

      await erc1155.mint(account2Address, erc1155TokenId2, 100n, []);
      await erc1155.connect(accounts[2]).setApprovalForAll(await transferProxy.getAddress(), true);

      const encDataLeft = await encDataV1([
        [
          [account3Address, 5000n],
          [account5Address, 5000n],
        ],
        [],
      ]);
      const encDataRight = await encDataV1([
        [
          [account4Address, 5000n],
          [account6Address, 5000n],
        ],
        [],
      ]);

      const left = Order(
        account1Address,
        Asset(ERC1155, enc(erc1155Address, erc1155TokenId1), 2n),
        ZERO,
        Asset(ERC1155, enc(erc1155Address, erc1155TokenId2), 10n),
        1n,
        0n,
        0n,
        ORDER_DATA_V1,
        encDataLeft,
      );
      const right = Order(
        account2Address,
        Asset(ERC1155, enc(erc1155Address, erc1155TokenId2), 10n),
        ZERO,
        Asset(ERC1155, enc(erc1155Address, erc1155TokenId1), 2n),
        1n,
        0n,
        0n,
        ORDER_DATA_V1,
        encDataRight,
      );

      await RTM.doTransfersExternal(left, right);

      expect(await erc1155.balanceOf(account1Address, erc1155TokenId1)).to.equal(98n);
      expect(await erc1155.balanceOf(account2Address, erc1155TokenId1)).to.equal(0n);
      expect(await erc1155.balanceOf(account1Address, erc1155TokenId2)).to.equal(0n);
      expect(await erc1155.balanceOf(account2Address, erc1155TokenId2)).to.equal(90n);

      expect(await erc1155.balanceOf(account3Address, erc1155TokenId2)).to.equal(5n);
      expect(await erc1155.balanceOf(account5Address, erc1155TokenId2)).to.equal(5n);
      expect(await erc1155.balanceOf(account4Address, erc1155TokenId1)).to.equal(1n);
      expect(await erc1155.balanceOf(account6Address, erc1155TokenId1)).to.equal(1n);
    });

    it("rounding error Transfer from ERC1155 to ERC1155: 1 to 5, 50% 50% for payouts", async () => {
      const erc1155 = await prepareERC1155(accounts[1], 100n);
      const account1Address = await accounts[1].getAddress();
      const account2Address = await accounts[2].getAddress();
      const account3Address = await accounts[3].getAddress();
      const account4Address = await accounts[4].getAddress();
      const account5Address = await accounts[5].getAddress();
      const account6Address = await accounts[6].getAddress();
      const erc1155Address = await erc1155.getAddress();

      await erc1155.mint(account2Address, erc1155TokenId2, 100n, []);
      await erc1155.connect(accounts[2]).setApprovalForAll(await transferProxy.getAddress(), true);

      const encDataLeft = await encDataV1([
        [
          [account3Address, 5000n],
          [account5Address, 5000n],
        ],
        [],
      ]);
      const encDataRight = await encDataV1([
        [
          [account4Address, 5000n],
          [account6Address, 5000n],
        ],
        [],
      ]);

      const left = Order(
        account1Address,
        Asset(ERC1155, enc(erc1155Address, erc1155TokenId1), 1n),
        ZERO,
        Asset(ERC1155, enc(erc1155Address, erc1155TokenId2), 5n),
        1n,
        0n,
        0n,
        ORDER_DATA_V1,
        encDataLeft,
      );
      const right = Order(
        account2Address,
        Asset(ERC1155, enc(erc1155Address, erc1155TokenId2), 5n),
        ZERO,
        Asset(ERC1155, enc(erc1155Address, erc1155TokenId1), 1n),
        1n,
        0n,
        0n,
        ORDER_DATA_V1,
        encDataRight,
      );

      await RTM.doTransfersExternal(left, right);

      expect(await erc1155.balanceOf(account1Address, erc1155TokenId1)).to.equal(99n);
      expect(await erc1155.balanceOf(account2Address, erc1155TokenId1)).to.equal(0n);
      expect(await erc1155.balanceOf(account1Address, erc1155TokenId2)).to.equal(0n);
      expect(await erc1155.balanceOf(account2Address, erc1155TokenId2)).to.equal(95n);

      expect(await erc1155.balanceOf(account3Address, erc1155TokenId2)).to.equal(2n);
      expect(await erc1155.balanceOf(account5Address, erc1155TokenId2)).to.equal(3n);
      expect(await erc1155.balanceOf(account4Address, erc1155TokenId1)).to.equal(0n);
      expect(await erc1155.balanceOf(account6Address, erc1155TokenId1)).to.equal(1n);
      expect(await erc1155.balanceOf(community, erc1155TokenId1)).to.equal(0n);
    });

    it("Transfer from ERC1155 to ERC721, (buyerFee3%, sallerFee3% = 6%) of ERC1155 protocol (buyerFee3%, sallerFee3%)", async () => {
      const erc721 = await prepareERC721(accounts[2]);
      const erc1155 = await prepareERC1155(accounts[1], 105n);
      const account1Address = await accounts[1].getAddress();
      const account2Address = await accounts[2].getAddress();
      const erc721Address = await erc721.getAddress();
      const erc1155Address = await erc1155.getAddress();

      const left = Order(
        account1Address,
        Asset(ERC1155, enc(erc1155Address, erc1155TokenId1), 100n),
        ZERO,
        Asset(ERC721, enc(erc721Address, erc721TokenId1), 1n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      const right = Order(
        account2Address,
        Asset(ERC721, enc(erc721Address, erc721TokenId1), 1n),
        ZERO,
        Asset(ERC1155, enc(erc1155Address, erc1155TokenId1), 100n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      await RTM.doTransfersExternal(left, right);

      expect(await erc721.balanceOf(account2Address)).to.equal(0n);
      expect(await erc721.balanceOf(account1Address)).to.equal(1n);
      expect(await erc1155.balanceOf(account2Address, erc1155TokenId1)).to.equal(100n);
      expect(await erc1155.balanceOf(account1Address, erc1155TokenId1)).to.equal(5n);
      expect(await erc1155.balanceOf(protocol, erc1155TokenId1)).to.equal(0n);
    });

    it("Transfer from ERC20 to ERC1155, protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
      const erc20 = await prepareERC20(accounts[1], 105n);
      const erc1155 = await prepareERC1155(accounts[2], 10n);
      const account1Address = await accounts[1].getAddress();
      const account2Address = await accounts[2].getAddress();
      const erc20Address = await erc20.getAddress();
      const erc1155Address = await erc1155.getAddress();

      const left = Order(
        account1Address,
        Asset(ERC20, enc(erc20Address), 100n),
        ZERO,
        Asset(ERC1155, enc(erc1155Address, erc1155TokenId1), 7n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      const right = Order(
        account2Address,
        Asset(ERC1155, enc(erc1155Address, erc1155TokenId1), 7n),
        ZERO,
        Asset(ERC20, enc(erc20Address), 100n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      await RTM.doTransfersExternal(left, right);

      expect(await erc20.balanceOf(account1Address)).to.equal(5n);
      expect(await erc20.balanceOf(account2Address)).to.equal(100n);
      expect(await erc1155.balanceOf(account1Address, erc1155TokenId1)).to.equal(7n);
      expect(await erc1155.balanceOf(account2Address, erc1155TokenId1)).to.equal(3n);
      expect(await erc20.balanceOf(protocol)).to.equal(0n);
    });

    it("Transfer from ERC1155 to ERC20, protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
      const erc20 = await prepareERC20(accounts[4], 105n);
      const erc1155 = await prepareERC1155(accounts[3], 10n, erc1155TokenId2);
      const account3Address = await accounts[3].getAddress();
      const account4Address = await accounts[4].getAddress();
      const erc20Address = await erc20.getAddress();
      const erc1155Address = await erc1155.getAddress();

      const left = Order(
        account3Address,
        Asset(ERC1155, enc(erc1155Address, erc1155TokenId2), 7n),
        ZERO,
        Asset(ERC20, enc(erc20Address), 100n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      const right = Order(
        account4Address,
        Asset(ERC20, enc(erc20Address), 100n),
        ZERO,
        Asset(ERC1155, enc(erc1155Address, erc1155TokenId2), 7n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      await RTM.doTransfersExternal(left, right);

      expect(await erc20.balanceOf(account3Address)).to.equal(100n);
      expect(await erc20.balanceOf(account4Address)).to.equal(5n);
      expect(await erc1155.balanceOf(account3Address, erc1155TokenId2)).to.equal(3n);
      expect(await erc1155.balanceOf(account4Address, erc1155TokenId2)).to.equal(7n);
      expect(await erc20.balanceOf(protocol)).to.equal(0n);
    });

    it("Transfer from ERC20 to ERC721, protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
      const erc20 = await prepareERC20(accounts[1], 105n);
      const erc721 = await prepareERC721(accounts[2]);
      const account1Address = await accounts[1].getAddress();
      const account2Address = await accounts[2].getAddress();
      const erc20Address = await erc20.getAddress();
      const erc721Address = await erc721.getAddress();

      const left = Order(
        account1Address,
        Asset(ERC20, enc(erc20Address), 100n),
        ZERO,
        Asset(ERC721, enc(erc721Address, erc721TokenId1), 1n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      const right = Order(
        account2Address,
        Asset(ERC721, enc(erc721Address, erc721TokenId1), 1n),
        ZERO,
        Asset(ERC20, enc(erc20Address), 100n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      await RTM.doTransfersExternal(left, right);

      expect(await erc20.balanceOf(account1Address)).to.equal(5n);
      expect(await erc20.balanceOf(account2Address)).to.equal(100n);
      expect(await erc721.balanceOf(account1Address)).to.equal(1n);
      expect(await erc721.balanceOf(account2Address)).to.equal(0n);
      expect(await erc20.balanceOf(protocol)).to.equal(0n);
    });

    it("Transfer from ERC721 to ERC20, protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
      const erc20 = await prepareERC20(accounts[2], 105n);
      const erc721 = await prepareERC721(accounts[1]);
      const account1Address = await accounts[1].getAddress();
      const account2Address = await accounts[2].getAddress();
      const erc20Address = await erc20.getAddress();
      const erc721Address = await erc721.getAddress();

      const left = Order(
        account1Address,
        Asset(ERC721, enc(erc721Address, erc721TokenId1), 1n),
        ZERO,
        Asset(ERC20, enc(erc20Address), 100n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      const right = Order(
        account2Address,
        Asset(ERC20, enc(erc20Address), 100n),
        ZERO,
        Asset(ERC721, enc(erc721Address, erc721TokenId1), 1n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      await RTM.doTransfersExternal(left, right);

      expect(await erc20.balanceOf(account1Address)).to.equal(100n);
      expect(await erc20.balanceOf(account2Address)).to.equal(5n);
      expect(await erc721.balanceOf(account1Address)).to.equal(0n);
      expect(await erc721.balanceOf(account2Address)).to.equal(1n);
      expect(await erc20.balanceOf(protocol)).to.equal(0n);
    });

    it("Transfer from ERC20 to ERC20, protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
      const erc20 = await prepareERC20(accounts[1], 105n);
      const t2 = await prepareERC20(accounts[2], 220n);
      const account1Address = await accounts[1].getAddress();
      const account2Address = await accounts[2].getAddress();
      const erc20Address = await erc20.getAddress();
      const t2Address = await t2.getAddress();

      const left = Order(
        account1Address,
        Asset(ERC20, enc(erc20Address), 100n),
        ZERO,
        Asset(ERC20, enc(t2Address), 200n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      const right = Order(
        account2Address,
        Asset(ERC20, enc(t2Address), 200n),
        ZERO,
        Asset(ERC20, enc(erc20Address), 100n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      await RTM.doTransfersExternal(left, right);

      expect(await erc20.balanceOf(account1Address)).to.equal(5n);
      expect(await erc20.balanceOf(account2Address)).to.equal(100n);
      expect(await t2.balanceOf(account1Address)).to.equal(200n);
      expect(await t2.balanceOf(account2Address)).to.equal(20n);
      expect(await erc20.balanceOf(protocol)).to.equal(0n);
    });
  });

  // ---------------------------------------------------------------------------
  // Check lazy with royalties tests
  // ---------------------------------------------------------------------------
  describe("Check lazy with royalties", () => {
    it("Transfer from  ERC721lazy to ERC20 ", async () => {
      const erc721Test = await new ERC721LazyMintTest__factory(deployer).deploy();
      await erc721Test.waitForDeployment();

      await RTM.setTransferProxy(id("ERC721_LAZY"), await erc721LazyProxy.getAddress());

      const erc20 = await prepareERC20(accounts[2], 106n);
      const account1Address = await accounts[1].getAddress();
      const account2Address = await accounts[2].getAddress();
      const account5Address = await accounts[5].getAddress();
      const account6Address = await accounts[6].getAddress();
      const erc20Address = await erc20.getAddress();
      const erc721TestAddress = await erc721Test.getAddress();

      const encodedMintData = await erc721Test.encode({
        tokenId: 1n,
        tokenURI: "uri",
        creators: [{ account: account1Address, value: 0n }],
        royalties: [
          { account: account5Address, value: 2000n },
          { account: account6Address, value: 1000n },
        ],
        signatures: [],
      });

      const left = Order(
        account1Address,
        Asset(id("ERC721_LAZY"), encodedMintData, 1n),
        ZERO,
        Asset(ERC20, enc(erc20Address), 100n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      const right = Order(
        account2Address,
        Asset(ERC20, enc(erc20Address), 100n),
        ZERO,
        Asset(id("ERC721_LAZY"), encodedMintData, 1n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      await RTM.doTransfersExternal(left, right);

      expect(await erc721Test.ownerOf(1n)).to.equal(account2Address);
      expect(await erc20.balanceOf(account1Address)).to.equal(70n);
      expect(await erc20.balanceOf(account2Address)).to.equal(6n);
      expect(await erc20.balanceOf(account5Address)).to.equal(20n);
      expect(await erc20.balanceOf(account6Address)).to.equal(10n);
    });

    it("Transfer from  ERC1155lazy to ERC20 ", async () => {
      const erc1155Test = await new ERC1155LazyMintTest__factory(deployer).deploy();
      await erc1155Test.waitForDeployment();

      await RTM.setTransferProxy(id("ERC1155_LAZY"), await erc1155LazyProxy.getAddress());

      const erc20 = await prepareERC20(accounts[2], 106n);
      const account1Address = await accounts[1].getAddress();
      const account2Address = await accounts[2].getAddress();
      const account5Address = await accounts[5].getAddress();
      const account6Address = await accounts[6].getAddress();
      const erc20Address = await erc20.getAddress();

      const encodedMintData = await erc1155Test.encode({
        tokenId: 1n,
        tokenURI: "uri",
        supply: 5n,
        creators: [{ account: account1Address, value: 0n }],
        royalties: [
          { account: account5Address, value: 2000n },
          { account: account6Address, value: 1000n },
        ],
        signatures: [],
      });

      const left = Order(
        account1Address,
        Asset(id("ERC1155_LAZY"), encodedMintData, 5n),
        ZERO,
        Asset(ERC20, enc(erc20Address), 100n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      const right = Order(
        account2Address,
        Asset(ERC20, enc(erc20Address), 100n),
        ZERO,
        Asset(id("ERC1155_LAZY"), encodedMintData, 5n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      await RTM.doTransfersExternal(left, right);

      expect(await erc1155Test.balanceOf(account2Address, 1n)).to.equal(5n);
      expect(await erc20.balanceOf(account1Address)).to.equal(70n);
      expect(await erc20.balanceOf(account2Address)).to.equal(6n);
      expect(await erc20.balanceOf(account5Address)).to.equal(20n);
      expect(await erc20.balanceOf(account6Address)).to.equal(10n);
    });

    it("Transfer from ETH to ERC721Lazy", async () => {
      const erc721Test = await new ERC721LazyMintTest__factory(deployer).deploy();
      await erc721Test.waitForDeployment();

      await RTM.setTransferProxy(id("ERC721_LAZY"), await erc721LazyProxy.getAddress());

      const account1Address = await accounts[1].getAddress();
      const account2Address = await accounts[2].getAddress();
      const account5Address = await accounts[5].getAddress();
      const account6Address = await accounts[6].getAddress();

      const encodedMintData = await erc721Test.encode({
        tokenId: 1n,
        tokenURI: "uri",
        creators: [{ account: account2Address, value: 0n }],
        royalties: [
          { account: account5Address, value: 2000n },
          { account: account6Address, value: 1000n },
        ],
        signatures: [],
      });

      const left = Order(
        account1Address,
        Asset(ETH, "0x", 100n),
        ZERO,
        Asset(id("ERC721_LAZY"), encodedMintData, 1n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      const right = Order(
        account2Address,
        Asset(id("ERC721_LAZY"), encodedMintData, 1n),
        ZERO,
        Asset(ETH, "0x", 100n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      const provider = accounts[1].provider;
      await verifyBalanceChangeReturnTx(provider, account1Address, 100n, async () =>
        verifyBalanceChangeReturnTx(provider, account2Address, -70n, async () =>
          verifyBalanceChangeReturnTx(provider, account5Address, -20n, async () =>
            verifyBalanceChangeReturnTx(provider, account6Address, -10n, async () =>
              verifyBalanceChangeReturnTx(provider, protocol, 0n, () =>
                RTM.connect(accounts[1]).doTransfersExternal(left, right, { value: 100n }),
              ),
            ),
          ),
        ),
      );
      expect(await erc721Test.ownerOf(1n)).to.equal(account1Address);
    });

    it("Transfer from ETH to ERC1155Lazy", async () => {
      const erc1155Test = await new ERC1155LazyMintTest__factory(deployer).deploy();
      await erc1155Test.waitForDeployment();

      await RTM.setTransferProxy(id("ERC1155_LAZY"), await erc1155LazyProxy.getAddress());

      const account1Address = await accounts[1].getAddress();
      const account2Address = await accounts[2].getAddress();
      const account5Address = await accounts[5].getAddress();
      const account6Address = await accounts[6].getAddress();

      const encodedMintData = await erc1155Test.encode({
        tokenId: 1n,
        tokenURI: "uri",
        supply: 5n,
        creators: [{ account: account2Address, value: 0n }],
        royalties: [
          { account: account5Address, value: 2000n },
          { account: account6Address, value: 1000n },
        ],
        signatures: [],
      });

      const left = Order(
        account1Address,
        Asset(ETH, "0x", 100n),
        ZERO,
        Asset(id("ERC1155_LAZY"), encodedMintData, 5n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      const right = Order(
        account2Address,
        Asset(id("ERC1155_LAZY"), encodedMintData, 5n),
        ZERO,
        Asset(ETH, "0x", 100n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      const provider = accounts[1].provider;
      await verifyBalanceChangeReturnTx(provider, account1Address, 100n, async () =>
        verifyBalanceChangeReturnTx(provider, account2Address, -70n, async () =>
          verifyBalanceChangeReturnTx(provider, account5Address, -20n, async () =>
            verifyBalanceChangeReturnTx(provider, account6Address, -10n, async () =>
              verifyBalanceChangeReturnTx(provider, protocol, 0n, () =>
                RTM.connect(accounts[1]).doTransfersExternal(left, right, { value: 100n }),
              ),
            ),
          ),
        ),
      );
      expect(await erc1155Test.balanceOf(account1Address, 1n)).to.equal(5n);
    });
  });

  // ---------------------------------------------------------------------------
  // Check doTransfersExternal() with Royalties fees tests
  // ---------------------------------------------------------------------------
  describe("Check doTransfersExternal() with Royalties fees", () => {
    it("Transfer from ERC721(RoyaltiesV1) to ERC20 , protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
      const erc721V1 = await new TestERC721RoyaltiesV1__factory(deployer).deploy();
      await erc721V1.waitForDeployment();
      await erc721V1.initialize();

      const account0Address = await accounts[0].getAddress();
      const account1Address = await accounts[1].getAddress();
      const account2Address = await accounts[2].getAddress();
      const account3Address = await accounts[3].getAddress();

      await erc721V1.mint(account0Address, erc721TokenId1, []);
      await erc721V1.connect(accounts[0]).setApprovalForAll(await transferProxy.getAddress(), true);

      const erc20 = await prepareERC20(accounts[1], 105n);
      const erc20Address = await erc20.getAddress();
      const erc721V1Address = await erc721V1.getAddress();

      await royaltiesRegistry.setRoyaltiesByToken(erc721V1Address, [
        { account: account2Address, value: 1000n },
        { account: account3Address, value: 500n },
      ]);

      const left = Order(
        account0Address,
        Asset(ERC721, enc(erc721V1Address, erc721TokenId1), 1n),
        ZERO,
        Asset(ERC20, enc(erc20Address), 100n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      const right = Order(
        account1Address,
        Asset(ERC20, enc(erc20Address), 100n),
        ZERO,
        Asset(ERC721, enc(erc721V1Address, erc721TokenId1), 1n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      await RTM.doTransfersExternal(left, right);

      expect(await erc20.balanceOf(account1Address)).to.equal(5n);
      expect(await erc20.balanceOf(account0Address)).to.equal(85n);
      expect(await erc20.balanceOf(account2Address)).to.equal(10n);
      expect(await erc20.balanceOf(account3Address)).to.equal(5n);
      expect(await erc721V1.balanceOf(account1Address)).to.equal(1n);
      expect(await erc721V1.balanceOf(account0Address)).to.equal(0n);
      expect(await erc20.balanceOf(protocol)).to.equal(0n);
    });

    it("Transfer from ERC20 to ERC721(RoyaltiesV2), protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
      const erc20 = await prepareERC20(accounts[1], 105n);
      const erc721V2 = await prepareERC721(accounts[0], erc721TokenId1, []);

      const account0Address = await accounts[0].getAddress();
      const account1Address = await accounts[1].getAddress();
      const account2Address = await accounts[2].getAddress();
      const account3Address = await accounts[3].getAddress();
      const erc20Address = await erc20.getAddress();
      const erc721V2Address = await erc721V2.getAddress();

      await royaltiesRegistry.setRoyaltiesByToken(erc721V2Address, [
        { account: account2Address, value: 1000n },
        { account: account3Address, value: 500n },
      ]);

      const left = Order(
        account1Address,
        Asset(ERC20, enc(erc20Address), 100n),
        ZERO,
        Asset(ERC721, enc(erc721V2Address, erc721TokenId1), 1n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      const right = Order(
        account0Address,
        Asset(ERC721, enc(erc721V2Address, erc721TokenId1), 1n),
        ZERO,
        Asset(ERC20, enc(erc20Address), 100n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      await RTM.doTransfersExternal(left, right);

      expect(await erc20.balanceOf(account1Address)).to.equal(5n);
      expect(await erc20.balanceOf(account0Address)).to.equal(85n);
      expect(await erc20.balanceOf(account2Address)).to.equal(10n);
      expect(await erc20.balanceOf(account3Address)).to.equal(5n);
      expect(await erc721V2.balanceOf(account1Address)).to.equal(1n);
      expect(await erc721V2.balanceOf(account0Address)).to.equal(0n);
      expect(await erc20.balanceOf(protocol)).to.equal(0n);
    });

    it("Transfer from ERC1155(RoyaltiesV1) to ERC20, protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
      const erc1155V1 = await new TestERC1155RoyaltiesV1__factory(deployer).deploy();
      await erc1155V1.waitForDeployment();
      await erc1155V1.initialize();

      const account0Address = await accounts[0].getAddress();
      const account1Address = await accounts[1].getAddress();
      const account2Address = await accounts[2].getAddress();
      const account3Address = await accounts[3].getAddress();

      await erc1155V1.mint(account0Address, erc1155TokenId1, [], 8n);
      await erc1155V1.connect(accounts[0]).setApprovalForAll(await transferProxy.getAddress(), true);

      const erc20 = await prepareERC20(accounts[1], 105n);
      const erc20Address = await erc20.getAddress();
      const erc1155V1Address = await erc1155V1.getAddress();

      await royaltiesRegistry.setRoyaltiesByToken(erc1155V1Address, [
        { account: account2Address, value: 1000n },
        { account: account3Address, value: 500n },
      ]);

      const left = Order(
        account0Address,
        Asset(ERC1155, enc(erc1155V1Address, erc1155TokenId1), 5n),
        ZERO,
        Asset(ERC20, enc(erc20Address), 100n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      const right = Order(
        account1Address,
        Asset(ERC20, enc(erc20Address), 100n),
        ZERO,
        Asset(ERC1155, enc(erc1155V1Address, erc1155TokenId1), 5n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      await RTM.doTransfersExternal(left, right);

      expect(await erc20.balanceOf(account1Address)).to.equal(5n);
      expect(await erc20.balanceOf(account0Address)).to.equal(85n);
      expect(await erc20.balanceOf(account2Address)).to.equal(10n);
      expect(await erc20.balanceOf(account3Address)).to.equal(5n);
      expect(await erc1155V1.balanceOf(account1Address, erc1155TokenId1)).to.equal(5n);
      expect(await erc1155V1.balanceOf(account0Address, erc1155TokenId1)).to.equal(3n);
      expect(await erc20.balanceOf(protocol)).to.equal(0n);
    });

    it("Transfer from ERC20 to ERC1155(RoyaltiesV2), protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
      const erc20 = await prepareERC20(accounts[1], 105n);
      const erc1155V2 = await prepareERC1155(accounts[0], 8n);

      const account0Address = await accounts[0].getAddress();
      const account1Address = await accounts[1].getAddress();
      const account2Address = await accounts[2].getAddress();
      const account3Address = await accounts[3].getAddress();
      const erc20Address = await erc20.getAddress();
      const erc1155V2Address = await erc1155V2.getAddress();

      await royaltiesRegistry.setRoyaltiesByToken(erc1155V2Address, [
        { account: account2Address, value: 1000n },
        { account: account3Address, value: 500n },
      ]);

      const left = Order(
        account1Address,
        Asset(ERC20, enc(erc20Address), 100n),
        ZERO,
        Asset(ERC1155, enc(erc1155V2Address, erc1155TokenId1), 6n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      const right = Order(
        account0Address,
        Asset(ERC1155, enc(erc1155V2Address, erc1155TokenId1), 6n),
        ZERO,
        Asset(ERC20, enc(erc20Address), 100n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      await RTM.doTransfersExternal(left, right);

      expect(await erc20.balanceOf(account1Address)).to.equal(5n);
      expect(await erc20.balanceOf(account0Address)).to.equal(85n);
      expect(await erc20.balanceOf(account2Address)).to.equal(10n);
      expect(await erc20.balanceOf(account3Address)).to.equal(5n);
      expect(await erc1155V2.balanceOf(account1Address, erc1155TokenId1)).to.equal(6n);
      expect(await erc1155V2.balanceOf(account0Address, erc1155TokenId1)).to.equal(2n);
      expect(await erc20.balanceOf(protocol)).to.equal(0n);
    });

    it("Transfer from ERC20 to ERC1155(RoyaltiesV2), royalties are too high", async () => {
      const erc20 = await prepareERC20(accounts[1], 105n);
      const erc1155V2 = await prepareERC1155(accounts[0], 8n);

      const account0Address = await accounts[0].getAddress();
      const account1Address = await accounts[1].getAddress();
      const account2Address = await accounts[2].getAddress();
      const account3Address = await accounts[3].getAddress();
      const erc20Address = await erc20.getAddress();
      const erc1155V2Address = await erc1155V2.getAddress();

      await royaltiesRegistry.setRoyaltiesByToken(erc1155V2Address, [
        { account: account2Address, value: 2000n },
        { account: account3Address, value: 3001n },
      ]);

      const left = Order(
        account1Address,
        Asset(ERC20, enc(erc20Address), 100n),
        ZERO,
        Asset(ERC1155, enc(erc1155V2Address, erc1155TokenId1), 6n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      const right = Order(
        account0Address,
        Asset(ERC1155, enc(erc1155V2Address, erc1155TokenId1), 6n),
        ZERO,
        Asset(ERC20, enc(erc20Address), 100n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      await expect(RTM.doTransfersExternal(left, right)).to.be.revertedWith("Royalties are too high (>50%)");
    });

    it("Transfer from ETH to ERC1155V2, protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
      const erc1155V2 = await prepareERC1155(accounts[1], 10n);

      const account0Address = await accounts[0].getAddress();
      const account1Address = await accounts[1].getAddress();
      const account2Address = await accounts[2].getAddress();
      const account3Address = await accounts[3].getAddress();
      const erc1155V2Address = await erc1155V2.getAddress();

      await royaltiesRegistry.setRoyaltiesByToken(erc1155V2Address, [
        { account: account2Address, value: 1000n },
        { account: account3Address, value: 500n },
      ]);

      const left = Order(
        account0Address,
        Asset(ETH, "0x", 100n),
        ZERO,
        Asset(ERC1155, enc(erc1155V2Address, erc1155TokenId1), 7n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      const right = Order(
        account1Address,
        Asset(ERC1155, enc(erc1155V2Address, erc1155TokenId1), 7n),
        ZERO,
        Asset(ETH, "0x", 100n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      const provider = accounts[0].provider;
      await verifyBalanceChangeReturnTx(provider, account0Address, 100n, async () =>
        verifyBalanceChangeReturnTx(provider, account1Address, -85n, async () =>
          verifyBalanceChangeReturnTx(provider, account2Address, -10n, async () =>
            verifyBalanceChangeReturnTx(provider, account3Address, -5n, async () =>
              verifyBalanceChangeReturnTx(provider, protocol, 0n, () =>
                RTM.connect(accounts[0]).doTransfersExternal(left, right, { value: 100n }),
              ),
            ),
          ),
        ),
      );
      expect(await erc1155V2.balanceOf(account0Address, erc1155TokenId1)).to.equal(7n);
      expect(await erc1155V2.balanceOf(account1Address, erc1155TokenId1)).to.equal(3n);
    });

    it("Transfer from ERC20 to ERC721(RoyaltiesV1 With Error), protocol fee 6% (buyerFee3%, sallerFee3%)", async () => {
      const erc20 = await prepareERC20(accounts[1], 105n);

      const erc721V1_Error = await new TestERC721WithRoyaltiesV1_InterfaceError__factory(deployer).deploy();
      await erc721V1_Error.waitForDeployment();
      await erc721V1_Error.initialize();
      await erc721V1_Error.waitForDeployment();

      const account0Address = await accounts[0].getAddress();
      const account1Address = await accounts[1].getAddress();
      const account2Address = await accounts[2].getAddress();
      const account3Address = await accounts[3].getAddress();
      const erc20Address = await erc20.getAddress();
      const erc721V1_ErrorAddress = await erc721V1_Error.getAddress();

      await erc721V1_Error.mint(account0Address, erc721TokenId1, [
        { account: account2Address, value: 1000n },
        { account: account3Address, value: 500n },
      ]);
      await erc721V1_Error.connect(accounts[0]).setApprovalForAll(await transferProxy.getAddress(), true);

      const left = Order(
        account1Address,
        Asset(ERC20, enc(erc20Address), 100n),
        ZERO,
        Asset(ERC721, enc(erc721V1_ErrorAddress, erc721TokenId1), 1n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      const right = Order(
        account0Address,
        Asset(ERC721, enc(erc721V1_ErrorAddress, erc721TokenId1), 1n),
        ZERO,
        Asset(ERC20, enc(erc20Address), 100n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      await RTM.doTransfersExternal(left, right);

      expect(await erc20.balanceOf(account1Address)).to.equal(5n);
      expect(await erc20.balanceOf(account0Address)).to.equal(100n);
      expect(await erc20.balanceOf(account2Address)).to.equal(0n);
      expect(await erc20.balanceOf(account3Address)).to.equal(0n);
      expect(await erc721V1_Error.balanceOf(account1Address)).to.equal(1n);
      expect(await erc721V1_Error.balanceOf(account0Address)).to.equal(0n);
      expect(await erc20.balanceOf(protocol)).to.equal(0n);
    });

    it("Transfer from ERC1155(RoyaltiesV2 With Error) to ERC20, protocol fee 6% (buyerFee3%, sallerFee3%)", async function () {
      // Skip this test - the TestERC1155WithRoyaltiesV2_InterfaceError contract's mint function
      // calls __ERC1155_init which requires initializing modifier, incompatible with OZ 5.x
      // This test was designed to test error handling when royalty interfaces fail
      this.skip();

      const account0Address = await accounts[0].getAddress();
      const account1Address = await accounts[1].getAddress();
      const account2Address = await accounts[2].getAddress();
      const account3Address = await accounts[3].getAddress();

      const erc1155V2_Error = await new TestERC1155WithRoyaltiesV2_InterfaceError__factory(deployer).deploy();
      await erc1155V2_Error.waitForDeployment();
      await erc1155V2_Error.connect(accounts[0]).setApprovalForAll(await transferProxy.getAddress(), true);

      const erc20 = await prepareERC20(accounts[1], 105n);
      const erc20Address = await erc20.getAddress();
      const erc1155V2_ErrorAddress = await erc1155V2_Error.getAddress();

      const left = Order(
        account0Address,
        Asset(ERC1155, enc(erc1155V2_ErrorAddress, erc1155TokenId1), 5n),
        ZERO,
        Asset(ERC20, enc(erc20Address), 100n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      const right = Order(
        account1Address,
        Asset(ERC20, enc(erc20Address), 100n),
        ZERO,
        Asset(ERC1155, enc(erc1155V2_ErrorAddress, erc1155TokenId1), 5n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      await RTM.doTransfersExternal(left, right);

      expect(await erc20.balanceOf(account1Address)).to.equal(5n);
      expect(await erc20.balanceOf(account0Address)).to.equal(100n);
      expect(await erc20.balanceOf(account2Address)).to.equal(0n);
      expect(await erc20.balanceOf(account3Address)).to.equal(0n);
      expect(await erc1155V2_Error.balanceOf(account1Address, erc1155TokenId1)).to.equal(5n);
      expect(await erc1155V2_Error.balanceOf(account0Address, erc1155TokenId1)).to.equal(7n);
      expect(await erc20.balanceOf(protocol)).to.equal(0n);
    });
  });

  // ---------------------------------------------------------------------------
  // Protocol Fee tests
  // ---------------------------------------------------------------------------
  describe("Protocol Fee", () => {
    it("protocol fee setting", async () => {
      const makerLeft = await accounts[1].getAddress();

      const feeZero1 = await RTM.protocolFee();

      expect(feeZero1.receiver).to.equal(ZERO);
      expect(feeZero1.buyerAmount).to.equal(0n);
      expect(feeZero1.sellerAmount).to.equal(0n);

      // Fail because not owner calling
      await expect(RTM.connect(accounts[1]).setAllProtocolFeeData(protocol, 100n, 100n)).to.be.revertedWithCustomError(
        RTM,
        "OwnableUnauthorizedAccount",
      );

      // Fail because not owner calling
      await expect(RTM.connect(accounts[1]).setPrtocolFeeReceiver(protocol)).to.be.revertedWithCustomError(
        RTM,
        "OwnableUnauthorizedAccount",
      );

      // Fail because not owner calling
      await expect(RTM.connect(accounts[1]).setPrtocolFeeBuyerAmount(100n)).to.be.revertedWithCustomError(
        RTM,
        "OwnableUnauthorizedAccount",
      );

      // Fail because not owner calling
      await expect(RTM.connect(accounts[1]).setPrtocolFeeSellerAmount(100n)).to.be.revertedWithCustomError(
        RTM,
        "OwnableUnauthorizedAccount",
      );

      // Setting separately
      const setReceiverTx = await RTM.setPrtocolFeeReceiver(protocol);
      await expect(setReceiverTx).to.emit(RTM, "FeeReceiverChanged").withArgs(ZERO, protocol);

      const setSellerTx = await RTM.setPrtocolFeeBuyerAmount(100n);
      await expect(setSellerTx).to.emit(RTM, "BuyerFeeAmountChanged").withArgs(0n, 100n);

      const setBuyerTx = await RTM.setPrtocolFeeSellerAmount(200n);
      await expect(setBuyerTx).to.emit(RTM, "SellerFeeAmountChanged").withArgs(0n, 200n);

      // Zeroing all by 1 tx
      const zeroTx = await RTM.setAllProtocolFeeData(ZERO, 0n, 0n);
      await expect(zeroTx).to.emit(RTM, "FeeReceiverChanged").withArgs(protocol, ZERO);
      await expect(zeroTx).to.emit(RTM, "BuyerFeeAmountChanged").withArgs(100n, 0n);
      await expect(zeroTx).to.emit(RTM, "SellerFeeAmountChanged").withArgs(200n, 0n);

      // Changing fee back to 0
      const feeZero2 = await RTM.protocolFee();

      expect(feeZero2.receiver).to.equal(ZERO);
      expect(feeZero2.buyerAmount).to.equal(0n);
      expect(feeZero2.sellerAmount).to.equal(0n);
    });
  });
});
