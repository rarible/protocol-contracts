// <ai_context> TypeScript tests for listingUtils SDK. Tests order creation, signing, and matching functionality with ERC721, ERC1155, ETH, and ERC20 tokens including lazy minting support. </ai_context>
import { expect } from "chai";
import { network } from "hardhat";
import type * as ethersTypes from "ethers";

const connection = await network.connect();
const { ethers } = connection;

import {
  type ERC721LazyMintTest,
  ERC721LazyMintTest__factory,
  type ERC1155LazyMintTest,
  ERC1155LazyMintTest__factory,
  type TestERC20,
  TestERC20__factory,
  type TransferProxyTest,
  TransferProxyTest__factory,
  type ERC20TransferProxyTest,
  ERC20TransferProxyTest__factory,
  type TestRoyaltiesRegistry,
  TestRoyaltiesRegistry__factory,
  type ERC721LazyMintTransferProxyTest,
  ERC721LazyMintTransferProxyTest__factory,
  type ERC1155LazyMintTransferProxyTest,
  ERC1155LazyMintTransferProxyTest__factory,
  type ExchangeV2,
  ExchangeV2__factory,
} from "../types/ethers-contracts";
import { deployTransparentProxy } from "@rarible/common-sdk/src/deploy";
import {
  ETH,
  ERC20,
  ERC721,
  ERC1155,
  ERC721_LAZY,
  ERC1155_LAZY,
} from "@rarible/common-sdk/src/assets";
import { sign } from "@rarible/common-sdk/src/order";
import {
  createSellOrder,
  createBuyOrder,
  ZERO_ADDRESS,
} from "@rarible/common-sdk/src/listing";

