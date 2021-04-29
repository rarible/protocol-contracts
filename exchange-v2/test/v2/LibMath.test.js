const LibMathTest = artifacts.require("LibMathTest.sol");
const tests = require("@daonomic/tests-common");
const expectThrow = tests.expectThrow;

contract("LibMath", accounts => {
	let lib;

	beforeEach(async () => {
		lib = await LibMathTest.new();
	});

	describe("safeGetPartialAmountFloor", () => {
		it("rounding errors", async () => {
			checkError(1001, 999, 1);//=0.2%
			checkError(100, 200, 1);
			checkError(100, 200, 99);
			checkError(100, 999, 2);
		});

		async function checkError(numerator, denominator,	target) {
			await expectThrow(
				lib.safeGetPartialAmountFloor(numerator, denominator,	target)
			);
		}

		it("calculated", async () => {
			checkCalculated(1000, 999, 1, 1);//rounding error = 0.1%
			checkCalculated(1000, 1000, 1, 1);
			checkCalculated(100, 200, 2, 99);
		});

		async function checkCalculated(numerator, denominator,	target, exp) {
			const result = await lib.safeGetPartialAmountFloor(numerator, denominator,	target);
			assert.equal(result, exp);
		}
	});
});