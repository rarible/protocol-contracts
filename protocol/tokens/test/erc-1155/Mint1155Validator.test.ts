// <ai_context> TypeScript port of erc-1155/Mint1155Validator.test.js. Tests Mint1155Validator signature validation functionality including correct signatures, empty fees, incorrect signatures, and ERC1271 contract wallet signatures. </ai_context>
import { expect } from "chai";
import { network } from "hardhat";
import type * as ethersTypes from "ethers";

const connection = await network.connect();
const { ethers } = connection;

import {
  type Mint1155ValidatorTest,
  Mint1155ValidatorTest__factory,
  type TestERC1271,
  TestERC1271__factory,
} from "../../types/ethers-contracts";
import { sign as signMint1155 } from "@rarible/common-sdk/src/mint1155";
import { deployTransparentProxy } from "@rarible/common-sdk/src/deploy";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
const ZERO = "0x0000000000000000000000000000000000000000";

type Part = { account: string; value: bigint };

// -----------------------------------------------------------------------------
// Main Test Suite
// -----------------------------------------------------------------------------
describe("Mint1155Validator", function () {
  let testing: Mint1155ValidatorTest;
  let erc1271: TestERC1271;
  let accounts: ethersTypes.Signer[];
  let deployer: ethersTypes.Signer;
  let fees: Part[];

  before(async () => {
    accounts = await ethers.getSigners();
    [deployer] = accounts;

    // Deploy Mint1155ValidatorTest
    testing = await new Mint1155ValidatorTest__factory(deployer).deploy();
    await testing.waitForDeployment();
    const { instance: validatorInstance } = await deployTransparentProxy<Mint1155ValidatorTest>(ethers, {
      contractName: "Mint1155ValidatorTest",
      initFunction: "__Mint1155ValidatorTest_init",
      initArgs: [],
      proxyOwner: await deployer.getAddress(),
    });
    testing = validatorInstance;

    // Deploy TestERC1271
    const erc1271Instance = await new TestERC1271__factory(deployer).deploy();
    await erc1271Instance.waitForDeployment();
    erc1271 = erc1271Instance;

    fees = [
      { account: await accounts[1].getAddress(), value: 1n },
      { account: await accounts[2].getAddress(), value: 100n },
    ];
  });

  async function getSignature(
    tokenId: bigint,
    tokenURI: string,
    supply: bigint,
    creatorsParts: Part[],
    royaltiesParts: Part[],
    signer: ethersTypes.Signer,
  ): Promise<string> {
    const testingAddress = await testing.getAddress();
    return signMint1155(signer, tokenId, tokenURI, supply, creatorsParts, royaltiesParts, testingAddress);
  }

  it("should validate if signer is correct", async () => {
    const account1Address = await accounts[1].getAddress();
    const creators: Part[] = [{ account: account1Address, value: 10000n }];
    const signature = await getSignature(1n, "testURI", 10n, creators, fees, accounts[1]);

    await testing.validateTest(
      ZERO,
      {
        tokenId: 1n,
        tokenURI: "testURI",
        supply: 10n,
        creators,
        royalties: fees,
        signatures: [signature],
      },
      0,
    );
  });

  it("should work if fees list is empty", async () => {
    const account1Address = await accounts[1].getAddress();
    const creators: Part[] = [{ account: account1Address, value: 10000n }];
    const signature = await getSignature(1n, "testURI", 10n, creators, [], accounts[1]);

    await testing.validateTest(
      ZERO,
      {
        tokenId: 1n,
        tokenURI: "testURI",
        supply: 10n,
        creators,
        royalties: [],
        signatures: [signature],
      },
      0,
    );
  });

  it("should fail if signer is incorrect", async () => {
    const account1Address = await accounts[1].getAddress();
    const creators: Part[] = [{ account: account1Address, value: 10000n }];
    // Sign with accounts[0] instead of accounts[1]
    const signature = await getSignature(1n, "testURI", 10n, creators, fees, accounts[0]);

    await expect(
      testing.validateTest(
        ZERO,
        {
          tokenId: 1n,
          tokenURI: "testURI",
          supply: 10n,
          creators,
          royalties: fees,
          signatures: [signature],
        },
        0,
      ),
    ).to.be.revertedWith("signature verification error");
  });

  it("should validate if signer is contract and 1271 passes", async () => {
    const erc1271Address = await erc1271.getAddress();
    const creators: Part[] = [{ account: erc1271Address, value: 10000n }];

    // Should fail initially when ERC1271 returns false
    await expect(
      testing.validateTest(
        ZERO,
        {
          tokenId: 1n,
          tokenURI: "testURI",
          supply: 10n,
          creators,
          royalties: fees,
          signatures: ["0x"],
        },
        0,
      ),
    ).to.be.revertedWith("signature verification error");

    // Enable successful signature validation on ERC1271 contract
    await erc1271.setReturnSuccessfulValidSignature(true);

    // Should succeed now
    await testing.validateTest(
      ZERO,
      {
        tokenId: 1n,
        tokenURI: "testURI",
        supply: 10n,
        creators,
        royalties: fees,
        signatures: ["0x"],
      },
      0,
    );
  });
});