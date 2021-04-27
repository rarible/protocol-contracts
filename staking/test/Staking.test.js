const StakingTest = artifacts.require("StakingTest.sol");
const Staking = artifacts.require("Staking.sol");
const ERC20 = artifacts.require("TestERC20.sol");
const truffleAssert = require('truffle-assertions');

contract("Staking", accounts => {
	let forTest;
	let staking;
	let token;
	let deposite;

	beforeEach(async () => {
		deposite = accounts[1];
		forTest = await StakingTest.new();
		token = await ERC20.new();
		await token.mint(accounts[2], 100);
		resultApprove = await token.approve(accounts[2], 1000000, { from: accounts[2] });
		staking = await Staking.new(token.address, deposite);
	})

	describe("Check metods Staking()", () => {

		it("Try to createLock() and check balance", async () => {
			rezultLock  = await forTest._createLock(staking.address, accounts[2], 20, 2, 0);
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

//		it("Try to createLock() and check totalBalance", async () => {
//			rezultLock  = await forTest._createLock(staking.address ,accounts[2], 30, 3, 0);
//
//			let resultTotalBalance = await forTest._totalSupply(staking.address);
//			let totalBalance;
//      truffleAssert.eventEmitted(resultTotalBalance, 'totalBalanceResult', (ev) => {
//       	totalBalance = ev.result;
//        return true;
//      });
//			assert.equal(totalBalance, 30);
//		});
	})

})