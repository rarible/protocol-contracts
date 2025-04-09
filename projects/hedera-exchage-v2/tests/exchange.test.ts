// <ai_context>
// tests/exchangeTest.ts
// New test for exchanging one NFT token (list & buy) using ExchangeMetaV2
// </ai_context>

import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer, BigNumber } from "ethers";

// Factories from Rarible's Exchange
import { ExchangeMetaV2, ExchangeMetaV2__factory } from "@rarible/exchange-v2";
import { signOrderEthers } from "@rarible/exchange-v2/test-hardhat/signOrder";
import { IERC721Enumerable, IERC721Enumerable__factory } from "@rarible/hedera-tokens/typechain-types";

// Royalties registry
import { HederaRoyaltiesRegistry, HederaRoyaltiesRegistry__factory } from "../typechain-types";

// Transfer proxies
import {
  UnsafeTransferProxy,
  UnsafeTransferProxy__factory,
} from "../typechain-types";
import {
  ERC20TransferProxy,
  ERC20TransferProxy__factory,
} from "../typechain-types";
import {
  ERC721LazyMintTransferProxy,
  ERC721LazyMintTransferProxy__factory,
  ERC1155LazyMintTransferProxy,
  ERC1155LazyMintTransferProxy__factory,
} from "../typechain-types";

// Helpers from hederaExchange
import {
  listNftToken,
  buyNftToken
} from "../sdk/hederaExchange";

// NFT creation from @rarible/hedera-tokens
import { RariNFTCreator__factory, RariNFTCreator } from "@rarible/hedera-tokens/typechain-types";
import { createNftCollection, mintNft, associateToken } from "@rarible/hedera-tokens/sdk";

