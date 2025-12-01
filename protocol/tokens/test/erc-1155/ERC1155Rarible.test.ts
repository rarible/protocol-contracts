// <ai_context> TypeScript port of erc-1155/ERC1155Rarible.test.js. Tests ERC1155Rarible token functionality including minting, burning, transfers, and factory creation. </ai_context>
import { expect } from "chai";
import { network } from "hardhat";
import type * as ethersTypes from "ethers";

const connection = await network.connect();
const { ethers } = connection;

import {
  type ERC1155Rarible,
  ERC1155Rarible__factory,
  type TestERC1271,
  TestERC1271__factory,
  type UpgradeableBeacon,
  UpgradeableBeacon__factory,
  type ERC1155RaribleFactoryC2,
  ERC1155RaribleFactoryC2__factory,
  type TransferProxyTest,
  TransferProxyTest__factory,
  type ERC1155LazyMintTransferProxyTest,
  ERC1155LazyMintTransferProxyTest__factory,
} from "../../types/ethers-contracts";
import { sign as signMint1155 } from "@rarible/common-sdk/src/mint1155";
import { deployTransparentProxy } from "@rarible/common-sdk/src/deploy";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
const zeroWord = "0x0000000000000000000000000000000000000000000000000000000000000000";
const ZERO = "0x0000000000000000000000000000000000000000";

type Part = { account: string; value: bigint };

function creators(accounts: string[]): Part[] {
  const value = BigInt(10000 / accounts.length);
  return accounts.map((account) => ({ account, value }));
}

function fees(accounts: string[]): Part[] {
  const value = 500n;
  return accounts.map((account) => ({ account, value }));
}

