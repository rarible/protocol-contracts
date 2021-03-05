const LibFillTest = artifacts.require("LibFillTest.sol");
const order = require("../order");
const ZERO = "0x0000000000000000000000000000000000000000";
const tests = require("@daonomic/tests-common");
const expectThrow = tests.expectThrow;

contract("LibFill", accounts => {
	let lib;

	beforeEach(async () => {
		lib = await LibFillTest.new();
	});

	describe("right order fill", () => {
		it("should fill fully right order if amounts are fully matched", async () => {
			const left = order.Order(ZERO, order.Asset("0x00000000", "0x", 100), ZERO, order.Asset("0x00000000", "0x", 200), 1, 0, 0, "0xffffffff", "0x");
			const right = order.Order(ZERO, order.Asset("0x00000000", "0x", 100), ZERO, order.Asset("0x00000000", "0x", 50), 1, 0, 0, "0xffffffff", "0x");

			const fill = await lib.fillOrder(left, right, 0, 0);
			assert.equal(fill[0], 50);
			assert.equal(fill[1], 100);
		});

		it("should throw if right order is fully matched, but price is not ok", async () => {
			const left = order.Order(ZERO, order.Asset("0x00000000", "0x", 100), ZERO, order.Asset("0x00000000", "0x", 200), 1, 0, 0, "0xffffffff", "0x");
			const right = order.Order(ZERO, order.Asset("0x00000000", "0x", 99), ZERO, order.Asset("0x00000000", "0x", 50), 1, 0, 0, "0xffffffff", "0x");

			await expectThrow(
				lib.fillOrder(left, right, 0, 0)
			);
		});

		it("should fill right order and return profit if more than needed", async () => {
			const left = order.Order(ZERO, order.Asset("0x00000000", "0x", 100), ZERO, order.Asset("0x00000000", "0x", 200), 1, 0, 0, "0xffffffff", "0x");
			const right = order.Order(ZERO, order.Asset("0x00000000", "0x", 101), ZERO, order.Asset("0x00000000", "0x", 50), 1, 0, 0, "0xffffffff", "0x");

			const fill = await lib.fillOrder(left, right, 0, 0);
			assert.equal(fill[0], 50);
			assert.equal(fill[1], 100);
		});
	})

	describe("left order fill", () => {
		it("should fill orders when prices match exactly", async () => {
			const left = order.Order(ZERO, order.Asset("0x00000000", "0x", 100), ZERO, order.Asset("0x00000000", "0x", 200), 1, 0, 0, "0xffffffff", "0x");
			const right = order.Order(ZERO, order.Asset("0x00000000", "0x", 400), ZERO, order.Asset("0x00000000", "0x", 200), 1, 0, 0, "0xffffffff", "0x");

			const fill = await lib.fillOrder(left, right, 0, 0);
			assert.equal(fill[0], 100);
			assert.equal(fill[1], 200);
		});

		it("should fill orders when right order has better price", async () => {
			const left = order.Order(ZERO, order.Asset("0x00000000", "0x", 100), ZERO, order.Asset("0x00000000", "0x", 200), 1, 0, 0, "0xffffffff", "0x");
			const right = order.Order(ZERO, order.Asset("0x00000000", "0x", 401), ZERO, order.Asset("0x00000000", "0x", 200), 1, 0, 0, "0xffffffff", "0x");

			const fill = await lib.fillOrder(left, right, 0, 0);
			assert.equal(fill[0], 100);
			assert.equal(fill[1], 200);
		});

		it("should throw if price is not ok", async () => {
			const left = order.Order(ZERO, order.Asset("0x00000000", "0x", 1000), ZERO, order.Asset("0x00000000", "0x", 2000), 1, 0, 0, "0xffffffff", "0x");
			const right = order.Order(ZERO, order.Asset("0x00000000", "0x", 3990), ZERO, order.Asset("0x00000000", "0x", 2000), 1, 0, 0, "0xffffffff", "0x");

			await expectThrow(
				lib.fillOrder(left, right, 0, 0)
			);
		});

	})

	describe("both orders fill", () => {
		it("should fill orders when prices match exactly", async () => {
			const left = order.Order(ZERO, order.Asset("0x00000000", "0x", 100), ZERO, order.Asset("0x00000000", "0x", 200), 1, 0, 0, "0xffffffff", "0x");
			const right = order.Order(ZERO, order.Asset("0x00000000", "0x", 200), ZERO, order.Asset("0x00000000", "0x", 100), 1, 0, 0, "0xffffffff", "0x");

			const fill = await lib.fillOrder(left, right, 0, 0);
			assert.equal(fill[0], 100);
			assert.equal(fill[1], 200);
		});

		it("should fill orders when right order has better price", async () => {
			const left = order.Order(ZERO, order.Asset("0x00000000", "0x", 100), ZERO, order.Asset("0x00000000", "0x", 200), 1, 0, 0, "0xffffffff", "0x");
			const right = order.Order(ZERO, order.Asset("0x00000000", "0x", 200), ZERO, order.Asset("0x00000000", "0x", 100), 1, 0, 0, "0xffffffff", "0x");

			const fill = await lib.fillOrder(left, right, 0, 0);
			assert.equal(fill[0], 100);
			assert.equal(fill[1], 200);
		});

		it("should throw if price is not ok", async () => {
			const left = order.Order(ZERO, order.Asset("0x00000000", "0x", 100), ZERO, order.Asset("0x00000000", "0x", 200), 1, 0, 0, "0xffffffff", "0x");
			const right = order.Order(ZERO, order.Asset("0x00000000", "0x", 199), ZERO, order.Asset("0x00000000", "0x", 100), 1, 0, 0, "0xffffffff", "0x");

			await expectThrow(
				lib.fillOrder(left, right, 0, 0)
			);
		});

	})

});