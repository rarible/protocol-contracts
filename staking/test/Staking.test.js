const StakingTest = artifacts.require("StakingTest.sol");
const Staking = artifacts.require("Staking.sol");
const truffleAssert = require('truffle-assertions');

contract("Staking", accounts => {
	let forTest;
	let staking;

	beforeEach(async () => {
		forTest = await StakingTest.new();
		staking = await Staking.new();
	})

	describe("Check metods Staking()", () => {

		it("Try to createLock()", async () => {
			rezultLock  = await forTest._createLock(staking.address ,accounts[2], 20, 2678, 0);

			let idLock;
      truffleAssert.eventEmitted(rezultLock, 'createLockResult', (ev) => {
       	idLock = ev.result;
        return true;
      });
      let balanseOfValue  = await staking.balanceOf(accounts[2]);
      assert.equal(idLock, 2);
      assert.equal(balanseOfValue, 20);
		});

		it("Should balanceOf()", async () => {
			console.log("before balanceOf");
			let tmp  = await staking.balanceOf(accounts[2]);
			console.log("After balanceOf:"+ tmp);
		});

	})

})