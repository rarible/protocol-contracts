import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { 
  ExchangeV2, ExchangeV2__factory,
  ERC1155LazyMintTransferProxy, ERC1155LazyMintTransferProxy__factory,
  ERC20TransferProxy, ERC20TransferProxy__factory,
  ERC721LazyMintTransferProxy, ERC721LazyMintTransferProxy__factory,
  TransferProxy, TransferProxy__factory,
  RoyaltiesRegistry, RoyaltiesRegistry__factory,
  AssetMatcherCollection, AssetMatcherCollection__factory,
} from "../typechain-types";

import { ZERO, ETH, ERC721, ERC721_LAZY, ERC1155_LAZY, ERC20, COLLECTION,} from "@rarible/exchange-v2/sdk/utils";
import {
  createSellOrder,
  createBuyOrder,
  signOrderWithWallet,
} from "@rarible/exchange-v2/sdk/listingUtils";
import { matchOrderOnExchange } from "@rarible/exchange-v2/sdk/listingUtils";
import { TestERC721RoyaltiesV2, TestERC721RoyaltiesV2__factory } from "@rarible/exchange-v2/typechain-types";

describe("ExchangeV2 - Sell ERC721 for native ETH (non-lazy)", function () {
  let exchange: ExchangeV2;
  let owner: SignerWithAddress;
  let transferProxy: TransferProxy;
  let erc20TransferProxy: ERC20TransferProxy;
  let erc721LazyMintTransferProxy: ERC721LazyMintTransferProxy;
  let erc1155LazyMintTransferProxy: ERC1155LazyMintTransferProxy;
  let royaltiesRegistry: RoyaltiesRegistry;
  let assetMatcherCollection: AssetMatcherCollection;
  let erc721: TestERC721RoyaltiesV2;
  
  let seller: SignerWithAddress;
  let buyer: SignerWithAddress;
  let feeRecipient: SignerWithAddress;
  let royaltyRecipient: SignerWithAddress;
  let accounts: SignerWithAddress[];

  const protocolFee = 300; // 3%
  const tokenId = 12345;

  beforeEach(async function () {
    [owner, seller, buyer, feeRecipient, royaltyRecipient, ...accounts] = await ethers.getSigners();

    // Deploy proxies
    transferProxy = await (new TransferProxy__factory(owner)).deploy();
    await transferProxy.__OperatorRole_init();

    erc20TransferProxy = await (new ERC20TransferProxy__factory(owner)).deploy();
    await erc20TransferProxy.__OperatorRole_init();

    erc721LazyMintTransferProxy = await (new ERC721LazyMintTransferProxy__factory(owner)).deploy();
    await erc721LazyMintTransferProxy.__OperatorRole_init();

    erc1155LazyMintTransferProxy = await (new ERC1155LazyMintTransferProxy__factory(owner)).deploy();
    await erc1155LazyMintTransferProxy.__OperatorRole_init();

    assetMatcherCollection = await (new AssetMatcherCollection__factory(owner)).deploy();

    // Deploy royalties registry
    royaltiesRegistry = await (new RoyaltiesRegistry__factory(owner)).deploy();

    // Deploy Exchange
    const Exchange = await ethers.getContractFactory("ExchangeV2");
    exchange = await Exchange.deploy() as ExchangeV2;
    await exchange.__ExchangeV2_init(
      transferProxy.address,
      erc20TransferProxy.address,
      protocolFee,
      feeRecipient.address,
      royaltiesRegistry.address
    );

    // Set up lazy mint proxies
    await erc721LazyMintTransferProxy.addOperator(exchange.address);
    await erc1155LazyMintTransferProxy.addOperator(exchange.address);
    await erc20TransferProxy.addOperator(exchange.address);
    await transferProxy.addOperator(exchange.address);

    await exchange.setTransferProxy(ERC721_LAZY, erc721LazyMintTransferProxy.address);
    await exchange.setTransferProxy(ERC1155_LAZY, erc1155LazyMintTransferProxy.address);
    await exchange.setTransferProxy(ERC20, erc20TransferProxy.address);
    await exchange.setAssetMatcher(COLLECTION, assetMatcherCollection.address);

    // Deploy NFT contracts
    erc721 = await (new TestERC721RoyaltiesV2__factory(owner)).deploy();
    await erc721.initialize();

    // Mint NFTs to seller
    await erc721.mint(seller.address, tokenId, [
      {
        account: seller.address,
        value: 1000,
      },
    ]);

    // Approve exchange
    await erc721.connect(seller).setApprovalForAll(transferProxy.address, true);
  });

  it("should sell ERC721 for ETH, NFT is transferred and seller receives ETH", async () => {

    const price = ethers.utils.parseEther("1");
    const sellerAddress = seller.address;
    const buyerAddress = buyer.address;

    // Create sell order: seller wants to sell tokenId for 1 ETH
    const sellOrder = createSellOrder(
      erc721.address,
      tokenId.toString(),
      sellerAddress,
      ETH,
      "0x", // ETH asset data
      price.toString(),
      ERC721
    );
    const sellSig = await signOrderWithWallet(sellOrder, seller, exchange.address);

    // Create buy order: buyer wants to buy tokenId for 1 ETH
    const buyOrder = createBuyOrder(sellOrder, buyerAddress, price.toString());
    const buySig = await signOrderWithWallet(buyOrder, buyer, exchange.address);

    // Check initial balances
    const sellerEthBefore = await ethers.provider.getBalance(sellerAddress);

    // Call matchOrders as buyer, send ETH
    const tx = await exchange.connect(buyer).matchOrders(
      sellOrder,
      sellSig,
      buyOrder,
      buySig,
      { value: price }
    );
    await tx.wait();

    // Check NFT is now owned by buyer
    expect(await erc721.ownerOf(tokenId)).to.equal(buyerAddress);

    // Check seller received ETH (minus gas; allow some leeway)
    const sellerEthAfter = await ethers.provider.getBalance(sellerAddress);
    expect(sellerEthAfter.sub(sellerEthBefore)).to.be.closeTo(price, ethers.utils.parseEther("0.001"));
  });
});