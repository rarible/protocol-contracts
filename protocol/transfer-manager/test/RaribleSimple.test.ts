// protocol/transfer-manager/test/RaribleSimple.test.ts
import { expect } from "chai";
import { network } from "hardhat";

const connection = await network.connect();
const { ethers } = connection;

import type * as ethersTypes from "ethers";
import {
  type RaribleSimpleTest,
  RaribleSimpleTest__factory,
} from "../types/ethers-contracts";
import { AssetType } from "../src/order";
import { id } from "../src/assets";

describe("RaribleSimpleTest", function () {
  let testing: RaribleSimpleTest;
  let accounts: ethersTypes.Signer[];

  before(async function () {
    accounts = await ethers.getSigners();
    const [deployer] = accounts;
    testing = await new RaribleSimpleTest__factory(deployer).deploy();
    await testing.waitForDeployment();
  });

  describe("Check royalties()", function () {
    it("get royalties ERC1155Lazy", async function () {
      const a1 = await accounts[1].getAddress();
      const a3 = await accounts[3].getAddress();
      const a4 = await accounts[4].getAddress();
      const a5 = await accounts[5].getAddress();

      const creators = [
        { account: a1, value: 0n },
        { account: a3, value: 0n },
      ];
      const royaltiesStruct = [
        { account: a4, value: 100n },
        { account: a5, value: 200n },
      ];
      const signatures: string[] = [];

      const data1155 = {
        tokenId: 1n,
        tokenURI: "uri",
        supply: 10n,
        creators,
        royalties: royaltiesStruct,
        signatures,
      };

      const encodedMintData = await testing.encode1155(data1155);

      const assetType = AssetType(id("ERC1155_LAZY"), encodedMintData);
      const royalties = await testing.getRoyaltiesByAssetTest.staticCall(assetType);

      expect(royalties.length).to.equal(2);
      expect(royalties[0].value).to.equal(100n);
      expect(royalties[0].account).to.equal(a4);
      expect(royalties[1].value).to.equal(200n);
      expect(royalties[1].account).to.equal(a5);
    });

    it("get royalties ERC721Lazy", async function () {
      const a1 = await accounts[1].getAddress();
      const a3 = await accounts[3].getAddress();
      const a4 = await accounts[4].getAddress();
      const a5 = await accounts[5].getAddress();

      const creators = [
        { account: a1, value: 0n },
        { account: a3, value: 0n },
      ];
      const royaltiesStruct = [
        { account: a4, value: 300n },
        { account: a5, value: 400n },
      ];
      const signatures: string[] = [];

      const data721 = {
        tokenId: 1n,
        tokenURI: "uri",
        creators,
        royalties: royaltiesStruct,
        signatures,
      };

      const encodedMintData = await testing.encode721(data721);

      const assetType = AssetType(id("ERC721_LAZY"), encodedMintData);
      const royalties = await testing.getRoyaltiesByAssetTest.staticCall(assetType);

      expect(royalties.length).to.equal(2);
      expect(royalties[0].value).to.equal(300n);
      expect(royalties[0].account).to.equal(a4);
      expect(royalties[1].value).to.equal(400n);
      expect(royalties[1].account).to.equal(a5);
    });

    it("wrong type -> empty royalties", async function () {
      const a1 = await accounts[1].getAddress();
      const a3 = await accounts[3].getAddress();
      const a4 = await accounts[4].getAddress();
      const a5 = await accounts[5].getAddress();

      const creators = [
        { account: a1, value: 0n },
        { account: a3, value: 0n },
      ];
      const royaltiesStruct = [
        { account: a4, value: 300n },
        { account: a5, value: 400n },
      ];
      const signatures: string[] = [];

      const data721 = {
        tokenId: 1n,
        tokenURI: "uri",
        creators,
        royalties: royaltiesStruct,
        signatures,
      };

      const encodedMintData = await testing.encode721(data721);

      const assetType = AssetType(id("ERC721_LAZY_WRONG_TYPE"), encodedMintData);
      const royalties = await testing.getRoyaltiesByAssetTest.staticCall(assetType);

      expect(royalties.length).to.equal(0);
    });
  });
});
