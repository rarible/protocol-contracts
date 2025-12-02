// <ai_context> TypeScript port of AssetMatcher.test.js. Tests AssetMatcher functionality including asset type matching for ETH, ERC20, ERC721, ERC1155, CRYPTO_PUNKS, custom matchers, and generic asset types. </ai_context>
import { expect } from "chai";
import { network } from "hardhat";
import type * as ethersTypes from "ethers";

const connection = await network.connect();
const { ethers } = connection;

import {
  type AssetMatcherTest,
  AssetMatcherTest__factory,
  type TestAssetMatcher,
  TestAssetMatcher__factory,
} from "../types/ethers-contracts";
import { deployTransparentProxy } from "@rarible/common-sdk/src/deploy";
import { AssetType } from "@rarible/common-sdk/src/order";
import { enc, ETH, ERC20, ERC721, ERC1155, CRYPTO_PUNKS, id } from "@rarible/common-sdk/src/assets";

// -----------------------------------------------------------------------------
// Main Test Suite
// -----------------------------------------------------------------------------
describe("AssetMatcher", function () {
  let testing: AssetMatcherTest;
  let accounts: ethersTypes.Signer[];
  let deployer: ethersTypes.Signer;

  before(async () => {
    accounts = await ethers.getSigners();
    [deployer] = accounts;

    // Deploy AssetMatcherTest via transparent proxy
    const { instance } = await deployTransparentProxy<AssetMatcherTest>(ethers, {
      contractName: "AssetMatcherTest",
      initFunction: "__AssetMatcherTest_init",
      initArgs: [await deployer.getAddress()],
      proxyOwner: await deployer.getAddress(),
    });
    testing = instance;
  });

  // ---------------------------------------------------------------------------
  // setAssetMatcher tests
  // ---------------------------------------------------------------------------
  describe("setAssetMatcher", () => {
    it("setAssetMatcher works", async () => {
      const account5Address = await accounts[5].getAddress();
      const encoded = enc(account5Address);

      // Should revert when no matcher is set for unknown asset class
      await expect(
        testing.matchAssetsTest(AssetType(ERC20, encoded), AssetType(id("BLA"), encoded)),
      ).to.be.revertedWith("not found IAssetMatcher");

      // Deploy TestAssetMatcher and set it
      const testMatcher = await new TestAssetMatcher__factory(deployer).deploy();
      await testMatcher.waitForDeployment();

      await testing.setAssetMatcher(id("BLA"), await testMatcher.getAddress());

      const result = await testing.matchAssetsTest(AssetType(ERC20, encoded), AssetType(id("BLA"), encoded));

      expect(result[0]).to.equal(ERC20);
      expect(result[1]).to.equal(encoded);
    });
  });

  // ---------------------------------------------------------------------------
  // ETH tests
  // ---------------------------------------------------------------------------
  describe("ETH", () => {
    it("should extract ETH type if both are ETHs", async () => {
      const result = await testing.matchAssetsTest(AssetType(ETH, "0x"), AssetType(ETH, "0x"));
      expect(result[0]).to.equal(ETH);
    });

    it("should extract nothing if one is not ETH", async () => {
      const result = await testing.matchAssetsTest(AssetType(ETH, "0x"), AssetType(ERC20, "0x"));
      expect(result[0]).to.equal(0);
    });
  });

  // ---------------------------------------------------------------------------
  // CRYPTO_PUNKS tests
  // ---------------------------------------------------------------------------
  describe("CRYPTO_PUNKS", () => {
    it("Punk Id = 3000 <-> Punk Id = 3000 matches!", async () => {
      const tokenId = 3000;
      const account5Address = await accounts[5].getAddress();
      const encodedPunk1 = enc(account5Address, tokenId);
      const encodedPunk2 = enc(account5Address, tokenId);

      const result = await testing.matchAssetsTest(
        AssetType(CRYPTO_PUNKS, encodedPunk1),
        AssetType(CRYPTO_PUNKS, encodedPunk2),
      );

      expect(result[0]).to.equal(CRYPTO_PUNKS);
      expect(result[1]).to.equal(encodedPunk1);
    });

    it("Punk Id = 3000 <-> Punk Id = 3001 don`t matches!", async () => {
      const tokenId1 = 3000;
      const tokenId2 = 3001;
      const account5Address = await accounts[5].getAddress();
      const encodedPunk1 = enc(account5Address, tokenId1);
      const encodedPunk2 = enc(account5Address, tokenId2);

      const result = await testing.matchAssetsTest(
        AssetType(CRYPTO_PUNKS, encodedPunk1),
        AssetType(CRYPTO_PUNKS, encodedPunk2),
      );

      expect(result[0]).to.equal(0);
    });

    it("Punk Id = 3000 <-> Punk Id = 3000, but different collections don`t matches!", async () => {
      const tokenId1 = 3000;
      const tokenId2 = 3000;
      const account5Address = await accounts[5].getAddress();
      const account6Address = await accounts[6].getAddress();
      const encodedPunk1 = enc(account5Address, tokenId1);
      const encodedPunk2 = enc(account6Address, tokenId2);

      const result = await testing.matchAssetsTest(
        AssetType(CRYPTO_PUNKS, encodedPunk1),
        AssetType(CRYPTO_PUNKS, encodedPunk2),
      );

      expect(result[0]).to.equal(0);
    });
  });

  // ---------------------------------------------------------------------------
  // ERC20 tests
  // ---------------------------------------------------------------------------
  describe("ERC20", () => {
    it("should extract ERC20 type if both are and addresses equal", async () => {
      const account5Address = await accounts[5].getAddress();
      const encoded = enc(account5Address);

      const result = await testing.matchAssetsTest(AssetType(ERC20, encoded), AssetType(ERC20, encoded));

      expect(result[0]).to.equal(ERC20);
      expect(result[1]).to.equal(encoded);
    });

    it("should extract nothing if erc20 don't match", async () => {
      const account1Address = await accounts[1].getAddress();
      const account2Address = await accounts[2].getAddress();

      const result = await testing.matchAssetsTest(
        AssetType(ERC20, enc(account1Address)),
        AssetType(ERC20, enc(account2Address)),
      );

      expect(result[0]).to.equal(0);
    });

    it("should extract nothing if other type is not ERC20", async () => {
      const account1Address = await accounts[1].getAddress();

      const result = await testing.matchAssetsTest(AssetType(ERC20, enc(account1Address)), AssetType(ETH, "0x"));

      expect(result[0]).to.equal(0);
    });
  });

  // ---------------------------------------------------------------------------
  // ERC721 tests
  // ---------------------------------------------------------------------------
  describe("ERC721", () => {
    it("should extract ERC721 type if both are equal", async () => {
      const account5Address = await accounts[5].getAddress();
      const encoded = enc(account5Address, 100);

      const result = await testing.matchAssetsTest(AssetType(ERC721, encoded), AssetType(ERC721, encoded));

      expect(result[0]).to.equal(ERC721);
      expect(result[1]).to.equal(encoded);
    });

    it("should extract nothing if tokenIds don't match", async () => {
      const account5Address = await accounts[5].getAddress();

      const result = await testing.matchAssetsTest(
        AssetType(ERC721, enc(account5Address, 100)),
        AssetType(ERC721, enc(account5Address, 101)),
      );

      expect(result[0]).to.equal(0);
    });

    it("should extract nothing if addresses don't match", async () => {
      const account4Address = await accounts[4].getAddress();
      const account5Address = await accounts[5].getAddress();

      const result = await testing.matchAssetsTest(
        AssetType(ERC721, enc(account4Address, 100)),
        AssetType(ERC721, enc(account5Address, 100)),
      );

      expect(result[0]).to.equal(0);
    });

    it("should extract nothing if other type is not ERC721", async () => {
      const account5Address = await accounts[5].getAddress();

      const result = await testing.matchAssetsTest(
        AssetType(ERC721, enc(account5Address, 100)),
        AssetType(ETH, "0x"),
      );

      expect(result[0]).to.equal(0);
    });
  });

  // ---------------------------------------------------------------------------
  // ERC1155 tests
  // ---------------------------------------------------------------------------
  describe("ERC1155", () => {
    it("should extract ERC1155 type if both are equal", async () => {
      const account5Address = await accounts[5].getAddress();
      const encoded = enc(account5Address, 100);

      const result = await testing.matchAssetsTest(AssetType(ERC1155, encoded), AssetType(ERC1155, encoded));

      expect(result[0]).to.equal(ERC1155);
      expect(result[1]).to.equal(encoded);
    });

    it("should extract nothing if tokenIds don't match", async () => {
      const account5Address = await accounts[5].getAddress();

      const result = await testing.matchAssetsTest(
        AssetType(ERC1155, enc(account5Address, 100)),
        AssetType(ERC1155, enc(account5Address, 101)),
      );

      expect(result[0]).to.equal(0);
    });

    it("should extract nothing if addresses don't match", async () => {
      const account4Address = await accounts[4].getAddress();
      const account5Address = await accounts[5].getAddress();

      const result = await testing.matchAssetsTest(
        AssetType(ERC1155, enc(account4Address, 100)),
        AssetType(ERC1155, enc(account5Address, 100)),
      );

      expect(result[0]).to.equal(0);
    });

    it("should extract nothing if other type is not erc1155", async () => {
      const account5Address = await accounts[5].getAddress();
      const encoded = enc(account5Address, 100);

      const result = await testing.matchAssetsTest(AssetType(ERC1155, encoded), AssetType(ERC721, encoded));

      expect(result[0]).to.equal(0);
    });
  });

  // ---------------------------------------------------------------------------
  // generic tests
  // ---------------------------------------------------------------------------
  describe("generic", () => {
    it("should extract left type if asset types are equal", async () => {
      const result = await testing.matchAssetsTest(
        AssetType("0x00112233", "0x1122"),
        AssetType("0x00112233", "0x1122"),
      );

      expect(result[0]).to.equal("0x00112233");
      expect(result[1]).to.equal("0x1122");
    });

    it("should extract nothing if single byte differs", async () => {
      const result = await testing.matchAssetsTest(
        AssetType("0x00112233", "0x1122"),
        AssetType("0x00112233", "0x1111"),
      );

      expect(result[0]).to.equal(0);
    });
  });
});