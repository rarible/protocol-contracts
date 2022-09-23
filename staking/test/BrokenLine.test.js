const BrokenLineTest = artifacts.require("BrokenLineTest.sol");
const { expectThrow } = require("@daonomic/tests-common");
const truffleAssert = require('truffle-assertions');
contract("BrokenLine", accounts => {
	let forTest;

	async function assertCurrent(line) {
		const current = await forTest.getCurrent();
		assert.equal(current[0], line[0]);  //start
		assert.equal(current[1], line[1]);  //bias
		assert.equal(current[2], line[2]);  //slope
	}

	beforeEach(async () => {
		forTest = await BrokenLineTest.new();
	})

	describe("Check actualBackValue", () => {
    it("Test1. One line can be added with cliff, back values detect from slope", async () => {
    	let id1 = 256;
    	// struct Line: start, bias, slope
    	await forTest.addTest([1, 100, 10], id1, 4); //Line, id, cliff
    	await forTest.update(1);
    	await assertCurrent([1, 100, 0]);

    	await forTest.update(5);
    	await assertCurrent([5, 100, 10]); // timeStamp, bias, slope

    	await forTest.update(10);
    	await assertCurrent([10, 50, 10]); // timeStamp, bias, slope

    	await forTest.update(15);
    	await assertCurrent([15, 0, 0]); // line is finished

    	await forTest.update(16);
    	await assertCurrent([16, 0, 0]); // timeStamp, bias, slope
      //      Line already finished, but we can define some history
    	let amountSlope;
    	amountSlope = await forTest.getActualValueBack.call(9); //what about 1 week ago
    	assert.equal(amountSlope[0], 60);  //bias
      assert.equal(amountSlope[1], 10);  //slope

      amountSlope = await forTest.getActualValueBack.call(6); //what about 4 week ago
  		assert.equal(amountSlope[0], 90);  //bias
      assert.equal(amountSlope[1], 10);  //slope

      amountSlope = await forTest.getActualValueBack.call(5); //what about 5 week ago
    	assert.equal(amountSlope[0], 100);  //bias
      assert.equal(amountSlope[1], 0);  //slope

      amountSlope = await forTest.getActualValueBack.call(4); //what about 6 week ago
    	assert.equal(amountSlope[0], 100);  //bias
      assert.equal(amountSlope[1], 0);  //slope

      amountSlope = await forTest.getActualValueBack.call(3); //what about 7 week ago
    	assert.equal(amountSlope[0], 100);  //bias
      assert.equal(amountSlope[1], 0);  //slope

      amountSlope = await forTest.getActualValueBack.call(1); //what about 9 week ago
    	assert.equal(amountSlope[0], 100);  //bias
      assert.equal(amountSlope[1], 0);  //slope

      amountSlope = await forTest.getActualValueBack.call(0); //what about 10 week ago
    	assert.equal(amountSlope[0], 0);  //bias
      assert.equal(amountSlope[1], 0);  //slope
  		});

    it("Test2. Second cliff+slope line added to cliff, back values detect from slope", async () => {
    	let id1 = 255;
    	let id2 = 256;
    	// struct Line: start, bias, slope
    	await forTest.addTest([1, 100, 10], id1, 4); //Line, id, cliff from 1 to 5 timeWeek
    	await forTest.update(1);
    	await assertCurrent([1, 100, 0]);

    	await forTest.update(3);
    	await assertCurrent([3, 100, 0]); // timeStamp, bias, slope

    	//add one more Line
    	await forTest.addTest([3, 100, 10], id2, 2); //Line, id, cliff from 3 to 5 timeWeek

    	await forTest.update(10);
    	await assertCurrent([10, 100, 20]); // timeStamp, bias, slope

    	await forTest.update(15);
    	await assertCurrent([15, 0, 0]); // line is finished

    	await forTest.update(16);
    	await assertCurrent([16, 0, 0]); // timeStamp, bias, slope
      //      Line already finished, but we can define some history
      amountSlope = await forTest.getActualValueBack.call(14); //what about 1 week ago
    	assert.equal(amountSlope[0], 20);  //bias
      assert.equal(amountSlope[1], 20);  //slope

      amountSlope = await forTest.getActualValueBack.call(5); //what about 10 week ago
    	assert.equal(amountSlope[0], 200);  //bias
      assert.equal(amountSlope[1], 0);  //slope

      amountSlope = await forTest.getActualValueBack.call(3); //what about 12 week ago
    	assert.equal(amountSlope[0], 200);  //bias
      assert.equal(amountSlope[1], 0);  //slope

      amountSlope = await forTest.getActualValueBack.call(2); //what about 13 week ago
    	assert.equal(amountSlope[0], 100);  //bias
      assert.equal(amountSlope[1], 0);  //slope

  		});
  })

	describe("Check actualBackValue after remove Line", () => {
    it("Test1. One line can be added with cliff, remove() from cliff", async () => {
    	let id1 = 256;
    	// struct Line: start, bias, slope
    	await forTest.addTest([1, 100, 10], id1, 4); //Line, id, cliff
    	await forTest.update(1);
    	await assertCurrent([1, 100, 0]);

    	await forTest.update(3);
    	await assertCurrent([3, 100, 0]); // timeStamp, bias, slope

			resultRemove = await forTest.removeTest(id1, 3);
			let amountRemove;
			let slopeRemove;
			let cliffRemove;
      truffleAssert.eventEmitted(resultRemove, 'resultRemoveLine', (ev) => {
      	amountRemove = ev.bias;
      	slopeRemove = ev.slope;
        cliffRemove = ev.cliff;
        return true;
      });
			assert.equal(amountRemove, 100);
			assert.equal(slopeRemove, 10);
			assert.equal(cliffRemove, 2);
      await assertCurrent([3, 0, 0]);

      amountSlope = await forTest.getActualValueBack.call(3); //what about 1 week ago
    	assert.equal(amountSlope[0], 0);  //bias
      assert.equal(amountSlope[1], 0);  //slope

      amountSlope = await forTest.getActualValueBack.call(2); //what about 2 week ago
    	assert.equal(amountSlope[0], 100);  //bias
      assert.equal(amountSlope[1], 0);  //slope

      amountSlope = await forTest.getActualValueBack.call(1); //what about 3 week ago
    	assert.equal(amountSlope[0], 100);  //bias
      assert.equal(amountSlope[1], 0);  //slope
  	});

    it("Test2. One line can be added with cliff, remove() from slopePeriod", async () => {
    	let id1 = 256;
    	// struct Line: start, bias, slope
    	await forTest.addTest([1, 100, 10], id1, 4); //Line, id, cliff
    	await forTest.update(1);
    	await assertCurrent([1, 100, 0]);

    	await forTest.update(3);
    	await assertCurrent([3, 100, 0]); // timeStamp, bias, slope

			resultRemove = await forTest.removeTest(id1, 10);
			let amountRemove;
			let slopeRemove;
			let cliffRemove;
      truffleAssert.eventEmitted(resultRemove, 'resultRemoveLine', (ev) => {
      	amountRemove = ev.bias;
      	slopeRemove = ev.slope;
        cliffRemove = ev.cliff;
        return true;
      });
			assert.equal(amountRemove, 50);
			assert.equal(slopeRemove, 10);
			assert.equal(cliffRemove, 0);
      await assertCurrent([10, 0, 0]);

      amountSlope = await forTest.getActualValueBack.call(9); //what about 1 week ago
    	assert.equal(amountSlope[0], 60);  //bias
      assert.equal(amountSlope[1], 10);  //slope

      amountSlope = await forTest.getActualValueBack.call(2); //what about 1 week ago
    	assert.equal(amountSlope[0], 100);  //bias
      assert.equal(amountSlope[1], 0);  //slope

      amountSlope = await forTest.getActualValueBack.call(1); //what about 1 week ago
    	assert.equal(amountSlope[0], 100);  //bias
      assert.equal(amountSlope[1], 0);  //slope

  	});

    it("Test3. Second cliff only line added to cliff, back values detect from slope", async () => {
      let id1 = 255;
      let id2 = 256;
      // struct Line: start, bias, slope
      await forTest.addTest([1, 100, 10], id1, 4); //Line, id, cliff from 1 to 5 timeWeek
      await forTest.update(1);
      await assertCurrent([1, 100, 0]);

      await forTest.update(3);
      await assertCurrent([3, 100, 0]); // timeStamp, bias, slope

      //add one more Line
      await forTest.addTest([3, 100, 10], id2, 2); //Line, id, cliff from 3 to 5 timeWeek

			resultRemove = await forTest.removeTest(id1, 4);
			let amountRemove;
			let slopeRemove;
			let cliffRemove;
      truffleAssert.eventEmitted(resultRemove, 'resultRemoveLine', (ev) => {
      	amountRemove = ev.bias;
      	slopeRemove = ev.slope;
        cliffRemove = ev.cliff;
        return true;
      });
			assert.equal(amountRemove, 100);
			assert.equal(slopeRemove, 10);
			assert.equal(cliffRemove, 1);
      await assertCurrent([4, 100, 0]);

      await forTest.update(10);
      await assertCurrent([10, 50, 10]); // timeStamp, bias, slope

      await forTest.update(15);
      await assertCurrent([15, 0, 0]); // line is finished

      await forTest.update(16);
      await assertCurrent([16, 0, 0]); // timeStamp, bias, slope
      //      Line already finished, but we can define some history
      amountSlope = await forTest.getActualValueBack.call(14); //what about 1 week ago
      assert.equal(amountSlope[0], 10);  //bias
      assert.equal(amountSlope[1], 10);  //slope

      amountSlope = await forTest.getActualValueBack.call(5); //what about 10 week ago
      assert.equal(amountSlope[0], 100);  //bias
      assert.equal(amountSlope[1], 0);  //slope

      amountSlope = await forTest.getActualValueBack.call(4); //what about 12 week ago
      assert.equal(amountSlope[0], 100);  //bias
      assert.equal(amountSlope[1], 0);  //slope

      amountSlope = await forTest.getActualValueBack.call(3); //what about 13 week ago
      assert.equal(amountSlope[0], 200);  //bias
      assert.equal(amountSlope[1], 0);  //slope

      amountSlope = await forTest.getActualValueBack.call(2); //what about 13 week ago
      assert.equal(amountSlope[0], 100);  //bias
      assert.equal(amountSlope[1], 0);  //slope

    });

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
			await forTest.addTest([1, 101, 10], 1, 0);
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
			await forTest.addTest([1, 100, 10], 1, 0);
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
			await forTest.addTest([1, 20, 10], 1, 0);
			await forTest.addTest([1, 40, 10], 2, 0);
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

		it("Check line.bias == line.slope with cliff", async () => {
			await forTest.addTest([1, 20, 20], 1, 2);
			await assertCurrent([1, 20, 0]);

			await forTest.update(2);
			await assertCurrent([2, 20, 0]);

			await forTest.update(3);
			await assertCurrent([3, 20, 20]);

			await forTest.update(4);
			await assertCurrent([4, 0, 0]);
		})


		it("Add line with the same id, expect throw ", async () => {
			let id = 1;
			await forTest.addTest([1, 20, 10], id, 0);
			await expectThrow(
    		forTest.addTest([1, 40, 10], id, 0)
    	);
		})

		it("Add line with slope == 0, expect throw ", async () => {
			let id = 1;
			await expectThrow(
    		forTest.addTest([1, 40, 0], id, 0)
    	);
		})

		it("Add line with slope>bias, expect throw ", async () => {
			let id = 1;
			await expectThrow(
    		forTest.addTest([1, 40, 100], id, 0)
    	);
		})


	})

	describe("Check with cliff", () => {

		it("One line can be added with cliff", async () => {
			await forTest.addTest([1, 100, 10], 1, 2);

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
			await forTest.addTest([3, 20, 10], 1, 2);
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
			await forTest.addTest([0, 20, 10], 1, 2);
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
			await forTest.addTest([0, 2, 1], 1, 1);
			await assertCurrent([0, 2, 0]);

			await forTest.update(1);
			await assertCurrent([1, 2, 1]);

			await forTest.update(2);
			await assertCurrent([2, 1, 1]);

			await forTest.update(3);
			await assertCurrent([3, 0, 0]);
		});

		it("One line can be added with no cliff(2, 1), begin from 0, check change balance for 2 steps!", async () => {
			await forTest.addTest([0, 2, 1], 1, 0);
			await assertCurrent([0, 2, 1]);

			await forTest.update(1);
			await assertCurrent([1, 1, 1]);

			await forTest.update(2);
			await assertCurrent([2, 0, 0]);

			await forTest.update(3);
			await assertCurrent([3, 0, 0]);
		});

		it("Two line can be added, only one with cliff+tail, no cliff shorter than freeze", async () => {
			await forTest.addTest([1, 35, 10], 1, 3);
			await forTest.addTest([1, 20, 10], 2, 0);
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
			await forTest.addTest([1, 35, 10], 1, 3);
			await forTest.addTest([1, 25, 10], 2, 0);
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
			await forTest.addTest([1, 30, 10], 1, 3);
			await forTest.addTest([1, 25, 5], 2, 0);
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
			await forTest.addTest([1, 30, 10], 1, 3);
			await forTest.addTest([1, 60, 20], 2, 0);
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
			await forTest.addTest([1, 30, 10], 1, 3);
			await forTest.addTest([1, 60, 20], 2, 0);
			await forTest.addTest([1, 120, 40], 3, 0);
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
			await forTest.addTest([1, 30, 10], 1, 3);
			await forTest.addTest([1, 60, 20], 2, 4);
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
			await forTest.addTest([1, 30, 10], 1, 3);
			await forTest.addTest([1, 60, 20], 2, 3);
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
			await forTest.addTest([1, 30, 10], 1, 3);
			await forTest.addTest([1, 60, 20], 2, 3);
			await assertCurrent([1, 90, 0]);

			await forTest.update(3);
			await assertCurrent([3, 90, 0]);
			await expectThrow(
    		forTest.update(2)
    	);
		});

	})

	describe("Check remove", () => {
		it("Test1. One line can be added with cliff, step 4 - remove while slope", async () => {
			let id1 = 256;
			await forTest.addTest([1, 100, 10], id1, 2);
			await assertCurrent([1, 100, 0]);

			await forTest.update(2);
			await assertCurrent([2, 100, 0]);

			await forTest.update(3);
			await assertCurrent([3, 100, 10]);

			await forTest.update(4);
			await assertCurrent([4, 90, 10]);

			resultRemove = await forTest.removeTest(id1, 4);
			let amount1;
			let slope1;
      truffleAssert.eventEmitted(resultRemove, 'resultRemoveLine', (ev) => {
      	amount1 = ev.bias;
      	slope1 = ev.slope;
        return true;
      });
      assert.equal(amount1, 90);
      assert.equal(slope1, 10);

			await forTest.update(5);
    	await assertCurrent([5, 0, 0]);

			await forTest.update(12);
    	await assertCurrent([12, 0, 0]);

		});

		it("Test2. One line can be added with cliff, and tail step 3 - remove while cliff", async () => {
			let id1 = 2;
			await forTest.addTest([1, 20, 8], id1, 2);
			await assertCurrent([1, 20, 0]);

			resultRemove = await forTest.removeTest(id1, 3);
			let amount;
			let cliff;
			let slope;
      truffleAssert.eventEmitted(resultRemove, 'resultRemoveLine', (ev) => {
      	amount = ev.bias;
      	cliff = ev.cliff;
      	slope = ev.slope;
        return true;
      });
      assert.equal(amount, 20);
      assert.equal(cliff, 0);
      assert.equal(slope, 8);
      await assertCurrent([3, 0, 0]);

      await forTest.update(3);
			await assertCurrent([3, 0, 0]);

			await forTest.update(4);
			await assertCurrent([4, 0, 0]);

			await forTest.update(5);
			await assertCurrent([5, 0, 0]);

			await forTest.update(6);
			await assertCurrent([6, 0, 0]);

			await forTest.update(7);
			await assertCurrent([7, 0, 0]);
		});

		it("Test3. One line can be added with cliff, and tail step 5 - remove while tail", async () => {
			let id1 = 3;
			await forTest.addTest([1, 20, 8], id1, 2);
			await assertCurrent([1, 20, 0]);

			resultRemove = await forTest.removeTest(id1, 5);
			let amount1;
      truffleAssert.eventEmitted(resultRemove, 'resultRemoveLine', (ev) => {
      	amount1 = ev.bias;
        return true;
      });
			assert.equal(amount1, 4);

			await forTest.update(5);
			await assertCurrent([5, 0, 0]);
		});

		it("Test4. Check remove line whith unknown id, expect throw", async () => {
			let id1 = 3;
			await forTest.addTest([1, 20, 8], id1, 2);
			await assertCurrent([1, 20, 0]);
      let idUnknown = 213;
			await expectThrow(
    		forTest.removeTest(idUnknown, 5)
    	);
		});

		it("Test5. Two line can be added with cliff, and tail step 5 - remove when cliff begin", async () => {
			let id1 = 4;
			let id2 = 5;
			await forTest.addTest([1, 32, 15], id1, 3);
			await forTest.addTest([1, 39, 12], id2, 3);
			await assertCurrent([1, 71, 0]);

			resultRemove = await forTest.removeTest(id1, 1);
			let amount;
      truffleAssert.eventEmitted(resultRemove, 'resultRemoveLine', (ev) => {
      	amount = ev.bias;
      	slope = ev.slope;
        cliff = ev.cliff;
        return true;
      });
			assert.equal(amount, 32);
			assert.equal(slope, 15);
			assert.equal(cliff, 3);

			await forTest.update(5);
			await assertCurrent([5, 27, 12]);

			await forTest.update(6);
			await assertCurrent([6, 15, 12]);

			await forTest.update(7);
			await assertCurrent([7, 3, 3]);

			await forTest.update(8);
			await assertCurrent([8, 0, 0]);
		});

		it("Test6. Two line can be added with cliff, and tail step 5 - remove while cliff", async () => {
			let id1 = 4;
			let id2 = 5;
			await forTest.addTest([1, 32, 15], id1, 3);
			await forTest.addTest([1, 39, 12], id2, 3);
			await assertCurrent([1, 71, 0]);

			resultRemove = await forTest.removeTest(id1, 2);
			let amount;
      truffleAssert.eventEmitted(resultRemove, 'resultRemoveLine', (ev) => {
      	amount = ev.bias;
      	slope = ev.slope;
        cliff = ev.cliff;
        return true;
      });
			assert.equal(amount, 32);
			assert.equal(slope, 15);
			assert.equal(cliff, 2);

			await forTest.update(5);
			await assertCurrent([5, 27, 12]);

			await forTest.update(6);
			await assertCurrent([6, 15, 12]);

			await forTest.update(7);
			await assertCurrent([7, 3, 3]);

			await forTest.update(8);
			await assertCurrent([8, 0, 0]);
		});

		it("Test7. Two line can be added with cliff, and tail step 5 - remove when cliff finish", async () => {
			let id1 = 4;
			let id2 = 5;
			await forTest.addTest([1, 32, 15], id1, 3);
			await forTest.addTest([1, 39, 12], id2, 3);
			await assertCurrent([1, 71, 0]);

			resultRemove = await forTest.removeTest(id1, 4);
			let amount;
      truffleAssert.eventEmitted(resultRemove, 'resultRemoveLine', (ev) => {
      	amount = ev.bias;
      	slope = ev.slope;
        cliff = ev.cliff;
        return true;
      });
			assert.equal(amount, 32);
			assert.equal(slope, 15);
			assert.equal(cliff, 0);

			await forTest.update(5);
			await assertCurrent([5, 27, 12]);

			await forTest.update(6);
			await assertCurrent([6, 15, 12]);

			await forTest.update(7);
			await assertCurrent([7, 3, 3]);

			await forTest.update(8);
			await assertCurrent([8, 0, 0]);
		});

		it("Test8. Two line can be added with cliff, and tail step 5 - remove while slope", async () => {
			let id1 = 4;
			let id2 = 5;
			await forTest.addTest([1, 32, 15], id1, 3);
			await forTest.addTest([1, 39, 12], id2, 3);
			await assertCurrent([1, 71, 0]);

			resultRemove = await forTest.removeTest(id1, 5);
			let amount;
      truffleAssert.eventEmitted(resultRemove, 'resultRemoveLine', (ev) => {
      	amount = ev.bias;
      	slope = ev.slope;
        cliff = ev.cliff;
        return true;
      });
			assert.equal(amount, 17);
			assert.equal(slope, 15);
			assert.equal(cliff, 0);

			await forTest.update(5);
			await assertCurrent([5, 27, 12]);

			await forTest.update(6);
			await assertCurrent([6, 15, 12]);

			await forTest.update(7);
			await assertCurrent([7, 3, 3]);

			await forTest.update(8);
			await assertCurrent([8, 0, 0]);
		});

		it("Test9. One line can be added with cliff, and tail step 5 - remove when finish return: bias = 0, cliff = 0", async () => {
			let id1 = 3;
			await forTest.addTest([1, 20, 10], id1, 2);
			await assertCurrent([1, 20, 0]);

			resultRemove = await forTest.removeTest(id1, 6);
			let amount;
			let slope;
			let cliff;
      truffleAssert.eventEmitted(resultRemove, 'resultRemoveLine', (ev) => {
      	amount = ev.bias;
      	slope = ev.slope;
      	cliff = ev.cliff;
        return true;
      });
			assert.equal(amount, 0);
//			assert.equal(slope, 10); //to do: think why here were 10? Line is already finished
			assert.equal(slope, 0);
			assert.equal(cliff, 0);
		});

	})


})