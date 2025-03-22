// <ai_context>
// tests/transferProxy.test.ts
// Tests the UnsafeTransferProxy in hedera-exchage-v2
// Includes creating a collection, minting an NFT, transferring, and a failed transfer
// </ai_context>

import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";

import { addOperatorRole, transferFrom } from "../sdk/unsafeTransferProxy";
import { createNftCollection, mintNft } from "@rarible/hedera-tokens/sdk";
import { RariNFTCreator__factory, RariNFTCreator } from "@rarible/hedera-tokens/typechain-types";
import { associateToken } from "@rarible/hedera-tokens/sdk";
import { UnsafeTransferProxy__factory, UnsafeTransferProxy } from "../typechain-types";
import { IERC721Enumerable, IERC721Enumerable__factory } from "@rarible/hedera-tokens/typechain-types";

describe("UnsafeTransferProxy", function () {
  let signers: Signer[];
  let deployer: Signer;
  let user1: Signer;
  let user2: Signer;
  let unsafeTransferProxy: UnsafeTransferProxy;
  let rariNFTCreator: RariNFTCreator;
  let nftAddress: string;
  let mintedSerial: string;

  beforeEach(async function () {
    signers = await ethers.getSigners();
    deployer = signers[0];
    user1 = signers[1];
    user2 = signers[2];
    console.log("user1", await user1.getAddress());
    console.log("user2", await user2.getAddress());
    console.log("deployer", await deployer.getAddress());

    console.log("balance deployer", await deployer.getBalance());
    console.log("balance user1", await user1.getBalance());
    console.log("balance user2", await user2.getBalance());
    // Deploy UnsafeTransferProxy
    const UnsafeTransferProxyFactory = new UnsafeTransferProxy__factory(deployer);
    unsafeTransferProxy = await UnsafeTransferProxyFactory.deploy();
    await unsafeTransferProxy.deployed();
    await unsafeTransferProxy.__OperatorRole_init();

    // Deploy RariNFTCreator
    const RariNFTCreatorFactory = new RariNFTCreator__factory(deployer);
    rariNFTCreator = await RariNFTCreatorFactory.deploy();
    rariNFTCreator = await rariNFTCreator.deployed();
    console.log("RariNFTCreatorFactory deploy done");

    // Grant operator role to user1 on the proxy
    const addOperatorRoleReceipt = await addOperatorRole(
      deployer,
      unsafeTransferProxy.address,
      await user1.getAddress(),
      4_000_000
    );
    console.log("addOperatorRoleReceipt", addOperatorRoleReceipt.hash);

    // user1 creates an NFT collection
    nftAddress = await createNftCollection(
      user1,
      rariNFTCreator.address,
      {
        collectionName: "MyNFT",
        collectionSymbol: "MNFT",
        memo: "Testing Collection",
        maxSupply: 100,
        metadataUri: "ipfs://sample_cid",
        feeCollector: await deployer.getAddress(),
        isRoyaltyFee: false,
        isFixedFee: false,
        feeAmount: 0,
        fixedFeeTokenAddress: "0x0000000000000000000000000000000000000000",
        useHbarsForPayment: true,
        useCurrentTokenForPayment: false,
        value: "50000000000000000000",
        gasLimit: 4_000_000
      }
    );
    console.log("nftAddress", nftAddress);
    // associate the NFT to the user1 account
    const associateTokenReceiptUser1 = await associateToken(
      user1,
      { tokenAddress: nftAddress }
    );
    console.log("associateTokenReceiptUser1", associateTokenReceiptUser1);

    // user1 mints an NFT (returns the minted token index)
    console.log("minting NFT");
    mintedSerial = await mintNft(
      user1,
      rariNFTCreator.address,
      {
        collectionAddress: nftAddress,
        gasLimit: 4_000_000
      }
    );
    console.log("mintedSerial", mintedSerial);

    // associate the NFT to the user1 account
    const associateTokenReceipt = await associateToken(
      user2,
      { tokenAddress: nftAddress }
    );
    console.log("associateTokenReceipt", associateTokenReceipt);
  });

  it("should transfer NFT using unsafeTransferProxy", async function () {
    // Transfer from user1 to user2
    const fromAddress = await user1.getAddress();
    const toAddress = await user2.getAddress();


    const receipt = await transferFrom(
      user1,
      unsafeTransferProxy.address,
      fromAddress,
      toAddress,
      nftAddress,
      mintedSerial,
      4_000_000
    );
    expect(receipt.status).to.equal(1);

    // Verify that new owner is user2
    const erc721 = IERC721Enumerable__factory.connect(nftAddress, user1);
    const newOwner = await erc721.ownerOf(mintedSerial);
    expect(newOwner).to.equal(toAddress);
  });

  it("should revert if transferring NFT that doesn't belong to the caller", async function () {
    // Attempt to transfer from user2 to user1, but user2 does NOT own the NFT
    const fromAddress = await user2.getAddress();
    const toAddress = await user1.getAddress();

    try {
      await transferFrom(
        user2,
        unsafeTransferProxy.address,
        fromAddress,
        toAddress,
        nftAddress,
        mintedSerial,
        4_000_000
      );
      // If transferFrom does not throw, fail the test explicitly.
      expect.fail("Transaction should have failed");
    } catch (err: any) {
      // Check that the error message contains "transaction failed"
      expect(err.message).to.match(/transaction failed/);
    }
  });
});