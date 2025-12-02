// <ai_context> TypeScript port of LibFill.test.js. Tests LibFill library functionality for order filling logic including right order fill, left order fill, and both orders fill scenarios with price matching validation. </ai_context>
import { expect } from "chai";
import { network } from "hardhat";
import type * as ethersTypes from "ethers";

const connection = await network.connect();
const { ethers } = connection;

import { type LibFillTest, LibFillTest__factory } from "../types/ethers-contracts";
import { Order, Asset } from "@rarible/common-sdk/src/order";

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const ZERO = "0x0000000000000000000000000000000000000000";

// -----------------------------------------------------------------------------
// Main Test Suite
// -----------------------------------------------------------------------------
describe("LibFill", function () {
  let lib: LibFillTest;
  let accounts: ethersTypes.Signer[];
  let deployer: ethersTypes.Signer;

  before(async () => {
    accounts = await ethers.getSigners();
    [deployer] = accounts;

    // Deploy LibFillTest
    lib = await new LibFillTest__factory(deployer).deploy();
    await lib.waitForDeployment();
  });

  // ---------------------------------------------------------------------------
  // Right order fill tests
  // ---------------------------------------------------------------------------
  describe("right order fill", () => {
    it("should fill fully right order if amounts are fully matched", async () => {
      const left = Order(
        ZERO,
        Asset("0x00000000", "0x", 100n),
        ZERO,
        Asset("0x00000000", "0x", 200n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      const right = Order(
        ZERO,
        Asset("0x00000000", "0x", 100n),
        ZERO,
        Asset("0x00000000", "0x", 50n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      const fill = await lib.fillOrder(left, right, 0n, 0n, false, false);
      expect(fill[0]).to.equal(50n);
      expect(fill[1]).to.equal(100n);
    });

    it("should throw if right order is fully matched, but price is not ok", async () => {
      const left = Order(
        ZERO,
        Asset("0x00000000", "0x", 100n),
        ZERO,
        Asset("0x00000000", "0x", 200n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      const right = Order(
        ZERO,
        Asset("0x00000000", "0x", 99n),
        ZERO,
        Asset("0x00000000", "0x", 50n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      await expect(lib.fillOrder(left, right, 0n, 0n, false, false)).to.be.revertedWith("fillRight: unable to fill");
    });

    it("should fill right order and return profit if more than needed", async () => {
      const left = Order(
        ZERO,
        Asset("0x00000000", "0x", 100n),
        ZERO,
        Asset("0x00000000", "0x", 200n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      const right = Order(
        ZERO,
        Asset("0x00000000", "0x", 101n),
        ZERO,
        Asset("0x00000000", "0x", 50n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      const fill = await lib.fillOrder(left, right, 0n, 0n, false, false);
      expect(fill[0]).to.equal(50n);
      expect(fill[1]).to.equal(100n);
    });
  });

  // ---------------------------------------------------------------------------
  // Left order fill tests
  // ---------------------------------------------------------------------------
  describe("left order fill", () => {
    it("should fill orders when prices match exactly", async () => {
      const left = Order(
        ZERO,
        Asset("0x00000000", "0x", 100n),
        ZERO,
        Asset("0x00000000", "0x", 200n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      const right = Order(
        ZERO,
        Asset("0x00000000", "0x", 400n),
        ZERO,
        Asset("0x00000000", "0x", 200n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      const fill = await lib.fillOrder(left, right, 0n, 0n, false, false);
      expect(fill[0]).to.equal(100n);
      expect(fill[1]).to.equal(200n);
    });

    it("should fill orders when right order has better price", async () => {
      const left = Order(
        ZERO,
        Asset("0x00000000", "0x", 1000n),
        ZERO,
        Asset("0x00000000", "0x", 2000n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      const right = Order(
        ZERO,
        Asset("0x00000000", "0x", 4001n),
        ZERO,
        Asset("0x00000000", "0x", 2000n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      const fill = await lib.fillOrder(left, right, 0n, 0n, false, false);
      expect(fill[0]).to.equal(1000n);
      expect(fill[1]).to.equal(2000n);
    });

    it("should throw if price is not ok", async () => {
      const left = Order(
        ZERO,
        Asset("0x00000000", "0x", 1000n),
        ZERO,
        Asset("0x00000000", "0x", 2000n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      const right = Order(
        ZERO,
        Asset("0x00000000", "0x", 3990n),
        ZERO,
        Asset("0x00000000", "0x", 2000n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      await expect(lib.fillOrder(left, right, 0n, 0n, false, false)).to.be.revertedWith("fillLeft: unable to fill");
    });
  });

  // ---------------------------------------------------------------------------
  // Both orders fill tests
  // ---------------------------------------------------------------------------
  describe("both orders fill", () => {
    it("should fill orders when prices match exactly", async () => {
      const left = Order(
        ZERO,
        Asset("0x00000000", "0x", 100n),
        ZERO,
        Asset("0x00000000", "0x", 200n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      const right = Order(
        ZERO,
        Asset("0x00000000", "0x", 200n),
        ZERO,
        Asset("0x00000000", "0x", 100n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      const fill = await lib.fillOrder(left, right, 0n, 0n, false, false);
      expect(fill[0]).to.equal(100n);
      expect(fill[1]).to.equal(200n);
    });

    it("should fill orders when right order has better price", async () => {
      const left = Order(
        ZERO,
        Asset("0x00000000", "0x", 100n),
        ZERO,
        Asset("0x00000000", "0x", 200n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      const right = Order(
        ZERO,
        Asset("0x00000000", "0x", 300n),
        ZERO,
        Asset("0x00000000", "0x", 100n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      const fill = await lib.fillOrder(left, right, 0n, 0n, false, false);
      expect(fill[0]).to.equal(100n);
      expect(fill[1]).to.equal(200n);
    });

    it("should fill orders when right order has better price with less needed amount", async () => {
      const left = Order(
        ZERO,
        Asset("0x00000000", "0x", 100n),
        ZERO,
        Asset("0x00000000", "0x", 200n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      const right = Order(
        ZERO,
        Asset("0x00000000", "0x", 300n),
        ZERO,
        Asset("0x00000000", "0x", 50n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      const fill = await lib.fillOrder(left, right, 0n, 0n, false, false);
      expect(fill[0]).to.equal(50n);
      expect(fill[1]).to.equal(100n);
    });

    it("should throw if price is not ok", async () => {
      const left = Order(
        ZERO,
        Asset("0x00000000", "0x", 100n),
        ZERO,
        Asset("0x00000000", "0x", 200n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );
      const right = Order(
        ZERO,
        Asset("0x00000000", "0x", 199n),
        ZERO,
        Asset("0x00000000", "0x", 100n),
        1n,
        0n,
        0n,
        "0xffffffff",
        "0x",
      );

      await expect(lib.fillOrder(left, right, 0n, 0n, false, false)).to.be.revertedWith("fillRight: unable to fill");
    });
  });
});
