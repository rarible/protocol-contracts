const BrokenLineTest = artifacts.require("BrokenLineTest.sol");
const truffleAssert = require('truffle-assertions');
const { expectThrow } = require("@daonomic/tests-common");
contract("BrokenLine", accounts => {
	let forTest;

	async function assertCurrent(line) {
		const current = await forTest.getCurrent();
		assert.equal(current[0], line[0]);
		assert.equal(current[1], line[1]);
		assert.equal(current[2], line[2]);
	}

	beforeEach(async () => {
		forTest = await BrokenLineTest.new();
	})

	describe("Check add()", () => {

		it("Should update if no line added", async () => {
			await forTest.update(0);
			await assertCurrent([0, 0, 0])

			await forTest.update(10);
			let current = await forTest.getCurrent();
			await assertCurrent([10, 0, 0])
		});

		it("One line can be added, tail works", async () => {
			await forTest.add([1, 101, 10], 0);
			await assertCurrent([1, 101, 10]);

			await forTest.update(2);
			await assertCurrent([2, 91, 10]);

			await forTest.update(10);
			await assertCurrent([10, 11, 10]);

			await forTest.update(11);
			await assertCurrent([11, 1, 1]);

			await forTest.update(12);
			await assertCurrent([12, 0, 0]);

			await forTest.update(13);
			await assertCurrent([13, 0, 0]);
		});

		it("One line with no mod should work", async () => {
			await forTest.add([1, 100, 10], 0);
			await assertCurrent([1, 100, 10]);

			await forTest.update(2);
			await assertCurrent([2, 90, 10]);

			await forTest.update(10);
			await assertCurrent([10, 10, 10]);

			await forTest.update(11);
			await assertCurrent([11, 0, 0]);

			await forTest.update(12);
			await assertCurrent([12, 0, 0]);

			await forTest.update(13);
			await assertCurrent([13, 0, 0]);
		})

		it("Some lines can be added at one time", async () => {
			await forTest.add([1, 20, 10], 0);
			await forTest.add([1, 40, 10], 0);
			await assertCurrent([1, 60, 20]);

			await forTest.update(2);
			await assertCurrent([2, 40, 20]);

			await forTest.update(3);
			await assertCurrent([3, 20, 10]);

			await forTest.update(4);
			await assertCurrent([4, 10, 10]);

			await forTest.update(5);
			await assertCurrent([5, 0, 0]);
		})
	})

	describe("Check with cliff", () => {

		it("One line can be added with cliff", async () => {
			await forTest.add([1, 100, 10], 2);
			await assertCurrent([1, 100, 0]);

			await forTest.update(2);
			await assertCurrent([2, 100, 0]);

			await forTest.update(3);
			await assertCurrent([3, 100, 10]);

			await forTest.update(4);
			await assertCurrent([4, 90, 10]);

			await forTest.update(12);
    	await assertCurrent([12, 10, 10]);

    	await forTest.update(13);
    	await assertCurrent([13, 0, 0]);
		});

		it("One line can be added with cliff(20, 10), begin from 3", async () => {
			await forTest.add([3, 20, 10], 2);
			await assertCurrent([3, 20, 0]);

			await forTest.update(4);
			await assertCurrent([4, 20, 0]);

			await forTest.update(5);
			await assertCurrent([5, 20, 10]);

			await forTest.update(6);
			await assertCurrent([6, 10, 10]);

			await forTest.update(7);
			await assertCurrent([7, 0, 0]);

			await forTest.update(8);
			await assertCurrent([8, 0, 0]);
		});

		it("One line can be added with cliff(20, 10), begin from 0, maybe line.start==0 its impossible, but need to check also!", async () => {
			await forTest.add([0, 20, 10], 2);
			await assertCurrent([0, 20, 0]);

			await forTest.update(1);
			await assertCurrent([1, 20, 0]);

			await forTest.update(2);
			await assertCurrent([2, 20, 10]);

			await forTest.update(3);
			await assertCurrent([3, 10, 10]);

			await forTest.update(4);
			await assertCurrent([4, 0, 0]);

			await forTest.update(5);
			await assertCurrent([5, 0, 0]);
		});

		it("One line can be added with cliff(2, 1), begin from 0, check change balance for 3 steps!", async () => {
			await forTest.add([0, 2, 1], 1);
			await assertCurrent([0, 2, 0]);

			await forTest.update(1);
			await assertCurrent([1, 2, 1]);

			await forTest.update(2);
			await assertCurrent([2, 1, 1]);

			await forTest.update(3);
			await assertCurrent([3, 0, 0]);
		});

		it("One line can be added with no cliff(2, 1), begin from 0, check change balance for 2 steps!", async () => {
			await forTest.add([0, 2, 1], 0);
			await assertCurrent([0, 2, 1]);

			await forTest.update(1);
			await assertCurrent([1, 1, 1]);

			await forTest.update(2);
			await assertCurrent([2, 0, 0]);

			await forTest.update(3);
			await assertCurrent([3, 0, 0]);
		});

		it("Two line can be added, only one with cliff+tail, no cliff shorter than freeze", async () => {
			await forTest.add([1, 35, 10], 3);
			await forTest.add([1, 20, 10], 0);
			await assertCurrent([1, 55, 10]);

			await forTest.update(2);
			await assertCurrent([2, 45, 10]);

			await forTest.update(3);
			await assertCurrent([3, 35, 0]);

			await forTest.update(4);
			await assertCurrent([4, 35, 10]);

			await forTest.update(5);
    	await assertCurrent([5, 25, 10]);

    	await forTest.update(7);
    	await assertCurrent([7, 5, 5]);

    	await forTest.update(8);
    	await assertCurrent([8, 0, 0]);
		});

		it("Two line can be added: first+tail, cliff+tail, no cliff shorter than freeze", async () => {
			await forTest.add([1, 35, 10], 3);
			await forTest.add([1, 25, 10], 0);
			await assertCurrent([1, 60, 10]);

			await forTest.update(2);
			await assertCurrent([2, 50, 10]);

			await forTest.update(3);
			await assertCurrent([3, 40, 5]);

			await forTest.update(4);
			await assertCurrent([4, 35, 10]);

			await forTest.update(5);
    	await assertCurrent([5, 25, 10]);

    	await forTest.update(7);
    	await assertCurrent([7, 5, 5]);

    	await forTest.update(8);
    	await assertCurrent([8, 0, 0]);
		});

		it("Two line can be added, only one with cliff, no cliff longer than freeze", async () => {
			await forTest.add([1, 30, 10], 3);
			await forTest.add([1, 25, 5], 0);
			await assertCurrent([1, 55, 5]);

			await forTest.update(2);
			await assertCurrent([2, 50, 5]);

			await forTest.update(4);
			await assertCurrent([4, 40, 15]);

			await forTest.update(5);
    	await assertCurrent([5, 25, 15]);

			await forTest.update(6);
    	await assertCurrent([6, 10, 10]);

    	await forTest.update(7);
    	await assertCurrent([7, 0, 0]);
		});

		it("Two line can be added, only one with cliff, no cliff == freeze", async () => {
			await forTest.add([1, 30, 10], 3);
			await forTest.add([1, 60, 20], 0);
			await assertCurrent([1, 90, 20]);

			await forTest.update(2);
			await assertCurrent([2, 70, 20]);

			await forTest.update(4);
			await assertCurrent([4, 30, 10]);

			await forTest.update(5);
    	await assertCurrent([5, 20, 10]);

			await forTest.update(6);
    	await assertCurrent([6, 10, 10]);

    	await forTest.update(7);
    	await assertCurrent([7, 0, 0]);
		});

		it("Three line can be added, only one with cliff, no cliff == freeze", async () => {
			await forTest.add([1, 30, 10], 3);
			await forTest.add([1, 60, 20], 0);
			await forTest.add([1, 120, 40], 0);
			await assertCurrent([1, 210, 60]);

			await forTest.update(2);
			await assertCurrent([2, 150, 60]);

			await forTest.update(4);
			await assertCurrent([4, 30, 10]);

			await forTest.update(5);
    	await assertCurrent([5, 20, 10]);

			await forTest.update(6);
    	await assertCurrent([6, 10, 10]);

    	await forTest.update(7);
    	await assertCurrent([7, 0, 0]);
		});

		it("Two line can be added with different cliff ", async () => {
			await forTest.add([1, 30, 10], 3);
			await forTest.add([1, 60, 20], 4);
			await assertCurrent([1, 90, 0]);

			await forTest.update(3);
			await assertCurrent([3, 90, 0]);

			await forTest.update(4);
			await assertCurrent([4, 90, 10]);

			await forTest.update(5);
    	await assertCurrent([5, 80, 30]);

			await forTest.update(6);
    	await assertCurrent([6, 50, 30]);

    	await forTest.update(7);
    	await assertCurrent([7, 20, 20]);

    	await forTest.update(8);
    	await assertCurrent([8, 0, 0]);
		});

		it("Two line can be added with the same cliff ", async () => {
			await forTest.add([1, 30, 10], 3);
			await forTest.add([1, 60, 20], 3);
			await assertCurrent([1, 90, 0]);

			await forTest.update(3);
			await assertCurrent([3, 90, 0]);

			await forTest.update(4);
			await assertCurrent([4, 90, 30]);

			await forTest.update(5);
    	await assertCurrent([5, 60, 30]);

			await forTest.update(6);
    	await assertCurrent([6, 30, 30]);

    	await forTest.update(7);
    	await assertCurrent([7, 0, 0]);
		});

		it("Expect throw time incorrect ", async () => {
			await forTest.add([1, 30, 10], 3);
			await forTest.add([1, 60, 20], 3);
			await assertCurrent([1, 90, 0]);

			await forTest.update(3);
			await assertCurrent([3, 90, 0]);
			await expectThrow(
    		forTest.update(2)
    	);
		});
	})

	describe("Check changes Slope", () => {
		it("Test1. One line. cliff = 0, change slope from 10 to 5", async () => {
			await forTest.add([1, 100, 10], 0);
			await assertCurrent([1, 100, 10]);

			await forTest.update(2);
			await assertCurrent([2, 90, 10]);

			await forTest.changePeriodTest([1, 100, 10], 0, 5, 6);

//			await forTest.update(6); //comment for understand, what happens on changePeriodTest()
//			await assertCurrent([6, 50, 10]);

			await forTest.update(7);
			await assertCurrent([7, 45, 5]);

			await forTest.update(10);
			await assertCurrent([10, 30, 5]);

			await forTest.update(15);
			await assertCurrent([15, 5, 5]);

			await forTest.update(16);
			await assertCurrent([16, 0, 0]);

			await forTest.update(17);
			await assertCurrent([17, 0, 0]);
		})

//todo: test should work
//		it("Test2. One line. cliff = 3  change slope (in cliff) from 20 to 8, week = 2", async () => {
//			await forTest.add([1, 40, 20], 3);
//			await assertCurrent([1, 40, 0]);
//
//			await forTest.changePeriodTest([1, 40, 20], 3, 8, 2);
//
//			await forTest.update(3);
//			await assertCurrent([3, 40, 0]);
//
//			await forTest.update(4);
//			await assertCurrent([4, 40, 8]);
//
//			await forTest.update(7);
//			await assertCurrent([7, 16, 8]);
//
//			await forTest.update(8);
//			await assertCurrent([8, 8, 8]);

//			await forTest.update(9);
//			await assertCurrent([9, 0, 0]);
//
//			await forTest.update(10);
//			await assertCurrent([10, 0, 0]);
//		})

		it("Test3. One line. cliff = 3  change slope (out cliff) from 20 to 8, week = 5, yes tail", async () => {
			await forTest.add([1, 40, 20], 3);
			await assertCurrent([1, 40, 0]);

			await forTest.update(4);
			await assertCurrent([4, 40, 20]);

			await forTest.changePeriodTest([1, 40, 20], 3, 8, 5);

			await forTest.update(5);
			await assertCurrent([5, 20, 8]);

			await forTest.update(6);
			await assertCurrent([6, 12, 8]);

			await forTest.update(7);
			await assertCurrent([7, 4, 4]);

			await forTest.update(8);
			await assertCurrent([8, 0, 0]);

			await forTest.update(9);
			await assertCurrent([9, 0, 0]);
		})

		it("Test4. One line. cliff = 3  change slope from 20 to 8, week = 4 (point cliff finish), yes tail", async () => {
			await forTest.add([1, 40, 20], 3);
			await assertCurrent([1, 40, 0]);

			await forTest.changePeriodTest([1, 40, 20], 3, 7, 4);

			await forTest.update(5);
			await assertCurrent([5, 33, 7]);

			await forTest.update(8);
			await assertCurrent([8, 12, 7]);

			await forTest.update(9);
			await assertCurrent([9, 5, 5]);

			await forTest.update(10);
			await assertCurrent([10, 0, 0]);
		})

		it("Test5. One line. cliff = 3  change slope from 20 to 5, on week = 6 (out cliff), bias=0, finish nothing to change ", async () => {
			await forTest.add([1, 40, 20], 3);
			await assertCurrent([1, 40, 0]);

			await forTest.update(4);
			await assertCurrent([4, 40, 20]);

			await forTest.changePeriodTest([1, 40, 20], 3, 5, 6);

			await forTest.update(6);
			await assertCurrent([6, 0, 0]);

			await forTest.update(7);
			await assertCurrent([7, 0, 0]);
		})

		it("Test6. One line. cliff = 3  change slope from 20 to 5, on week = 6 (out cliff), tail<newSlope, nothing to change ", async () => {
			await forTest.add([1, 42, 20], 3);
			await assertCurrent([1, 42, 0]);

			await forTest.update(4);
			await assertCurrent([4, 42, 20]);

			await forTest.changePeriodTest([1, 42, 20], 3, 5, 6);

			await forTest.update(6);
			await assertCurrent([6, 2, 2]);

			await forTest.update(7);
			await assertCurrent([7, 0, 0]);
		})

		it("Test7. One line. cliff = 3  change slope from 20 to 5, on week = 6 (out cliff), tail<newSlope, nothing to change ", async () => {
			await forTest.add([1, 45, 20], 3);
			await assertCurrent([1, 45, 0]);

			await forTest.update(4);
			await assertCurrent([4, 45, 20]);

			await forTest.changePeriodTest([1, 45, 20], 3, 5, 6);

			await forTest.update(6);
			await assertCurrent([6, 5, 5]);

			await forTest.update(7);
			await assertCurrent([7, 0, 0]);
		})
//todo: test should work!!!
//		it("Test8. One line. cliff = 3  change slope from 20 to 5, on week = 6 (out cliff), tail<newSlope, nothing to change ", async () => {
//			await forTest.add([1, 59, 20], 3);
//			await assertCurrent([1, 59, 0]);
//
//			await forTest.update(4);
//			await assertCurrent([4, 59, 20]);
//
//			await forTest.changePeriodTest([1, 59, 20], 3, 5, 6);
//
//			await forTest.update(6);
//			await assertCurrent([6, 19, 4]);
//
//			await forTest.update(7);
//			await assertCurrent([7, 0, 0]);
//		})


	})

	describe("Check changes Amount", () => {
		it("Test1. One line, cliff = 0, change amount from 50 to 75, slope works", async () => {
			await forTest.add([1, 100, 10], 0);
			await assertCurrent([1, 100, 10]);

			await forTest.update(2);
			await assertCurrent([2, 90, 10]);

			await forTest.changeAmountTest([1, 100, 10], 0, 25, 6);

			await forTest.update(6);
			await assertCurrent([6, 75, 15]);

			await forTest.update(7);
			await assertCurrent([7, 60, 15]);

			await forTest.update(8);
			await assertCurrent([8, 45, 15]);

			await forTest.update(9);
			await assertCurrent([9, 30, 15]);

			await forTest.update(10);
			await assertCurrent([10, 15, 15]);

			await forTest.update(11);
			await assertCurrent([11, 0, 0]);
		})

		it("Test2. One line. cliff = 3, change amount (in cliff) from 40 to 60, week = 2", async () => {
			await forTest.add([1, 40, 20], 3);
			await assertCurrent([1, 40, 0]);

			await forTest.changeAmountTest([1, 40, 20], 3, 20, 2);

			await forTest.update(3);
			await assertCurrent([3, 60, 0]);

			await forTest.update(4);
			await assertCurrent([4, 60, 30]);

			await forTest.update(5);
			await assertCurrent([5, 30, 30]);

			await forTest.update(6);
			await assertCurrent([6, 0, 0]);

			await forTest.update(7);
			await assertCurrent([7, 0, 0]);
		})

		it("Test3. One line. cliff = 3  change amount (in cliff) from 43 to 65, week = 2, with tail  ", async () => {
			await forTest.add([1, 43, 7], 3);
			await assertCurrent([1, 43, 0]);

			await forTest.changeAmountTest([1, 43, 7], 3, 22, 2);

			await forTest.update(3);
			await assertCurrent([3, 65, 0]);

			await forTest.update(4);
			await assertCurrent([4, 65, 10]);

			await forTest.update(5);
			await assertCurrent([5, 55, 10]);

			await forTest.update(10);
			await assertCurrent([10, 5, 5]);

			await forTest.update(11);
			await assertCurrent([11, 0, 0]);

			await forTest.update(12);
			await assertCurrent([12, 0, 0]);
		})

		it("Test4. One line. cliff = 3, change amount (in cliff finish point) from 40 to 61, week = 4, tail", async () => {
			await forTest.add([1, 40, 20], 3);
			await assertCurrent([1, 40, 0]);

			await forTest.update(3);
			await assertCurrent([3, 40, 0]);

			await forTest.changeAmountTest([1, 40, 20], 3, 21, 4);

			await forTest.update(4);
			await assertCurrent([4, 61, 30]);

			await forTest.update(5);
			await assertCurrent([5, 31, 30]);

			await forTest.update(6);
			await assertCurrent([6, 1, 1]);

			await forTest.update(7);
			await assertCurrent([7, 0, 0]);
		})

		it("Test5. One line. cliff = 3, change amount after cliff from 42 to 60, week = 6, delete tail", async () => {
			await forTest.add([1, 42, 10], 3);
			await assertCurrent([1, 42, 0]);

			await forTest.update(4);
			await assertCurrent([4, 42, 10]);

			await forTest.update(5);
			await assertCurrent([5, 32, 10]);

			await forTest.changeAmountTest([1, 42, 10], 3, 38, 6);

			await forTest.update(7);
			await assertCurrent([7, 30, 30]);

			await forTest.update(8);
			await assertCurrent([8, 0, 0]);
		})

		it("Test6. One line. cliff = 3, change amount in tail after cliff from 42 to 60, week = 6, no change", async () => {
			await forTest.add([1, 42, 10], 3);
			await assertCurrent([1, 42, 0]);

			await forTest.update(7);
			await assertCurrent([7, 12, 10]);

			await forTest.changeAmountTest([1, 42, 10], 3, 38, 8);

			await forTest.update(8);
			await assertCurrent([8, 2, 2]);

			await forTest.update(9);
			await assertCurrent([9, 0, 0]);
		})
	})
})