// <ai_context> Test suite for ERC1155 lazy minting using upgradeable proxy pattern. Covers signature recovery, mintAndTransfer, transferFromOrMint, supply handling, edge cases, and transfer via an OperatorRole-based transfer proxy. Uses TypeChain, Hardhat (Ethers v6), and deployTransparentProxy helper, aligned with ERC721 lazy mint tests. </ai_context>
import { expect } from "chai";
import { network } from "hardhat";
const connection = await network.connect();
const { ethers } = connection;
import type * as ethersTypes from "ethers";
import {
  type ERC1155Test,
  ERC1155Test__factory,
  type ERC1155LazyMintTest,
  ERC1155LazyMintTest__factory,
  type ERC1155LazyMintTransferProxyTest,
  ERC1155LazyMintTransferProxyTest__factory,
} from "../types/ethers-contracts/index.js";
import { deployTransparentProxy } from "@rarible/test/src/index.js";
import { sign } from "./helpers/mint1155";

describe("ERC1155 Lazy Mint", function () {
  let erc1155Test: ERC1155Test;
  let lazyMintTest: ERC1155LazyMintTest;
  let transferProxy: ERC1155LazyMintTransferProxyTest;
  let signers: ethersTypes.Signer[];
  let creator: string;
  let recipient: string;
  let other: string;
  let royaltiesAddr1: string;
  let royaltiesAddr2: string;
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  const tokenId = 1n;
  const tokenURI = "testURI";
  const supply = 10n;
  const amount = 5n;
  let royalties: any[];
  let creators: any[];

  before(async function () {
    signers = await ethers.getSigners();
    creator = await signers[1].getAddress();
    recipient = await signers[2].getAddress();
    other = await signers[3].getAddress();
    royaltiesAddr1 = await signers[1].getAddress();
    royaltiesAddr2 = await signers[2].getAddress();
  });

  beforeEach(async function () {
    const [deployer] = signers;

    const { instance: erc1155TestInstance } = await deployTransparentProxy<ERC1155Test>(ethers, {
      contractName: "ERC1155Test",
      initFunction: "__ERC1155Test_init",
      proxyOwner: await deployer.getAddress(),
    });
    erc1155Test = erc1155TestInstance;

    const { instance: lazyMintTestInstance } = await deployTransparentProxy<ERC1155LazyMintTest>(ethers, {
      contractName: "ERC1155LazyMintTest",
      initFunction: "__ERC1155LazyMintTest_init",
      proxyOwner: await deployer.getAddress(),
    });
    lazyMintTest = lazyMintTestInstance;

    const { instance: transferProxyInstance } = await deployTransparentProxy<ERC1155LazyMintTransferProxyTest>(ethers, {
      contractName: "ERC1155LazyMintTransferProxyTest",
      initFunction: "__ERC1155LazyMintTransferProxyTest_init",
      initArgs: [await deployer.getAddress()],
      proxyOwner: await deployer.getAddress(),
    });
    transferProxy = transferProxyInstance;

    await transferProxy.addOperator(await deployer.getAddress());

    royalties = [
      { account: royaltiesAddr1, value: 1n },
      { account: royaltiesAddr2, value: 100n },
    ];
    creators = [{ account: creator, value: 100000n }];
  });

  describe("Signature Recovery", function () {
    it("should recover signer", async function () {
      const signature = await sign(
        signers[1],
        tokenId,
        tokenURI,
        supply,
        creators,
        royalties,
        await erc1155Test.getAddress(),
      );
      const data = { tokenId, tokenURI, supply, creators, royalties, signatures: [signature] };
      expect(await erc1155Test.recover(data, signature)).to.equal(await signers[1].getAddress());
    });

    it("should fail with invalid signature", async function () {
      const data = { tokenId, tokenURI, supply, creators, royalties, signatures: [] };
      // 0x11 -> 1-byte signature, triggers OpenZeppelin's ECDSAInvalidSignatureLength(uint256)
      const invalidSig = "0x11";
      await expect(erc1155Test.recover(data, invalidSig))
        .to.be.revertedWithCustomError(erc1155Test, "ECDSAInvalidSignatureLength")
        .withArgs(1n);
    });
  });

  describe("Lazy Mint and Transfer", function () {
    it("should mint and transfer if not minted", async function () {
      const data = {
        tokenId,
        tokenURI,
        supply,
        creators: [{ account: creator, value: 100000n }],
        royalties,
        signatures: [],
      };
      await expect(lazyMintTest.mintAndTransfer(data, recipient, amount))
        .to.emit(lazyMintTest, "TransferSingle")
        .withArgs(await signers[0].getAddress(), ZERO_ADDRESS, recipient, tokenId, amount);
      expect(await lazyMintTest.balanceOf(recipient, tokenId)).to.equal(amount);
    });

    it("should handle partial supply", async function () {
      const data = {
        tokenId,
        tokenURI,
        supply,
        creators: [{ account: creator, value: 100000n }],
        royalties,
        signatures: [],
      };
      await lazyMintTest.mintAndTransfer(data, recipient, amount);
      await lazyMintTest.mintAndTransfer(data, other, amount);
      expect(await lazyMintTest.balanceOf(recipient, tokenId)).to.equal(amount);
      expect(await lazyMintTest.balanceOf(other, tokenId)).to.equal(amount);
    });

    it("should transfer from or mint", async function () {
      const data = {
        tokenId,
        tokenURI,
        supply,
        creators: [{ account: creator, value: 100000n }],
        royalties,
        signatures: [],
      };
      // First: mints
      await lazyMintTest.transferFromOrMint(data, creator, recipient, amount);
      expect(await lazyMintTest.balanceOf(recipient, tokenId)).to.equal(amount);

      // Approve for transfer
      await lazyMintTest.connect(signers[2]).setApprovalForAll(await signers[0].getAddress(), true);

      // Second: transfers
      await lazyMintTest.transferFromOrMint(data, recipient, other, amount);
      expect(await lazyMintTest.balanceOf(other, tokenId)).to.equal(amount);
    });

    it("should work with transfer proxy", async function () {
      const data = {
        tokenId,
        tokenURI,
        supply,
        creators: [{ account: creator, value: 100000n }],
        royalties,
        signatures: [],
      };
      const asset = {
        assetType: { assetClass: "0x973bb640", data: await lazyMintTest.encode(data) },
        value: amount,
      };
      await transferProxy.transfer(asset, creator, recipient);
      expect(await lazyMintTest.balanceOf(recipient, tokenId)).to.equal(amount);
    });
  });

  describe("Edge Cases", function () {
    it("should allow minting beyond supply (no enforcement in test contract)", async function () {
      const data = {
        tokenId,
        tokenURI,
        supply: 1n,
        creators: [{ account: creator, value: 100000n }],
        royalties,
        signatures: [],
      };
      await lazyMintTest.mintAndTransfer(data, recipient, 1n);
      await lazyMintTest.mintAndTransfer(data, other, 1n); // No revert, as test contract doesn't enforce
      expect(await lazyMintTest.balanceOf(other, tokenId)).to.equal(1n);
    });
  });
});