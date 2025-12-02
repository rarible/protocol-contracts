// <ai_context> TypeScript port of OrderValidator.test.js. Tests OrderValidator contract functionality including signature validation, ERC-1271 contract signature validation, bypassing signatures when maker is msg.sender, and handling contracts that don't support ERC-1271. </ai_context>
import { expect } from "chai";
import { network } from "hardhat";
import type * as ethersTypes from "ethers";

const connection = await network.connect();
const { ethers } = connection;

import {
  type OrderValidatorTest,
  OrderValidatorTest__factory,
  type TestERC1271,
  TestERC1271__factory,
} from "../types/ethers-contracts";
import { Order, Asset, sign, type OrderStruct } from "@rarible/common-sdk/src/order";
import { deployTransparentProxy } from "@rarible/common-sdk/src/deploy";

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const ZERO = "0x0000000000000000000000000000000000000000";

// -----------------------------------------------------------------------------
// Main Test Suite
// -----------------------------------------------------------------------------
describe("OrderValidator", function () {
  let testing: OrderValidatorTest;
  let erc1271: TestERC1271;
  let accounts: ethersTypes.Signer[];
  let deployer: ethersTypes.Signer;

  before(async () => {
    accounts = await ethers.getSigners();
    [deployer] = accounts;

    // Deploy OrderValidatorTest via transparent proxy
    const { instance } = await deployTransparentProxy<OrderValidatorTest>(ethers, {
      contractName: "OrderValidatorTest",
      initFunction: "__OrderValidatorTest_init",
      initArgs: [],
      proxyOwner: await deployer.getAddress(),
    });
    testing = instance;

    // Deploy TestERC1271
    erc1271 = await new TestERC1271__factory(deployer).deploy();
    await erc1271.waitForDeployment();
  });

  // ---------------------------------------------------------------------------
  // Helper functions
  // ---------------------------------------------------------------------------
  async function getSignature(order: OrderStruct, signer: ethersTypes.Signer): Promise<string> {
    return sign(signer, order, await testing.getAddress());
  }

  // ---------------------------------------------------------------------------
  // Validation tests
  // ---------------------------------------------------------------------------
  it("Test1. should validate if signer is correct", async () => {
    const account1Address = await accounts[1].getAddress();
    const testOrder = Order(
      account1Address,
      Asset("0xffffffff", "0x", 100n),
      ZERO,
      Asset("0xffffffff", "0x", 200n),
      1n,
      0n,
      0n,
      "0xffffffff",
      "0x",
    );
    const signature = await getSignature(testOrder, accounts[1]);
    const tx = await testing.validateOrderTest2(testOrder, signature);
    const receipt = await tx.wait();
    console.log(`Gas used: ${receipt?.gasUsed}`);
  });

  it("Test2. should fail validate if signer is incorrect", async () => {
    const account1Address = await accounts[1].getAddress();
    const testOrder = Order(
      account1Address,
      Asset("0xffffffff", "0x", 100n),
      ZERO,
      Asset("0xffffffff", "0x", 200n),
      1n,
      0n,
      0n,
      "0xffffffff",
      "0x",
    );
    const signature = await getSignature(testOrder, accounts[2]);
    await expect(testing.validateOrderTest(testOrder, signature)).to.be.revertedWith(
      "order signature verification error",
    );
  });

  it("Test3. should bypass signature if maker is msg.sender", async () => {
    const account5Address = await accounts[5].getAddress();
    const testOrder = Order(
      account5Address,
      Asset("0xffffffff", "0x", 100n),
      ZERO,
      Asset("0xffffffff", "0x", 200n),
      1n,
      0n,
      0n,
      "0xffffffff",
      "0x",
    );
    await testing.connect(accounts[5]).validateOrderTest(testOrder, "0x");
  });

  it("Test4. should validate if signer is contract and 1271 passes", async () => {
    const erc1271Address = await erc1271.getAddress();
    const testOrder = Order(
      erc1271Address,
      Asset("0xffffffff", "0x", 100n),
      ZERO,
      Asset("0xffffffff", "0x", 200n),
      1n,
      0n,
      0n,
      "0xffffffff",
      "0x",
    );
    const signature = await getSignature(testOrder, accounts[2]);

    await expect(testing.validateOrderTest(testOrder, signature)).to.be.revertedWith(
      "contract order signature verification error",
    );

    await erc1271.setReturnSuccessfulValidSignature(true);

    await testing.validateOrderTest(testOrder, signature);
  });

  it("Test5. should not validate contract don`t support ERC1271_INTERFACE", async () => {
    const testingAddress = await testing.getAddress();
    const testOrder = Order(
      testingAddress,
      Asset("0xffffffff", "0x", 100n),
      ZERO,
      Asset("0xffffffff", "0x", 200n),
      1n,
      0n,
      0n,
      "0xffffffff",
      "0x",
    );
    const signature = await getSignature(testOrder, accounts[2]);
    await expect(testing.validateOrderTest(testOrder, signature)).to.be.revertedWith(
      "contract order signature verification error",
    );
  });

  it("Test6. should validate IERC1271 with empty signature", async () => {
    const erc1271Address = await erc1271.getAddress();
    const testOrder = Order(
      erc1271Address,
      Asset("0xffffffff", "0x", 100n),
      ZERO,
      Asset("0xffffffff", "0x", 200n),
      1n,
      0n,
      0n,
      "0xffffffff",
      "0x",
    );

    await erc1271.setReturnSuccessfulValidSignature(false);

    await expect(testing.validateOrderTest(testOrder, "0x")).to.be.revertedWithCustomError(
      testing,
      "ECDSAInvalidSignatureLength",
    );

    await erc1271.setReturnSuccessfulValidSignature(true);

    await testing.validateOrderTest(testOrder, "0x");
  });

  it("Test7. should validate correct ERC1271 AND incorrect ECDSA signature", async () => {
    const erc1271Address = await erc1271.getAddress();
    const testOrder = Order(
      erc1271Address,
      Asset("0xffffffff", "0x", 100n),
      ZERO,
      Asset("0xffffffff", "0x", 200n),
      1n,
      0n,
      0n,
      "0xffffffff",
      "0x",
    );

    await erc1271.setReturnSuccessfulValidSignature(true);

    // signature len = 65, but v = 1
    const signature =
      "0xae9f79f54ab16651972eb2f815e5c901cf39209d692e12261c91747324b81ec05aabe86556e1a9dc8786f4ebb8b0e547320aef8db1d0d8ac86ef837557829d7a01";
    await testing.validateOrderTest(testOrder, signature);
  });
});
