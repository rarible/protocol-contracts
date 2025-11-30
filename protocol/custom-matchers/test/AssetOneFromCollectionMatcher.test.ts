// <ai_context> Hardhat + Ethers v6 test suite for AssetMatcherCollection. Migrated from the original Truffle JS tests to TypeScript, reusing the same asset and order helpers as scripts/order.js and scripts/assets.js but implemented in src. Verifies matching behavior between COLLECTION and ERC721/1155 (including lazy variants) and non-matching cases.</ai_context>

import { expect } from "chai";
import { network } from "hardhat";

const connection = await network.connect();
const { ethers } = connection;

import type * as ethersTypes from "ethers";
import type { AssetMatcherCollection } from "../types/ethers-contracts";
import { AssetType } from "@rarible/common-sdk/src/order";
import {
  enc,
  ETH,
  ERC20,
  ERC721,
  ERC721_LAZY,
  ERC1155,
  ERC1155_LAZY,
  COLLECTION,
} from "@rarible/common-sdk/src/assets";

describe("AssetMatcherCustom", function () {
  let assetMatcherCollection: AssetMatcherCollection;
  let accounts: ethersTypes.Signer[];
  let operator: ethersTypes.Signer;

  const ZERO_ASSET_CLASS = "0x00000000";

  before(async function () {
    accounts = await ethers.getSigners();
    operator = accounts[3];

    const deployed = await ethers.deployContract("AssetMatcherCollection");
    await deployed.waitForDeployment();
    assetMatcherCollection = deployed as unknown as AssetMatcherCollection;
  });

  describe("Check match by customMatcher Match one from Collection", function () {
    it("Collection COLLECTION &lt;-&gt; ERC1155  matches!", async function () {
      const tokenId = 3000n;
      const collectionAddress = await accounts[5].getAddress();

      const encoded = enc(collectionAddress);
      const encodedNFT = enc(collectionAddress, tokenId);

      const result = await assetMatcherCollection
        .connect(operator)
        .matchAssets(AssetType(COLLECTION, encoded), AssetType(ERC1155, encodedNFT));

      expect(result.assetClass).to.equal(ERC1155);
      expect(result.data).to.equal(encodedNFT);
    });

    it("Collection COLLECTION &lt;-&gt; ERC1155_LAZY  matches!", async function () {
      const tokenId = 3000n;
      const collectionAddress = await accounts[5].getAddress();

      const encoded = enc(collectionAddress);
      const encodedNFT = enc(collectionAddress, tokenId);

      const result = await assetMatcherCollection
        .connect(operator)
        .matchAssets(AssetType(COLLECTION, encoded), AssetType(ERC1155_LAZY, encodedNFT));

      expect(result.assetClass).to.equal(ERC1155_LAZY);
      expect(result.data).to.equal(encodedNFT);
    });

    it("Collection COLLECTION &lt;-&gt; ERC721  matches!", async function () {
      const tokenId = 3000n;
      const collectionAddress = await accounts[5].getAddress();

      const encoded = enc(collectionAddress);
      const encodedNFT = enc(collectionAddress, tokenId);

      const result = await assetMatcherCollection
        .connect(operator)
        .matchAssets(AssetType(COLLECTION, encoded), AssetType(ERC721, encodedNFT));

      expect(result.assetClass).to.equal(ERC721);
      expect(result.data).to.equal(encodedNFT);
    });

    it("Collection COLLECTION &lt;-&gt; ERC721_LAZY  matches!", async function () {
      const tokenId = 3000n;
      const collectionAddress = await accounts[5].getAddress();

      const encoded = enc(collectionAddress);
      const encodedNFT = enc(collectionAddress, tokenId);

      const result = await assetMatcherCollection
        .connect(operator)
        .matchAssets(AssetType(COLLECTION, encoded), AssetType(ERC721_LAZY, encodedNFT));

      expect(result.assetClass).to.equal(ERC721_LAZY);
      expect(result.data).to.equal(encodedNFT);
    });

    it("Collection COLLECTION &lt;-&gt; ERC1155 (another collection) don`t match!", async function () {
      const tokenId = 3000n;
      const collectionAddress = await accounts[5].getAddress();
      const anotherCollection = await accounts[6].getAddress();

      const encoded = enc(collectionAddress);
      const encodedNFT = enc(anotherCollection, tokenId);

      const result = await assetMatcherCollection
        .connect(operator)
        .matchAssets(AssetType(COLLECTION, encoded), AssetType(ERC1155, encodedNFT));

      expect(result.assetClass).to.equal(ZERO_ASSET_CLASS);
    });

    it("Collection COLLECTION &lt;-&gt; ERC721 (another collection) don`t match!", async function () {
      const tokenId = 3000n;
      const collectionAddress = await accounts[5].getAddress();
      const anotherCollection = await accounts[6].getAddress();

      const encoded = enc(collectionAddress);
      const encodedNFT = enc(anotherCollection, tokenId);

      const result = await assetMatcherCollection
        .connect(operator)
        .matchAssets(AssetType(COLLECTION, encoded), AssetType(ERC721, encodedNFT));

      expect(result.assetClass).to.equal(ZERO_ASSET_CLASS);
    });

    it("Collection COLLECTION &lt;-&gt; ERC20  don`t match", async function () {
      const collectionAddress = await accounts[5].getAddress();
      const tokenAddress = await accounts[5].getAddress();

      const encoded = enc(collectionAddress);
      const encodedERC20 = enc(tokenAddress);

      const result = await assetMatcherCollection
        .connect(operator)
        .matchAssets(AssetType(COLLECTION, encoded), AssetType(ERC20, encodedERC20));

      expect(result.assetClass).to.equal(ZERO_ASSET_CLASS);
    });

    it("Collection COLLECTION &lt;-&gt; COLLECTION  don`t match", async function () {
      const collectionAddress = await accounts[5].getAddress();
      const anotherCollection = await accounts[5].getAddress();

      const encoded = enc(collectionAddress);
      const encodedCollection = enc(anotherCollection);

      const result = await assetMatcherCollection
        .connect(operator)
        .matchAssets(AssetType(COLLECTION, encoded), AssetType(COLLECTION, encodedCollection));

      expect(result.assetClass).to.equal(ZERO_ASSET_CLASS);
    });

    it("Collection COLLECTION &lt;-&gt; ETH  don`t match", async function () {
      const collectionAddress = await accounts[5].getAddress();
      const receiver = await accounts[5].getAddress();

      const encoded = enc(collectionAddress);
      const encodedETH = enc(receiver);

      const result = await assetMatcherCollection
        .connect(operator)
        .matchAssets(AssetType(COLLECTION, encoded), AssetType(ETH, encodedETH));

      expect(result.assetClass).to.equal(ZERO_ASSET_CLASS);
    });
  });
});
