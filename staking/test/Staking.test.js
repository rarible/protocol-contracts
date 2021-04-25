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

		it("Try to createLock() and check balance", async () => {
			rezultLock  = await forTest._createLock(staking.address ,accounts[2], 20, 10, 0);
			let idLock;
      truffleAssert.eventEmitted(rezultLock, 'createLockResult', (ev) => {
       	idLock = ev.result;
        return true;
      });

      resultBalanseOfValue  = await forTest._balanceOf(staking.address, accounts[2]);
      let balanceOf;
      truffleAssert.eventEmitted(resultBalanseOfValue, 'balanceOfResult', (ev) => {
      	balanceOf = ev.result;
        return true;
      });

      assert.equal(idLock, 2);
      assert.equal(balanceOf, 20);
		});

		it("Try to createLock() and check totalBalance", async () => {
			rezultLock  = await forTest._createLock(staking.address ,accounts[2], 30, 10, 0);

			let resultTotalBalance = await forTest._totalSupply(staking.address);
			let totalBalance;
      truffleAssert.eventEmitted(resultTotalBalance, 'totalBalanceResult', (ev) => {
       	totalBalance = ev.result;
        return true;
      });
			assert.equal(totalBalance, 30);
		});
	})

})