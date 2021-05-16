const BrokenLineTest = artifacts.require("BrokenLineTest.sol");
const { expectThrow } = require("@daonomic/tests-common");
const truffleAssert = require('truffle-assertions');
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
			await forTest.addTest([1, 101, 10], 0);
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
			await forTest.addTest([1, 100, 10], 0);
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
			await forTest.addTest([1, 20, 10], 0);
			await forTest.addTest([1, 40, 10], 0);
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
			rezultAdd = await forTest.addTest([1, 100, 10], 2);
			let id1;
			truffleAssert.eventEmitted(rezultAdd, 'resultAddLine', (ev) => {
      	id1 = ev.result;
        return true;
      });
      assert.equal(id1,1);
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
			await forTest.addTest([3, 20, 10], 2);
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
			await forTest.addTest([0, 20, 10], 2);
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
			await forTest.addTest([0, 2, 1], 1);
			await assertCurrent([0, 2, 0]);

			await forTest.update(1);
			await assertCurrent([1, 2, 1]);

			await forTest.update(2);
			await assertCurrent([2, 1, 1]);

			await forTest.update(3);
			await assertCurrent([3, 0, 0]);
		});

		it("One line can be added with no cliff(2, 1), begin from 0, check change balance for 2 steps!", async () => {
			await forTest.addTest([0, 2, 1], 0);
			await assertCurrent([0, 2, 1]);

			await forTest.update(1);
			await assertCurrent([1, 1, 1]);

			await forTest.update(2);
			await assertCurrent([2, 0, 0]);

			await forTest.update(3);
			await assertCurrent([3, 0, 0]);
		});

		it("Two line can be added, only one with cliff+tail, no cliff shorter than freeze", async () => {
			await forTest.addTest([1, 35, 10], 3);
			await forTest.addTest([1, 20, 10], 0);
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
			await forTest.addTest([1, 35, 10], 3);
			await forTest.addTest([1, 25, 10], 0);
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
			await forTest.addTest([1, 30, 10], 3);
			await forTest.addTest([1, 25, 5], 0);
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
			await forTest.addTest([1, 30, 10], 3);
			await forTest.addTest([1, 60, 20], 0);
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
			await forTest.addTest([1, 30, 10], 3);
			await forTest.addTest([1, 60, 20], 0);
			await forTest.addTest([1, 120, 40], 0);
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
			await forTest.addTest([1, 30, 10], 3);
			await forTest.addTest([1, 60, 20], 4);
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
			await forTest.addTest([1, 30, 10], 3);
			await forTest.addTest([1, 60, 20], 3);
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
			await forTest.addTest([1, 30, 10], 3);
			await forTest.addTest([1, 60, 20], 3);
			await assertCurrent([1, 90, 0]);

			await forTest.update(3);
			await assertCurrent([3, 90, 0]);
			await expectThrow(
    		forTest.update(2)
    	);
		});

	})

	describe("Check remove", () => {
		it("One line can be added with cliff, step 4 - remove while slope", async () => {
			rezultAdd = await forTest.addTest([1, 100, 10], 2);
			let id1;
			truffleAssert.eventEmitted(rezultAdd, 'resultAddLine', (ev) => {
      	id1 = ev.result;
        return true;
      });
      assert.equal(id1,1);

			await assertCurrent([1, 100, 0]);

			await forTest.update(2);
			await assertCurrent([2, 100, 0]);

			await forTest.update(3);
			await assertCurrent([3, 100, 10]);

			await forTest.update(4);
			await assertCurrent([4, 90, 10]);

			resultRemove = await forTest.removeTest(id1, 4);
			let amount1;
      truffleAssert.eventEmitted(resultRemove, 'resultRemoveLine', (ev) => {
      	amount1 = ev.result;
        return true;
      });
      assert.equal(amount1, 90);

			await forTest.update(5);
    	await assertCurrent([5, 0, 0]);

			await forTest.update(12);
    	await assertCurrent([12, 0, 0]);

		});

		it("One line can be added with cliff, and tail step 3 - remove while cliff", async () => {
			rezultAdd = await forTest.addTest([1, 20, 8], 2);
			await assertCurrent([1, 20, 0]);

			let id1;
			truffleAssert.eventEmitted(rezultAdd, 'resultAddLine', (ev) => {
      	id1 = ev.result;
        return true;
      });

			resultRemove = await forTest.removeTest(id1, 3);
			let amount1;
      truffleAssert.eventEmitted(resultRemove, 'resultRemoveLine', (ev) => {
      	amount1 = ev.result;
        return true;
      });

			await forTest.update(4);
			await assertCurrent([4, 0, 0]);

			await forTest.update(5);
			await assertCurrent([5, 0, 0]);

			await forTest.update(6);
			await assertCurrent([6, 0, 0]);

			await forTest.update(7);
			await assertCurrent([7, 0, 0]);
		});

		it("One line can be added with cliff, and tail step 5 - remove while tail", async () => {
			rezultAdd = await forTest.addTest([1, 20, 8], 2);
			await assertCurrent([1, 20, 0]);

			let id1;
			truffleAssert.eventEmitted(rezultAdd, 'resultAddLine', (ev) => {
      	id1 = ev.result;
        return true;
      });

			resultRemove = await forTest.removeTest(id1, 5);
			let amount1;
      truffleAssert.eventEmitted(resultRemove, 'resultRemoveLine', (ev) => {
      	amount1 = ev.result;
        return true;
      });
			assert.equal(amount1, 4);

			await forTest.update(5);
			await assertCurrent([5, 0, 0]);
		});

		it("Two line can be added with cliff, and tail step 5 - remove while cliff", async () => {
			rezultAdd1 = await forTest.addTest([1, 32, 15], 3);
			rezultAdd2 = await forTest.addTest([1, 39, 12], 3);
			await assertCurrent([1, 71, 0]);

			let id1;
			truffleAssert.eventEmitted(rezultAdd1, 'resultAddLine', (ev) => {
      	id1 = ev.result;
        return true;
      });

			let id2;
			truffleAssert.eventEmitted(rezultAdd2, 'resultAddLine', (ev) => {
      	id2 = ev.result;
        return true;
      });

			resultRemove = await forTest.removeTest(id1, 5);
			let amount1;
      truffleAssert.eventEmitted(resultRemove, 'resultRemoveLine', (ev) => {
      	amount1 = ev.result;
        return true;
      });
			assert.equal(amount1, 17);

			await forTest.update(5);
			await assertCurrent([5, 27, 12]);

			await forTest.update(6);
			await assertCurrent([6, 15, 12]);

			await forTest.update(7);
			await assertCurrent([7, 3, 3]);

			await forTest.update(8);
			await assertCurrent([8, 0, 0]);
		});

	})
})