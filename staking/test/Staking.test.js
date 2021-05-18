const StakingTest = artifacts.require("StakingTest.sol");
const Staking = artifacts.require("Staking.sol");
const ERC20 = artifacts.require("TestERC20.sol");
const truffleAssert = require('truffle-assertions');
const tests = require("@daonomic/tests-common");
const increaseTime = tests.increaseTime;

contract("Staking", accounts => {
	let forTest;
	let staking;
	let token;
	let deposite;

	const DAY = 86400;
 	const WEEK = DAY * 7;
 	const MONTH = WEEK * 4;
 	const YEAR = DAY * 365;

	function eventRestakeHandler(resultRestake){
		let idNewLock;
    truffleAssert.eventEmitted(resultRestake, 'restakeResult', (ev) => {
    	idNewLock = ev.result;
      return true;
    });
    return idNewLock;
	}

	function eventLockHandler(resultLock){
		let idLock;
    truffleAssert.eventEmitted(resultLock, 'createLockResult', (ev) => {
    	idLock = ev.result;
      return true;
    });
    return idLock;
	}

	beforeEach(async () => {
		deposite = accounts[1];
		forTest = await StakingTest.new();
		token = await ERC20.new();
		staking = await Staking.new(token.address);
	})

//	describe("Check metods Staking()", () => {
//
//		it("Try to createLock() and check balance", async () => {
//			await token.mint(accounts[2], 100);
//   		await token.approve(staking.address, 1000000, { from: accounts[2] });
//			rezultLock  = await forTest._createLock(staking.address, accounts[2], 20, 10, 0);
//			let idLock;
//      truffleAssert.eventEmitted(rezultLock, 'createLockResult', (ev) => {
//       	idLock = ev.result;
//        return true;
//      });
//
//      resultBalanseOfValue  = await forTest._balanceOf(staking.address, accounts[2]);
//      let balanceOf;
//      truffleAssert.eventEmitted(resultBalanseOfValue, 'balanceOfResult', (ev) => {
//      	balanceOf = ev.result;
//        return true;
//      });
//			assert.equal(await token.balanceOf(staking.address), 20);				//balance Lock on deposite
//  		assert.equal(await token.balanceOf(accounts[2]), 80);			//tail user balance
//      assert.equal(idLock, 2);
//      assert.equal(balanceOf, 20);
//		});
//
//		it("Try to createLock() and check totalBalance", async () => {
//			await token.mint(accounts[2], 100);
//   		await token.approve(staking.address, 1000000, { from: accounts[2] });
//
//			await forTest._createLock(staking.address ,accounts[2], 30, 10, 0);
//
//			let resultTotalBalance = await forTest._totalSupply(staking.address);
//			let totalBalance;
//      truffleAssert.eventEmitted(resultTotalBalance, 'totalBalanceResult', (ev) => {
//       	totalBalance = ev.result;
//        return true;
//      });
// 			assert.equal(await token.balanceOf(staking.address), 30);				//balance Lock on deposite
//   		assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
//			assert.equal(totalBalance, 30);
//		});
//
//		it("Try to createLock() and check withdraw()", async () => {
//			await token.mint(accounts[2], 100);
//   		await token.approve(staking.address, 1000000, { from: accounts[2] });
//
//			rezultLock  = await forTest._createLock(staking.address ,accounts[2], 30, 10, 0);
//			/*3 week later*/
//			await increaseTime(WEEK * 3);
//			staking.withdraw({ from: accounts[2] });
// 			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
//   		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
//   		/*one week later*/
//			await increaseTime(WEEK);
//			staking.withdraw({ from: accounts[2] });
// 			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock ondeposite
//   		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
//		});
//
//		it("Try to createLock() and check withdraw(), with cliff", async () => {
//			await token.mint(accounts[2], 100);
//   		await token.approve(staking.address, 1000000, { from: accounts[2] });
//
//			rezultLock  = await forTest._createLock(staking.address ,accounts[2], 30, 10, 3);
//			/*3 week later nothing change, because cliff */
//			await increaseTime(WEEK * 3);
//			staking.withdraw({ from: accounts[2] });
// 			assert.equal(await token.balanceOf(staking.address), 30);	//balance Lock on deposite
//   		assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
//   		/*one week later*/
//			await increaseTime(WEEK);
//			staking.withdraw({ from: accounts[2] });
// 			assert.equal(await token.balanceOf(staking.address), 20);	//balance Lock ondeposite
//   		assert.equal(await token.balanceOf(accounts[2]), 80);			//tail user balance
//		});
//
//		it("Try to createLock() and check withdraw(), from another account, no changes", async () => {
//			await token.mint(accounts[2], 100);
//   		await token.approve(staking.address, 1000000, { from: accounts[2] });
//
//			rezultLock  = await forTest._createLock(staking.address ,accounts[2], 30, 10, 0);
//			/*one week later*/
//			await increaseTime(WEEK);
//			staking.withdraw({ from: accounts[3] });
// 			assert.equal(await token.balanceOf(staking.address), 30);	//balance Lock on deposite
//   		assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
//		});
//	})

	describe("Check restake metods Staking()", () => {
		it("Test1. Change slope createLock()  with cliff, in cliff time", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			resultLock  = await forTest._createLock(staking.address ,accounts[2], 30, 10, 3);
			let idLock = eventLockHandler(resultLock);

			await increaseTime(WEEK * 2); //2 week later nothing change, because cliff
			let newAmount = 0;
			let newSlope = 5;
			let newCliff = 0;
			resultRestake = await forTest._restake(staking.address, idLock, newAmount, newSlope, newCliff);
			let idNewLock = eventRestakeHandler(resultRestake);
 			assert.equal(await token.balanceOf(staking.address), 30);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance

			await increaseTime(WEEK*2); //2 week later
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 20);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 80);			//user balance

			await increaseTime(WEEK*4); //4 week later
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test2. Change cliff createLock()  with cliff, in cliff time", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			resultLock  = await forTest._createLock(staking.address ,accounts[2], 30, 10, 3);
			let idLock = eventLockHandler(resultLock);

			await increaseTime(WEEK * 2); //2 week later nothing change, because cliff
			let newAmount = 0;
			let newSlope = 5;
			let newCliff = 3;
			resultRestake = await forTest._restake(staking.address, idLock, newAmount, newSlope, newCliff);
			let idNewLock = eventRestakeHandler(resultRestake);
 			assert.equal(await token.balanceOf(staking.address), 30);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 70);			//user balance

			await increaseTime(WEEK*3); //3 week later new slope works,nothing change
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 30);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 70);			//user balance

			await increaseTime(WEEK); // week later slope finish
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 25);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 75);			//user balance

			await increaseTime(WEEK*5); //5 week later slope finish
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);		// user balance
		});

		it("Test3. Change amount createLock()  with cliff, in cliff time", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			resultLock  = await forTest._createLock(staking.address ,accounts[2], 30, 10, 3);
			let idLock = eventLockHandler(resultLock);

			await increaseTime(WEEK * 2); //2 week later nothing change, because cliff
			let newAmount = 20;
			let newSlope = 5;
			let newCliff = 3;
			resultRestake = await forTest._restake(staking.address, idLock, newAmount, newSlope, newCliff);
			let idNewLock = eventRestakeHandler(resultRestake);
 			assert.equal(await token.balanceOf(staking.address), 50);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 50);			//user balance

			await increaseTime(WEEK*3); //3 week later new slope works,nothing change
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 50);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 50);			//user balance

			await increaseTime(WEEK); // week later slope finish
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 45);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 55);			//user balance

			await increaseTime(WEEK*9); //9 week later slope finish
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);		// user balance
		});

	})
})