// <ai_context> TypeScript port of LibOrder.test.js. Tests LibOrder library functionality including calculateRemaining for fill calculations, validate for order date validation, and hashKey for different order types (V1, V2). </ai_context>
import { expect } from "chai";
import { network } from "hardhat";
import type * as ethersTypes from "ethers";

const connection = await network.connect();
const { ethers } = connection;

import { type LibOrderTest, LibOrderTest__factory } from "../types/ethers-contracts";
import { Order, Asset } from "@rarible/common-sdk/src/order";
import { ORDER_DATA_V1, ORDER_DATA_V2 } from "@rarible/common-sdk/src/assets";

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const ZERO = "0x0000000000000000000000000000000000000000";

// -----------------------------------------------------------------------------
// Main Test Suite
// -----------------------------------------------------------------------------
describe("LibOrder", function () {
  let lib: LibOrderTest;
  let accounts: ethersTypes.Signer[];
  let deployer: ethersTypes.Signer;

  before(async () => {
    accounts = await ethers.getSigners();
    [deployer] = accounts;

    // Deploy LibOrderTest
    lib = await new LibOrderTest__factory(deployer).deploy();
    await lib.waitForDeployment();
  });

  // ---------------------------------------------------------------------------
  // calculateRemaining tests
  // ---------------------------------------------------------------------------
  describe("calculateRemaining", () => {
    it("should calculate remaining amounts if fill=0", async () => {
      const make = Asset("0x00000000", "0x", 100n);
      const take = Asset("0x00000000", "0x", 200n);
      const result = await lib.calculateRemaining(
        Order(ZERO, make, ZERO, take, 1n, 0n, 0n, "0xffffffff", "0x"),
        0n,
        false,
      );
      expect(result[0]).to.equal(100n);
      expect(result[1]).to.equal(200n);
    });

    it("should calculate remaining amounts if fill is specified", async () => {
      const make = Asset("0x00000000", "0x", 100n);
      const take = Asset("0x00000000", "0x", 200n);
      const result = await lib.calculateRemaining(
        Order(ZERO, make, ZERO, take, 1n, 0n, 0n, "0xffffffff", "0x"),
        20n,
        false,
      );
      expect(result[0]).to.equal(90n);
      expect(result[1]).to.equal(180n);
    });

    it("should return 0s if filled fully", async () => {
      const make = Asset("0x00000000", "0x", 100n);
      const take = Asset("0x00000000", "0x", 200n);
      const result = await lib.calculateRemaining(
        Order(ZERO, make, ZERO, take, 1n, 0n, 0n, "0xffffffff", "0x"),
        200n,
        false,
      );
      expect(result[0]).to.equal(0n);
      expect(result[1]).to.equal(0n);
    });

    it("should throw if fill is more than in the order", async () => {
      const make = Asset("0x00000000", "0x", 100n);
      const take = Asset("0x00000000", "0x", 200n);
      await expect(
        lib.calculateRemaining(Order(ZERO, make, ZERO, take, 1n, 0n, 0n, "0xffffffff", "0x"), 220n, false),
      ).to.be.revertedWithPanic(0x11);
    });

    it("should return correct reaming value for makeFill = true", async () => {
      const make = Asset("0x00000000", "0x", 200n);
      const take = Asset("0x00000000", "0x", 600n);
      const result = await lib.calculateRemaining(
        Order(ZERO, make, ZERO, take, 1n, 0n, 0n, ORDER_DATA_V2, "0x"),
        100n,
        true,
      );
      expect(result.makeAmount, "makeAmount").to.equal(100n);
      expect(result.takeAmount, "takeAmount").to.equal(300n);
    });

    it("should return correct reaming value for makeFill = false", async () => {
      const make = Asset("0x00000000", "0x", 100n);
      const take = Asset("0x00000000", "0x", 200n);
      const result = await lib.calculateRemaining(
        Order(ZERO, make, ZERO, take, 1n, 0n, 0n, ORDER_DATA_V2, "0x"),
        20n,
        false,
      );
      expect(result.makeAmount, "makeAmount").to.equal(90n);
      expect(result.takeAmount, "takeAmount").to.equal(180n);
    });
  });

  // ---------------------------------------------------------------------------
  // validate tests
  // ---------------------------------------------------------------------------
  describe("validate", () => {
    const testAsset = Asset("0x00000000", "0x", 100n);

    it("should not throw if dates not set", async () => {
      await lib.validate(Order(ZERO, testAsset, ZERO, testAsset, 0n, 0n, 0n, "0xffffffff", "0x"));
    });

    it("should not throw if dates are correct", async () => {
      const now = Math.floor(Date.now() / 1000);
      await lib.validate(
        Order(ZERO, testAsset, ZERO, testAsset, 0n, BigInt(now - 100), BigInt(now + 100), "0xffffffff", "0x"),
      );
    });

    it("should throw if start date error", async () => {
      const now = Math.floor(Date.now() / 1000);
      await expect(
        lib.validate(Order(ZERO, testAsset, ZERO, testAsset, 0n, BigInt(now + 100), 0n, "0xffffffff", "0x")),
      ).to.be.revertedWith("Order start validation failed");
    });

    it("should throw if end date error", async () => {
      const now = Math.floor(Date.now() / 1000);
      await expect(
        lib.validate(Order(ZERO, testAsset, ZERO, testAsset, 0n, 0n, BigInt(now - 100), "0xffffffff", "0x")),
      ).to.be.revertedWith("Order end validation failed");
    });

    it("should throw if both dates error", async () => {
      const now = Math.floor(Date.now() / 1000);
      await expect(
        lib.validate(
          Order(ZERO, testAsset, ZERO, testAsset, 0n, BigInt(now + 100), BigInt(now - 100), "0xffffffff", "0x"),
        ),
      ).to.be.revertedWith("Order start validation failed");
    });
  });

  // ---------------------------------------------------------------------------
  // hashKey tests
  // ---------------------------------------------------------------------------
  describe("hashKey", () => {
    let maker: string;
    const makeAsset = Asset("0x00000000", "0x", 100n);
    const takeAsset = Asset("0x00000000", "0x", 100n);
    const salt = 1n;
    const data = "0x12";

    before(async () => {
      maker = await accounts[1].getAddress();
    });

    it("should calculate correct hash key for no type order", async () => {
      const test_order = Order(maker, makeAsset, ZERO, takeAsset, salt, 0n, 0n, "0xffffffff", data);

      const hash = await lib.hashKey(test_order);
      const test_hash = await lib.hashV1(maker, makeAsset, takeAsset, salt);
      const test_wrong_hash = await lib.hashV2(maker, makeAsset, takeAsset, salt, data);

      expect(hash).to.not.equal(test_wrong_hash, "not equal to wrong hash");
      expect(hash).to.equal(test_hash, "correct hash no type order");
    });

    it("should calculate correct hash key for V1 order", async () => {
      const test_order = Order(maker, makeAsset, ZERO, takeAsset, salt, 0n, 0n, ORDER_DATA_V1, data);

      const hash = await lib.hashKey(test_order);
      const test_hash = await lib.hashV1(maker, makeAsset, takeAsset, salt);
      const test_wrong_hash = await lib.hashV2(maker, makeAsset, takeAsset, salt, data);

      expect(hash).to.not.equal(test_wrong_hash, "not equal to wrong hash");
      expect(hash).to.equal(test_hash, "correct hash V1 order");
    });

    it("should calculate correct hash key for V2 order", async () => {
      const test_order = Order(maker, makeAsset, ZERO, takeAsset, salt, 0n, 0n, ORDER_DATA_V2, data);

      const hash = await lib.hashKey(test_order);
      const test_hash = await lib.hashV2(maker, makeAsset, takeAsset, salt, data);
      const test_wrong_hash = await lib.hashV1(maker, makeAsset, takeAsset, salt);

      expect(hash).to.not.equal(test_wrong_hash, "not equal to wrong hash");
      expect(hash).to.equal(test_hash, "correct hash V2 order");
    });
  });
});