// -----------------------------------------------------------------------------
// Main Test Suite
// -----------------------------------------------------------------------------
describe("listingUtils", function () {
  let seller: ethersTypes.Signer;
  let buyer: ethersTypes.Signer;
  let token721: ERC721LazyMintTest;
  let token1155: ERC1155LazyMintTest;
  let exchange: ExchangeV2;
  let erc20: TestERC20;
  let transferProxy: TransferProxyTest;
  let erc20TransferProxy: ERC20TransferProxyTest;
  let erc721LazyMintTransferProxy: ERC721LazyMintTransferProxyTest;
  let erc1155LazyMintTransferProxy: ERC1155LazyMintTransferProxyTest;
  let royaltiesRegistry: TestRoyaltiesRegistry;
  let accounts: ethersTypes.Signer[];
  let deployer: ethersTypes.Signer;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    [deployer, seller, buyer] = accounts;

    // Deploy ERC721 and ERC1155 test tokens
    token721 = await new ERC721LazyMintTest__factory(deployer).deploy();
    await token721.waitForDeployment();

    token1155 = await new ERC1155LazyMintTest__factory(deployer).deploy();
    await token1155.waitForDeployment();

    // Deploy proxies
    transferProxy = await new TransferProxyTest__factory(deployer).deploy();
    await transferProxy.waitForDeployment();

    erc20TransferProxy = await new ERC20TransferProxyTest__factory(deployer).deploy();
    await erc20TransferProxy.waitForDeployment();

    royaltiesRegistry = await new TestRoyaltiesRegistry__factory(deployer).deploy();
    await royaltiesRegistry.waitForDeployment();

    // Deploy Exchange via transparent proxy
    const { instance } = await deployTransparentProxy<ExchangeV2>(ethers, {
      contractName: "ExchangeV2",
      initFunction: "__ExchangeV2_init",
      initArgs: [
        await transferProxy.getAddress(),
        await erc20TransferProxy.getAddress(),
        0n,
        ZERO_ADDRESS,
        await royaltiesRegistry.getAddress(),
        await deployer.getAddress(),
      ],
      proxyOwner: await deployer.getAddress(),
    });
    exchange = instance;

    // Deploy lazy mint proxies
    const { instance: erc721LazyInstance } = await deployTransparentProxy<ERC721LazyMintTransferProxyTest>(ethers, {
      contractName: "ERC721LazyMintTransferProxyTest",
      initFunction: "__ERC721LazyMintTransferProxyTest_init",
      initArgs: [await deployer.getAddress()],
      proxyOwner: await deployer.getAddress(),
    });
    erc721LazyMintTransferProxy = erc721LazyInstance;

    const { instance: erc1155LazyInstance } = await deployTransparentProxy<ERC1155LazyMintTransferProxyTest>(ethers, {
      contractName: "ERC1155LazyMintTransferProxyTest",
      initFunction: "__ERC1155LazyMintTransferProxyTest_init",
      initArgs: [await deployer.getAddress()],
      proxyOwner: await deployer.getAddress(),
    });
    erc1155LazyMintTransferProxy = erc1155LazyInstance;

    await erc721LazyMintTransferProxy.addOperator(await exchange.getAddress());
    await erc1155LazyMintTransferProxy.addOperator(await exchange.getAddress());

    await exchange.setTransferProxy(ERC721_LAZY, await erc721LazyMintTransferProxy.getAddress());
    await exchange.setTransferProxy(ERC1155_LAZY, await erc1155LazyMintTransferProxy.getAddress());

    // Set approval for the transfer proxy, not the exchange
    await token721.connect(seller).setApprovalForAll(await transferProxy.getAddress(), true);
    await token1155.connect(seller).setApprovalForAll(await transferProxy.getAddress(), true);

    // Deploy and setup ERC20
    erc20 = await new TestERC20__factory(deployer).deploy();
    await erc20.waitForDeployment();
    const buyerAddress = await buyer.getAddress();
    await erc20.mintTo(buyerAddress, 10000n);
    await erc20.connect(buyer).approve(await erc20TransferProxy.getAddress(), 10000n);
  });

  it("should mint ERC721 correctly", async () => {
    const tokenId = 1n;
    const sellerAddress = await seller.getAddress();
    const mintData = {
      tokenId,
      tokenURI: "ipfs://test",
      creators: [{ account: sellerAddress, value: 10000n }],
      royalties: [],
      signatures: [],
    };
    await token721.mintAndTransfer(mintData, sellerAddress);
    expect(await token721.ownerOf(tokenId)).to.equal(sellerAddress);
  });

  it("should mint ERC1155 correctly", async () => {
    const tokenId = 2n;
    const sellerAddress = await seller.getAddress();
    const mintData = {
      tokenId,
      tokenURI: "ipfs://test",
      supply: 1n,
      creators: [{ account: sellerAddress, value: 10000n }],
      royalties: [],
      signatures: [],
    };
    await token1155.mintAndTransfer(mintData, sellerAddress, 1n);
    expect(await token1155.balanceOf(sellerAddress, tokenId)).to.equal(1n);
  });

  it("should create a sell order with ERC721", async () => {
    const sellerAddress = await seller.getAddress();
    const token721Address = await token721.getAddress();

    const order = createSellOrder(token721Address, "3", sellerAddress, ETH, "0x", "1000", ERC721);

    expect(order.maker).to.equal(sellerAddress);
    expect(order.makeAsset.assetType.assetClass).to.equal(ERC721);
    expect(order.takeAsset.assetType.assetClass).to.equal(ETH);
  });

  it("should create a buy order from a sell order", async () => {
    const sellerAddress = await seller.getAddress();
    const buyerAddress = await buyer.getAddress();
    const token721Address = await token721.getAddress();
    const erc20Address = await erc20.getAddress();

    const sellOrder = createSellOrder(token721Address, "4", sellerAddress, ERC20, erc20Address, "1000", ERC721);
    const buyOrder = createBuyOrder(sellOrder, buyerAddress, "1000");

    expect(buyOrder.maker).to.equal(buyerAddress);
    expect(buyOrder.taker).to.equal(sellOrder.maker);
    expect(buyOrder.takeAsset.assetType.assetClass).to.equal(ERC721);
  });

  it("should sign an order with a wallet", async () => {
    const sellerAddress = await seller.getAddress();
    const token721Address = await token721.getAddress();
    const exchangeAddress = await exchange.getAddress();

    const sellOrder = createSellOrder(token721Address, "5", sellerAddress, ETH, "0x", "1000", ERC721);
    const sig = await sign(seller, sellOrder, exchangeAddress);

    expect(sig).to.match(/^0x[0-9a-f]{130}$/); // Basic signature format check
  });

  it("should match orders without value (ERC20)", async () => {
    const tokenId = 6n;
    const sellerAddress = await seller.getAddress();
    const buyerAddress = await buyer.getAddress();
    const token721Address = await token721.getAddress();
    const erc20Address = await erc20.getAddress();
    const exchangeAddress = await exchange.getAddress();

    const mintData = {
      tokenId,
      tokenURI: "ipfs://test",
      creators: [{ account: sellerAddress, value: 10000n }],
      royalties: [],
      signatures: [],
    };
    await token721.mintAndTransfer(mintData, sellerAddress);
    const transferProxyAddress = await transferProxy.getAddress();
    await token721.connect(seller).setApprovalForAll(transferProxyAddress, true);

    const sellOrder = createSellOrder(
      token721Address,
      tokenId.toString(),
      sellerAddress,
      ERC20,
      erc20Address,
      "1000",
      ERC721,
    );
    const sellSig = await sign(seller, sellOrder, exchangeAddress);

    const buyOrder = createBuyOrder(sellOrder, buyerAddress, "1000");
    const buySig = await sign(buyer, buyOrder, exchangeAddress);

    const tx = await exchange.connect(buyer).matchOrders(sellOrder, sellSig, buyOrder, buySig, {
      gasLimit: 8_000_000n,
    });
    await tx.wait();

    // Verify the transfer
    expect(await token721.ownerOf(tokenId)).to.equal(buyerAddress);
  });

  it("should match orders with value (ETH)", async () => {
    const sellerAddress = await seller.getAddress();
    const buyerAddress = await buyer.getAddress();
    const token721Address = await token721.getAddress();
    const exchangeAddress = await exchange.getAddress();
    const tokenId = BigInt(sellerAddress.toLowerCase() + "b00000000000000000000001".slice(42));

    const mintData = {
      tokenId,
      tokenURI: "ipfs://test",
      creators: [{ account: sellerAddress, value: 10000n }],
      royalties: [],
      signatures: [],
    };
    await token721.mintAndTransfer(mintData, sellerAddress);
    const transferProxyAddress = await transferProxy.getAddress();
    await token721.connect(seller).setApprovalForAll(transferProxyAddress, true);

    const sellOrder = createSellOrder(
      token721Address,
      tokenId.toString(),
      sellerAddress,
      ETH,
      "0x",
      "1000",
      ERC721,
    );
    const sellSig = await sign(seller, sellOrder, exchangeAddress);

    const buyOrder = createBuyOrder(sellOrder, buyerAddress, "1000");
    const buySig = await sign(buyer, buyOrder, exchangeAddress);

    const tx = await exchange.connect(buyer).matchOrders(sellOrder, sellSig, buyOrder, buySig, {
      gasLimit: 8_000_000n,
      value: 1000n,
    });
    await tx.wait();

    // Verify the transfer
    expect(await token721.ownerOf(tokenId)).to.equal(buyerAddress);
  });
});