describe("Exchange Test", function () {
  let deployer: Signer;
  let user1: Signer;
  let user2: Signer;
  let royaltiesReceiver: Signer;

  let unsafeTransferProxy: UnsafeTransferProxy;
  let erc20TransferProxy: ERC20TransferProxy;
  let erc721LazyMintTransferProxy: ERC721LazyMintTransferProxy;
  let erc1155LazyMintTransferProxy: ERC1155LazyMintTransferProxy;
  let royaltiesRegistry: HederaRoyaltiesRegistry;
  let exchange: ExchangeMetaV2;

  let rariNFTCreator: RariNFTCreator;
  let nftAddress: string;
  let mintedSerial: string;

  beforeEach(async () => {
    console.log("--------- TEST SETUP STARTED ---------");
    
    console.log("STEP 0: Setting up test accounts");
    const signers = await ethers.getSigners();
    deployer = signers[1];
    user1 = signers[2];
    user2 = signers[0];
    royaltiesReceiver = signers[3]; 
    console.log("user1:", await user1.getAddress());
    console.log("user2:", await user2.getAddress());
    console.log("deployer:", await deployer.getAddress());
    console.log("royaltiesReceiver:", await royaltiesReceiver.getAddress());

    console.log("Account balances:");
    console.log("- deployer:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");
    console.log("- user1:", ethers.utils.formatEther(await user1.getBalance()), "ETH");
    console.log("- user2:", ethers.utils.formatEther(await user2.getBalance()), "ETH");
    console.log("- royaltiesReceiver:", ethers.utils.formatEther(await royaltiesReceiver.getBalance()), "ETH");
    console.log("\nSTEP 1: Deploying UnsafeTransferProxy");
    const unsafeTransferProxyFactory = new UnsafeTransferProxy__factory(deployer);
    unsafeTransferProxy = await unsafeTransferProxyFactory.deploy();
    await unsafeTransferProxy.deployed();
    console.log("UnsafeTransferProxy deployed at:", unsafeTransferProxy.address);
    await unsafeTransferProxy.__OperatorRole_init();
    console.log("UnsafeTransferProxy initialized");

    console.log("\nSTEP 2: Deploying ERC20TransferProxy");
    const erc20TransferProxyFactory = new ERC20TransferProxy__factory(deployer);
    erc20TransferProxy = await erc20TransferProxyFactory.deploy();
    await erc20TransferProxy.deployed();
    console.log("ERC20TransferProxy deployed at:", erc20TransferProxy.address);
    await erc20TransferProxy.__OperatorRole_init();
    console.log("ERC20TransferProxy initialized");

    console.log("\nSTEP 3: Deploying ERC721LazyMintTransferProxy");
    const erc721LazyFactory = new ERC721LazyMintTransferProxy__factory(deployer);
    erc721LazyMintTransferProxy = await erc721LazyFactory.deploy();
    await erc721LazyMintTransferProxy.deployed();
    console.log("ERC721LazyMintTransferProxy deployed at:", erc721LazyMintTransferProxy.address);
    await erc721LazyMintTransferProxy.__OperatorRole_init();
    console.log("ERC721LazyMintTransferProxy initialized");

    console.log("\nSTEP 4: Deploying ERC1155LazyMintTransferProxy");
    const erc1155LazyFactory = new ERC1155LazyMintTransferProxy__factory(deployer);
    erc1155LazyMintTransferProxy = await erc1155LazyFactory.deploy();
    await erc1155LazyMintTransferProxy.deployed();
    console.log("ERC1155LazyMintTransferProxy deployed at:", erc1155LazyMintTransferProxy.address);
    await erc1155LazyMintTransferProxy.__OperatorRole_init();
    console.log("ERC1155LazyMintTransferProxy initialized");

    console.log("\nSTEP 5: Deploying RoyaltiesRegistry");
    const RoyaltiesRegistryFactory = new HederaRoyaltiesRegistry__factory(deployer);
    royaltiesRegistry = await RoyaltiesRegistryFactory.deploy();
    await royaltiesRegistry.deployed();
    console.log("RoyaltiesRegistry deployed at:", royaltiesRegistry.address);
    await royaltiesRegistry.__HederaRoyaltiesRegistry_init();
    console.log("RoyaltiesRegistry initialized");

    console.log("\nSTEP 6: Deploying and initializing ExchangeMetaV2");
    const exchangeFactory = new ExchangeMetaV2__factory(deployer);
    exchange = await exchangeFactory.deploy();
    console.log("ExchangeMetaV2 deployed at:", exchange.address);
    await exchange.__ExchangeV2_init(
      unsafeTransferProxy.address,
      erc20TransferProxy.address,
      1, // protocol fee
      await royaltiesReceiver.getAddress(), // default fee receiver
      royaltiesRegistry.address
    );
    console.log("ExchangeMetaV2 initialized with proxies and royalties registry");

    console.log("\nSTEP 7: Granting operator roles to Exchange");
    await (await unsafeTransferProxy.addOperator(exchange.address)).wait();
    console.log("UnsafeTransferProxy operator role granted");
    await (await erc20TransferProxy.addOperator(exchange.address)).wait();
    console.log("ERC20TransferProxy operator role granted");
    await (await erc721LazyMintTransferProxy.addOperator(exchange.address)).wait();
    console.log("ERC721LazyMintTransferProxy operator role granted");
    await (await erc1155LazyMintTransferProxy.addOperator(exchange.address)).wait();
    console.log("ERC1155LazyMintTransferProxy operator role granted");

    console.log("\nSTEP 8: Deploying RariNFTCreator");
    const RariNFTCreatorFactory = new RariNFTCreator__factory(deployer);
    rariNFTCreator = await RariNFTCreatorFactory.deploy();
    await rariNFTCreator.deployed();
    console.log("RariNFTCreator deployed at:", rariNFTCreator.address);

    console.log("\nSTEP 9: Creating NFT collection");
    console.log("Creating collection with user1:", await user1.getAddress());
    nftAddress = await createNftCollection(
      user1,
      rariNFTCreator.address,
      {
        collectionName: "TestNFT",
        collectionSymbol: "TNFT",
        memo: "Test Collection for Exchange",
        maxSupply: 100,
        metadataUri: "ipfs://CID",
        feeCollector: await royaltiesReceiver.getAddress(),
        isRoyaltyFee: true,
        isFixedFee: false,
        feeAmount: 10,
        fixedFeeTokenAddress: ethers.constants.AddressZero,
        useHbarsForPayment: true,
        useCurrentTokenForPayment: false,
        value: "40000000000000000000", // Some cost
        gasLimit: 4_000_000
      }
    );
    console.log("NFT collection created at:", nftAddress);

    console.log("\nSTEP 10: Associating tokens");
    console.log("Associating token to user1");
    await associateToken(user1, { tokenAddress: nftAddress });
    console.log("Associating token to user2");
    await associateToken(user2, { tokenAddress: nftAddress });
    console.log("Token associations completed");

    console.log("\nSTEP 11: Minting NFT");
    console.log("Minting NFT with user1");
    mintedSerial = await mintNft(
      user1,
      rariNFTCreator.address,
      {
        collectionAddress: nftAddress,
        gasLimit: 4_000_000
      }
    );
    console.log("Minted NFT with serial:", mintedSerial);

    console.log("\nSTEP 12: Verifying ownership and approving transfer");
    const erc721: IERC721Enumerable = IERC721Enumerable__factory.connect(nftAddress, user1);
    const owner = await erc721.ownerOf(mintedSerial);
    console.log("Current owner:", owner);
    console.log("Expected owner (user1):", await user1.getAddress());
    expect(owner).to.equal(await user1.getAddress());
    
    console.log("Approving UnsafeTransferProxy to transfer NFTs");
    const tx = await erc721.connect(user1).setApprovalForAll(unsafeTransferProxy.address, true);
    await tx.wait();
    console.log("Approval granted to proxy:", unsafeTransferProxy.address);
    
    console.log("--------- TEST SETUP COMPLETED ---------\n");
  });

  it("Should list and buy NFT using ExchangeMetaV2", async function () {
    console.log("--------- TEST STARTED ---------");
    
    // 1. user1 lists the NFT
    console.log("STEP 1: Listing NFT for sale");
    console.log(`NFT Collection: ${nftAddress}`);
    console.log(`Token ID: ${mintedSerial}`);
    const price = BigNumber.from("1000000000"); // Price in "HBAR" terms. The code adjusts the value in buyNftToken
    console.log(`Listing price: ${ethers.utils.formatUnits(price, 8)} HBAR`);
    
    const { order, signature } = await listNftToken(
      exchange.address,
      user1,
      nftAddress,
      BigNumber.from(mintedSerial),
      price
    );
    console.log("NFT successfully listed");
    console.log(`Order maker: ${order.maker}`);
    console.log(`Signature: ${signature.substring(0, 20)}...`);

    // 2. user2 buys the NFT
    console.log("\nSTEP 2: Buying the NFT");
    console.log(`Buyer address: ${await user2.getAddress()}`);
    console.log(`Payment amount: ${ethers.utils.formatUnits(price, 8)} HBAR`);
    
    const tx = await buyNftToken(
      exchange.address,
      user2,
      order,
      signature,
      price
    );
    console.log("Purchase transaction submitted");
    const receipt = await tx.wait();
    console.log(`Purchase completed in block ${receipt.blockNumber}`);
    console.log(`Gas used: ${receipt.gasUsed.toString()}`);

    // 3. Verify user2 is the new owner
    console.log("\nSTEP 3: Verifying ownership transfer");
    const erc721: IERC721Enumerable = IERC721Enumerable__factory.connect(nftAddress, user1);
    const newOwner2 = await erc721.ownerOf(mintedSerial);
    console.log(`Current owner of token ${mintedSerial}: ${newOwner2}`);
    console.log(`Expected owner (user2): ${await user2.getAddress()}`);
    expect(newOwner2).to.equal(await user2.getAddress());
    console.log("Ownership verification successful");
    
    console.log("--------- TEST COMPLETED ---------");
  });
});