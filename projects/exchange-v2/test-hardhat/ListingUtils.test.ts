import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  createSellOrder,
  createBuyOrder,
  signOrderWithWallet,
  matchOrderOnExchange,
} from "../sdk/listingUtils";
import { mintToken } from "@rarible/tokens/sdk/mintToken";
import { ERC721, ERC20, ETH, ZERO, ERC1155_LAZY, ERC721_LAZY } from "../sdk/utils";
import { ERC721LazyMintTest, ERC1155LazyMintTest, TestERC20, TransferProxyTest, ERC20TransferProxyTest, TestRoyaltiesRegistry, RaribleTransferManagerTest } from "../typechain-types";
import { ExchangeV2 } from "../typechain-types/ExchangeV2";
import { ERC721LazyMintTransferProxyTest, ERC1155LazyMintTransferProxyTest } from "../typechain-types";

describe("listingUtils", function () {
  let seller: SignerWithAddress;
  let buyer: SignerWithAddress;
  let token721: ERC721LazyMintTest;
  let token1155: ERC1155LazyMintTest;
  let exchange: ExchangeV2;
  let erc20: TestERC20;
  let transferProxy: TransferProxyTest;
  let erc20TransferProxy: ERC20TransferProxyTest;
  let erc721LazyMintTransferProxy: ERC721LazyMintTransferProxyTest;
  let erc1155LazyMintTransferProxy: ERC1155LazyMintTransferProxyTest;
  let rtm: RaribleTransferManagerTest;
  let royaltiesRegistry: TestRoyaltiesRegistry;

  beforeEach(async function () {
    [seller, buyer] = await ethers.getSigners();

    const TestERC721 = await ethers.getContractFactory("ERC721LazyMintTest");
    token721 = await TestERC721.deploy() as ERC721LazyMintTest;

    const TestERC1155 = await ethers.getContractFactory("ERC1155LazyMintTest");
    token1155 = await TestERC1155.deploy() as ERC1155LazyMintTest;

    transferProxy = await ethers.getContractFactory("TransferProxyTest").then(f => f.deploy()) as TransferProxyTest;
    erc20TransferProxy = await ethers.getContractFactory("ERC20TransferProxyTest").then(f => f.deploy()) as ERC20TransferProxyTest;
    rtm = await ethers.getContractFactory("RaribleTransferManagerTest").then(f => f.deploy()) as RaribleTransferManagerTest;
    royaltiesRegistry = await ethers.getContractFactory("TestRoyaltiesRegistry").then(f => f.deploy()) as TestRoyaltiesRegistry;
    
    const Exchange = await ethers.getContractFactory("ExchangeV2");
    exchange = await Exchange.deploy() as ExchangeV2;
    await exchange.__ExchangeV2_init(transferProxy.address, erc20TransferProxy.address, 0, ZERO, royaltiesRegistry.address);

    erc721LazyMintTransferProxy = await ethers.getContractFactory("ERC721LazyMintTransferProxyTest").then(f => f.deploy()) as ERC721LazyMintTransferProxyTest;
    await erc721LazyMintTransferProxy.__OperatorRole_init();
    erc1155LazyMintTransferProxy = await ethers.getContractFactory("ERC1155LazyMintTransferProxyTest").then(f => f.deploy()) as ERC1155LazyMintTransferProxyTest;
    await erc1155LazyMintTransferProxy.__OperatorRole_init();

    await (await erc721LazyMintTransferProxy.addOperator(exchange.address)).wait()
    await (await erc1155LazyMintTransferProxy.addOperator(exchange.address)).wait()

    await (await exchange.setTransferProxy(ERC721_LAZY, erc721LazyMintTransferProxy.address)).wait()
    await (await exchange.setTransferProxy(ERC1155_LAZY, erc1155LazyMintTransferProxy.address)).wait()

    await token721.connect(seller).setApprovalForAll(exchange.address, true);
    await token1155.connect(seller).setApprovalForAll(exchange.address, true);

    const TestERC20 = await ethers.getContractFactory("TestERC20");
    erc20 = await TestERC20.deploy() as TestERC20;
    await erc20.mint(buyer.address, 10000);
    await erc20.connect(buyer).approve(exchange.address, 10000);
  });

  it("should mint ERC721 correctly", async () => {
    const tokenId = "1";
    await mintToken(token721, tokenId, seller.address);
    expect(await token721.ownerOf(tokenId)).to.equal(seller.address);
  });

  it("should mint ERC1155 correctly", async () => {
    const tokenId = "2";
    await mintToken(token1155, tokenId, seller.address, { is1155: true });
    expect(await token1155.balanceOf(seller.address, tokenId)).to.equal(1);
  });

  it("should create a sell order with ERC721", async () => {
    const order = createSellOrder(
      token721.address,
      "3",
      seller.address,
      ETH,
      "0x",
      "1000",
      ERC721
    );
    expect(order.maker).to.equal(seller.address);
    expect(order.makeAsset.assetType.assetClass).to.equal(ERC721);
    expect(order.takeAsset.assetType.assetClass).to.equal(ETH);
  });

  it("should create a buy order from a sell order", async () => {
    const sellOrder = createSellOrder(
      token721.address,
      "4",
      seller.address,
      ERC20,
      erc20.address,
      "1000",
      ERC721
    );
    const buyOrder = createBuyOrder(sellOrder, buyer.address, "1000");
    expect(buyOrder.maker).to.equal(buyer.address);
    expect(buyOrder.taker).to.equal(sellOrder.maker);
    expect(buyOrder.takeAsset.assetType.assetClass).to.equal(ERC721);
  });

  it("should sign an order with a wallet", async () => {
    const sellOrder = createSellOrder(
      token721.address,
      "5",
      seller.address,
      ETH,
      "0x",
      "1000",
      ERC721
    );
    const sig = await signOrderWithWallet(sellOrder, seller, exchange.address);
    expect(sig).to.match(/^0x[0-9a-f]{130}$/); // Basic signature format check
    // cannot check if the signature is valid because it's internally implemented in the contract
  });

  it("should match orders without value (ERC20)", async () => {
    const tokenId = "6";
    await mintToken(token721, tokenId, seller.address);
    await token721.connect(seller).setApprovalForAll(exchange.address, true);

    const sellOrder = createSellOrder(
      token721.address,
      tokenId,
      seller.address,
      ERC20,
      erc20.address,
      "1000",
      ERC721
    );
    const sellSig = await signOrderWithWallet(sellOrder, seller, exchange.address);

    const buyOrder = createBuyOrder(sellOrder, buyer.address, "1000");
    const buySig = await signOrderWithWallet(buyOrder, buyer, exchange.address);

    await expect(
      matchOrderOnExchange(exchange, buyer, sellOrder, sellSig, buyOrder, buySig)
    ).to.not.be.rejected;
  });

  it("should match orders with value (ETH)", async () => {
    const tokenId = seller.address + "b00000000000000000000001";
    await mintToken(token721, tokenId, seller.address);
    await token721.setApprovalForAll(exchange.address, true);

    const sellOrder = createSellOrder(
      token721.address,
      tokenId,
      seller.address,
      ETH,
      "0x",
      "1000",
      ERC721
    );
    const sellSig = await signOrderWithWallet(sellOrder, seller, exchange.address);

    const buyOrder = createBuyOrder(sellOrder, buyer.address, "1000");
    const buySig = await signOrderWithWallet(buyOrder, buyer, exchange.address);

    const tx = await matchOrderOnExchange(exchange, buyer, sellOrder, sellSig, buyOrder, buySig, "1000");
    console.log(tx);
    await expect(tx).to.not.be.rejected;
  });
});
