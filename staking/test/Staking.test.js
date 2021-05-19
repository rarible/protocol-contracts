const StakingTest = artifacts.require("StakingTest.sol");
const Staking = artifacts.require("Staking.sol");
const ERC20 = artifacts.require("TestERC20.sol");
const truffleAssert = require('truffle-assertions');
const tests = require("@daonomic/tests-common");
const increaseTime = tests.increaseTime;
const { expectThrow } = require("@daonomic/tests-common");

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

	describe("Check metods Staking(), createLock, withdraw", () => {

		it("Try to createLock() and check balance", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			rezultLock  = await forTest._createLock(staking.address, accounts[2], 20, 10, 0);
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
			assert.equal(await token.balanceOf(staking.address), 20);				//balance Lock on deposite
  		assert.equal(await token.balanceOf(accounts[2]), 80);			//tail user balance
      assert.equal(idLock, 1);
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

		it("Try to createLock() and check withdraw()", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });

			rezultLock  = await forTest._createLock(staking.address ,accounts[2], 30, 10, 0);
			/*3 week later*/
			await increaseTime(WEEK * 3);
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
   		/*one week later*/
			await increaseTime(WEEK);
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock ondeposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Try to createLock() and check withdraw(), with cliff", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });

			rezultLock  = await forTest._createLock(staking.address ,accounts[2], 30, 10, 3);
			/*3 week later nothing change, because cliff */
			await increaseTime(WEEK * 3);
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 30);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
   		/*one week later*/
			await increaseTime(WEEK);
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 20);	//balance Lock ondeposite
   		assert.equal(await token.balanceOf(accounts[2]), 80);			//tail user balance
		});

		it("Try to createLock() and check withdraw(), from another account, no changes", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });

			rezultLock  = await forTest._createLock(staking.address ,accounts[2], 30, 10, 0);
			/*one week later*/
			await increaseTime(WEEK);
			staking.withdraw({ from: accounts[3] });
 			assert.equal(await token.balanceOf(staking.address), 30);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
		});
	})

	describe("Part1. Check restake() One line only, change slope ", () => {
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

		it("Test2. Change slope createLock()  with cliff, in slope time", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			resultLock  = await forTest._createLock(staking.address ,accounts[2], 30, 10, 3);
			let idLock = eventLockHandler(resultLock);

			await increaseTime(WEEK * 4); //4 week later change, because slope
			let newAmount = 0;
			let newSlope = 5;
			let newCliff = 0;
			resultRestake = await forTest._restake(staking.address, idLock, newAmount, newSlope, newCliff);
			let idNewLock = eventRestakeHandler(resultRestake);
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 20);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 80);			//tail user balance

			await increaseTime(WEEK*2); //2 week later
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 10);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 90);			//user balance

			await increaseTime(WEEK*2); //2 week later
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test3. Change slope createLock()  with cliff, in tail time, bias>newSlope", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			resultLock  = await forTest._createLock(staking.address ,accounts[2], 37, 10, 3);
			let idLock = eventLockHandler(resultLock);

			await increaseTime(WEEK * 6); //4 week later change, because slope
			let newAmount = 0;
			let newSlope = 5;
			let newCliff = 0;
			resultRestake = await forTest._restake(staking.address, idLock, newAmount, newSlope, newCliff);
			let idNewLock = eventRestakeHandler(resultRestake);
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 7);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 93);			//tail user balance

			await increaseTime(WEEK); //week later
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 2);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 98);			//user balance

			await increaseTime(WEEK);
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test4. Change slope createLock()  with cliff, in tail time, bias<newSlope, throw", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			resultLock  = await forTest._createLock(staking.address ,accounts[2], 33, 10, 3);
			let idLock = eventLockHandler(resultLock);

			await increaseTime(WEEK * 6); //4 week later change, because slope
			let newAmount = 0;
			let newSlope = 5;
			let newCliff = 0;
			await expectThrow(
				forTest._restake(staking.address, idLock, newAmount, newSlope, newCliff)
			);
		});
	})

	describe("Part2. Check restake() One line only, change cliff", () => {
		it("Test1. Change cliff createLock()  with cliff, in cliff time", async () => {
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

		it("Test2. Change cliff createLock()  with cliff, in slope time", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			resultLock  = await forTest._createLock(staking.address ,accounts[2], 30, 10, 3);
			let idLock = eventLockHandler(resultLock);

			await increaseTime(WEEK * 5); //5 week later change, because slope
			let newAmount = 0;
			let newSlope = 3;
			let newCliff = 3;
			resultRestake = await forTest._restake(staking.address, idLock, newAmount, newSlope, newCliff);
			let idNewLock = eventRestakeHandler(resultRestake);
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 10);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 90);			//user balance

			await increaseTime(WEEK*3); //3 week later new slope works,nothing change
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 10);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 90);			//user balance

			await increaseTime(WEEK); // week later slope finish
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 7);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 93);			//user balance

			await increaseTime(WEEK*2); //2 week later slope finish, but tail works
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 1);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 99);		// user balance

			await increaseTime(WEEK); // week later tail finish
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);		// user balance
		});

		it("Test3. Change cliff createLock()  with cliff, in tail time", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			resultLock  = await forTest._createLock(staking.address ,accounts[2], 37, 10, 3);
			let idLock = eventLockHandler(resultLock);

			await increaseTime(WEEK * 6); //5 week later change, because slope
			let newAmount = 0;
			let newSlope = 3;
			let newCliff = 3;
			resultRestake = await forTest._restake(staking.address, idLock, newAmount, newSlope, newCliff);
			let idNewLock = eventRestakeHandler(resultRestake);
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 7);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 93);			//user balance

			await increaseTime(WEEK*3); //3 week later new slope works,nothing change
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 7);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 93);			//user balance

			await increaseTime(WEEK); // week later slope finish
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 4);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 96);			//user balance

			await increaseTime(WEEK); //week later slope finish, but tail works
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 1);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 99);		// user balance

			await increaseTime(WEEK); // week later tail finish
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);		// user balance
		});
	})

	describe("Part3. Check restake() One line only, change amount, cliff, slope", () => {
		it("Test1. Change amount createLock()  with cliff, in cliff time", async () => {
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
		it("Test2. Change amount createLock()  with cliff, in slope time", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			resultLock  = await forTest._createLock(staking.address ,accounts[2], 30, 10, 3);
			let idLock = eventLockHandler(resultLock);

			await increaseTime(WEEK * 4); //2 week later nothing change, because cliff
			let newAmount = 20;
			let newSlope = 5;
			let newCliff = 2;
			resultRestake = await forTest._restake(staking.address, idLock, newAmount, newSlope, newCliff);
			let idNewLock = eventRestakeHandler(resultRestake);
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 40);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 60);			//user balance

			await increaseTime(WEEK*2); //2 week later new slope works, nothing change
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 40);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 60);			//user balance

			await increaseTime(WEEK*8); //8 week later slope finish
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);			//user balance
		});
		it("Test3. Change amount createLock()  with cliff, in tail time", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			resultLock  = await forTest._createLock(staking.address ,accounts[2], 33, 10, 3);
			let idLock = eventLockHandler(resultLock);

			await increaseTime(WEEK * 6); //2 week later nothing change, because cliff
			let newAmount = 20;
			let newSlope = 5;
			let newCliff = 2;
			resultRestake = await forTest._restake(staking.address, idLock, newAmount, newSlope, newCliff);
			let idNewLock = eventRestakeHandler(resultRestake);
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 23);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 77);			//user balance

			await increaseTime(WEEK*2); //2 week later new slope works, nothing change
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 23);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 77);			//user balance

			await increaseTime(WEEK*4); //8 week later slope finish
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 3);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 97);			//user balance

			await increaseTime(WEEK); //week later slope finish
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);		//user balance
		});
	})

	describe("Part4. Check restake metods Staking() Two and more lines ", () => {
		it("Test1. Two Lines. Change slope createLock()  with cliff, in cliff time", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await token.mint(accounts[3], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[3] });

			let resultLock1  = await forTest._createLock(staking.address ,accounts[2], 30, 10, 3);
			let idLock1 = eventLockHandler(resultLock1);
			let resultLock2  = await forTest._createLock(staking.address ,accounts[3], 50, 10, 3);
			let idLock2 = eventLockHandler(resultLock2);

			await increaseTime(WEEK * 2); //2 week later nothing change, because cliff
			let newAmount = 0;
			let newSlope = 5;
			let newCliff = 0;
			resultRestake = await forTest._restake(staking.address, idLock2, newAmount, newSlope, newCliff);
			let idNewLock = eventRestakeHandler(resultRestake);
 			assert.equal(await token.balanceOf(staking.address), 80);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
   		assert.equal(await token.balanceOf(accounts[3]), 50);			//tail user balance

			await increaseTime(WEEK); //1 week later
			staking.withdraw({ from: accounts[2] });
			staking.withdraw({ from: accounts[3] });
 			assert.equal(await token.balanceOf(staking.address), 75);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 70);			//user balance
   		assert.equal(await token.balanceOf(accounts[3]), 55);			//user balance

			await increaseTime(WEEK); //1 week later
			staking.withdraw({ from: accounts[2] });
			staking.withdraw({ from: accounts[3] });
 			assert.equal(await token.balanceOf(staking.address), 60);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 80);			//user balance
   		assert.equal(await token.balanceOf(accounts[3]), 60);			//user balance

			await increaseTime(WEEK*2); //2 week later finish Line
			staking.withdraw({ from: accounts[2] });
			staking.withdraw({ from: accounts[3] });
 			assert.equal(await token.balanceOf(staking.address), 30);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
   		assert.equal(await token.balanceOf(accounts[3]), 70);			//tail user balance

			await increaseTime(WEEK*6); //6 week later
			staking.withdraw({ from: accounts[2] });
			staking.withdraw({ from: accounts[3] });
 			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
   		assert.equal(await token.balanceOf(accounts[3]), 100);			//tail user balance
		});
		it("Test2. 3 Lines. Change slope createLock()  with cliff, in cliff time", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await token.mint(accounts[3], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[3] });
			await token.mint(accounts[4], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[4] });

			let resultLock1  = await forTest._createLock(staking.address ,accounts[2], 20, 5, 2);
			let idLock1 = eventLockHandler(resultLock1);
			let resultLock2  = await forTest._createLock(staking.address ,accounts[3], 30, 10, 3);
			let idLock2 = eventLockHandler(resultLock2);
			let resultLock3  = await forTest._createLock(staking.address ,accounts[4], 40, 10, 4);
			let idLock3 = eventLockHandler(resultLock3);

			await increaseTime(WEEK * 4); //4 week later nothing change, because cliff
			let newAmount = 0;
			let newSlope = 5;
			let newCliff = 1;
			resultRestake = await forTest._restake(staking.address, idLock2, newAmount, newSlope, newCliff);
			let idNewLock = eventRestakeHandler(resultRestake);
			staking.withdraw({ from: accounts[2] });
			staking.withdraw({ from: accounts[3] });
			staking.withdraw({ from: accounts[4] });
 			assert.equal(await token.balanceOf(staking.address), 70);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 90);			//tail user balance
   		assert.equal(await token.balanceOf(accounts[3]), 80);			//tail user balance
   		assert.equal(await token.balanceOf(accounts[4]), 60);			//tail user balance

			await increaseTime(WEEK); //1 week later
			staking.withdraw({ from: accounts[2] });
			staking.withdraw({ from: accounts[3] });
			staking.withdraw({ from: accounts[4] });
 			assert.equal(await token.balanceOf(staking.address), 55);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 95);			//tail user balance
   		assert.equal(await token.balanceOf(accounts[3]), 80);			//tail user balance clif work
   		assert.equal(await token.balanceOf(accounts[4]), 70);			//tail user balance

			await increaseTime(WEEK); //1 week later
			staking.withdraw({ from: accounts[2] });
			staking.withdraw({ from: accounts[3] });
			staking.withdraw({ from: accounts[4] });
 			assert.equal(await token.balanceOf(staking.address), 35);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
   		assert.equal(await token.balanceOf(accounts[3]), 85);			//tail user balance clif work
   		assert.equal(await token.balanceOf(accounts[4]), 80);			//tail user balance

			await increaseTime(WEEK*2); //2 week later finish Line
			staking.withdraw({ from: accounts[2] });
			staking.withdraw({ from: accounts[3] });
			staking.withdraw({ from: accounts[4] });
 			assert.equal(await token.balanceOf(staking.address), 5);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
   		assert.equal(await token.balanceOf(accounts[3]), 95);			//tail user balance clif work
   		assert.equal(await token.balanceOf(accounts[4]), 100);			//tail user balance

			await increaseTime(WEEK); // week later
			staking.withdraw({ from: accounts[2] });
			staking.withdraw({ from: accounts[3] });
			staking.withdraw({ from: accounts[4] });
 			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
   		assert.equal(await token.balanceOf(accounts[3]), 100);			//tail user balance
   		assert.equal(await token.balanceOf(accounts[4]), 100);			//tail user balance
		});

		it("Test3. 3 Lines. Change slope, Amount createLock()  with cliff, in tail time", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await token.mint(accounts[3], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[3] });
			await token.mint(accounts[4], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[4] });

			let resultLock1  = await forTest._createLock(staking.address ,accounts[2], 20, 5, 2);
			let idLock1 = eventLockHandler(resultLock1);
			let resultLock2  = await forTest._createLock(staking.address ,accounts[3], 32, 10, 3);
			let idLock2 = eventLockHandler(resultLock2);
			let resultLock3  = await forTest._createLock(staking.address ,accounts[4], 40, 10, 4);
			let idLock3 = eventLockHandler(resultLock3);

			await increaseTime(WEEK * 6); //6 week later nothing change, because cliff
			let newAmount = 20;
			let newSlope = 5;
			let newCliff = 1;
			resultRestake = await forTest._restake(staking.address, idLock2, newAmount, newSlope, newCliff);
			let idNewLock = eventRestakeHandler(resultRestake);
			staking.withdraw({ from: accounts[2] });
			staking.withdraw({ from: accounts[3] });
			staking.withdraw({ from: accounts[4] });
 			assert.equal(await token.balanceOf(staking.address), 42);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
   		assert.equal(await token.balanceOf(accounts[3]), 78);			//tail user balance
   		assert.equal(await token.balanceOf(accounts[4]), 80);			//tail user balance

			await increaseTime(WEEK); //2 week later
			staking.withdraw({ from: accounts[2] });
			staking.withdraw({ from: accounts[3] });
			staking.withdraw({ from: accounts[4] });
 			assert.equal(await token.balanceOf(staking.address), 32);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
   		assert.equal(await token.balanceOf(accounts[3]), 78);			//tail user balance clif work
   		assert.equal(await token.balanceOf(accounts[4]), 90);			//tail user balance

			await increaseTime(WEEK); // week later
			staking.withdraw({ from: accounts[2] });
			staking.withdraw({ from: accounts[3] });
			staking.withdraw({ from: accounts[4] });
 			assert.equal(await token.balanceOf(staking.address), 17);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
   		assert.equal(await token.balanceOf(accounts[3]), 83);			//tail user balance clif work
   		assert.equal(await token.balanceOf(accounts[4]), 100);			//tail user balance

			await increaseTime(WEEK*4); //4 week later
			staking.withdraw({ from: accounts[2] });
			staking.withdraw({ from: accounts[3] });
			staking.withdraw({ from: accounts[4] });
 			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
   		assert.equal(await token.balanceOf(accounts[3]), 100);			//tail user balance
   		assert.equal(await token.balanceOf(accounts[4]), 100);			//tail user balance
		});
	})
})