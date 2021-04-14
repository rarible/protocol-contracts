const ERC20 = artifacts.require("TestERC20.sol");
const RariStake = artifacts.require("RariStakeV1.sol");
const RariStakeState = artifacts.require("RariStakeStateV1.sol");
const RatioFunction = artifacts.require("LinearRatioFunction.sol");

const sign = require("./sign");
const tests = require("@daonomic/tests-common");
const assertEq = tests.assertEq;
const expectThrow = tests.expectThrow;
const increaseTime = tests.increaseTime;

function assertArrayEq(arr1, arr2) {
	assert.equal(arr1.length, arr2.length);
	arr1.forEach((v, idx) => {
		assert.equal(v, arr2[idx]);
	});
}

contract("RariStake", accounts => {
	let token;
	let stake;
	let stakeState;
	let migratedStake;

	const DAY = 86400;
	const YEAR = DAY * 365;

	beforeEach(async () => {
		const ratioFunction = await RatioFunction.deployed();
		token = await ERC20.new();
		stakeState = await RariStakeState.new();
		stake = await RariStake.new(token.address, ratioFunction.address, stakeState.address);
		migratedStake = await RariStake.new(token.address, ratioFunction.address, stakeState.address);
		stakeState.transferOwnership(stake.address);
	});

	it("stake is working for 1 year", async () => {
		assert.equal(await stake.getPower(accounts[0]), 0);
		await token.mint(accounts[0], 100);
		assert.equal(await stake.getPower(accounts[0]), 10);
		await token.approve(stake.address, 100);

		var id = `0x${sign.randomKey()}`;
		await stake.lock(id, 100, YEAR);

		assertEq(await stake.getPower(accounts[0]), 1000);
	});

	it("add is working", async () => {
		assert.equal(await stake.getPower(accounts[0]), 0);
		await token.mint(accounts[0], 1000);
		assert.equal(await stake.getPower(accounts[0]), 100);
		await token.approve(stake.address, 1000);

		var id = `0x${sign.randomKey()}`;
		await stake.lock(id, 100, YEAR);
		assertEq(await stake.getPower(accounts[0]), 1090);

		await stake.add(id, 200);
		assertEq(await stake.getPower(accounts[0]), 3070);

    var ownerStake = await stakeState.getStake(id);
    assertEq(ownerStake.amount, 300);
    assertEq(ownerStake.unlockPeriod, YEAR);
    assertEq(ownerStake.unlockTime, 0);
	});

	it("claim is working", async () => {
		await token.mint(accounts[0], 100);
		await token.approve(stake.address, 100);

		var id = `0x${sign.randomKey()}`;
		await stake.lock(id, 100, /*unlockPeriod = */0);
		assertEq(await token.balanceOf(accounts[0]), 0);
		await stake.unlock(id);
		assert.equal((await stake.getStakes(accounts[0])).length, 1);
		await stake.claim(id);
		assert.equal((await stake.getStakes(accounts[0])).length, 0);

		assertEq(await token.balanceOf(accounts[0]), 100);
		assertEq(await stake.getPower(accounts[0]), 10);
	});

	it("claim removes empty stake from user", async () => {
		await token.mint(accounts[0], 100);
		await token.approve(stake.address, 100);

		var id1 = `0x${sign.randomKey()}`;
		var id2 = `0x${sign.randomKey()}`;
		var id3 = `0x${sign.randomKey()}`;
		await stake.lock(id1, 10, 0);
		await stake.lock(id2, 10, 0);
		await stake.lock(id3, 10, 0);

		await stake.unlock(id1);
		await stake.unlock(id2);
		await stake.unlock(id3);

		const stakes = (await stake.getStakes(accounts[0])).map(s => s[0]);
		assertArrayEq(stakes, [id1, id2, id3]);

		await stake.claim(id1);
		const stakes2 = (await stake.getStakes(accounts[0])).map(s => s[0]);
		assertArrayEq(stakes2, [id2, id3]);

		await stake.claim(id3);
		const stakes3 = (await stake.getStakes(accounts[0])).map(s => s[0]);
		assertArrayEq(stakes3, [id2]);

		await stake.claim(id2);
		const stakes4 = (await stake.getStakes(accounts[0])).map(s => s[0]);
		assertArrayEq(stakes4, []);
	});

	it("claim doesn't work without unstake", async () => {
		await token.mint(accounts[0], 100);
		await token.mint(accounts[1], 1000);
		await token.approve(stake.address, 100);
		await token.approve(stake.address, 1000, { from: accounts[1] });

		var id = `0x${sign.randomKey()}`;
		await stake.lock(id, 100, 0);

		await expectThrow(
			stake.claim(id)
		);
	});

	it("migrate is working", async () => {
		await token.mint(accounts[0], 100);
		await token.mint(accounts[1], 100);
		await token.approve(stake.address, 100);
		await token.approve(stake.address, 100, {from: accounts[1]});

		var id1 = `0x${sign.randomKey()}`;
		await stake.lock(id1, 100, 100000000);
		var id2 = `0x${sign.randomKey()}`;
		await stake.lock(id2, 100, 100000000, {from: accounts[1]});

		await expectThrow(
			stake.claim(id1)
		);

		await stake.migrate(accounts[5]);
		await stake.claim(id1);

		assertEq(await token.balanceOf(accounts[0]), 100);
		assertEq(await stake.getPower(accounts[0]), 10);

		await expectThrow(
			stake.finishMigration()
		);
		await increaseTime(DAY);
		await stake.finishMigration();

		await expectThrow(
			stake.claim(id2, {from: accounts[1]})
		);

		assertEq(await token.balanceOf(accounts[0]), 100);
		assertEq(await token.balanceOf(accounts[5]), 100);
	});

	it("work after migrate", async () => {
		await token.mint(accounts[0], 100);
		await token.approve(stake.address, 100);

		var id = `0x${sign.randomKey()}`;
		await stake.lock(id, 100, 10);
		assertEq(await token.balanceOf(stake.address), 100);

		await stake.migrate(migratedStake.address);

		assertEq(await token.balanceOf(accounts[0]), 0);
		assertEq(await stake.getPower(accounts[0]), 10);
		assertEq(await migratedStake.getPower(accounts[0]), 10);

		await increaseTime(DAY);
		await stake.finishMigration();
		assertEq(await token.balanceOf(stake.address), 0);
		assertEq(await token.balanceOf(migratedStake.address), 100);

		await expectThrow(
			stake.claim(id)
		);

		await migratedStake.unlock(id);
		await increaseTime(DAY);
		await migratedStake.claim(id);

		assertEq(await stake.getPower(accounts[0]), 10);
		assertEq(await migratedStake.getPower(accounts[0]), 10);

		assertEq(await token.balanceOf(accounts[0]), 100);
		assertEq(await token.balanceOf(migratedStake.address), 0);
	});

	it("cancelling migrate works", async () => {
    await token.mint(accounts[0], 100);
    await token.mint(accounts[1], 100);
    await token.approve(stake.address, 100);
    await token.approve(stake.address, 100, {from: accounts[1]});

    var id1 = `0x${sign.randomKey()}`;
    await stake.lock(id1, 100, YEAR);
    var id2 = `0x${sign.randomKey()}`;
    await stake.lock(id2, 100, YEAR, {from: accounts[1]});

    await expectThrow(
      stake.claim(id1)
    );

    await stake.migrate(accounts[5]);
    await stake.claim(id1);

    assertEq(await token.balanceOf(accounts[0]), 100);
    assertEq(await stake.getPower(accounts[0]), 10);

    await stake.cancelMigration();

    await expectThrow(
      stake.claim(id2, {from: accounts[1]})
    );

    await increaseTime(DAY);
    await expectThrow(
      stake.finishMigration()
    );

    await stake.unlock(id2, {from: accounts[1]});
    await increaseTime(YEAR);
    await stake.claim(id2, {from: accounts[1]});

    assertEq(await token.balanceOf(accounts[1]), 100);
	});

  it("migrate again after cancelling migrate", async () => {
    await token.mint(accounts[0], 100);
    await token.approve(stake.address, 100);

    var id = `0x${sign.randomKey()}`;
    await stake.lock(id, 100, DAY);
    assertEq(await token.balanceOf(stake.address), 100);
    assertEq(await token.balanceOf(accounts[0]), 0);

    await stake.migrate(accounts[5]);
    await stake.cancelMigration();

    await stake.migrate(migratedStake.address);
    await increaseTime(DAY);
    await stake.finishMigration();
    assertEq(await token.balanceOf(stake.address), 0);
    assertEq(await token.balanceOf(migratedStake.address), 100);

    await migratedStake.unlock(id);
    await increaseTime(DAY);
    await migratedStake.claim(id);

    assertEq(await token.balanceOf(accounts[0]), 100);
    assertEq(await token.balanceOf(migratedStake.address), 0);
  });

	it("error: cancel migration if migration isn't started", async () => {
    await expectThrow(
      stake.cancelMigration()
    );
	});

	it("error: cancel migration if migration is done", async () => {
    await stake.migrate(accounts[5]);
    await increaseTime(DAY);
    await stake.finishMigration();
    await expectThrow(
      stake.cancelMigration()
    );
	});

	it("claim doesn't work some times", async () => {
		await token.mint(accounts[0], 100);
		await token.mint(accounts[1], 1000);
		await token.approve(stake.address, 100);
		await token.approve(stake.address, 1000, { from: accounts[1] });

		var id = `0x${sign.randomKey()}`;
		await stake.lock(id, 100, 0);
		var id2 = `0x${sign.randomKey()}`;
		await stake.lock(id2, 1000, 0, { from: accounts[1] });

		await stake.unlock(id);
		await stake.claim(id);
		await expectThrow(
			stake.claim(id)
		);

		assertEq(await stake.getPower(accounts[0]), 10);
	});

	it("getPowers and getStakes works", async () => {
		const arr1 = await stake.getPowers([accounts[0], accounts[1]]);
		assert.equal(arr1.length, 2);
		assertEq(arr1[0], 0);
		assertEq(arr1[1], 0);

		await token.mint(accounts[0], 100);
		await token.mint(accounts[1], 1000);

		var id = `0x${sign.randomKey()}`;
		await token.approve(stake.address, 100);
		await stake.lock(id, 100, 0);
		const arr2 = await stake.getPowers([accounts[0], accounts[1]]);
		assert.equal(arr2.length, 2);
		assertEq(arr2[0], 10);
		assertEq(arr2[1], 100);

		const extStakes = await stake.getStakes(accounts[0]);
		assert.equal(extStakes.length, 1);
		assert.equal(extStakes[0][2], 10);
	});

	it("value decreasing after unstake", async () => {
		assert.equal(await stake.getPower(accounts[0]), 0);
		await token.mint(accounts[0], 100);
		assert.equal(await stake.getPower(accounts[0]), 10);
		await token.approve(stake.address, 100);

		var id = `0x${sign.randomKey()}`;
		await stake.lock(id, 100, YEAR);

		assertEq(await stake.getPower(accounts[0]), 1000);
		await stake.unlock(id);
		assertEq(await stake.getPower(accounts[0]), 1000);

		await increaseTime(0.5 * YEAR);
		assertEq(await stake.getPower(accounts[0]), 505);

		await increaseTime(0.5 * YEAR);
		assertEq(await stake.getPower(accounts[0]), 10);

		await increaseTime(0.5 * YEAR);
		assertEq(await stake.getPower(accounts[0]), 10);
	});

	it("claims during unstaking", async () => {
		assertEq(await token.balanceOf(accounts[0]), 0);
		assert.equal(await stake.getPower(accounts[0]), 0);
		await token.mint(accounts[0], 100);
		assertEq(await token.balanceOf(accounts[0]), 100);
		assert.equal(await stake.getPower(accounts[0]), 10);
		await token.approve(stake.address, 100);

		var id = `0x${sign.randomKey()}`;
		await stake.lock(id, 100, YEAR);
		assert.equal((await stake.getStakes(accounts[0])).length, 1);
		assertEq(await token.balanceOf(accounts[0]), 0);

		await stake.unlock(id);
		assertEq(await stake.getPower(accounts[0]), 1000);

		await increaseTime(0.25 * YEAR);
		assertEq(await stake.getPower(accounts[0]), 752);
		await stake.claim(id);
		assertEq(await token.balanceOf(accounts[0]), 25);

		await increaseTime(0.5 * YEAR);
		assertEq(await stake.getPower(accounts[0]), 257);
		await stake.claim(id);
		assertEq(await token.balanceOf(accounts[0]), 75);

		await increaseTime(0.25 * YEAR);
		assertEq(await stake.getPower(accounts[0]), 10);
		assert.equal((await stake.getStakes(accounts[0])).length, 1);

		await stake.claim(id);
		assertEq(await token.balanceOf(accounts[0]), 100);

		assert.equal((await stake.getStakes(accounts[0])).length, 0);
	});

});