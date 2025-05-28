import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  mintERC721,
  mintERC1155,
  createSellOrder,
  createBuyOrder,
  signOrderWithWallet,
  matchOrderOnExchange,
} from "../sdk/listingUtils";
import { ERC721, ERC20, ETH, ZERO } from "../sdk/utils";
import { ERC721LazyMintTest, ERC1155LazyMintTest, TestERC20, TransferProxyTest, ERC20TransferProxyTest, TestRoyaltiesRegistry, RaribleTransferManagerTest } from "../typechain-types";
import { ExchangeV2 } from "../typechain-types/ExchangeV2";

describe("listingUtils", function () {
  let seller: SignerWithAddress;
  let buyer: SignerWithAddress;
  let token721: ERC721LazyMintTest;
  let token1155: ERC1155LazyMintTest;
  let exchange: ExchangeV2;
  let erc20: TestERC20;
  let transferProxy: TransferProxyTest;
  let erc20TransferProxy: ERC20TransferProxyTest;
  let rtm: RaribleTransferManagerTest;
  let royaltiesRegistry: TestRoyaltiesRegistry;

  beforeEach(async function () {
    [seller, buyer] = await ethers.getSigners();

    const TestERC721 = await ethers.getContractFactory("ERC721LazyMintTest");
    token721 = await TestERC721.deploy();
    // await token721.initialize();

    const TestERC1155 = await ethers.getContractFactory("ERC1155LazyMintTest");
    token1155 = await TestERC1155.deploy();
    // await token1155.initialize();

    transferProxy = await ethers.getContractFactory("TransferProxyTest").then(f => f.deploy())
    erc20TransferProxy = await ethers.getContractFactory("ERC20TransferProxyTest").then(f => f.deploy());
    rtm = await ethers.getContractFactory("RaribleTransferManagerTest").then(f => f.deploy());
    royaltiesRegistry = await ethers.getContractFactory("TestRoyaltiesRegistry").then(f => f.deploy());
    const Exchange = await ethers.getContractFactory("ExchangeV2");
    exchange = await Exchange.deploy();
    await exchange.__ExchangeV2_init(transferProxy.address, erc20TransferProxy.address, 0, ZERO, royaltiesRegistry.address);

    const TestERC20 = await ethers.getContractFactory("TestERC20");
    erc20 = await TestERC20.deploy();
    await erc20.mint(buyer.address, 10000);
    await erc20.connect(buyer).approve(exchange.address, 10000);
  });

  it("should mint ERC721 correctly", async () => {
    const tokenId = "1";
    await mintERC721(token721, tokenId, seller.address);
    expect(await token721.ownerOf(tokenId)).to.equal(seller.address);
  });

  it("should mint ERC1155 correctly", async () => {
    const tokenId = "2";
    await mintERC1155(token1155, tokenId, seller.address);
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
    await mintERC721(token721, tokenId, seller.address);
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
    await mintERC721(token721, tokenId, seller.address);
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
