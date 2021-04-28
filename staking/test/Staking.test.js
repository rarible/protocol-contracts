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
		staking = await Staking.new(token.address);
	})

	describe("Check metods Staking()", () => {

		it("Try to createLock() and check balance", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			rezultLock  = await forTest._createLock(staking.address, accounts[2], 20, 10, 0);
			let idLock;
      truffleAssert.eventEmitted(rezultLock, 'createLockResult', (ev) => {
       	idLock = ev.result;
        return true;
      });

      resultBalanseOfValue  = await forTest._userSypply(staking.address, accounts[2]);
      let balanceOf;
      truffleAssert.eventEmitted(resultBalanseOfValue, 'balanceOfResult', (ev) => {
      	balanceOf = ev.result;
        return true;
      });
			assert.equal(await token.balanceOf(staking.address), 20);				//balance Lock on deposite
  		assert.equal(await token.balanceOf(accounts[2]), 80);			//tail user balance
      assert.equal(idLock, 2);
      assert.equal(balanceOf, 20);
		});

		it("Try to createLock() and check totalBalance", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });

			await forTest._createLock(staking.address ,accounts[2], 30, 10, 0);

			let resultTotalBalance = await forTest._totalSupply(staking.address);
			let totalBalance;
      truffleAssert.eventEmitted(resultTotalBalance, 'totalBalanceResult', (ev) => {
       	totalBalance = ev.result;
        return true;
      });
 			assert.equal(await token.balanceOf(staking.address), 30);				//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
			assert.equal(totalBalance, 30);
		});

//		it("Try to createLock() and check withdraw()", async () => {
//			await token.mint(accounts[2], 100);
//   		await token.approve(staking.address, 1000000, { from: accounts[2] });
//
//			rezultLock  = await forTest._createLock(staking.address ,accounts[2], 30, 3, 0);
//			staking.withdraw();
// 			assert.equal(await token.balanceOf(staking.address), 30);				//balance Lock on deposite
//   		assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
//		});
	})

})