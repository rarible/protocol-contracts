// <ai_context>
// tests/exchangeTest.ts
// New test for exchanging one NFT token (list & buy) using ExchangeMetaV2
// </ai_context>

import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer, BigNumber } from "ethers";

// Factories from Rarible’s Exchange
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
    const signers = await ethers.getSigners();
    deployer = signers[0];
    user1 = signers[1];
    user2 = signers[2];
    console.log("user1", await user1.getAddress());
    console.log("user2", await user2.getAddress());
    console.log("deployer", await deployer.getAddress());

    console.log("balance deployer", await deployer.getBalance());
    console.log("balance user1", await user1.getBalance());
    console.log("balance user2", await user2.getBalance());

    // 1. Deploy UnsafeTransferProxy
    const unsafeTransferProxyFactory = new UnsafeTransferProxy__factory(deployer);
    unsafeTransferProxy = await unsafeTransferProxyFactory.deploy();
    await unsafeTransferProxy.deployed();
    await unsafeTransferProxy.__OperatorRole_init();

    // 2. Deploy ERC20TransferProxy
    const erc20TransferProxyFactory = new ERC20TransferProxy__factory(deployer);
    erc20TransferProxy = await erc20TransferProxyFactory.deploy();
    await erc20TransferProxy.deployed();
    await erc20TransferProxy.__OperatorRole_init();

    // 3. Deploy ERC721LazyMintTransferProxy
    const erc721LazyFactory = new ERC721LazyMintTransferProxy__factory(deployer);
    erc721LazyMintTransferProxy = await erc721LazyFactory.deploy();
    await erc721LazyMintTransferProxy.deployed();
    await erc721LazyMintTransferProxy.__OperatorRole_init();

    // 4. Deploy ERC1155LazyMintTransferProxy
    const erc1155LazyFactory = new ERC1155LazyMintTransferProxy__factory(deployer);
    erc1155LazyMintTransferProxy = await erc1155LazyFactory.deploy();
    await erc1155LazyMintTransferProxy.deployed();
    await erc1155LazyMintTransferProxy.__OperatorRole_init();

    // 5. Deploy RoyaltiesRegistry
    const RoyaltiesRegistryFactory = new HederaRoyaltiesRegistry__factory(deployer);
    royaltiesRegistry = await RoyaltiesRegistryFactory.deploy();
    await royaltiesRegistry.deployed();
    await royaltiesRegistry.__HederaRoyaltiesRegistry_init();

    // 6. Deploy and init ExchangeMetaV2
    const exchangeFactory = new ExchangeMetaV2__factory(deployer);
    exchange = await exchangeFactory.deploy();
    await exchange.deployed();
    await exchange.__ExchangeV2_init(
      unsafeTransferProxy.address,
      erc20TransferProxy.address,
      0, // protocol fee
      ethers.constants.AddressZero, // default fee receiver
      royaltiesRegistry.address
    );

    // 7. Grant operator roles so Exchange can transfer items
    await (await unsafeTransferProxy.addOperator(exchange.address)).wait();
    await (await erc20TransferProxy.addOperator(exchange.address)).wait();
    await (await erc721LazyMintTransferProxy.addOperator(exchange.address)).wait();
    await (await erc1155LazyMintTransferProxy.addOperator(exchange.address)).wait();

    // 8. Deploy RariNFTCreator
    const RariNFTCreatorFactory = new RariNFTCreator__factory(deployer);
    rariNFTCreator = await RariNFTCreatorFactory.deploy();
    await rariNFTCreator.deployed();

    // user1 creates an NFT collection
    nftAddress = await createNftCollection(
      user1,
      rariNFTCreator.address,
      {
        collectionName: "TestNFT",
        collectionSymbol: "TNFT",
        memo: "Test Collection for Exchange",
        maxSupply: 100,
        metadataUri: "ipfs://CID",
        feeCollector: await (await deployer.getAddress()),
        isRoyaltyFee: false,
        isFixedFee: false,
        feeAmount: 0,
        fixedFeeTokenAddress: ethers.constants.AddressZero,
        useHbarsForPayment: true,
        useCurrentTokenForPayment: false,
        value: "40000000000000000000", // Some cost
        gasLimit: 4_000_000
      }
    );

    // associate the NFT to user1, user2
    await associateToken(user1, { tokenAddress: nftAddress });
    await associateToken(user2, { tokenAddress: nftAddress });

    // user1 mints an NFT
    mintedSerial = await mintNft(
      user1,
      rariNFTCreator.address,
      {
        collectionAddress: nftAddress,
        gasLimit: 4_000_000
      }
    );

    const erc721: IERC721Enumerable = IERC721Enumerable__factory.connect(nftAddress, user1);
    const owner = await erc721.ownerOf(mintedSerial);
    expect(owner).to.equal(await user1.getAddress());
    const tx = await erc721.setApprovalForAll(unsafeTransferProxy.address, true);
    await tx.wait();
  });

  it("Should list and buy NFT using ExchangeMetaV2", async function () {
    // 1. user1 lists the NFT
    const price = BigNumber.from("100000000"); // Price in "HBAR" terms. The code adjusts the value in buyNftToken
    const { order, signature } = await listNftToken(
      exchange.address,
      user1,
      nftAddress,
      BigNumber.from(mintedSerial),
      price
    );

    // 2. user2 buys the NFT
    const tx = await buyNftToken(
      exchange.address,
      user2,
      order,
      signature,
      price
    );
    await tx.wait();

    // 3. Verify user2 is the new owner
    //    Since we minted an ERC721 on Hedera,
    //    we can just check by calling "ownerOf"
    const erc721: IERC721Enumerable = IERC721Enumerable__factory.connect(nftAddress, user1);
    const newOwner2 = await erc721.ownerOf(mintedSerial);
    expect(newOwner2).to.equal(await user2.getAddress());
  });
});