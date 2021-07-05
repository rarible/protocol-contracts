const Staking = artifacts.require("Staking.sol");
const ERC20 = artifacts.require("TestERC20.sol");
const TestNewStaking = artifacts.require("TestNewStaking.sol");
const TestStaking = artifacts.require("TestStaking.sol");
const TestNewStakingNoInterface = artifacts.require("TestNewStakingNoInteface.sol");
const truffleAssert = require('truffle-assertions');
const tests = require("@daonomic/tests-common");
const increaseTime = tests.increaseTime;
const { expectThrow } = require("@daonomic/tests-common");

contract("Staking", accounts => {
	let staking;
	let testStaking;
	let token;
	let deposite;

	const DAY = 86400;
 	const WEEK = DAY * 7;
 	const MONTH = WEEK * 4;
 	const YEAR = DAY * 365;

	beforeEach(async () => {
		deposite = accounts[1];
		token = await ERC20.new();
		staking = await Staking.new();
		newStaking = await TestNewStaking.new();
		testStaking = await TestStaking.new();
		newStakingNoInterface = await TestNewStakingNoInterface.new();
		await staking.__Staking_init(token.address); //initialize, set owner
	})

	describe("Part1. Check base metods Staking contract, createLock, withdraw", () => {

		it("Test1. Try to createLock() and check balance", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 20, 10, 0, { from: accounts[2] });
      balanceOf  = await staking.balanceOf.call(accounts[2]);

			assert.equal(await token.balanceOf(staking.address), 20);				//balance Lock on deposite
  		assert.equal(await token.balanceOf(accounts[2]), 80);			//tail user balance
      assert.equal(balanceOf, 21);
		});

		it("Test2. Try to createLock() and check totalBalance", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
      await staking.stake(accounts[2], accounts[2], 30, 10, 0, { from: accounts[2] });

			let totalBalance = await staking.totalSupply.call();
 			assert.equal(await token.balanceOf(staking.address), 30);				//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
			assert.equal(totalBalance, 31);
		});

		it("Test3. Try to createLock() and check withdraw()", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
      await staking.stake(accounts[2], accounts[2], 30, 10, 0, { from: accounts[2] });
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

		it("Test4. Try to createLock() and check withdraw(), with cliff", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 30, 10, 3, { from: accounts[2] });
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

		it("Test5. Try to createLock() and check withdraw(), from another account, no changes", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
      await staking.stake(accounts[2], accounts[2], 30, 10, 0, { from: accounts[2] });
			/*one week later*/
			await increaseTime(WEEK);
			staking.withdraw({ from: accounts[3] });
 			assert.equal(await token.balanceOf(staking.address), 30);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
		});

		it("Test6. Try to createLock() to another user and check withdraw(), from creator stake account, no changes", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
      await staking.stake(accounts[3], accounts[3], 30, 10, 0, { from: accounts[2] });
			/*one week later*/
			await increaseTime(WEEK);
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 30);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
		});

		it("Test7. Try to createLock() to another user and check withdraw(), from account address, amount changes", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
      await staking.stake(accounts[3], accounts[3], 30, 10, 0, { from: accounts[2] });
			/*one week later*/
			await increaseTime(WEEK);
			staking.withdraw({ from: accounts[3] });
 			assert.equal(await token.balanceOf(staking.address), 20);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
   		assert.equal(await token.balanceOf(accounts[3]), 10);			//tail user balance
		});

		it("Test8. Try to createLock() more than 2 year slopePeriod, throw", async () => {
			await token.mint(accounts[2], 2000);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
      await expectThrow(
			  staking.stake(accounts[2], accounts[2], 1050, 10, 0, { from: accounts[2] })
			);
    });

		it("Test9. Try to createLock() more than 2 year cliffPeriod, throw", async () => {
			await token.mint(accounts[2], 2000);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
      await expectThrow(
        staking.stake(accounts[2], accounts[2], 105, 10, 105, { from: accounts[2] })
			);
		});

		it("Test10. Try to createLock() more amount == 0, throw", async () => {
			await token.mint(accounts[2], 2000);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
      await expectThrow(
			  staking.stake(accounts[2], accounts[2], 0, 10, 10, { from: accounts[2] })
			);
		});

		it("Test11. Try to createLock() more slope == 0, throw", async () => {
			await token.mint(accounts[2], 2000);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
      await expectThrow(
			  staking.stake(accounts[2], accounts[2], 20, 0, 10, { from: accounts[2] })
			);
		});

		it("Test12. Try to createLock() more slope more amount, throw", async () => {
			await token.mint(accounts[2], 2000);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
      await expectThrow(
			  staking.stake(accounts[2], accounts[2], 20, 40, 0, { from: accounts[2] })
			);
		});
	})

	describe("Part2. Check restake() One line only, change slope ", () => {
		it("Test1.1. Change slope, line with cliff, in cliff time", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 30, 10, 3, { from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 30);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
			let idLock = 1;

			await increaseTime(WEEK * 2); //2 week later nothing change, because cliff
			let newAmount = 30;
			let newSlope = 5;
			let newCliff = 0;
			await staking.restake(idLock, accounts[2], newAmount, newSlope, newCliff, { from: accounts[2] });
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

		it("Test1.2. Change slope, amount, cliff, line with cliff, in cliff time, transfer erc20", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 30, 10, 3, { from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 30);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
			let idLock = 1;

			await increaseTime(WEEK * 2); //2 week later nothing change, because cliff
			let newAmount = 80;
			let newSlope = 5;
			let newCliff = 6;
			await staking.restake(idLock, accounts[2], newAmount, newSlope, newCliff, { from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 80);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 20);			//tail user balance

			await increaseTime(WEEK*6); //6 week later
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 80);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 20);			//user balance

			await increaseTime(WEEK*16); //16 week later
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test1.3. Change slope, amount, cliff, line with cliff, in slope time, need transfer tokens", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 30, 10, 0, { from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 30);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
			let idLock = 1;

			await increaseTime(WEEK * 2); //2 week later nothing change, because cliff
			let newAmount = 80;
			let newSlope = 5;
			let newCliff = 6;
			await staking.restake(idLock, accounts[2], newAmount, newSlope, newCliff, { from: accounts[2] });
			//after two weeks: residue = 10, addAmount = 80 - residue = 70
			//amount = 30, bias = 10 balance = amount - bias = 20
			//needTransfer = addAmount - balance = 50
 			assert.equal(await token.balanceOf(staking.address), 80);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 20);			//tail user balance

			await increaseTime(WEEK*6); //6 week later
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 80);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 20);			//user balance

			await increaseTime(WEEK*16); //16 week later
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test1.4. Change slope, amount, cliff, line with cliff, in slope time, withdraw before restake, need transfer tokens", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 30, 10, 0, { from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 30);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
			let idLock = 1;

			await increaseTime(WEEK * 2); //2 week later nothing change, because cliff
			let newAmount = 80;
			let newSlope = 5;
			let newCliff = 6;
			staking.withdraw({ from: accounts[2] }); //withdraw before restake
			await staking.restake(idLock, accounts[2], newAmount, newSlope, newCliff, { from: accounts[2] });
			//after two weeks: residue = 10, addAmount = 80 - residue = 70
			//amount = 10, balance = amount - residue = 0
			//needTransfer = addAmount - balance = 70
 			assert.equal(await token.balanceOf(staking.address), 80);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 20);			//tail user balance

			await increaseTime(WEEK*6); //6 week later
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 80);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 20);			//user balance

			await increaseTime(WEEK*16); //16 week later
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test2. Change slope, line with cliff, in slope time", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 30, 10, 3, { from: accounts[2] });
			let idLock = 1;

			await increaseTime(WEEK * 4); //4 week later change, because slope
			let newAmount = 30;
			let newSlope = 5;
			let newCliff = 0;
			await staking.restake(idLock, accounts[2], newAmount, newSlope, newCliff, { from: accounts[2] });
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 30);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance

			await increaseTime(WEEK*6); //2 week later
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);			//user balance
		});

		it("Test3. Change slope, amount, cliff, with cliff, in tail time, enough ERC20 for restake", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 37, 10, 3, { from: accounts[2] });
			let idLock = 1;

			await increaseTime(WEEK * 6); //4 week later change, because slope
			let newAmount = 10;
			let newSlope = 5;
			let newCliff = 2;
			staking.restake(idLock, accounts[2], newAmount, newSlope, newCliff, { from: accounts[2] });
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 10);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 90);			//tail user balance

			await increaseTime(WEEK*2); //2 week later cliff works nothing changebias>newSlope
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 10);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 90);			//user balance

			await increaseTime(WEEK*2);
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test4. Change slope, cliff, amount, line with cliff, in tail time, additionally transfer ERC20 for restake", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 37, 10, 3, { from: accounts[2] });
			let idLock = 1;

			await increaseTime(WEEK * 6); //4 week later change, because slope
			staking.withdraw({ from: accounts[2] });
			let newAmount = 10;
			let newSlope = 5;
			let newCliff = 2;
			await staking.restake(idLock, accounts[2], newAmount, newSlope, newCliff, { from: accounts[2] });

 			assert.equal(await token.balanceOf(staking.address), 10);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 90);			//tail user balance

			await increaseTime(WEEK*2); //2 week later cliff works nothing changebias>newSlope
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 10);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 90);			//user balance

			await increaseTime(WEEK*2);
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test5. Change slope, amount, with cliff, in tail time, less amount, then now is, throw", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 38, 10, 3, { from: accounts[2] });
			let idLock = 1;

			await increaseTime(WEEK * 6); //6 week later change, because slope
			let newAmount = 5;
			let newSlope = 5;
			let newCliff = 2;
			await expectThrow(
				staking.restake(idLock, accounts[2], newAmount, newSlope, newCliff, { from: accounts[2] })
			);
		});

		it("Test6. Change slope, amount, with cliff, in cliff time, New line period stake too short, throw", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 38, 10, 3, { from: accounts[2] });
			let idLock = 1;

			await increaseTime(WEEK * 2); //2 week later no change, because cliff
			let newAmount = 5;
			let newSlope = 5;
			let newCliff = 2;
			await expectThrow(
				staking.restake(idLock, accounts[2], newAmount, newSlope, newCliff, { from: accounts[2] })
			);
		});

		it("Test7. Change slope, amount, with cliff, in cliff time, New line amount == 0, throw", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 38, 10, 3, { from: accounts[2] });
			let idLock = 1;

			await increaseTime(WEEK * 2); //2 week later no change, because cliff
			let newAmount = 0;
			let newSlope = 5;
			let newCliff = 2;
			await expectThrow(
				staking.restake(idLock, accounts[2], newAmount, newSlope, newCliff, { from: accounts[2] })
			);
		});

		it("Test8. Change slope, amount, with cliff, in cliff time, New line slope == 0, throw", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 38, 10, 3, { from: accounts[2] });
			let idLock = 1;

			await increaseTime(WEEK * 2); //2 week later no change, because cliff
			let newAmount = 60;
			let newSlope = 0;
			let newCliff = 2;
			await expectThrow(
				staking.restake(idLock, accounts[2], newAmount, newSlope, newCliff, { from: accounts[2] })
			);
		});

		it("Test9. Change slope, amount, with cliff, in cliff time, New line new cliffPeriod more 2 years, throw", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 38, 10, 3, { from: accounts[2] });
			let idLock = 1;

			await increaseTime(WEEK * 2); //2 week later no change, because cliff
			let newAmount = 60;
			let newSlope = 5;
			let newCliff = 105;
			await expectThrow(
				staking.restake(idLock, accounts[2], newAmount, newSlope, newCliff, { from: accounts[2] })
			);
		});

		it("Test10. Change slope, amount, with cliff, in cliff time, New line new slopePeriod more 2 years, throw", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 38, 10, 3, { from: accounts[2] });
			let idLock = 1;

			await increaseTime(WEEK * 2); //2 week later no change, because cliff
			let newAmount = 1050;
			let newSlope = 5;
			let newCliff = 10;
			await expectThrow(
				staking.restake(idLock, accounts[2], newAmount, newSlope, newCliff, { from: accounts[2] })
			);
		});
	})

	describe("Part3. Check restake metods Staking() Two and more lines ", () => {
		it("Test1.1 Two Lines. Restake, in cliff time no transfer", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await token.mint(accounts[3], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[3] });

			await staking.stake(accounts[2], accounts[2], 30, 10, 3, { from: accounts[2] });
			let idLock1 = 1;
			await staking.stake(accounts[2], accounts[2], 50, 10, 3, { from: accounts[2] });
			let idLock2 = 2;
      assert.equal(await token.balanceOf(staking.address), 80);	//balance Lock on deposite
      assert.equal(await staking.balanceOf.call(accounts[2]), 84);

			await increaseTime(WEEK * 2); //2 week later nothing change, because cliff
			let newAmount = 50;
			let newSlope = 5;
			let newCliff = 0;
			await staking.restake(idLock2, accounts[3], newAmount, newSlope, newCliff, { from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 80);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 20);			//tail user balance

			await increaseTime(WEEK); //1 week later
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 75);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 25);			//user balance

			await increaseTime(WEEK); //1 week later
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 60);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 40);			//user balance

			await increaseTime(WEEK*12); //8 week later
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test1.2 Two Lines. Restake, in cliff time transfer", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await token.mint(accounts[3], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[3] });

			await staking.stake(accounts[2], accounts[2], 30, 10, 3, { from: accounts[2] });
			let idLock1 = 1;
			await staking.stake(accounts[2], accounts[2], 50, 10, 3, { from: accounts[2] });
			let idLock2 = 2;
      assert.equal(await token.balanceOf(staking.address), 80);	//balance Lock on deposite
      assert.equal(await staking.balanceOf.call(accounts[2]), 84);

			await increaseTime(WEEK * 2); //2 week later nothing change, because cliff
			let newAmount = 50;
			let newSlope = 5;
			let newCliff = 0;
			await staking.restake(idLock1, accounts[3], newAmount, newSlope, newCliff, { from: accounts[2] });
			//after two weeks: Lock residue = 30, addAmount = 50 - residue = 20
			//amount = 80, bias = 80(cliff nothing change), balance = amount - bias = 0
			//needTransfer = addAmount - balance = 20
 			assert.equal(await token.balanceOf(staking.address), 100);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 0);			//tail user balance

			await increaseTime(WEEK); //1 week later
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 95);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 5);			//user balance

			await increaseTime(WEEK*9); //9 week later
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test2.1. Two Lines. Restake, in slope time, need to transfer", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });

			await staking.stake(accounts[2], accounts[2], 30, 10, 0, { from: accounts[2] });
			let idLock1 = 1;
			await staking.stake(accounts[2], accounts[2], 30, 10, 0, { from: accounts[2] });
			let idLock2 = 2;
      assert.equal(await token.balanceOf(staking.address), 60);	//balance Lock on deposite

			await increaseTime(WEEK * 2); //2 week later change, because slope
			let newAmount = 60;
			let newSlope = 5;
			let newCliff = 0;
			await staking.restake(idLock2, accounts[3], newAmount, newSlope, newCliff, { from: accounts[2] });
			//after two weeks: Lock residue = 10, addAmount = 60 - residue = 50
			//amount = 30*2(two lines), bias = 20, balance = amount - bias = 40
			//needTransfer = addAmount - balance = 10
 			assert.equal(await token.balanceOf(staking.address), 70);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 30);			//tail user balance

			await increaseTime(WEEK); //1 week later
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 55);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 45);			//user balance

			await increaseTime(WEEK*11); //11 week later
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);			//user balance
		});

		it("Test2.1. Two Lines. Restake, in slope time, NO need to transfer", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });

			await staking.stake(accounts[2], accounts[2], 30, 10, 0, { from: accounts[2] });
			let idLock1 = 1;
			await staking.stake(accounts[2], accounts[2], 30, 10, 0, { from: accounts[2] });
			let idLock2 = 2;
      assert.equal(await token.balanceOf(staking.address), 60);	//balance Lock on deposite
      assert.equal(await token.balanceOf(accounts[2]), 40);			//tail user balance

			await increaseTime(WEEK * 2); //2 week later change, because slope
			let newAmount = 50;
			let newSlope = 5;
			let newCliff = 0;
			await staking.restake(idLock2, accounts[3], newAmount, newSlope, newCliff, { from: accounts[2] });
			//after two weeks: Lock residue = 10, addAmount = 50 - residue = 40
			//amount = 30*2(two lines), bias = 20, balance = amount - bias = 40
			//needTransfer = addAmount - balance = 0
 			assert.equal(await token.balanceOf(staking.address), 60);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 40);			//tail user balance

			await increaseTime(WEEK); //1 week later
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 45);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 55);			//user balance

			await increaseTime(WEEK*9); //11 week later
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);			//user balance
		});

		it("Test2.3. Restake, in slope time, need to transfer because withdraw before restake", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });

			await staking.stake(accounts[2], accounts[2], 30, 10, 0, { from: accounts[2] });
			let idLock1 = 1;
			await staking.stake(accounts[2], accounts[2], 30, 10, 0, { from: accounts[2] });
			let idLock2 = 2;
      assert.equal(await token.balanceOf(staking.address), 60);	//balance Lock on deposite

			await increaseTime(WEEK * 2); //2 week later change, because slope
			let newAmount = 60;
			let newSlope = 5;
			let newCliff = 0;
			staking.withdraw({ from: accounts[2] }); //withdraw 40
			assert.equal(await token.balanceOf(staking.address), 20);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 80);			//tail user balance
			await staking.restake(idLock2, accounts[3], newAmount, newSlope, newCliff, { from: accounts[2] });
			//after two weeks: Lock residue  = 10, addAmount = 60 - residue = 50
			//amount = 20(because withdraw), bias = 20, balance = amount - bias = 0
			//needTransfer = addAmount - balance = 50
 			assert.equal(await token.balanceOf(staking.address), 70);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 30);			//tail user balance

			await increaseTime(WEEK); //1 week later
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 55);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 45);			//user balance

			await increaseTime(WEEK*11); //11 week later
			staking.withdraw({ from: accounts[2] });
 			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);			//user balance
		});

		it("Test3. 3 Lines. Change slope, amount, with cliff, in cliff time", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await token.mint(accounts[3], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[3] });
			await token.mint(accounts[4], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[4] });

			await staking.stake(accounts[2], accounts[2], 20, 5, 2, { from: accounts[2] });
			let idLock1 = 1;
			await staking.stake(accounts[3], accounts[3], 30, 10, 3, { from: accounts[3] });
			let idLock2 = 2;
			await staking.stake(accounts[4], accounts[4], 40, 10, 4, { from: accounts[4] });
			let idLock3 = 3;

			await increaseTime(WEEK * 4); //4 week later nothing change, because cliff
			let newAmount = 30;
			let newSlope = 5;
			let newCliff = 1;
			await staking.restake(idLock2, accounts[3], newAmount, newSlope, newCliff, { from: accounts[3] });
			staking.withdraw({ from: accounts[2] });
			staking.withdraw({ from: accounts[3] });
			staking.withdraw({ from: accounts[4] });
 			assert.equal(await token.balanceOf(staking.address), 80);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 90);			//tail user balance
   		assert.equal(await token.balanceOf(accounts[3]), 70);			//tail user balance
   		assert.equal(await token.balanceOf(accounts[4]), 60);			//tail user balance

			await increaseTime(WEEK); //1 week later
			staking.withdraw({ from: accounts[2] });
			staking.withdraw({ from: accounts[3] });
			staking.withdraw({ from: accounts[4] });
 			assert.equal(await token.balanceOf(staking.address), 65);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 95);			//tail user balance
   		assert.equal(await token.balanceOf(accounts[3]), 70);			//tail user balance clif work
   		assert.equal(await token.balanceOf(accounts[4]), 70);			//tail user balance

			await increaseTime(WEEK); //1 week later
			staking.withdraw({ from: accounts[2] });
			staking.withdraw({ from: accounts[3] });
			staking.withdraw({ from: accounts[4] });
 			assert.equal(await token.balanceOf(staking.address), 45);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
   		assert.equal(await token.balanceOf(accounts[3]), 75);			//tail user balance clif work
   		assert.equal(await token.balanceOf(accounts[4]), 80);			//tail user balance

			await increaseTime(WEEK*2); //2 week later finish Line
			staking.withdraw({ from: accounts[2] });
			staking.withdraw({ from: accounts[3] });
			staking.withdraw({ from: accounts[4] });
 			assert.equal(await token.balanceOf(staking.address), 15);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
   		assert.equal(await token.balanceOf(accounts[3]), 85);			//tail user balance clif work
   		assert.equal(await token.balanceOf(accounts[4]), 100);			//tail user balance

			await increaseTime(WEEK*3); //3 week later
			staking.withdraw({ from: accounts[2] });
			staking.withdraw({ from: accounts[3] });
			staking.withdraw({ from: accounts[4] });
 			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
   		assert.equal(await token.balanceOf(accounts[3]), 100);			//tail user balance
   		assert.equal(await token.balanceOf(accounts[4]), 100);			//tail user balance
		});

		it("Test4. 3 Lines. Change slope, amount, with cliff, in tail time", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await token.mint(accounts[3], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[3] });
			await token.mint(accounts[4], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[4] });

			await staking.stake(accounts[2], accounts[2], 20, 5, 2, { from: accounts[2] });
			let idLock1 = 1;
			await staking.stake(accounts[3], accounts[3], 32, 10, 3, { from: accounts[3] });
			let idLock2 = 2;
			await staking.stake(accounts[4], accounts[4], 40, 10, 4, { from: accounts[4] });
			let idLock3 = 3;

			await increaseTime(WEEK * 6); //6 week later nothing change, because cliff
			let newAmount = 22;
			let newSlope = 5;
			let newCliff = 1;
			await staking.restake(idLock2, accounts[3], newAmount, newSlope, newCliff, { from: accounts[3] });
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

	describe("Part4. Check restake() with delegation ", () => {

		it("Test1. restake() and check balance delegated stRari", async () => {
			await token.mint(accounts[2], 100000);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[3], 60000, 2000, 0, { from: accounts[2] });
			let idLock = 1;

      balanceOf  = await staking.balanceOf.call(accounts[3]);
			assert.equal(await token.balanceOf(staking.address), 60000);				//balance Lock on deposite
  		assert.equal(await token.balanceOf(accounts[2]), 40000);			//tail user balance
      assert.equal(idLock, 1);
      assert.equal(balanceOf, 86160);

      await increaseTime(WEEK*29); //29 week later
      balanceOf  = await staking.balanceOf.call(accounts[3]);
      assert.equal(balanceOf, 2872);
      staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 2000);				//balance Lock on deposite
  		assert.equal(await token.balanceOf(accounts[2]), 98000);			//tail user balance

  		await increaseTime(WEEK); // week later
      balanceOf  = await staking.balanceOf.call(accounts[3]);
      assert.equal(balanceOf, 0);
      staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 0);				//balance Lock on deposite
  		assert.equal(await token.balanceOf(accounts[2]), 100000);			//tail user balance
		});

		it("Test2. restake() and check balance delegated stRari, after that redelegate", async () => {
			await token.mint(accounts[2], 100000);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[3], 60000, 2000, 0, { from: accounts[2] });  //first time stake
			let idLock = 1;

      let balanceOf  = await staking.balanceOf.call(accounts[3]);
			assert.equal(await token.balanceOf(staking.address), 60000);				//balance Lock on deposite
  		assert.equal(await token.balanceOf(accounts[2]), 40000);			//tail user balance
      assert.equal(idLock, 1);
      assert.equal(balanceOf, 86160);

      await increaseTime(WEEK*20); //20 week later
      balanceOf  = await staking.balanceOf.call(accounts[3]);
      assert.equal(balanceOf, 28720);
      staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 20000);				//balance Lock on deposite
  		assert.equal(await token.balanceOf(accounts[2]), 80000);			//tail user balance

			let newAmount = 20000;
			let newSlope = 2000;
			let newCliff = 0;
			await staking.restake(idLock, accounts[4], newAmount, newSlope, newCliff, { from: accounts[2] });

      balanceOf  = await staking.balanceOf.call(accounts[3]); //for check balance accounts[3]
      assert.equal(balanceOf, 0);

      balanceOf  = await staking.balanceOf.call(accounts[4]); //for check balance accounts[4]
      assert.equal(balanceOf, 21840);

  		await increaseTime(WEEK*10); //10 week later
      balanceOf  = await staking.balanceOf.call(accounts[3]);
      assert.equal(balanceOf, 0);
      staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 0);				//balance Lock on deposite
  		assert.equal(await token.balanceOf(accounts[2]), 100000);			//tail user balance
		});

		it("Test3. restake() and check balance delegated stRari, unknown idLine, throw", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[3], 60, 2, 0, { from: accounts[2] });  //first time stake
			let idLock = 1;

      await increaseTime(WEEK*30); //20 week later
			let newAmount = 30;
			let newSlope = 2;
			let newCliff = 0;
			staking.withdraw({ from: accounts[2] });
			let idLockUndefined = 4;
		  await expectThrow(
		    staking.restake(idLockUndefined, accounts[4], newAmount, newSlope, newCliff, { from: accounts[2] })
		  );
		});
  })

	describe("Part5. Check delegate()", () => {

		it("Test1. delegate() and check balance delegated stRari, after redelegate", async () => {
			await token.mint(accounts[2], 100000);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[3], 60000, 2000, 0, { from: accounts[2] });  //first time stake
			let idLock = 1;

      let balanceOf = await staking.balanceOf.call(accounts[3]);
			assert.equal(await token.balanceOf(staking.address), 60000);				//balance Lock on deposite
  		assert.equal(await token.balanceOf(accounts[2]), 40000);			//tail user balance
      assert.equal(idLock, 1);
      assert.equal(balanceOf, 86160);

      await increaseTime(WEEK*20); //20 week later
      balanceOf  = await staking.balanceOf.call(accounts[3]);
      assert.equal(balanceOf, 28720);                                    //miss user balance stRari
      staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 20000);				//balance Lock on deposite
  		assert.equal(await token.balanceOf(accounts[2]), 80000);

		  await staking.delegateTo(idLock, accounts[4], { from: accounts[2] });  //delegate from accounts[3]

      balanceOf  = await staking.balanceOf.call(accounts[3]); //for check balance accounts[3]
      assert.equal(balanceOf, 0);     //stRary balance accounts[3], after _delegateTo

      balanceOf = await staking.balanceOf.call(accounts[4]); //for check balance accounts[4]
      assert.equal(balanceOf, 28720);    //stRary balance accounts[4], after _delegateTo

  		await increaseTime(WEEK*10); //10 week later
      balanceOf = await staking.balanceOf.call(accounts[4]);
      assert.equal(balanceOf, 0);
      staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 0);				//balance Lock on deposite
  		assert.equal(await token.balanceOf(accounts[2]), 100000);			//tail user balance
		});

		it("Test2.1 delegate() and check balance delegated stRari, in tail time, after redelegate", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[3], 63, 10, 0, { from: accounts[2] });  //first time stake
			let idLock = 1;

      let balanceOf = await staking.balanceOf.call(accounts[3]);
			assert.equal(await token.balanceOf(staking.address), 63);				//balance Lock on deposite
  		assert.equal(await token.balanceOf(accounts[2]), 37);			//tail user balance
      assert.equal(idLock, 1);
      assert.equal(balanceOf, 67);

      await increaseTime(WEEK*6); //6 week later
      balanceOf  = await staking.balanceOf.call(accounts[3]);
      assert.equal(balanceOf, 7);
      staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 3);				//balance Lock on deposite
  		assert.equal(await token.balanceOf(accounts[2]), 97);

		  await staking.delegateTo(idLock, accounts[4], { from: accounts[2] });  //delegate from accounts[3]

      balanceOf  = await staking.balanceOf.call(accounts[3]); //for check balance accounts[3]
      assert.equal(balanceOf, 0);     //stRary balance accounts[3], after _delegateTo

      balanceOf = await staking.balanceOf.call(accounts[4]); //for check balance accounts[4]
      assert.equal(balanceOf, 7);    //stRary balance accounts[4], after _delegateTo

  		await increaseTime(WEEK); //1 week later
      balanceOf = await staking.balanceOf.call(accounts[4]);
      assert.equal(balanceOf, 0);
      staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 0);				//balance Lock on deposite
  		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test2.2 delegate() and check balance delegated stRari, in cliff time, cliff > 0 after redelegate", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[3], 63, 10, 2, { from: accounts[2] });  //first time stake
			let idLock = 1;

      let balanceOf = await staking.balanceOf.call(accounts[3]);
			assert.equal(await token.balanceOf(staking.address), 63);				//balance Lock on deposite
  		assert.equal(await token.balanceOf(accounts[2]), 37);			//tail user balance
      assert.equal(idLock, 1);
      assert.equal(balanceOf, 67);

      await increaseTime(WEEK); //1 week later, cliff works
      balanceOf  = await staking.balanceOf.call(accounts[3]);
      assert.equal(balanceOf, 67);
      staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 63);				//balance Lock on deposite
  		assert.equal(await token.balanceOf(accounts[2]), 37);

		  await staking.delegateTo(idLock, accounts[4], { from: accounts[2] });  //delegate from accounts[3]

      balanceOf  = await staking.balanceOf.call(accounts[3]); //for check balance accounts[3]
      assert.equal(balanceOf, 0);     //stRary balance accounts[3], after _delegateTo

      balanceOf = await staking.balanceOf.call(accounts[4]); //for check balance accounts[4]
      assert.equal(balanceOf, 67);    //stRary balance accounts[4], after _delegateTo

  		await increaseTime(WEEK); //1 week later cliff works
      balanceOf = await staking.balanceOf.call(accounts[4]);
      assert.equal(balanceOf, 67);

  		await increaseTime(WEEK*7); //1 week later all will finish
      balanceOf = await staking.balanceOf.call(accounts[4]);
      assert.equal(balanceOf, 0);
      staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 0);				//balance Lock on deposite
  		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test2.3 delegate() and check balance delegated stRari, in slope time, cliff > 0 after redelegate", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[3], 63, 10, 2, { from: accounts[2] });  //first time stake
			let idLock = 1;

      let balanceOf = await staking.balanceOf.call(accounts[3]);
			assert.equal(await token.balanceOf(staking.address), 63);				//balance Lock on deposite
  		assert.equal(await token.balanceOf(accounts[2]), 37);			//tail user balance
      assert.equal(idLock, 1);
      assert.equal(balanceOf, 67);

      await increaseTime(WEEK*4); //4 week later, cliff finished, slope works
      balanceOf  = await staking.balanceOf.call(accounts[3]);
      assert.equal(balanceOf, 47);
      staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 43);				//balance Lock on deposite
  		assert.equal(await token.balanceOf(accounts[2]), 57);

		  await staking.delegateTo(idLock, accounts[4], { from: accounts[2] });  //delegate from accounts[3]

      balanceOf  = await staking.balanceOf.call(accounts[3]); //for check balance accounts[3]
      assert.equal(balanceOf, 0);     //stRary balance accounts[3], after _delegateTo

      balanceOf = await staking.balanceOf.call(accounts[4]); //for check balance accounts[4]
      assert.equal(balanceOf, 47);    //stRary balance accounts[4], after _delegateTo

  		await increaseTime(WEEK*5); //5 week later cliff, slope finished, tail finished
      balanceOf = await staking.balanceOf.call(accounts[4]);
      assert.equal(balanceOf, 0);
      staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 0);				//balance Lock on deposite
  		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test2.4 delegate() and check balance delegated stRari, in tail time, cliff > 0 after redelegate", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[3], 63, 10, 2, { from: accounts[2] });  //first time stake
			let idLock = 1;

      let balanceOf = await staking.balanceOf.call(accounts[3]);
			assert.equal(await token.balanceOf(staking.address), 63);				//balance Lock on deposite
  		assert.equal(await token.balanceOf(accounts[2]), 37);			//tail user balance
      assert.equal(idLock, 1);
      assert.equal(balanceOf, 67);

      await increaseTime(WEEK*8); //8 week later, cliff finished, slope finished, tail works
      balanceOf  = await staking.balanceOf.call(accounts[3]);
      assert.equal(balanceOf, 7);
      staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 3);				//balance Lock on deposite
  		assert.equal(await token.balanceOf(accounts[2]), 97);

		  await staking.delegateTo(idLock, accounts[4], { from: accounts[2] });  //delegate from accounts[3]

      balanceOf  = await staking.balanceOf.call(accounts[3]); //for check balance accounts[3]
      assert.equal(balanceOf, 0);     //stRary balance accounts[3], after _delegateTo

      balanceOf = await staking.balanceOf.call(accounts[4]); //for check balance accounts[4]
      assert.equal(balanceOf, 7);    //stRary balance accounts[4], after _delegateTo

  		await increaseTime(WEEK); //1 week later cliff, slope finished, tail finished
      balanceOf = await staking.balanceOf.call(accounts[4]);
      assert.equal(balanceOf, 0);
      staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 0);				//balance Lock on deposite
  		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test3. delegate() and check totalBalance, balance delegated stRari, after that redelegate and redelegate back", async () => {
			await token.mint(accounts[2], 100000);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[3], 60000, 2000, 0, { from: accounts[2] });  //first time stake
			let idLock = 1;

      //check balances after _stake()
      let balanceOf  = await staking.balanceOf.call(accounts[3]);
      let totalBalance  = await staking.totalSupply.call(); //totalBalance check
			assert.equal(await token.balanceOf(staking.address), 60000);				//balance Lock on deposite
  		assert.equal(await token.balanceOf(accounts[2]), 40000);			//tail user balance
      assert.equal(idLock, 1);
      assert.equal(balanceOf, 86160);
      assert.equal(totalBalance, 86160);

      await increaseTime(WEEK*20); //20 week later
      balanceOf  = await staking.balanceOf.call(accounts[3]);
      assert.equal(balanceOf, 28720);
      staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 20000);				//balance Lock on deposite
  		assert.equal(await token.balanceOf(accounts[2]), 80000);			      //miss user balance stRari

		  await staking.delegateTo(idLock, accounts[4], { from: accounts[2] });  //delegate from accounts[3] to accounts[4]
      balanceOf  = await staking.balanceOf.call(accounts[3]); //for check balance accounts[3]
      assert.equal(balanceOf, 0);     //stRary balance accounts[3], after _delegateTo()

      balanceOf  = await staking.balanceOf.call(accounts[4]); //for check balance accounts[4]
      assert.equal(balanceOf, 28720);    //stRary balance accounts[3], after _delegateTo()

  		await increaseTime(WEEK*5); //5 week later
		  await staking.delegateTo(idLock, accounts[3], { from: accounts[2] });  //delegate from accounts[4] to accounts[3] (delegate back)
      balanceOf  = await staking.balanceOf.call(accounts[4]);
      assert.equal(balanceOf, 0);
      balanceOf  = await staking.balanceOf.call(accounts[3]);
      assert.equal(balanceOf, 14360);
      staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 10000);				//balance Lock on deposite
  		assert.equal(await token.balanceOf(accounts[2]), 90000);			//tail user balance

  		await increaseTime(WEEK*5); //5 week later
      balanceOf  = await staking.balanceOf.call(accounts[3]);
      assert.equal(balanceOf, 0);
      staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 0);				//balance Lock on deposite
  		assert.equal(await token.balanceOf(accounts[2]), 100000);			//tail user balance
      totalBalance  = await staking.totalSupply.call();
  		assert.equal(totalBalance, 0);
		});

		it("Test4. delegate() stRari, after finish time Line, throw", async () => {
			await token.mint(accounts[2], 100000);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[3], 60000, 2000, 0, { from: accounts[2] });  //first time stake
			let idLock = 1;

      await increaseTime(WEEK*30); //20 week later
		  await expectThrow(
		    staking.delegateTo(idLock, accounts[4], { from: accounts[2] })  //delegate from accounts[3]
		  );
		});
  })

	describe("Part6. Check setStopLock()", () => {

		it("Test1. stop() and check account and total balance stRari", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[3], 60, 2, 0, { from: accounts[2] });  //first time stake
			let idLock = 1;

      await staking.stop();    //STOP!!! only owner

      balanceOf = await staking.balanceOf.call(accounts[3]); //check balance account
      assert.equal(balanceOf, 0);
 			assert.equal(await token.balanceOf(staking.address), 60);				//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 40);			//tail user balance

      totalBalance = await staking.totalSupply.call(); //check balance total
      assert.equal(totalBalance, 0);
		});

		it("Test2. stop() after check stake(), restake() methods", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[3], 60, 2, 0, { from: accounts[2] });  //first time stake
			let idLock = 1;

      await staking.stop();    //STOP!!! only owner

			await expectThrow(staking.stake(accounts[2], accounts[4], 60, 2, 0, { from: accounts[2] }));
		});

		it("Test3. stop() and check withdraw()", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[3], 60, 2, 0, { from: accounts[2] });  //first time stake
			let idLock = 1;

      await staking.stop();    //STOP!!! only owner

			staking.withdraw({ from: accounts[2] });  //chek withdraw
 			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test4. stop()  from not owner, throw", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[3], 60, 2, 0, { from: accounts[2] });  //first time stake
			let idLock = 1;

      await expectThrow(
        staking.stop({ from: accounts[8] })    //STOP!!! not owner
      );
		});
  })

	describe("Part7. Check Migration()", () => {

		it("Test1. migrate() after start", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 60, 2, 0, { from: accounts[2] });  //first time stake
			let idLock = 1;

      await staking.startMigration(newStaking.address);    //Start migration!!!, only owner

      let balanceOf = await staking.balanceOf.call(accounts[2]); //check balance account
      assert.equal(balanceOf, 86);
 			assert.equal(await token.balanceOf(staking.address), 60);				//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 40);			      //tail user balance

      let totalBalance = await staking.totalSupply.call(); //check balance total
      assert.equal(totalBalance, 86);

      await staking.migrate([idLock], { from: accounts[2] });            //migrate

      balanceOf = await staking.balanceOf.call(accounts[2]); //check balance account
      assert.equal(balanceOf, 0);
 			assert.equal(await token.balanceOf(staking.address), 0);				//balance Lock on deposite after migrate
 			assert.equal(await token.balanceOf(newStaking.address), 60);		//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 40);			      //tail user balance

      totalBalance = await staking.totalSupply.call(); //check balance total
      assert.equal(totalBalance, 0);
		});

		it("Test2. After 10 weeks migrate() slope works", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[3], 60, 2, 0, { from: accounts[2] });  //first time stake
			let idLock = 1;

      let balanceOf = await staking.balanceOf.call(accounts[3]); //check balance account
      assert.equal(balanceOf, 86);

      await increaseTime(WEEK * 10);
      await staking.startMigration(newStaking.address);    //Start migration!!!, only owner
      await staking.migrate([idLock], { from: accounts[2] });            //migrate

      balanceOf = await staking.balanceOf.call(accounts[3]); //check balance account
      assert.equal(balanceOf, 0);
 			assert.equal(await token.balanceOf(staking.address), 20);				//balance Lock on deposite after migrate, till withdraw
 			assert.equal(await token.balanceOf(newStaking.address), 40);		//balance Lock on deposite
   		assert.equal(await token.balanceOf(accounts[2]), 40);			      //tail user balance

      let totalBalance = await staking.totalSupply.call(); //check balance total
      assert.equal(totalBalance, 0);

      staking.withdraw({ from: accounts[2] });
      assert.equal(await token.balanceOf(staking.address), 0);         //after withdraw
      assert.equal(await token.balanceOf(accounts[2]), 60);			      //tail user balance
		});

		it("Test3. After 10 weeks migrate() tial works", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[3], 65, 6, 0, { from: accounts[2] });  //first time stake
			let idLock = 1;

      await increaseTime(WEEK * 10);
      await staking.startMigration(newStaking.address);                   //Start migration!!!, only owner
      await staking.migrate([idLock], { from: accounts[2] });             //migrate

 			assert.equal(await token.balanceOf(staking.address), 60);				    //balance Lock on deposite after migrate, till withdraw
 			assert.equal(await token.balanceOf(newStaking.address), 5);		      //balance Lock on deposite newContract
   		assert.equal(await token.balanceOf(accounts[2]), 35);			          //tail user balance

      let totalBalance = await staking.totalSupply.call(); //check balance total
      assert.equal(totalBalance, 0);

      staking.withdraw({ from: accounts[2] });
      assert.equal(await token.balanceOf(staking.address), 0);        //after withdraw oldContract
      assert.equal(await token.balanceOf(newStaking.address), 5);		  //balance Lock on deposite newContract
      assert.equal(await token.balanceOf(accounts[2]), 95);			      //tail user balance
		});

		it("Test4. migrate() to contract no supported INextVersionStake, throw", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[3], 60, 2, 0, { from: accounts[2] });  //first time stake
			let idLock = 1;

      await staking.startMigration(newStakingNoInterface.address);    //Start migration!!!, only owner
      await expectThrow(
        staking.migrate([idLock], { from: accounts[2] })              //migrate, addres
      );
		});

		it("Test5. startMigration() from not owner, throw", async () => {
      await expectThrow(
        staking.startMigration(newStaking.address, { from: accounts[8] })    //startMigration!!! not owner
      );
		});
  })

	describe("Part8. Check calculation token newAmount, newSlope by formula", () => {

		it("Test. Set different parameters getStake(amount, slope, cliff), check result newAmount, newSlope", async () => {
      let result = [];
      // slope = 30, cliff = 30, koeff = 2210,
		  result = await testStaking.getStakeTest(60000, 2000, 30);
		  assert.equal(result[0], 132600);
		  assert.equal(result[1], 4420);

		  // slope = 48, cliff = 48, koeff = 4021,
		  result = await testStaking.getStakeTest(96000, 2000, 48);
		  assert.equal(result[0], 386016);
		  assert.equal(result[1], 8042);

		  // slope = 84, cliff = 48, koeff = 10150,
		  result = await testStaking.getStakeTest(84000, 1000, 84);
		  assert.equal(result[0], 852600);
		  assert.equal(result[1], 10150);

		  // slope = 104, cliff = 104, koeff = 15000,
		  result = await testStaking.getStakeTest(104000, 1000, 104);
		  assert.equal(result[0], 1560000);
		  assert.equal(result[1], 15000);

		  // slope = 104, cliff = 0, koeff = 5700,
		  result = await testStaking.getStakeTest(104000, 1000, 0);
		  assert.equal(result[0], 592800);
		  assert.equal(result[1], 5700);

		  // slope = 1, cliff = 104, koeff = 10350,
		  result = await testStaking.getStakeTest(104000, 104000, 104);
		  assert.equal(result[0], 1076400);
		  assert.equal(result[1], 1076400);

		});
  })

	describe("Part9. Check events emit()", () => {
		it("Test1. check emit Stake()", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			resultLock  = await staking.stake(accounts[2], accounts[3], 20, 10, 7, { from: accounts[2] });

			let account;
			let delegate;
			let amount;
			let slope;
			let cliff;
      truffleAssert.eventEmitted(resultLock, 'StakeCreate', (ev) => {
       	account = ev.account;
       	delegate = ev.delegate;
       	amount = ev.amount;
       	slope = ev.slope;
       	cliff = ev.cliff;
        return true;
      });
      assert.equal(account, accounts[2]);
      assert.equal(delegate, accounts[3]);
      assert.equal(amount, 20);
      assert.equal(slope, 10);
      assert.equal(cliff, 7);
		});

		it("Test2. check emit Restake()", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
      let id = 1;
      await staking.stake(accounts[2], accounts[2], 20, 10, 7, { from: accounts[2] });
			resultReStake  = await staking.restake(id, accounts[3], 30, 5, 17, { from: accounts[2] });

			let delegate;
			let amount;
			let slope;
			let cliff;
			let account;
			let counter;
      truffleAssert.eventEmitted(resultReStake, 'Restake', (ev) => {
       	id = ev.id;
       	account = ev.account;
       	delegate = ev.delegate;
       	counter = ev.counter;
       	amount = ev.amount;
       	slope = ev.slope;
       	cliff = ev.cliff;
        return true;
      });
      assert.equal(id, 1);
      assert.equal(account, accounts[2]);
      assert.equal(delegate, accounts[3]);
      assert.equal(counter, 2);
      assert.equal(amount, 30);
      assert.equal(slope, 5);
      assert.equal(cliff, 17);
		});

		it("Test3. check emit Delegate()", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
      let id = 1;
      await staking.stake(accounts[2], accounts[3], 20, 10, 7, { from: accounts[2] });
			resultDelegate  = await staking.delegateTo(id, accounts[4], { from: accounts[2] });

			let delegate;
			let time;
			let account;
	    truffleAssert.eventEmitted(resultDelegate, 'Delegate', (ev) => {
       	id = ev.id;
       	delegate = ev.delegate;
       	account = ev.account;
       	time = ev.time
        return true;
      });
      assert.equal(id, 1);
      assert.equal(account, accounts[2]);
      assert.equal(delegate, accounts[4]);
//      assert.equal(time, 11); now 11 is actual, but after some time test`ll not be passed. We check it works 05.07.2021.
		});

		it("Test4. check emit Withdraw()", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
      let id = 1;
      await staking.stake(accounts[2], accounts[3], 20, 10, 7, { from: accounts[2] });
      await increaseTime(WEEK * 8);
			resultWithdraw  = await staking.withdraw({ from: accounts[2] });
			let account;
			let amount
	    truffleAssert.eventEmitted(resultWithdraw, 'Withdraw', (ev) => {
       	amount = ev.amount;
       	account = ev.account;
        return true;
      });
      assert.equal(amount, 10);
      assert.equal(account, accounts[2]);
		});

		it("Test5. check emit Migrate()", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
      await staking.stake(accounts[2], accounts[2], 20, 10, 7, { from: accounts[2] });
      await staking.stake(accounts[2], accounts[2], 30, 10, 7, { from: accounts[2] });
      await staking.stake(accounts[2], accounts[2], 40, 10, 7, { from: accounts[2] });
      await staking.startMigration(newStaking.address);
			resultMigrate  = await staking.migrate([1, 2, 3], { from: accounts[2] });
			let account;
			let ids = [];
	    truffleAssert.eventEmitted(resultMigrate, 'Migrate', (ev) => {
       	account = ev.account;
       	ids = ev.id;
        return true;
      });
      assert.equal(ids[0], 1);
      assert.equal(ids[1], 2);
      assert.equal(ids[2], 3);
      assert.equal(account, accounts[2]);
		});

		it("Test6. check emit StartMigration()", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			resultLock  = await staking.stake(accounts[2], accounts[3], 20, 10, 7, { from: accounts[2] });

			startMigrationRezult  = await staking.startMigration(newStaking.address, { from: accounts[0] });

			let account;
			let newContract;
      truffleAssert.eventEmitted(startMigrationRezult, 'StartMigration', (ev) => {
       	account = ev.account;
       	newContract = ev.to;
        return true;
      });
      assert.equal(account, accounts[0]);
      assert.equal(newContract, newStaking.address);
		});

		it("Test7. check emit StopStaking()", async () => {
			await token.mint(accounts[2], 100);
   		await token.approve(staking.address, 1000000, { from: accounts[2] });
			resultLock  = await staking.stake(accounts[2], accounts[3], 20, 10, 7, { from: accounts[2] });

			stopResult  = await staking.stop({ from: accounts[0] });

			let account;
      truffleAssert.eventEmitted(stopResult, 'StopStaking', (ev) => {
       	account = ev.account;
        return true;
      });
      assert.equal(account, accounts[0]);
		});
  })
})