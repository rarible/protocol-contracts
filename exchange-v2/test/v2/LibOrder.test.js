const LibOrderTest = artifacts.require("LibOrderTest.sol");
const order = require("../order");
const ZERO = "0x0000000000000000000000000000000000000000";
const tests = require("@daonomic/tests-common");
const expectThrow = tests.expectThrow;

const {ORDER_DATA_V1, ORDER_DATA_V2} = require("../assets");

contract("LibOrder", accounts => {
	let lib;

	beforeEach(async () => {
		lib = await LibOrderTest.new();
	});
  
  describe("calculateRemaining", () => {
		it("should calculate remaining amounts if fill=0", async () => {
      const make = order.Asset("0x00000000", "0x", 100);
      const take = order.Asset("0x00000000", "0x", 200);
      const result = await lib.calculateRemaining(order.Order(ZERO, make, ZERO, take, 1, 0, 0, "0xffffffff", "0x"), 0);
      assert.equal(result[0], 100);
      assert.equal(result[1], 200);
    });
  
    it("should calculate remaining amounts if fill is specified", async () => {
      const make = order.Asset("0x00000000", "0x", 100);
      const take = order.Asset("0x00000000", "0x", 200);
      const result = await lib.calculateRemaining(order.Order(ZERO, make, ZERO, take, 1, 0, 0, "0xffffffff", "0x"), 20);
      assert.equal(result[0], 90);
      assert.equal(result[1], 180);
    });
  
    it("should return 0s if filled fully", async () => {
      const make = order.Asset("0x00000000", "0x", 100);
      const take = order.Asset("0x00000000", "0x", 200);
      const result = await lib.calculateRemaining(order.Order(ZERO, make, ZERO, take, 1, 0, 0, "0xffffffff", "0x"), 200);
      assert.equal(result[0], 0);
      assert.equal(result[1], 0);
    });
  
    it("should throw if fill is more than in the order", async () => {
      const make = order.Asset("0x00000000", "0x", 100);
      const take = order.Asset("0x00000000", "0x", 200);
      await expectThrow(
        lib.calculateRemaining(order.Order(ZERO, make, ZERO, take, 1, 0, 0, "0xffffffff", "0x"), 220)
      );
    });
  
    it("should throw if fill is more than in the order", async () => {
      const make = order.Asset("0x00000000", "0x", 100);
      const take = order.Asset("0x00000000", "0x", 200);
      await expectThrow(
        lib.calculateRemaining(order.Order(ZERO, make, ZERO, take, 1, 0, 0, "0xffffffff", "0x"), 220)
      );
    });
  
    it("should return correct reaming value for V2 order with data.makeFill = true", async () => {
      const make = order.Asset("0x00000000", "0x", 200);
      const take = order.Asset("0x00000000", "0x", 600);
      const data = await encDataV2([ [], [], true ])
      const result = await lib.calculateRemaining(order.Order(ZERO, make, ZERO, take, 1, 0, 0, ORDER_DATA_V2, data), 100);
      assert.equal(result.makeAmount, 100, "makeAmount");
      assert.equal(result.takeAmount, 300, "takeAmount");
    })

    it("should return correct reaming value for V2 order with data.makeFill = false", async () => {
      const make = order.Asset("0x00000000", "0x", 100);
      const take = order.Asset("0x00000000", "0x", 200);
      const data = await encDataV2([ [], [], false ])
      const result = await lib.calculateRemaining(order.Order(ZERO, make, ZERO, take, 1, 0, 0, ORDER_DATA_V2, data), 20);
      assert.equal(result.makeAmount, 90, "makeAmount");
      assert.equal(result.takeAmount, 180, "takeAmount");
    })
	})

	describe("validate", () => {
		const testAsset = order.Asset("0x00000000", "0x", 100);

		it("should not throw if dates not set", async () => {
			await lib.validate(order.Order(ZERO, testAsset, ZERO, testAsset, 0, 0, 0, "0xffffffff", "0x"))
		})

		it("should not throw if dates are correct", async () => {
			const now = parseInt(new Date() / 1000);
			await lib.validate(order.Order(ZERO, testAsset, ZERO, testAsset, 0, now - 100, now + 100, "0xffffffff", "0x"))
		})

		it("should throw if start date error", async () => {
			const now = parseInt(new Date() / 1000);
			await expectThrow(
				lib.validate(order.Order(ZERO, testAsset, ZERO, testAsset, 0, now + 100, 0, "0xffffffff", "0x"))
			)
		})

		it("should throw if end date error", async () => {
			const now = parseInt(new Date() / 1000);
			await expectThrow(
				lib.validate(order.Order(ZERO, testAsset, ZERO, testAsset, 0, 0, now - 100, "0xffffffff", "0x"))
			)
		})

		it("should throw if both dates error", async () => {
			const now = parseInt(new Date() / 1000);
			await expectThrow(
				lib.validate(order.Order(ZERO, testAsset, ZERO, testAsset, 0, now + 100, now - 100, "0xffffffff", "0x"))
			)
		})

	})

  async function encDataV2(tuple) {
    return await lib.encodeV2(tuple);
 }
});