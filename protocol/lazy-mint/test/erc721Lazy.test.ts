// <ai_context> Test suite for ERC721 lazy minting. Covers signature recovery, mintAndTransfer, transferFromOrMint, and edge cases. Uses TypeChain and Hardhat. Updated to match JS test values/logic for recover using Ethers v6 signers. </ai_context>
import { expect } from "chai";
import { network } from "hardhat";
const connection = await network.connect();
const { ethers } = connection;
import type * as ethersTypes from "ethers";
import {
  type ERC721Test,
  ERC721Test__factory,
  type ERC721LazyMintTest,
  ERC721LazyMintTest__factory,
  type ERC721LazyMintTransferProxyTest,
  ERC721LazyMintTransferProxyTest__factory,
} from "../types/ethers-contracts/index.js";
import { deployTransparentProxy } from "@rarible/test/src/index.js";
import { sign } from "./helpers/mint721";

describe("ERC721 Lazy Mint", function () {
  let erc721Test: ERC721Test;
  let lazyMintTest: ERC721LazyMintTest;
  let transferProxy: ERC721LazyMintTransferProxyTest;
  let signers: ethersTypes.Signer[];
  let creator: string;
  let recipient: string;
  let other: string;
  let royaltiesAddr1: string;
  let royaltiesAddr2: string;
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  const tokenId = 1n;
  const tokenURI = "testURI";
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
    const { instance: erc721TestInstance } = await deployTransparentProxy<ERC721Test>(ethers, {
      contractName: "ERC721Test",
      initFunction: "__ERC721Test_init",
      proxyOwner: await deployer.getAddress(),
    });
    erc721Test = erc721TestInstance;
    const { instance: lazyMintTestInstance } = await deployTransparentProxy<ERC721LazyMintTest>(ethers, {
      contractName: "ERC721LazyMintTest",
      initFunction: "__ERC721LazyMintTest_init",
      proxyOwner: await deployer.getAddress(),
    });
    lazyMintTest = lazyMintTestInstance;

    const { instance: transferProxyInstance } = await deployTransparentProxy<ERC721LazyMintTransferProxyTest>(ethers, {
      contractName: "ERC721LazyMintTransferProxyTest",
      initFunction: "__ERC721LazyMintTransferProxyTest_init",
      initArgs: [await deployer.getAddress()],
      proxyOwner: await deployer.getAddress(),
    });
    transferProxy = transferProxyInstance;
    royalties = [{ account: royaltiesAddr1, value: 1n }, { account: royaltiesAddr2, value: 100n }];
    creators = [{ account: creator, value: 100000n }];
    await transferProxy.addOperator(await deployer.getAddress());
  });
  describe("Signature Recovery", function () {
    it("should recover signer", async function () {
      const signature = await sign(signers[1], tokenId, tokenURI, creators, royalties, await erc721Test.getAddress());
      const data = { tokenId, tokenURI, creators, royalties, signatures: [signature] };
      expect(await erc721Test.recover(data, signature)).to.equal(await signers[1].getAddress());
    });
  });
  describe("Lazy Mint and Transfer", function () {
    it("should mint and transfer if not minted", async function () {
      const data = { tokenId, tokenURI, creators: [{ account: creator, value: 100000n }], royalties, signatures: [] };
      await expect(lazyMintTest.mintAndTransfer(data, recipient))
        .to.emit(lazyMintTest, "Transfer")
        .withArgs(ZERO_ADDRESS, recipient, tokenId);
      expect(await lazyMintTest.ownerOf(tokenId)).to.equal(recipient);
    });
    it("should revert if already minted", async function () {
      const data = { tokenId, tokenURI, creators: [{ account: creator, value: 100000n }], royalties, signatures: [] };
      await lazyMintTest.mintAndTransfer(data, recipient);
      await expect(lazyMintTest.mintAndTransfer(data, other))
        .to.be.revertedWithCustomError(lazyMintTest, "ERC721InvalidSender")
        .withArgs(ethers.ZeroAddress);
    });
    it("should transfer from or mint", async function () {
      const data = { tokenId, tokenURI, creators: [{ account: creator, value: 100000n }], royalties, signatures: [] };
      // First call: mints
      await lazyMintTest.transferFromOrMint(data, creator, recipient);
      expect(await lazyMintTest.ownerOf(tokenId)).to.equal(recipient);
      // Approve for transfer
      await lazyMintTest.connect(signers[2]).approve(await signers[0].getAddress(), tokenId);
      // Second call: transfers
      await lazyMintTest.transferFromOrMint(data, recipient, other);
      expect(await lazyMintTest.ownerOf(tokenId)).to.equal(other);
    });
    it("should work with transfer proxy", async function () {

      const data = { tokenId, tokenURI, creators: [{ account: creator, value: 100000n }], royalties, signatures: [] };
      const asset = { assetType: { assetClass: "0x73bb5bfe", data: await lazyMintTest.encode(data) }, value: 1n };
      await transferProxy.transfer(asset, creator, recipient);
      expect(await lazyMintTest.ownerOf(tokenId)).to.equal(recipient);
    });
  });
});