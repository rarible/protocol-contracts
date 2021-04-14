const BrokenLineTest = artifacts.require("BrokenLineTest.sol");

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

	it("should update if no line added", async () => {
		await forTest.update(0);
		await assertCurrent([0, 0, 0])

		await forTest.update(10);
		let current = await forTest.getCurrent();
		await assertCurrent([10, 0, 0])
	});

	it("one line can be added, end works", async () => {
		await forTest.add([1, 101, 10]);
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

	it("one line with no mod should work", async () => {
		await forTest.add([1, 100, 10]);
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

	it("some lines can be added at one time", async () => {
		await forTest.add([1, 20, 10]);
		await forTest.add([1, 40, 10]);
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