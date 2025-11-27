// <ai_context> Test suite for ERC1155 lazy minting. Covers signature recovery, mintAndTransfer, transferFromOrMint, supply, and edge cases. Uses TypeChain and Hardhat. Updated to match JS test values/logic for recover using Ethers v6 signers. </ai_context>
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
    erc1155Test = await new ERC1155Test__factory(deployer).deploy();
    await erc1155Test.__ERC1155Test_init();
    lazyMintTest = await new ERC1155LazyMintTest__factory(deployer).deploy();
    transferProxy = await new ERC1155LazyMintTransferProxyTest__factory(deployer).deploy();
    await transferProxy.__OperatorRole_init(await deployer.getAddress());
    await transferProxy.addOperator(await deployer.getAddress());
    royalties = [{ account: royaltiesAddr1, value: 1n }, { account: royaltiesAddr2, value: 100n }];
    creators = [{ account: creator, value: 100000n }];
  });
  describe("Signature Recovery", function () {
    it("should recover signer", async function () {
      const signature = await sign(signers[1], tokenId, tokenURI, supply, creators, royalties, await erc1155Test.getAddress());
      const data = { tokenId, tokenURI, supply, creators, royalties, signatures: [signature] };
      expect(await erc1155Test.recover(data, signature)).to.equal(await signers[1].getAddress());
    });
    it("should fail with invalid signature", async function () {
      const data = { tokenId, tokenURI, supply, creators, royalties, signatures: [] };
      const invalidSig = "0xinvalid";
      await expect(erc1155Test.recover(data, invalidSig)).to.be.reverted;
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
      const asset = { assetType: { assetClass: "0x973bb640", data: await lazyMintTest.encode(data) }, value: amount };
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
    // Add more as needed
  });
});