// <ai_context> Hardhat + Ethers v6 test suite for lazy mint transfer proxies (ERC721LazyMintTransferProxy, ERC1155LazyMintTransferProxy). Migrated from the original Truffle JS tests to TypeScript, using upgradeable proxies and the same asset/order encoding logic as scripts/assets.js.</ai_context>

import { expect } from "chai";
import { network } from "hardhat";

const connection = await network.connect();
const { ethers } = connection;

import type * as ethersTypes from "ethers";
import {
  type ERC721LazyMintTest,
  ERC721LazyMintTest__factory,
  type ERC1155LazyMintTest,
  ERC1155LazyMintTest__factory,
  type ERC721LazyMintTransferProxy,
  ERC721LazyMintTransferProxy__factory,
  type ERC1155LazyMintTransferProxy,
  ERC1155LazyMintTransferProxy__factory,
} from "./types/ethers-contracts";
import { deployTransparentProxy } from "@rarible/test/src/index.js";
import { Asset } from "../src/order.js";
import { id } from "../src/assets.js";

describe("Exchange with LazyMint proxies", function () {
  let erc721Test: ERC721LazyMintTest;
  let erc1155Test: ERC1155LazyMintTest;
  let erc721Proxy: ERC721LazyMintTransferProxy;
  let erc1155Proxy: ERC1155LazyMintTransferProxy;
  let accounts: ethersTypes.Signer[];
  let deployer: ethersTypes.Signer;

  const ERC721_LAZY = id("ERC721_LAZY");
  const ERC1155_LAZY = id("ERC1155_LAZY");

  before(async function () {
    accounts = await ethers.getSigners();
    [deployer] = accounts;
  });

  beforeEach(async function () {
    const deployerAddress = await deployer.getAddress();

    // Deploy ERC721LazyMintTest behind Transparent proxy and init
    {
      const { instance } = await deployTransparentProxy<ERC721LazyMintTest>(ethers, {
        contractName: "ERC721LazyMintTest",
        initFunction: "__ERC721LazyMintTest_init",
        proxyOwner: deployerAddress,
      });
      erc721Test = instance;
    }

    // Deploy ERC1155LazyMintTest behind Transparent proxy and init
    {
      const { instance } = await deployTransparentProxy<ERC1155LazyMintTest>(ethers, {
        contractName: "ERC1155LazyMintTest",
        initFunction: "__ERC1155LazyMintTest_init",
        proxyOwner: deployerAddress,
      });
      erc1155Test = instance;
    }

    // Deploy ERC721LazyMintTransferProxy behind Transparent proxy and init with owner
    {
      const { instance } = await deployTransparentProxy<ERC721LazyMintTransferProxy>(ethers, {
        contractName: "ERC721LazyMintTransferProxy",
        initFunction: "__ERC721LazyMintTransferProxy_init",
        initArgs: [deployerAddress],
        proxyOwner: deployerAddress,
      });
      erc721Proxy = instance;
      await erc721Proxy.addOperator(deployerAddress);
    }

    // Deploy ERC1155LazyMintTransferProxy behind Transparent proxy and init with owner
    {
      const { instance } = await deployTransparentProxy<ERC1155LazyMintTransferProxy>(ethers, {
        contractName: "ERC1155LazyMintTransferProxy",
        initFunction: "__ERC1155LazyMintTransferProxy_init",
        initArgs: [deployerAddress],
        proxyOwner: deployerAddress,
      });
      erc1155Proxy = instance;
      await erc1155Proxy.addOperator(deployerAddress);
    }
  });

  it("lazy mint proxyTransfer works for ERC-721", async function () {
    const operator = deployer;
    const from = await accounts[1].getAddress();
    const to = await accounts[2].getAddress();
    const tokenId = 1n;

    const creators = [
      { account: from, value: 0n },
      { account: await accounts[3].getAddress(), value: 0n },
    ];
    const royalties: Array<{ account: string; value: bigint }> = [];
    const signatures: string[] = [];

    const data = {
      tokenId,
      tokenURI: "uri",
      creators,
      royalties,
      signatures,
    };

    const encodedMintData = await erc721Test.encode(data);

    const asset = Asset(ERC721_LAZY, encodedMintData, 1n);

    await erc721Proxy.connect(operator).transfer(asset, from, to);

    expect(await erc721Test.ownerOf(tokenId)).to.equal(to);
  });

  it("lazy mint proxyTransfer works for ERC-721, wrong operator, reverts", async function () {
    const from = await accounts[1].getAddress();
    const to = await accounts[2].getAddress();
    const tokenId = 1n;

    const creators = [
      { account: from, value: 0n },
      { account: await accounts[3].getAddress(), value: 0n },
    ];
    const royalties: Array<{ account: string; value: bigint }> = [];
    const signatures: string[] = [];

    const data = {
      tokenId,
      tokenURI: "uri",
      creators,
      royalties,
      signatures,
    };

    const encodedMintData = await erc721Test.encode(data);

    const asset = Asset(ERC721_LAZY, encodedMintData, 1n);

    const wrongOperator = accounts[4];

    await expect(erc721Proxy.connect(wrongOperator).transfer(asset, from, to)).to.be.revertedWithCustomError(
      erc721Proxy,
      "OperatorRole__NotOperator",
    );
  });

  it("lazy mint proxyTransfer works for ERC-1155", async function () {
    const operator = deployer;
    const from = await accounts[1].getAddress();
    const to = await accounts[2].getAddress();
    const tokenId = 1n;
    const supply = 10n;
    const value = 5n;

    const creators = [
      { account: from, value: 0n },
      { account: await accounts[3].getAddress(), value: 0n },
    ];
    const royalties: Array<{ account: string; value: bigint }> = [];
    const signatures: string[] = [];

    const data = {
      tokenId,
      tokenURI: "uri",
      supply,
      creators,
      royalties,
      signatures,
    };

    const encodedMintData = await erc1155Test.encode(data);

    const asset = Asset(ERC1155_LAZY, encodedMintData, value);

    await erc1155Proxy.connect(operator).transfer(asset, from, to);

    expect(await erc1155Test.balanceOf(to, tokenId)).to.equal(value);
  });

  it("lazy mint proxyTransfer works for ERC-1155, wrong operator, reverts", async function () {
    const from = await accounts[1].getAddress();
    const to = await accounts[2].getAddress();
    const tokenId = 1n;
    const supply = 10n;
    const value = 5n;

    const creators = [
      { account: from, value: 0n },
      { account: await accounts[3].getAddress(), value: 0n },
    ];
    const royalties: Array<{ account: string; value: bigint }> = [];
    const signatures: string[] = [];

    const data = {
      tokenId,
      tokenURI: "uri",
      supply,
      creators,
      royalties,
      signatures,
    };

    const encodedMintData = await erc1155Test.encode(data);

    const asset = Asset(ERC1155_LAZY, encodedMintData, value);

    const wrongOperator = accounts[5];

    await expect(erc1155Proxy.connect(wrongOperator).transfer(asset, from, to)).to.be.revertedWithCustomError(
      erc1155Proxy,
      "OperatorRole__NotOperator",
    );
  });
});