// -----------------------------------------------------------------------------
// Main Test Suite
// -----------------------------------------------------------------------------
describe("ERC1155Rarible", function () {
  let token: ERC1155Rarible;
  let tokenOwner: ethersTypes.Signer;
  let accounts: ethersTypes.Signer[];
  let deployer: ethersTypes.Signer;
  let erc1271: TestERC1271;
  let proxyLazy: ERC1155LazyMintTransferProxyTest;
  let whiteListProxy: ethersTypes.Signer;

  const name = "FreeMintable";

  before(async () => {
    accounts = await ethers.getSigners();
    [deployer, , , , , whiteListProxy, , , , tokenOwner] = accounts;

    // Deploy lazy mint transfer proxy
    proxyLazy = await new ERC1155LazyMintTransferProxyTest__factory(deployer).deploy();
    await proxyLazy.waitForDeployment();

    // Deploy ERC1271 test contract
    erc1271 = await new TestERC1271__factory(deployer).deploy();
    await erc1271.waitForDeployment();
  });

  beforeEach(async () => {
    const { instance } = await deployTransparentProxy<ERC1155Rarible>(ethers, {
      contractName: "ERC1155Rarible",
      initFunction: "__ERC1155Rarible_init",
      initArgs: [
        name,
        "TST",
        "ipfs:/",
        "ipfs:/",
        await whiteListProxy.getAddress(),
        await proxyLazy.getAddress(),
        await tokenOwner.getAddress(),
      ],
      proxyOwner: await deployer.getAddress(),
    });
    token = instance;
  });

  async function getSignature(
    tokenId: string,
    tokenURI: string,
    supply: bigint,
    creatorsParts: Part[],
    royaltiesParts: Part[],
    signer: ethersTypes.Signer,
  ): Promise<string> {
    const tokenAddress = await token.getAddress();
    const tokenIdBigInt = BigInt(tokenId);
    return signMint1155(signer, tokenIdBigInt, tokenURI, supply, creatorsParts, royaltiesParts, tokenAddress);
  }

  async function checkCreators(tokenId: string, expected: string[]) {
    const onChain = await token.getCreators(tokenId);
    expect(onChain.length).to.equal(expected.length);
    const value = BigInt(10000 / expected.length);
    for (let i = 0; i < onChain.length; i++) {
      expect(onChain[i].account).to.equal(expected[i]);
      expect(onChain[i].value).to.equal(value);
    }
  }

  // ---------------------------------------------------------------------------
  // burnBatch tests
  // ---------------------------------------------------------------------------
  describe("burnBatch()", () => {
    it("BurnBatch before, ok", async () => {
      const minter = accounts[1];
      const transferTo = accounts[2];
      const minterAddress = await minter.getAddress();
      const transferToAddress = await transferTo.getAddress();

      const tokenId4 = minterAddress + "b00000000000000000000004";
      const tokenId5 = transferToAddress + "b00000000000000000000005";
      const tokenURI = "/uri";
      const supply = 5n;

      // throw transferTo not owner for tokenId4
      await expect(
        token.connect(transferTo).burnBatch(transferToAddress, [tokenId4, tokenId5], [2, 2]),
      ).to.be.revertedWith("ERC1155: burn amount exceeds balance");

      await token.connect(transferTo).burnBatch(transferToAddress, [tokenId5], [2]);
      await token.connect(minter).burnBatch(minterAddress, [tokenId4], [2]);

      // can't mint 5, 2 already burned
      await expect(
        token.connect(minter).mintAndTransfer(
          {
            tokenId: tokenId4,
            tokenURI,
            supply,
            creators: creators([minterAddress]),
            royalties: [],
            signatures: [zeroWord],
          },
          transferToAddress,
          5,
        ),
      ).to.be.revertedWith("more than supply");

      await token.connect(transferTo).mintAndTransfer(
        {
          tokenId: tokenId5,
          tokenURI,
          supply,
          creators: creators([transferToAddress]),
          royalties: [],
          signatures: [zeroWord],
        },
        transferToAddress,
        3,
      );
      expect(await token.balanceOf(transferToAddress, tokenId5)).to.equal(3n);
    });

    it("BurnBatch two tokens, ok", async () => {
      const minter = accounts[1];
      const anotherUser = accounts[6];
      const transferTo = accounts[2];
      const minterAddress = await minter.getAddress();
      const transferToAddress = await transferTo.getAddress();

      const tokenId4 = minterAddress + "b00000000000000000000004";
      const tokenId5 = transferToAddress + "b00000000000000000000005";
      const tokenURI = "/uri";
      const supply = 5n;
      const mintValue = 5n;

      // mint, after do burnBatch
      await token.connect(minter).mintAndTransfer(
        {
          tokenId: tokenId4,
          tokenURI,
          supply,
          creators: creators([minterAddress]),
          royalties: [],
          signatures: [zeroWord],
        },
        transferToAddress,
        mintValue,
      );
      expect(await token.balanceOf(transferToAddress, tokenId4)).to.equal(mintValue);

      // combine minted and not yet minted, try to burnBatch
      await token.connect(transferTo).burnBatch(transferToAddress, [tokenId4, tokenId5], [mintValue, mintValue]);
      expect(await token.balanceOf(transferToAddress, tokenId4)).to.equal(0n);

      // no lazy tokenId5, throw
      await expect(
        token.connect(transferTo).mintAndTransfer(
          {
            tokenId: tokenId5,
            tokenURI,
            supply,
            creators: creators([minterAddress]),
            royalties: [],
            signatures: [zeroWord],
          },
          await anotherUser.getAddress(),
          1,
        ),
      ).to.be.revertedWith("tokenId incorrect");
    });

    it("BurnBatch three tokens, ok", async () => {
      const minter = accounts[1];
      const anotherUser = accounts[6];
      const transferTo = accounts[2];
      const minterAddress = await minter.getAddress();
      const anotherUserAddress = await anotherUser.getAddress();
      const transferToAddress = await transferTo.getAddress();

      const tokenId1 = minterAddress + "b00000000000000000000001";
      const tokenId2 = minterAddress + "b00000000000000000000002";
      const tokenId3 = minterAddress + "b00000000000000000000003";
      const tokenURI = "/uri";
      const supply = 5n;
      const burn = 2n;

      // token has another creator
      await expect(
        token.connect(anotherUser).burnBatch(anotherUserAddress, [tokenId1, tokenId2, tokenId3], [burn, burn, burn]),
      ).to.be.revertedWith("ERC1155: burn amount exceeds balance");

      // burn not from minter
      await expect(
        token.connect(anotherUser).burnBatch(minterAddress, [tokenId1, tokenId2, tokenId3], [burn, burn, burn]),
      ).to.be.revertedWith("ERC1155: caller is not owner nor approved");

      // burn not from minter
      await expect(
        token.connect(transferTo).burnBatch(minterAddress, [tokenId1, tokenId2, tokenId3], [burn, burn, burn]),
      ).to.be.revertedWith("ERC1155: caller is not owner nor approved");

      // ok
      await token.connect(minter).burnBatch(minterAddress, [tokenId1, tokenId2, tokenId3], [burn, burn, burn]);

      // supply - burn < mintValue == 5, throw
      await expect(
        token.connect(minter).mintAndTransfer(
          {
            tokenId: tokenId1,
            tokenURI,
            supply,
            creators: creators([minterAddress]),
            royalties: [],
            signatures: [zeroWord],
          },
          transferToAddress,
          5,
        ),
      ).to.be.revertedWith("more than supply");

      await token.connect(minter).mintAndTransfer(
        {
          tokenId: tokenId2,
          tokenURI,
          supply,
          creators: creators([minterAddress]),
          royalties: [],
          signatures: [zeroWord],
        },
        transferToAddress,
        3,
      );
      expect(await token.balanceOf(transferToAddress, tokenId2)).to.equal(3n);

      await token.connect(minter).mintAndTransfer(
        {
          tokenId: tokenId3,
          tokenURI,
          supply,
          creators: creators([minterAddress]),
          royalties: [],
          signatures: [zeroWord],
        },
        transferToAddress,
        2,
      );
      expect(await token.balanceOf(transferToAddress, tokenId3)).to.equal(2n);
    });

    it("BurnBatch from different _msgFrom, ok", async () => {
      const minter = accounts[1];
      const anotherUser = accounts[6];
      const transferTo = accounts[2];
      const minterAddress = await minter.getAddress();
      const anotherUserAddress = await anotherUser.getAddress();
      const transferToAddress = await transferTo.getAddress();
      const whiteListProxyAddress = await whiteListProxy.getAddress();

      const tokenId4 = minterAddress + "b00000000000000000000004";
      const tokenId6 = anotherUserAddress + "b00000000000000000000004";
      const tokenURI = "/uri";
      const supply = 10n;
      const mintValue = 5n;

      // mint, after do burnBatch
      await token.connect(minter).mintAndTransfer(
        {
          tokenId: tokenId4,
          tokenURI,
          supply,
          creators: creators([minterAddress]),
          royalties: [],
          signatures: [zeroWord],
        },
        transferToAddress,
        mintValue,
      );
      expect(await token.balanceOf(transferToAddress, tokenId4)).to.equal(mintValue);

      // tokenId4 send to transferTo, try to burn from anotherUser, throw
      await expect(
        token.connect(anotherUser).burnBatch(anotherUserAddress, [tokenId4], [mintValue]),
      ).to.be.revertedWith("ERC1155: burn amount exceeds balance");

      // tokenId4 send to transferTo, try to burn from anotherUser, throw
      await expect(token.connect(anotherUser).burnBatch(transferToAddress, [tokenId4], [mintValue])).to.be.revertedWith(
        "ERC1155: caller is not owner nor approved",
      );

      expect(await token.balanceOf(transferToAddress, tokenId4)).to.equal(5n);

      // whiteListProxy burn only minted
      await token.connect(whiteListProxy).burnBatch(transferToAddress, [tokenId4], [2]);
      expect(await token.balanceOf(transferToAddress, tokenId4)).to.equal(3n);

      // transferTo burn only minted
      await token.connect(transferTo).burnBatch(transferToAddress, [tokenId4], [1]);
      expect(await token.balanceOf(transferToAddress, tokenId4)).to.equal(2n);

      // minter burn more than lazy
      await expect(token.connect(minter).burnBatch(minterAddress, [tokenId4], [7])).to.be.revertedWith(
        "ERC1155: burn amount exceeds balance",
      );

      // minter burn only lazy
      await token.connect(minter).burnBatch(minterAddress, [tokenId4], [3]);
      expect(await token.balanceOf(transferToAddress, tokenId4)).to.equal(2n);

      // caller is not owner nor approved, throw
      await expect(token.connect(minter).burnBatch(transferToAddress, [tokenId6], [1])).to.be.revertedWith(
        "ERC1155: caller is not owner nor approved",
      );
      expect(await token.balanceOf(transferToAddress, tokenId4)).to.equal(2n);
    });

    it("Run mintAndTransfer = 5, burnBatch = 7, by minter, ok", async () => {
      const minter = accounts[1];
      const minterAddress = await minter.getAddress();

      const tokenId4 = minterAddress + "b00000000000000000000004";
      const tokenURI = "/uri";
      const supply = 10n;
      const mint = 5n;
      const burn = 7n;

      // mint 5 to minter
      await token.connect(minter).mintAndTransfer(
        {
          tokenId: tokenId4,
          tokenURI,
          supply,
          creators: creators([minterAddress]),
          royalties: [],
          signatures: [zeroWord],
        },
        minterAddress,
        mint,
      );
      expect(await token.balanceOf(minterAddress, tokenId4)).to.equal(mint);

      // burn too much
      await expect(token.connect(minter).burnBatch(minterAddress, [tokenId4], [500])).to.be.revertedWith(
        "ERC1155: burn amount exceeds balance",
      );
      expect(await token.balanceOf(minterAddress, tokenId4)).to.equal(mint);

      // burn = 7 (5 Lazy, 2 minted)
      await token.connect(minter).burnBatch(minterAddress, [tokenId4], [burn]);
      expect(await token.balanceOf(minterAddress, tokenId4)).to.equal(3n);

      // mint 1, not possible, all Lazy already burned, throw
      await expect(
        token.connect(minter).mintAndTransfer(
          {
            tokenId: tokenId4,
            tokenURI,
            supply,
            creators: creators([minterAddress]),
            royalties: [],
            signatures: [zeroWord],
          },
          minterAddress,
          1,
        ),
      ).to.be.revertedWith("more than supply");

      // burn 2 minted
      await token.connect(minter).burnBatch(minterAddress, [tokenId4], [2]);
      expect(await token.balanceOf(minterAddress, tokenId4)).to.equal(1n);
    });
  });

  // ---------------------------------------------------------------------------
  // burn before mint tests
  // ---------------------------------------------------------------------------
  describe("burn before mint()", () => {
    it("Test1. Supply = 5, burn = 2 not from minter, throw, mintAndTransfer by the minter = 5, ok", async () => {
      const minter = accounts[1];
      const anotherUser = accounts[5];
      const transferTo = accounts[2];
      const minterAddress = await minter.getAddress();
      const anotherUserAddress = await anotherUser.getAddress();
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "/uri";
      const supply = 5n;
      const burn = 2n;
      const mintValue = 5n;

      // token has another creator
      await expect(token.connect(anotherUser).burn(anotherUserAddress, tokenId, burn)).to.be.revertedWith(
        "ERC1155: burn amount exceeds balance",
      );

      // burn not from minter
      await expect(token.connect(anotherUser).burn(minterAddress, tokenId, burn)).to.be.revertedWith(
        "ERC1155: burn amount exceeds balance",
      );

      await token
        .connect(minter)
        .mintAndTransfer(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          transferToAddress,
          mintValue,
        );
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(mintValue);
    });

    it("Test2. Supply = 5, burn = 2, mintAndTransfer by the same minter = 3, ok", async () => {
      const minter = accounts[1];
      const transferTo = accounts[2];
      const minterAddress = await minter.getAddress();
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "/uri";
      const supply = 5n;
      const burn = 2n;
      const mintValue = supply - burn;

      await token.connect(minter).burn(minterAddress, tokenId, burn);
      await token
        .connect(minter)
        .mintAndTransfer(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          transferToAddress,
          mintValue,
        );
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(mintValue);
    });

    it("Test3.1. Supply = 5, burn = 5, mintAndTransfer by the same minter = 1, burn==supply, throw", async () => {
      const minter = accounts[1];
      const transferTo = accounts[2];
      const minterAddress = await minter.getAddress();
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "/uri";
      const supply = 5n;
      const burn = 5n;
      const mintValue = 1n;

      await token.connect(minter).burn(minterAddress, tokenId, burn);
      await expect(
        token
          .connect(minter)
          .mintAndTransfer(
            { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
            transferToAddress,
            mintValue,
          ),
      ).to.be.revertedWith("more than supply");
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(0n);
    });

    it("Test3.2. Supply = 5, burn = 10, mintAndTransfer by the same minter = 1, burn>supply, throw", async () => {
      const minter = accounts[1];
      const transferTo = accounts[2];
      const minterAddress = await minter.getAddress();
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "/uri";
      const supply = 5n;
      const burn = 10n;
      const mintValue = 1n;

      await token.connect(minter).burn(minterAddress, tokenId, burn);
      await expect(
        token
          .connect(minter)
          .mintAndTransfer(
            { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
            transferToAddress,
            mintValue,
          ),
      ).to.be.revertedWith("more than supply");
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(0n);
    });

    it("Test4. Supply = 5, burn = 1, repeat 3 times, mintAndTransfer by the same minter = 3, more, throw", async () => {
      const minter = accounts[1];
      const transferTo = accounts[2];
      const minterAddress = await minter.getAddress();
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "/uri";
      const supply = 5n;
      const burn = 1n;
      const mintValue = 3n;

      await token.connect(minter).burn(minterAddress, tokenId, burn);
      await token.connect(minter).burn(minterAddress, tokenId, burn);
      await token.connect(minter).burn(minterAddress, tokenId, burn);

      await expect(
        token
          .connect(minter)
          .mintAndTransfer(
            { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
            transferToAddress,
            mintValue,
          ),
      ).to.be.revertedWith("more than supply");
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(0n);
    });

    it("Test5. Supply = 5, burn = 2, mintAndTransfer = 2, burn2, mintAndTransfer = 1, ok", async () => {
      const minter = accounts[1];
      const transferTo = accounts[2];
      const minterAddress = await minter.getAddress();
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "/uri";
      const supply = 5n;
      const burn = 2n;
      const mintValue = 2n;

      await token.connect(minter).burn(minterAddress, tokenId, burn);
      await token
        .connect(minter)
        .mintAndTransfer(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          transferToAddress,
          mintValue,
        );
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(mintValue);

      // owner burn 1
      await token.connect(transferTo).burn(transferToAddress, tokenId, 1);
      // owner burn 1, number of allBurned = 4
      await token.connect(transferTo).burn(transferToAddress, tokenId, 1);

      const signature = await getSignature(tokenId, tokenURI, supply, creators([minterAddress]), [], minter);

      // mint 2 impossible 4+2>supply==5
      await expect(
        token
          .connect(whiteListProxy)
          .mintAndTransfer(
            { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [signature] },
            transferToAddress,
            2,
          ),
      ).to.be.revertedWith("more than supply");

      // mint 1 possible 4+1<=supply==5
      await token
        .connect(whiteListProxy)
        .mintAndTransfer(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [signature] },
          transferToAddress,
          1,
        );
    });

    it("Run burn = 10, mintAndTransfer 1 supply = 10, throw burn+minted > supply", async () => {
      const minter = accounts[1];
      const transferTo = accounts[2];
      const minterAddress = await minter.getAddress();
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "/uri";
      const supply = 10n;
      const mint = 1n;
      const burn = 10n;

      await token.connect(minter).burn(minterAddress, tokenId, burn);
      await expect(
        token
          .connect(minter)
          .mintAndTransfer(
            { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
            minterAddress,
            mint,
          ),
      ).to.be.revertedWith("more than supply");
    });
  });

  // ---------------------------------------------------------------------------
  // burn after mint tests
  // ---------------------------------------------------------------------------
  describe("burn after mint()", () => {
    it("Run mintAndTransfer = 5, burn = 2, mintAndTransfer by the same minter = 3, ok", async () => {
      const minter = accounts[1];
      const transferTo = accounts[2];
      const minterAddress = await minter.getAddress();
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "/uri";
      const supply = 5n;
      const mint = 2n;
      const secondMintValue = supply - mint;

      await token
        .connect(minter)
        .mintAndTransfer(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          transferToAddress,
          mint,
        );
      expect(await token.uri(tokenId)).to.equal("ipfs:/" + tokenURI);
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(mint);
      expect(await token.balanceOf(minterAddress, tokenId)).to.equal(0n);

      await token.connect(transferTo).burn(transferToAddress, tokenId, mint);
      await token
        .connect(minter)
        .mintAndTransfer(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          transferToAddress,
          secondMintValue,
        );
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(secondMintValue);
    });

    it("Run mintAndTransfer = 5, burn = 2, mintAndTransfer by the same minter = 4, throw", async () => {
      const minter = accounts[1];
      const transferTo = accounts[2];
      const minterAddress = await minter.getAddress();
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "/uri";
      const supply = 5n;
      const mint = 2n;
      const secondMintValue = 4n;

      await token
        .connect(minter)
        .mintAndTransfer(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          transferToAddress,
          mint,
        );
      expect(await token.uri(tokenId)).to.equal("ipfs:/" + tokenURI);
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(mint);
      expect(await token.balanceOf(minterAddress, tokenId)).to.equal(0n);

      await token.connect(transferTo).burn(transferToAddress, tokenId, mint);
      await expect(
        token
          .connect(minter)
          .mintAndTransfer(
            { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
            transferToAddress,
            secondMintValue,
          ),
      ).to.be.revertedWith("more than supply");
    });

    it("Run mintAndTransfer = 5, burn = 5, mintAndTransfer by the same minter = 1, throw", async () => {
      const minter = accounts[1];
      const transferTo = accounts[2];
      const minterAddress = await minter.getAddress();
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "/uri";
      const supply = 5n;
      const mint = 5n;
      const secondMintValue = 1n;

      await token
        .connect(minter)
        .mintAndTransfer(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          transferToAddress,
          mint,
        );
      expect(await token.uri(tokenId)).to.equal("ipfs:/" + tokenURI);
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(mint);
      expect(await token.balanceOf(minterAddress, tokenId)).to.equal(0n);

      await token.connect(transferTo).burn(transferToAddress, tokenId, mint);
      await expect(
        token
          .connect(minter)
          .mintAndTransfer(
            { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
            transferToAddress,
            secondMintValue,
          ),
      ).to.be.revertedWith("more than supply");
    });

    it("Run mintAndTransfer = 5, burn = 4, mintAndTransfer by the same minter = 1, throw", async () => {
      const minter = accounts[1];
      const transferTo = accounts[2];
      const minterAddress = await minter.getAddress();
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "/uri";
      const supply = 5n;
      const mint = 5n;
      const secondMintValue = 1n;

      await token
        .connect(minter)
        .mintAndTransfer(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          transferToAddress,
          mint,
        );
      expect(await token.uri(tokenId)).to.equal("ipfs:/" + tokenURI);
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(mint);
      expect(await token.balanceOf(minterAddress, tokenId)).to.equal(0n);

      await token.connect(transferTo).burn(transferToAddress, tokenId, 4);
      await expect(
        token
          .connect(minter)
          .mintAndTransfer(
            { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
            transferToAddress,
            secondMintValue,
          ),
      ).to.be.revertedWith("more than supply");
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(secondMintValue);
    });

    it("Run mintAndTransfer = 4, burn = 3, mintAndTransfer by the same minter = 1, ok", async () => {
      const minter = accounts[1];
      const transferTo = accounts[2];
      const minterAddress = await minter.getAddress();
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "/uri";
      const supply = 5n;
      const mint = 4n;
      const secondMintValue = 1n;

      await token
        .connect(minter)
        .mintAndTransfer(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          transferToAddress,
          mint,
        );
      expect(await token.uri(tokenId)).to.equal("ipfs:/" + tokenURI);
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(mint);
      expect(await token.balanceOf(minterAddress, tokenId)).to.equal(0n);

      await token.connect(transferTo).burn(transferToAddress, tokenId, 3);
      await token
        .connect(minter)
        .mintAndTransfer(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          transferToAddress,
          secondMintValue,
        );
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(2n);
    });

    it("Run mintAndTransfer = 4, burn = 3, mintAndTransfer by the same minter = 2, throw", async () => {
      const minter = accounts[1];
      const transferTo = accounts[2];
      const minterAddress = await minter.getAddress();
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "/uri";
      const supply = 5n;
      const mint = 4n;
      const secondMintValue = 2n;

      await token
        .connect(minter)
        .mintAndTransfer(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          transferToAddress,
          mint,
        );
      expect(await token.uri(tokenId)).to.equal("ipfs:/" + tokenURI);
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(mint);
      expect(await token.balanceOf(minterAddress, tokenId)).to.equal(0n);

      await token.connect(transferTo).burn(transferToAddress, tokenId, 3);
      await expect(
        token
          .connect(minter)
          .mintAndTransfer(
            { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
            transferToAddress,
            secondMintValue,
          ),
      ).to.be.revertedWith("more than supply");
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(1n);
    });

    it("Run mintAndTransfer = 5, burn = 7, mint to new user, ok", async () => {
      const minter = accounts[1];
      const transferTo = accounts[2];
      const minterAddress = await minter.getAddress();
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "/uri";
      const supply = 10n;
      const mint = 5n;
      const burn = 7n;

      // mint 5 to anotherUser
      await token
        .connect(minter)
        .mintAndTransfer(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          transferToAddress,
          mint,
        );
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(mint);
      expect(await token.balanceOf(minterAddress, tokenId)).to.equal(0n);

      // burn 7 from new owner more than mint, throw new, because can't burn lazy
      await expect(token.connect(transferTo).burn(transferToAddress, tokenId, burn)).to.be.revertedWith(
        "ERC1155: burn amount exceeds balance",
      );
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(mint);

      // burn 5 real not lazy from new owner, ok
      await token.connect(transferTo).burn(transferToAddress, tokenId, mint);
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(0n);
      expect(await token.balanceOf(minterAddress, tokenId)).to.equal(0n);

      // mint 7, more than possible
      await expect(
        token
          .connect(minter)
          .mintAndTransfer(
            { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
            transferToAddress,
            burn,
          ),
      ).to.be.revertedWith("more than supply");

      await token
        .connect(minter)
        .mintAndTransfer(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          transferToAddress,
          mint,
        );
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(5n);
    });

    it("Run mintAndTransfer = 5, burn = 7, by minter, ok", async () => {
      const minter = accounts[1];
      const minterAddress = await minter.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "/uri";
      const supply = 10n;
      const mint = 5n;
      const burn = 7n;

      // mint 5 to minter
      await token
        .connect(minter)
        .mintAndTransfer(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          minterAddress,
          mint,
        );
      expect(await token.balanceOf(minterAddress, tokenId)).to.equal(mint);

      // burn too much
      await expect(token.connect(minter).burn(minterAddress, tokenId, 500)).to.be.revertedWith(
        "ERC1155: burn amount exceeds balance",
      );
      expect(await token.balanceOf(minterAddress, tokenId)).to.equal(mint);

      // burn = 7 (5 Lazy, 2 minted)
      await token.connect(minter).burn(minterAddress, tokenId, burn);
      expect(await token.balanceOf(minterAddress, tokenId)).to.equal(3n);

      // mint 1, not possible, all Lazy already burned, throw
      await expect(
        token
          .connect(minter)
          .mintAndTransfer(
            { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
            minterAddress,
            1,
          ),
      ).to.be.revertedWith("more than supply");

      // burn 2 minted
      await token.connect(minter).burn(minterAddress, tokenId, 2);
      expect(await token.balanceOf(minterAddress, tokenId)).to.equal(1n);
    });

    it("Run mintAndTransfer = 5 minter, mintAndTransfer = 2 transferTo, burn = 7, by minter, ok", async () => {
      const minter = accounts[1];
      const transferTo = accounts[2];
      const minterAddress = await minter.getAddress();
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "/uri";
      const supply = 10n;
      const mint = 5n;
      const burn = 7n;

      // mint 5 to minter, 2 to another
      await token
        .connect(minter)
        .mintAndTransfer(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          minterAddress,
          mint,
        );
      await token
        .connect(minter)
        .mintAndTransfer(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          transferToAddress,
          2,
        );
      expect(await token.balanceOf(minterAddress, tokenId)).to.equal(mint);
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(2n);

      // burn = 7 (3 Lazy, 4 minted)
      await token.connect(minter).burn(minterAddress, tokenId, burn);
      expect(await token.balanceOf(minterAddress, tokenId)).to.equal(1n);
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(2n);

      // burn more than minted
      await expect(token.connect(transferTo).burn(transferToAddress, tokenId, 3)).to.be.revertedWith(
        "ERC1155: burn amount exceeds balance",
      );

      await token.connect(transferTo).burn(transferToAddress, tokenId, 2);
      expect(await token.balanceOf(minterAddress, tokenId)).to.equal(1n);
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(0n);
    });

    it("Run mintAndTransfer = 5, burn = 500, by minter not possible, throw", async () => {
      const minter = accounts[1];
      const transferTo = accounts[2];
      const minterAddress = await minter.getAddress();
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "/uri";
      const supply = 10n;
      const mint = 5n;

      await token
        .connect(minter)
        .mintAndTransfer(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          minterAddress,
          mint,
        );
      expect(await token.uri(tokenId)).to.equal("ipfs:/" + tokenURI);
      expect(await token.balanceOf(minterAddress, tokenId)).to.equal(mint);

      // burn too much
      await expect(token.connect(minter).burn(minterAddress, tokenId, 500)).to.be.revertedWith(
        "ERC1155: burn amount exceeds balance",
      );
      expect(await token.balanceOf(minterAddress, tokenId)).to.equal(mint);

      // from new owner amount burn == mint
      await token.connect(minter).burn(minterAddress, tokenId, mint);
      expect(await token.balanceOf(minterAddress, tokenId)).to.equal(5n);

      await expect(
        token
          .connect(minter)
          .mintAndTransfer(
            { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
            transferToAddress,
            1,
          ),
      ).to.be.revertedWith("more than supply");
    });
  });

  // ---------------------------------------------------------------------------
  // Mint and transfer tests
  // ---------------------------------------------------------------------------
  describe("Mint and transfer()", () => {
    it("check for ERC165 interface", async () => {
      expect(await token.supportsInterface("0x01ffc9a7")).to.be.true;
    });

    it("check for mintAndTransfer interface", async () => {
      expect(await token.supportsInterface("0x6db15a0f")).to.be.true;
    });

    it("check for RoyaltiesV2 interface", async () => {
      expect(await token.supportsInterface("0xcad96cca")).to.be.true;
    });

    it("check for ERC1155 interfaces", async () => {
      expect(await token.supportsInterface("0xd9b67a26")).to.be.true;
      expect(await token.supportsInterface("0x0e89341c")).to.be.true;
    });

    it("approve for all", async () => {
      const whiteListProxyAddress = await whiteListProxy.getAddress();
      const proxyLazyAddress = await proxyLazy.getAddress();

      expect(await token.isApprovedForAll(await accounts[1].getAddress(), whiteListProxyAddress)).to.be.true;
      expect(await token.isApprovedForAll(await accounts[1].getAddress(), proxyLazyAddress)).to.be.true;
    });

    it("mint and transfer by proxy", async () => {
      const minter = accounts[1];
      const transferTo = accounts[2];
      const minterAddress = await minter.getAddress();
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "//uri";
      const supply = 5n;
      const mint = 2n;

      const signature = await getSignature(tokenId, tokenURI, supply, creators([minterAddress]), [], minter);

      await token
        .connect(whiteListProxy)
        .mintAndTransfer(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [signature] },
          transferToAddress,
          mint,
        );

      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(mint);
    });

    it("mint and transfer by minter", async () => {
      const minter = accounts[1];
      const transferTo = accounts[2];
      const minterAddress = await minter.getAddress();
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "/uri";
      const supply = 5n;
      const mint = 2n;

      await token
        .connect(minter)
        .mintAndTransfer(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          transferToAddress,
          mint,
        );

      expect(await token.uri(tokenId)).to.equal("ipfs:/" + tokenURI);
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(mint);
      expect(await token.balanceOf(minterAddress, tokenId)).to.equal(0n);
    });

    it("mint and transfer by minter several creators", async () => {
      const minter = accounts[1];
      const creator2 = accounts[3];
      const transferTo = accounts[2];
      const minterAddress = await minter.getAddress();
      const creator2Address = await creator2.getAddress();
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "//uri";
      const supply = 5n;
      const mint = 2n;

      const signature2 = await getSignature(
        tokenId,
        tokenURI,
        supply,
        creators([minterAddress, creator2Address]),
        [],
        creator2,
      );

      await token.connect(minter).mintAndTransfer(
        {
          tokenId,
          tokenURI,
          supply,
          creators: creators([minterAddress, creator2Address]),
          royalties: [],
          signatures: [zeroWord, signature2],
        },
        transferToAddress,
        mint,
      );

      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(mint);
      await checkCreators(tokenId, [minterAddress, creator2Address]);
    });

    it("mint and transfer to self by minter", async () => {
      const minter = accounts[1];
      const minterAddress = await minter.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "//uri";
      const supply = 5n;
      const mint = 2n;

      await token
        .connect(minter)
        .mintAndTransfer(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          minterAddress,
          mint,
        );

      expect(await token.balanceOf(minterAddress, tokenId)).to.equal(mint);
      await checkCreators(tokenId, [minterAddress]);
    });

    it("transferFromOrMint by minter", async () => {
      const minter = accounts[1];
      const transferTo = accounts[2];
      const minterAddress = await minter.getAddress();
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "//uri";
      const supply = 5n;
      const mint = 2n;

      expect(await token.balanceOf(minterAddress, tokenId)).to.equal(0n);

      await token
        .connect(minter)
        .transferFromOrMint(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          minterAddress,
          transferToAddress,
          mint,
        );
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(mint);
      expect(await token.balanceOf(minterAddress, tokenId)).to.equal(0n);

      await token
        .connect(minter)
        .transferFromOrMint(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          minterAddress,
          transferToAddress,
          mint,
        );

      await expect(
        token
          .connect(minter)
          .transferFromOrMint(
            { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
            minterAddress,
            transferToAddress,
            mint,
          ),
      ).to.be.revertedWith("more than supply");

      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(mint * 2n);
      await checkCreators(tokenId, [minterAddress]);

      await expect(
        token
          .connect(minter)
          .transferFromOrMint(
            { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
            transferToAddress,
            minterAddress,
            1,
          ),
      ).to.be.revertedWith("ERC1155: caller is not owner nor approved");

      await token
        .connect(transferTo)
        .transferFromOrMint(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          transferToAddress,
          minterAddress,
          1,
        );
      expect(await token.balanceOf(minterAddress, tokenId)).to.equal(1n);
    });

    it("mint and transfer by approved proxy for all by minter", async () => {
      const minter = accounts[1];
      const transferTo = accounts[2];
      const minterAddress = await minter.getAddress();
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "//uri";
      const supply = 5n;
      const mint = 2n;

      const signature = await getSignature(tokenId, tokenURI, supply, creators([minterAddress]), [], minter);

      await token
        .connect(whiteListProxy)
        .mintAndTransfer(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [signature] },
          transferToAddress,
          mint,
        );

      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(mint);
    });

    it("second mint and transfer", async () => {
      const minter = accounts[1];
      const minterAddress = await minter.getAddress();
      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "//uri";
      const supply = 5n;

      const transferTo = accounts[2];
      const transferToAddress = await transferTo.getAddress();
      const mint = 2n;

      const signature = await getSignature(tokenId, tokenURI, supply, creators([minterAddress]), [], minter);
      await token
        .connect(whiteListProxy)
        .mintAndTransfer(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [signature] },
          transferToAddress,
          mint,
        );
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(mint);

      // no signature needed, uri, fees not checked
      const transferTo2 = accounts[3];
      const transferTo2Address = await transferTo2.getAddress();
      const mint2 = 3n;
      await token.connect(whiteListProxy).mintAndTransfer(
        {
          tokenId,
          tokenURI: "any, idle",
          supply,
          creators: creators([minterAddress]),
          royalties: [],
          signatures: [zeroWord],
        },
        transferTo2Address,
        mint2,
      );
      expect(await token.balanceOf(transferTo2Address, tokenId)).to.equal(mint2);
    });

    it("second mint and transfer for the same person", async () => {
      const minter = accounts[1];
      const minterAddress = await minter.getAddress();
      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "//uri";
      const supply = 5n;

      const transferTo = accounts[2];
      const transferToAddress = await transferTo.getAddress();
      const mint = 1n;

      const signature = await getSignature(tokenId, tokenURI, supply, creators([minterAddress]), [], minter);
      await token
        .connect(whiteListProxy)
        .mintAndTransfer(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [signature] },
          transferToAddress,
          mint,
        );
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(mint);

      // no signature needed, uri not checked
      const mint2 = 2n;
      await token.connect(whiteListProxy).mintAndTransfer(
        {
          tokenId,
          tokenURI: "any, idle",
          supply,
          creators: creators([minterAddress]),
          royalties: [],
          signatures: [zeroWord],
        },
        transferToAddress,
        mint2,
      );
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(3n);
    });

    it("second mint and transfer: wrong supply", async () => {
      const minter = accounts[1];
      const minterAddress = await minter.getAddress();
      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "//uri";
      const supply = 5n;

      const transferTo = accounts[2];
      const transferToAddress = await transferTo.getAddress();
      const mint = 2n;

      const signature = await getSignature(tokenId, tokenURI, supply, creators([minterAddress]), [], minter);
      await token
        .connect(whiteListProxy)
        .mintAndTransfer(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [signature] },
          transferToAddress,
          mint,
        );
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(mint);

      // no signature needed, uri not checked
      const transferTo2 = accounts[3];
      const transferTo2Address = await transferTo2.getAddress();
      await expect(
        token.connect(whiteListProxy).mintAndTransfer(
          {
            tokenId,
            tokenURI: "any, idle",
            supply: 10n,
            creators: creators([minterAddress]),
            royalties: [],
            signatures: [zeroWord],
          },
          transferTo2Address,
          4,
        ),
      ).to.be.revertedWith("more than supply");

      await token.connect(whiteListProxy).mintAndTransfer(
        {
          tokenId,
          tokenURI: "any, idle",
          supply: 10n,
          creators: creators([minterAddress]),
          royalties: [],
          signatures: [zeroWord],
        },
        transferTo2Address,
        3,
      );
    });

    it("second mint and transfer: more than supply", async () => {
      const minter = accounts[1];
      const minterAddress = await minter.getAddress();
      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "//uri";
      const supply = 5n;

      const transferTo = accounts[2];
      const transferToAddress = await transferTo.getAddress();
      const mint = 2n;

      const signature = await getSignature(tokenId, tokenURI, supply, creators([minterAddress]), [], minter);
      await token
        .connect(whiteListProxy)
        .mintAndTransfer(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [signature] },
          transferToAddress,
          mint,
        );
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(mint);

      // no signature needed, uri not checked
      const transferTo2 = accounts[3];
      const transferTo2Address = await transferTo2.getAddress();
      const mint2 = 4n;
      await expect(
        token.connect(whiteListProxy).mintAndTransfer(
          {
            tokenId,
            tokenURI: "any, idle",
            supply,
            creators: creators([minterAddress]),
            royalties: [],
            signatures: [zeroWord],
          },
          transferTo2Address,
          mint2,
        ),
      ).to.be.revertedWith("more than supply");
    });

    it("mint and transfer with signature of not minter", async () => {
      const minter = accounts[1];
      const transferTo = accounts[2];
      const minterAddress = await minter.getAddress();
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "//uri";
      const supply = 5n;
      const mint = 2n;

      const signature = await getSignature(tokenId, tokenURI, supply, creators([minterAddress]), [], transferTo);

      await expect(
        token
          .connect(whiteListProxy)
          .mintAndTransfer(
            { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [signature] },
            transferToAddress,
            mint,
          ),
      ).to.be.revertedWith("signature verification error");
    });

    it("mint and transfer without approval", async () => {
      const minter = accounts[1];
      const transferTo = accounts[2];
      const minterAddress = await minter.getAddress();
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "//uri";
      const supply = 5n;
      const mint = 2n;

      const signature = await getSignature(tokenId, tokenURI, supply, creators([minterAddress]), [], minter);

      await expect(
        token
          .connect(accounts[3])
          .mintAndTransfer(
            { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [signature] },
            transferToAddress,
            mint,
          ),
      ).to.be.revertedWith("ERC1155: transfer caller is not approved");
    });

    it("standard transfer from owner", async () => {
      const minter = accounts[1];
      const minterAddress = await minter.getAddress();
      const tokenId = minterAddress + "b00000000000000000000001";
      const supply = 5n;

      await token.connect(minter).mintAndTransfer(
        {
          tokenId,
          tokenURI: "//uri",
          supply,
          creators: creators([minterAddress]),
          royalties: [],
          signatures: [zeroWord],
        },
        minterAddress,
        supply,
      );

      expect(await token.balanceOf(minterAddress, tokenId)).to.equal(supply);

      const transferTo = accounts[2];
      const transferToAddress = await transferTo.getAddress();
      await token.connect(minter).safeTransferFrom(minterAddress, transferToAddress, tokenId, supply, "0x");

      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(supply);
    });

    it("standard transfer by approved contract", async () => {
      const minter = accounts[1];
      const minterAddress = await minter.getAddress();
      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "//uri";
      const supply = 5n;

      await token
        .connect(minter)
        .mintAndTransfer(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          minterAddress,
          supply,
        );

      expect(await token.balanceOf(minterAddress, tokenId)).to.equal(supply);

      const transferTo = accounts[2];
      const transferToAddress = await transferTo.getAddress();
      await token.connect(whiteListProxy).safeTransferFrom(minterAddress, transferToAddress, tokenId, supply, "0x");

      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(supply);
    });

    it("standard transfer by not approved contract", async () => {
      const minter = accounts[1];
      const minterAddress = await minter.getAddress();
      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "//uri";
      const supply = 5n;

      await token
        .connect(minter)
        .mintAndTransfer(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          minterAddress,
          supply,
        );

      expect(await token.balanceOf(minterAddress, tokenId)).to.equal(supply);

      const transferTo = accounts[2];
      const transferToAddress = await transferTo.getAddress();
      await expect(
        token.connect(accounts[6]).safeTransferFrom(minterAddress, transferToAddress, tokenId, supply, "0x"),
      ).to.be.revertedWith("ERC1155: caller is not owner nor approved");
    });

    it("signature by contract wallet erc1271, with whitelist proxy", async () => {
      const minter = erc1271;
      const minterAddress = await minter.getAddress();
      const transferTo = accounts[2];
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "//uri";
      const supply = 5n;
      const mint = 2n;

      await expect(
        token
          .connect(whiteListProxy)
          .mintAndTransfer(
            { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
            transferToAddress,
            supply,
          ),
      ).to.be.revertedWith("signature verification error");

      await erc1271.setReturnSuccessfulValidSignature(true);
      await token
        .connect(whiteListProxy)
        .mintAndTransfer(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          transferToAddress,
          mint,
        );
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(mint);
    });
  });

  // ---------------------------------------------------------------------------
  // Factory tests
  // ---------------------------------------------------------------------------
  describe("Factory", () => {
    let factory: ERC1155RaribleFactoryC2;
    let beacon: UpgradeableBeacon;
    let transferProxy: TransferProxyTest;

    before(async () => {
      transferProxy = await new TransferProxyTest__factory(deployer).deploy();
      await transferProxy.waitForDeployment();

      // Deploy implementation
      const impl = await new ERC1155Rarible__factory(deployer).deploy();
      await impl.waitForDeployment();

      // Deploy beacon
      beacon = await new UpgradeableBeacon__factory(deployer).deploy(
        await impl.getAddress(),
        await deployer.getAddress(),
      );
      await beacon.waitForDeployment();

      // Deploy factory
      factory = await new ERC1155RaribleFactoryC2__factory(deployer).deploy(
        await beacon.getAddress(),
        await transferProxy.getAddress(),
        await proxyLazy.getAddress(),
      );
      await factory.waitForDeployment();
    });

    it("mint and transfer by minter, token create by Factory", async () => {
      const salt = 3n;
      let proxyAddress: string | undefined;

      const addressBeforeDeploy = await factory["getAddress(string,string,string,string,uint256)"](
        name,
        "TSA",
        "ipfs:/",
        "ipfs:/",
        salt,
      );

      const addfressWithDifferentSalt = await factory["getAddress(string,string,string,string,uint256)"](
        name,
        "TSA",
        "ipfs:/",
        "ipfs:/",
        salt + 1n,
      );

      const addressWithDifferentData = await factory["getAddress(string,string,string,string,uint256)"](
        name,
        "TST",
        "ipfs:/",
        "ipfs:/",
        salt,
      );

      expect(addressBeforeDeploy).to.not.equal(addfressWithDifferentSalt);
      expect(addressBeforeDeploy).to.not.equal(addressWithDifferentData);

      const tx = await factory
        .connect(tokenOwner)
        ["createToken(string,string,string,string,uint256)"](name, "TSA", "ipfs:/", "ipfs:/", salt);
      const receipt = await tx.wait();

      for (const log of receipt?.logs ?? []) {
        try {
          const parsed = factory.interface.parseLog(log);
          if (parsed?.name === "Create1155RaribleProxy") {
            proxyAddress = parsed.args.proxy as string;
            break;
          }
        } catch {
          // ignore
        }
      }

      if (!proxyAddress) {
        throw new Error("Create1155RaribleProxy event not found");
      }

      expect(proxyAddress).to.equal(addressBeforeDeploy);

      const tokenByProxy = ERC1155Rarible__factory.connect(proxyAddress, deployer);

      const minter = tokenOwner;
      const minterAddress = await minter.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "/uri";
      const supply = 5n;
      const mint = 2n;

      await tokenByProxy
        .connect(minter)
        .mintAndTransfer(
          { tokenId, tokenURI, supply, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          minterAddress,
          mint,
        );

      expect(await tokenByProxy.uri(tokenId)).to.equal("ipfs:/" + tokenURI);
      expect(await tokenByProxy.balanceOf(minterAddress, tokenId)).to.equal(mint);
    });

    it("checkPrefix should work correctly, checks for duplicating of the base part of the uri", async () => {
      const baseURI = "https://ipfs.rarible.com";
      let proxyAddress: string | undefined;

      const tx = await factory
        .connect(tokenOwner)
        ["createToken(string,string,string,string,uint256)"]("name", "RARI", baseURI, "https://ipfs.rarible.com", 1);
      const receipt = await tx.wait();

      for (const log of receipt?.logs ?? []) {
        try {
          const parsed = factory.interface.parseLog(log);
          if (parsed?.name === "Create1155RaribleProxy") {
            proxyAddress = parsed.args.proxy as string;
            break;
          }
        } catch {
          // ignore
        }
      }

      if (!proxyAddress) {
        throw new Error("Create1155RaribleProxy event not found");
      }

      const tokenByProxy = ERC1155Rarible__factory.connect(proxyAddress, deployer);

      const minter = tokenOwner;
      const minterAddress = await minter.getAddress();
      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = baseURI + "/12345/456";

      await tokenByProxy
        .connect(minter)
        .mintAndTransfer(
          { tokenId, tokenURI, supply: 5n, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          minterAddress,
          5,
        );
      const gettokeURI = await tokenByProxy.uri(tokenId);
      expect(gettokeURI).to.equal(tokenURI);

      const tokenId1 = minterAddress + "b00000000000000000000002";
      const tokenURI1 = "/12345/123512512/12312312";
      await tokenByProxy.connect(minter).mintAndTransfer(
        {
          tokenId: tokenId1,
          tokenURI: tokenURI1,
          supply: 5n,
          creators: creators([minterAddress]),
          royalties: [],
          signatures: [zeroWord],
        },
        minterAddress,
        5,
      );
      const gettokeURI1 = await tokenByProxy.uri(tokenId1);
      expect(gettokeURI1).to.equal(baseURI + tokenURI1);

      const tokenId2 = minterAddress + "b00000000000000000000003";
      const tokenURI2 = "/12345/";
      await tokenByProxy.connect(minter).mintAndTransfer(
        {
          tokenId: tokenId2,
          tokenURI: tokenURI2,
          supply: 5n,
          creators: creators([minterAddress]),
          royalties: [],
          signatures: [zeroWord],
        },
        minterAddress,
        5,
      );
      const gettokeURI2 = await tokenByProxy.uri(tokenId2);
      expect(gettokeURI2).to.equal(baseURI + tokenURI2);
    });
  });
});
