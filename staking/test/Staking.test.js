const ERC20 = artifacts.require("TestERC20.sol");
const TestNewStaking = artifacts.require("TestNewStaking.sol");
const TestStaking = artifacts.require("TestStaking.sol");
const TestNewStakingNoInterface = artifacts.require("TestNewStakingNoInteface.sol");
const truffleAssert = require('truffle-assertions');
const { expectThrow } = require("@daonomic/tests-common");

contract("Staking", accounts => {
	let staking;
	let token;
	let deposite;

	const DAY = 7200; // blocks in 1 day
	const WEEK = DAY * 7;
	const MONTH = WEEK * 4;
	const YEAR = DAY * 365;

	beforeEach(async () => {
		deposite = accounts[1];
		token = await ERC20.new();
		staking = await TestStaking.new();
		newStaking = await TestNewStaking.new();
		newStakingNoInterface = await TestNewStakingNoInterface.new();
		await staking.__Staking_init(token.address); //initialize, set owner
	})

	describe("Part1. Check base metods Staking contract, createLock, withdraw", () => {

		it("Test0 Try to createLock() slope == amount, cliff == 103 and check balance", async () => {
			await token.mint(accounts[2], 1500);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 1000, 1000, 103, { from: accounts[2] }); //address account, address delegate, uint amount, uint slope, uint cliff
			balanceOf = await staking.balanceOf.call(accounts[2]);

			assert.equal(await token.balanceOf(staking.address), 1000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 500);			      //tail user balance
			assert.equal(balanceOf, 1000);                                     //stRari calculated by formula
		});

		it("Test1. Try to createLock() slope only, cliff == 0 and check balance", async () => {
			await token.mint(accounts[2], 1500);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 1000, 100, 0, { from: accounts[2] }); //address account, address delegate, uint amount, uint slope, uint cliff
			balanceOf = await staking.balanceOf.call(accounts[2]);

			assert.equal(await token.balanceOf(staking.address), 1000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 500);			      //tail user balance
			assert.equal(balanceOf, 238);                                     //stRari calculated by formula
		});

		it("Test1.1 Try to createLock() throw, stake period < minimal stake period", async () => {
			await token.mint(accounts[2], 3300);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.setMinCliffPeriod(5);
			await staking.setMinSlopePeriod(5);
			await expectThrow(          //slopePeriod < minSlopePeriod
				staking.stake(accounts[2], accounts[2], 3000, 1500, 2, { from: accounts[2] })
			);
			await expectThrow(          //cliffPeriod < minCliffPeriod
				staking.stake(accounts[2], accounts[2], 3000, 150, 4, { from: accounts[2] })
			);
			await staking.stake(accounts[2], accounts[2], 3000, 600, 5, { from: accounts[2] });

			balanceOf = await staking.balanceOf.call(accounts[2]);
			assert.equal(await token.balanceOf(staking.address), 3000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 300);			//tail user balance
			assert.equal(balanceOf, 600);                               //by formula=(3000*(2000 + (8040*(5-5))/(104-0)+(4000*(5-5))/(104-0)))/10000
		});

		it("Test2. Try to createLock() and check totalBalance", async () => {
			await token.mint(accounts[2], 2200);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 2000, 200, 0, { from: accounts[2] });

			let totalBalance = await staking.totalSupply.call();
			assert.equal(await token.balanceOf(staking.address), 2000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 200);			      //tail user balance
			assert.equal(totalBalance, 476);                                  //stRari calculated by formula
		});

		it("Test3.1. CreateLock() and check withdraw()", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 30, 10, 0, { from: accounts[2] });
			/*3 week later*/
			await incrementBlock(WEEK * 3);
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
			/*one week later*/
			await incrementBlock(WEEK);
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock ondeposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test3.2. CreateLock() and check locked()", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 85, 10, 0, { from: accounts[2] });

			let lockedValue = await staking.locked.call(accounts[2]);
			assert.equal(lockedValue, 85);			//locked from: accounts[2]

			lockedValue = await staking.locked.call(accounts[3]);
			assert.equal(lockedValue, 0);			//locked from: accounts[3]
		});

		it("Test3.3. CreateLock() and check getAvailableForWithdraw()", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 30, 10, 0, { from: accounts[2] });
			/*3 week later*/
			await incrementBlock(WEEK * 2);
			let availableForWithdraw = await staking.getAvailableForWithdraw.call(accounts[2]);
			assert.equal(await token.balanceOf(staking.address), 30);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
			assert.equal(availableForWithdraw, 20);			//availableForWithdraw after 2 weeks
		});

		it("Test3.4. CreateLock() and check getAccountAndDelegate()", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[3], 30, 10, 0, { from: accounts[2] });
			/*3 week later*/
			await incrementBlock(WEEK * 2);
			let accountAndDelegate = await staking.getAccountAndDelegate.call(1);
			assert.equal(accountAndDelegate[0], accounts[2]);
			assert.equal(accountAndDelegate[1], accounts[3]);
		});

		it("Test3.5. Check getWeek()", async () => {
			let week = await staking.getWeek.call();
			//assert.equal(week, 20); checked 08.07.21, later test crashed
		});

		it("Test4. Try to createLock() and check withdraw(), with cliff", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 30, 10, 3, { from: accounts[2] });
			/*3 week later nothing change, because cliff */
			await incrementBlock(WEEK * 3);
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 30);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
			/*one week later*/
			await incrementBlock(WEEK);
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 20);	//balance Lock ondeposite
			assert.equal(await token.balanceOf(accounts[2]), 80);			//tail user balance
		});

		it("Test5. Try to createLock() and check withdraw(), from another account, no changes", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 30, 10, 0, { from: accounts[2] });
			/*one week later*/
			await incrementBlock(WEEK);
			await staking.withdraw({ from: accounts[3] });
			assert.equal(await token.balanceOf(staking.address), 30);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
		});

		it("Test6. Try to createLock() to another user and check withdraw(), from creator stake account, no changes", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[3], accounts[3], 30, 10, 0, { from: accounts[2] });
			/*one week later*/
			await incrementBlock(WEEK);
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 30);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
		});

		it("Test7. Try to createLock() to another user and check withdraw(), from account address, amount changes", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[3], accounts[3], 30, 10, 0, { from: accounts[2] });
			/*one week later*/
			await incrementBlock(WEEK);
			await staking.withdraw({ from: accounts[3] });
			assert.equal(await token.balanceOf(staking.address), 20);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
			assert.equal(await token.balanceOf(accounts[3]), 10);			//tail user balance
		});

		it("Test8.1. Try to createLock() more than 2 year slopePeriod, throw", async () => {
			await token.mint(accounts[2], 2000);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await expectThrow(
				staking.stake(accounts[2], accounts[2], 1050, 10, 0, { from: accounts[2] })
			);
		});

		it("Test8.2. Try to createLock() more than 2 year slopePeriod, because tail, throw", async () => {
			await token.mint(accounts[2], 2000);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await expectThrow(
				staking.stake(accounts[2], accounts[2], 1041, 10, 0, { from: accounts[2] })
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

		it("Test1.1.1 Change slope, increase amount(prevent cut), line with cliff, in cliff time", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 30, 10, 3, { from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 30);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
			let idLock = 1;

			await incrementBlock(WEEK * 2); //2 week later nothing change, because cliff
			let newAmount = 45;
			let newSlope = 5;
			let newCliff = 0;
			await staking.restake(idLock, accounts[2], newAmount, newSlope, newCliff, { from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 45);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 55);			//tail user balance

			await incrementBlock(WEEK * 9); //9 week later
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test1.1.2 Change slope, increase cliff(prevent cut), line with cliff, in cliff time", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 30, 10, 3, { from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 30);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
			let idLock = 1;

			await incrementBlock(WEEK * 2); //2 week later nothing change, because cliff
			let newAmount = 30;
			let newSlope = 10;
			let newCliff = 4;
			await staking.restake(idLock, accounts[2], newAmount, newSlope, newCliff, { from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 30);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance

			await incrementBlock(WEEK * 7); //7 week later
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test1.1.3 Change slope, decrease slope(prevent cut), line with cliff, in cliff time", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 30, 10, 3, { from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 30);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
			let idLock = 1;

			await incrementBlock(WEEK * 2); //2 week later nothing change, because cliff
			let newAmount = 35;
			let newSlope = 2;
			let newCliff = 0;
			await staking.restake(idLock, accounts[2], newAmount, newSlope, newCliff, { from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 35);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 65);			//tail user balance

			await incrementBlock(WEEK * 18); //18 week later
			await staking.withdraw({ from: accounts[2] });
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

			await incrementBlock(WEEK * 2); //2 week later nothing change, because cliff
			let newAmount = 80;
			let newSlope = 5;
			let newCliff = 6;
			await staking.restake(idLock, accounts[2], newAmount, newSlope, newCliff, { from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 80);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 20);			//tail user balance

			await incrementBlock(WEEK * 6); //6 week later
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 80);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 20);			//user balance

			await incrementBlock(WEEK * 16); //16 week later
			await staking.withdraw({ from: accounts[2] });
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

			await incrementBlock(WEEK * 2); //2 week later nothing change, because cliff
			let newAmount = 80;
			let newSlope = 5;
			let newCliff = 6;
			await staking.restake(idLock, accounts[2], newAmount, newSlope, newCliff, { from: accounts[2] });
			//after two weeks: residue = 10, addAmount = 80 - residue = 70
			//amount = 30, bias = 10 balance = amount - bias = 20
			//needTransfer = addAmount - balance = 50
			assert.equal(await token.balanceOf(staking.address), 80);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 20);			//tail user balance

			await incrementBlock(WEEK * 6); //6 week later
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 80);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 20);			//user balance

			await incrementBlock(WEEK * 16); //16 week later
			await staking.withdraw({ from: accounts[2] });
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

			await incrementBlock(WEEK * 2); //2 week later nothing change, because cliff
			let newAmount = 80;
			let newSlope = 5;
			let newCliff = 6;
			await staking.withdraw({ from: accounts[2] }); //withdraw before restake
			await staking.restake(idLock, accounts[2], newAmount, newSlope, newCliff, { from: accounts[2] });
			//after two weeks: residue = 10, addAmount = 80 - residue = 70
			//amount = 10, balance = amount - residue = 0
			//needTransfer = addAmount - balance = 70
			assert.equal(await token.balanceOf(staking.address), 80);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 20);			//tail user balance

			await incrementBlock(WEEK * 6); //6 week later
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 80);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 20);			//user balance

			await incrementBlock(WEEK * 16); //16 week later
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test2. Change slope, line with cliff, in slope time", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 30, 10, 3, { from: accounts[2] });
			let idLock = 1;

			await incrementBlock(WEEK * 4); //4 week later change, because slope
			let newAmount = 30;
			let newSlope = 5;
			let newCliff = 0;
			await staking.restake(idLock, accounts[2], newAmount, newSlope, newCliff, { from: accounts[2] });
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 30);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance

			await incrementBlock(WEEK * 6); //2 week later
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//user balance
		});

		it("Test3. Change slope, amount, cliff, with cliff, in tail time, enough ERC20 for restake", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 37, 10, 3, { from: accounts[2] });
			let idLock = 1;

			await incrementBlock(WEEK * 6); //4 week later change, because slope
			let newAmount = 10;
			let newSlope = 5;
			let newCliff = 2;
			staking.restake(idLock, accounts[2], newAmount, newSlope, newCliff, { from: accounts[2] });
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 10);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 90);			//tail user balance

			await incrementBlock(WEEK * 2); //2 week later cliff works nothing changebias>newSlope
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 10);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 90);			//user balance

			await incrementBlock(WEEK * 2);
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test4. Change slope, cliff, amount, line with cliff, in tail time, additionally transfer ERC20 for restake", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 37, 10, 3, { from: accounts[2] });
			let idLock = 1;

			await incrementBlock(WEEK * 6); //4 week later change, because slope
			await staking.withdraw({ from: accounts[2] });
			let newAmount = 10;
			let newSlope = 5;
			let newCliff = 2;
			await staking.restake(idLock, accounts[2], newAmount, newSlope, newCliff, { from: accounts[2] });

			assert.equal(await token.balanceOf(staking.address), 10);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 90);			//tail user balance

			await incrementBlock(WEEK * 2); //2 week later cliff works nothing changebias>newSlope
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 10);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 90);			//user balance

			await incrementBlock(WEEK * 2);
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test5. Change slope, amount, with cliff, in tail time, less amount, then now is, throw", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 38, 10, 3, { from: accounts[2] });
			let idLock = 1;

			await incrementBlock(WEEK * 6); //6 week later change, because slope
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

			await incrementBlock(WEEK * 2); //2 week later no change, because cliff
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

			await incrementBlock(WEEK * 2); //2 week later no change, because cliff
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

			await incrementBlock(WEEK * 2); //2 week later no change, because cliff
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

			await incrementBlock(WEEK * 2); //2 week later no change, because cliff
			let newAmount = 60;
			let newSlope = 5;
			let newCliff = 105;
			await expectThrow(
				staking.restake(idLock, accounts[2], newAmount, newSlope, newCliff, { from: accounts[2] })
			);
		});

		it("Test10.1. Change slope, amount, with cliff, in cliff time, New line new slopePeriod more 2 years, throw", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 38, 10, 3, { from: accounts[2] });
			let idLock = 1;

			await incrementBlock(WEEK * 2); //2 week later no change, because cliff
			let newAmount = 1050;
			let newSlope = 5;
			let newCliff = 10;
			await expectThrow(
				staking.restake(idLock, accounts[2], newAmount, newSlope, newCliff, { from: accounts[2] })
			);
		});

		it("Test10.2 Change slope, amount, with cliff, in cliff time, New line new slopePeriod more 2 years, because slope, throw", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 38, 10, 3, { from: accounts[2] });
			let idLock = 1;

			await incrementBlock(WEEK * 2); //2 week later no change, because cliff
			let newAmount = 1041;
			let newSlope = 10;
			let newCliff = 10;
			await expectThrow(
				staking.restake(idLock, accounts[2], newAmount, newSlope, newCliff, { from: accounts[2] })
			);
		});

		it("Test11. Change slope, line with cliff, in cliff time cut corner, throw", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 30, 10, 3, { from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 30);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
			let idLock = 1;

			await incrementBlock(WEEK * 2); //2 week later nothing change, because cliff
			let newAmount = 30;
			let newSlope = 5;
			let newCliff = 0;
			await expectThrow(
				staking.restake(idLock, accounts[2], newAmount, newSlope, newCliff, { from: accounts[2] })
			);
		});
	})

	describe("Part3. Check restake metods Staking() Two and more lines ", () => {
		it("Test1.1 Two Lines. Restake, in cliff time nedd to transfer, another throw, because cut corner", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await token.mint(accounts[3], 100);
			await token.approve(staking.address, 1000000, { from: accounts[3] });

			await staking.stake(accounts[2], accounts[2], 30, 10, 3, { from: accounts[2] });
			let idLock1 = 1;
			await staking.stake(accounts[2], accounts[2], 50, 10, 3, { from: accounts[2] });
			let idLock2 = 2;
			assert.equal(await token.balanceOf(staking.address), 80);	    //balance Lock on deposite
			assert.equal(await staking.balanceOf.call(accounts[2]), 19);  //stRari calculated by formula

			await incrementBlock(WEEK * 2); //2 week later nothing change, because cliff
			let newAmount = 60;
			let newSlope = 10;
			let newCliff = 0;
			await staking.restake(idLock2, accounts[3], newAmount, newSlope, newCliff, { from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 90);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 10);			//tail user balance

			await incrementBlock(WEEK); //1 week later
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 80);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 20);			//user balance

			await incrementBlock(WEEK * 5); //5 week later
			await staking.withdraw({ from: accounts[2] });
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
			assert.equal(await staking.balanceOf.call(accounts[2]), 19); //stRari calculated by formula

			await incrementBlock(WEEK * 2); //2 week later nothing change, because cliff
			let newAmount = 50;
			let newSlope = 5;
			let newCliff = 0;
			await staking.restake(idLock1, accounts[3], newAmount, newSlope, newCliff, { from: accounts[2] });
			//after two weeks: Lock residue = 30, addAmount = 50 - residue = 20
			//amount = 80, bias = 80(cliff nothing change), balance = amount - bias = 0
			//needTransfer = addAmount - balance = 20
			assert.equal(await token.balanceOf(staking.address), 100);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 0);			//tail user balance

			await incrementBlock(WEEK); //1 week later
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 95);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 5);			//user balance

			await incrementBlock(WEEK * 9); //9 week later
			await staking.withdraw({ from: accounts[2] });
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

			await incrementBlock(WEEK * 2); //2 week later change, because slope
			let newAmount = 60;
			let newSlope = 5;
			let newCliff = 0;
			await staking.restake(idLock2, accounts[3], newAmount, newSlope, newCliff, { from: accounts[2] });
			//after two weeks: Lock residue = 10, addAmount = 60 - residue = 50
			//amount = 30*2(two lines), bias = 20, balance = amount - bias = 40
			//needTransfer = addAmount - balance = 10
			assert.equal(await token.balanceOf(staking.address), 70);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 30);			//tail user balance

			await incrementBlock(WEEK); //1 week later
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 55);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 45);			//user balance

			await incrementBlock(WEEK * 11); //11 week later
			await staking.withdraw({ from: accounts[2] });
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

			await incrementBlock(WEEK * 2); //2 week later change, because slope
			let newAmount = 50;
			let newSlope = 5;
			let newCliff = 0;
			await staking.restake(idLock2, accounts[3], newAmount, newSlope, newCliff, { from: accounts[2] });
			//after two weeks: Lock residue = 10, addAmount = 50 - residue = 40
			//amount = 30*2(two lines), bias = 20, balance = amount - bias = 40
			//needTransfer = addAmount - balance = 0
			assert.equal(await token.balanceOf(staking.address), 60);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 40);			//tail user balance

			await incrementBlock(WEEK); //1 week later
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 45);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 55);			//user balance

			await incrementBlock(WEEK * 9); //11 week later
			await staking.withdraw({ from: accounts[2] });
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

			await incrementBlock(WEEK * 2); //2 week later change, because slope
			let newAmount = 60;
			let newSlope = 5;
			let newCliff = 0;
			await staking.withdraw({ from: accounts[2] }); //withdraw 40
			assert.equal(await token.balanceOf(staking.address), 20);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 80);			//tail user balance
			await staking.restake(idLock2, accounts[3], newAmount, newSlope, newCliff, { from: accounts[2] });
			//after two weeks: Lock residue  = 10, addAmount = 60 - residue = 50
			//amount = 20(because withdraw), bias = 20, balance = amount - bias = 0
			//needTransfer = addAmount - balance = 50
			assert.equal(await token.balanceOf(staking.address), 70);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 30);			//tail user balance

			await incrementBlock(WEEK); //1 week later
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 55);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 45);			//user balance

			await incrementBlock(WEEK * 11); //11 week later
			await staking.withdraw({ from: accounts[2] });
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

			await incrementBlock(WEEK * 4); //4 week later nothing change, because cliff
			let newAmount = 30;
			let newSlope = 5;
			let newCliff = 1;
			await staking.restake(idLock2, accounts[3], newAmount, newSlope, newCliff, { from: accounts[3] });
			await staking.withdraw({ from: accounts[2] });
			await staking.withdraw({ from: accounts[3] });
			await staking.withdraw({ from: accounts[4] });
			assert.equal(await token.balanceOf(staking.address), 80);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 90);			//tail user balance
			assert.equal(await token.balanceOf(accounts[3]), 70);			//tail user balance
			assert.equal(await token.balanceOf(accounts[4]), 60);			//tail user balance

			await incrementBlock(WEEK); //1 week later
			await staking.withdraw({ from: accounts[2] });
			await staking.withdraw({ from: accounts[3] });
			await staking.withdraw({ from: accounts[4] });
			assert.equal(await token.balanceOf(staking.address), 65);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 95);			//tail user balance
			assert.equal(await token.balanceOf(accounts[3]), 70);			//tail user balance clif work
			assert.equal(await token.balanceOf(accounts[4]), 70);			//tail user balance

			await incrementBlock(WEEK); //1 week later
			await staking.withdraw({ from: accounts[2] });
			await staking.withdraw({ from: accounts[3] });
			await staking.withdraw({ from: accounts[4] });
			assert.equal(await token.balanceOf(staking.address), 45);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
			assert.equal(await token.balanceOf(accounts[3]), 75);			//tail user balance clif work
			assert.equal(await token.balanceOf(accounts[4]), 80);			//tail user balance

			await incrementBlock(WEEK * 2); //2 week later finish Line
			await staking.withdraw({ from: accounts[2] });
			await staking.withdraw({ from: accounts[3] });
			await staking.withdraw({ from: accounts[4] });
			assert.equal(await token.balanceOf(staking.address), 15);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
			assert.equal(await token.balanceOf(accounts[3]), 85);			//tail user balance clif work
			assert.equal(await token.balanceOf(accounts[4]), 100);			//tail user balance

			await incrementBlock(WEEK * 3); //3 week later
			await staking.withdraw({ from: accounts[2] });
			await staking.withdraw({ from: accounts[3] });
			await staking.withdraw({ from: accounts[4] });
			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
			assert.equal(await token.balanceOf(accounts[3]), 100);			//tail user balance
			assert.equal(await token.balanceOf(accounts[4]), 100);			//tail user balance
		});

		it("Test4. 3 Lines. Change slope, amount, with cliff, in tail time, cut corner, throw", async () => {
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

			await incrementBlock(WEEK * 6); //6 week later nothing change, because cliff
			let newAmount = 22;
			let newSlope = 5;
			let newCliff = 1;
			await staking.restake(idLock2, accounts[3], newAmount, newSlope, newCliff, { from: accounts[3] });
			await staking.withdraw({ from: accounts[2] });
			await staking.withdraw({ from: accounts[3] });
			await staking.withdraw({ from: accounts[4] });
			assert.equal(await token.balanceOf(staking.address), 42);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
			assert.equal(await token.balanceOf(accounts[3]), 78);			//tail user balance
			assert.equal(await token.balanceOf(accounts[4]), 80);			//tail user balance

			await incrementBlock(WEEK); //2 week later
			await staking.withdraw({ from: accounts[2] });
			await staking.withdraw({ from: accounts[3] });
			await staking.withdraw({ from: accounts[4] });
			assert.equal(await token.balanceOf(staking.address), 32);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
			assert.equal(await token.balanceOf(accounts[3]), 78);			//tail user balance clif work
			assert.equal(await token.balanceOf(accounts[4]), 90);			//tail user balance

			await incrementBlock(WEEK); // week later
			await staking.withdraw({ from: accounts[2] });
			await staking.withdraw({ from: accounts[3] });
			await staking.withdraw({ from: accounts[4] });
			assert.equal(await token.balanceOf(staking.address), 17);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
			assert.equal(await token.balanceOf(accounts[3]), 83);			//tail user balance clif work
			assert.equal(await token.balanceOf(accounts[4]), 100);			//tail user balance

			await incrementBlock(WEEK * 4); //4 week later
			await staking.withdraw({ from: accounts[2] });
			await staking.withdraw({ from: accounts[3] });
			await staking.withdraw({ from: accounts[4] });
			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
			assert.equal(await token.balanceOf(accounts[3]), 100);			//tail user balance
			assert.equal(await token.balanceOf(accounts[4]), 100);			//tail user balance
		});

		it("Test5. Two Lines. Restake, in cliff time no transfer, but cut corner, throw", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await token.mint(accounts[3], 100);
			await token.approve(staking.address, 1000000, { from: accounts[3] });

			await staking.stake(accounts[2], accounts[2], 30, 10, 3, { from: accounts[2] });
			let idLock1 = 1;
			await staking.stake(accounts[2], accounts[2], 50, 10, 3, { from: accounts[2] });
			let idLock2 = 2;
			assert.equal(await token.balanceOf(staking.address), 80);	//balance Lock on deposite
			assert.equal(await staking.balanceOf.call(accounts[2]), 19); //stRari calculated by formula

			await incrementBlock(WEEK * 2); //2 week later nothing change, because cliff
			let newAmount = 50;
			let newSlope = 5;
			let newCliff = 0;
			await expectThrow(
				staking.restake(idLock2, accounts[3], newAmount, newSlope, newCliff, { from: accounts[2] })
			);
		});
	})

	describe("Part4. Check restake() with delegation ", () => {

		it("Test1. restake() and check balance delegated stRari", async () => {
			await token.mint(accounts[2], 100000);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[3], 60000, 2000, 0, { from: accounts[2] });
			let idLock = 1;

			balanceOf = await staking.balanceOf.call(accounts[3]);
			assert.equal(await token.balanceOf(staking.address), 60000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 40000);			//tail user balance
			assert.equal(idLock, 1);
			assert.equal(balanceOf, 18923);

			await incrementBlock(WEEK * 29); //29 week later, stake cliff = 631
			balanceOf = await staking.balanceOf.call(accounts[3]);
			assert.equal(balanceOf, 624);       //tail
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 2000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 98000);			//tail user balance

			await incrementBlock(WEEK); // week later
			balanceOf = await staking.balanceOf.call(accounts[3]);
			assert.equal(balanceOf, 0);
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 0);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100000);			//tail user balance
		});

		it("Test2. restake() and check balance delegated stRari, after that redelegate", async () => {
			await token.mint(accounts[2], 100000);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[3], 60000, 2000, 0, { from: accounts[2] });  //first time stake
			let idLock = 1;

			let balanceOf = await staking.balanceOf.call(accounts[3]);
			assert.equal(await token.balanceOf(staking.address), 60000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 40000);			//tail user balance
			assert.equal(idLock, 1);
			assert.equal(balanceOf, 18923);

			await incrementBlock(WEEK * 20); //20 week later
			balanceOf = await staking.balanceOf.call(accounts[3]);
			assert.equal(balanceOf, 6303);
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 20000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 80000);			//tail user balance

			let newAmount = 20000;
			let newSlope = 2000;
			let newCliff = 0;
			await staking.restake(idLock, accounts[4], newAmount, newSlope, newCliff, { from: accounts[2] });

			balanceOf = await staking.balanceOf.call(accounts[3]); //for check balance accounts[3]
			assert.equal(balanceOf, 0);

			balanceOf = await staking.balanceOf.call(accounts[4]); //for check balance accounts[4]
			assert.equal(balanceOf, 4769);

			await incrementBlock(WEEK * 10); //10 week later
			balanceOf = await staking.balanceOf.call(accounts[3]);
			assert.equal(balanceOf, 0);
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 0);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100000);			//tail user balance
		});

		it("Test3. restake() and check balance delegated stRari, unknown idLine, throw", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[3], 60, 2, 0, { from: accounts[2] });  //first time stake
			let idLock = 1;

			await incrementBlock(WEEK * 30); //20 week later
			let newAmount = 30;
			let newSlope = 2;
			let newCliff = 0;
			await staking.withdraw({ from: accounts[2] });
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
			assert.equal(balanceOf, 18923);

			await incrementBlock(WEEK * 20); //20 week later
			balanceOf = await staking.balanceOf.call(accounts[3]);
			assert.equal(balanceOf, 6303);                                    //miss user balance stRari
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 20000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 80000);

			await staking.delegateTo(idLock, accounts[4], { from: accounts[2] });  //delegate from accounts[3]

			balanceOf = await staking.balanceOf.call(accounts[3]); //for check balance accounts[3]
			assert.equal(balanceOf, 0);     //stRary balance accounts[3], after _delegateTo

			balanceOf = await staking.balanceOf.call(accounts[4]); //for check balance accounts[4]
			assert.equal(balanceOf, 6303);    //stRary balance accounts[4], after _delegateTo

			await incrementBlock(WEEK * 10); //10 week later
			balanceOf = await staking.balanceOf.call(accounts[4]);
			assert.equal(balanceOf, 0);
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 0);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100000);			//tail user balance
		});

		it("Test2.1 delegate() and check balance delegated stRari, in tail time, after redelegate", async () => {
			await token.mint(accounts[2], 10000);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[3], 6300, 1000, 0, { from: accounts[2] });  //first time stake
			let idLock = 1;

			let balanceOf = await staking.balanceOf.call(accounts[3]);
			assert.equal(await token.balanceOf(staking.address), 6300);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 3700);			//tail user balance
			assert.equal(idLock, 1);
			assert.equal(balanceOf, 1429);

			await incrementBlock(WEEK * 6); //6 week later
			balanceOf = await staking.balanceOf.call(accounts[3]);
			assert.equal(balanceOf, 199);
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 300);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 9700);

			await staking.delegateTo(idLock, accounts[4], { from: accounts[2] });  //delegate from accounts[3]

			balanceOf = await staking.balanceOf.call(accounts[3]); //for check balance accounts[3]
			assert.equal(balanceOf, 0);     //stRary balance accounts[3], after _delegateTo

			balanceOf = await staking.balanceOf.call(accounts[4]); //for check balance accounts[4]
			assert.equal(balanceOf, 199);    //stRary balance accounts[4], after _delegateTo

			await incrementBlock(WEEK); //1 week later
			balanceOf = await staking.balanceOf.call(accounts[4]);
			assert.equal(balanceOf, 0);
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 0);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 10000);			//tail user balance
		});

		it("Test2.2 delegate() and check balance delegated stRari, in cliff time, cliff > 0 after redelegate", async () => {
			await token.mint(accounts[2], 1000000);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[3], 630000, 100000, 2, { from: accounts[2] });  //first time stake
			let idLock = 1;

			let balanceOf = await staking.balanceOf.call(accounts[3]);
			assert.equal(await token.balanceOf(staking.address), 630000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 370000);			//tail user balance
			assert.equal(idLock, 1);
			assert.equal(balanceOf, 152702);

			await incrementBlock(WEEK); //1 week later, cliff works
			balanceOf = await staking.balanceOf.call(accounts[3]);
			assert.equal(balanceOf, 152702);
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 630000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 370000);

			await staking.delegateTo(idLock, accounts[4], { from: accounts[2] });  //delegate from accounts[3]

			balanceOf = await staking.balanceOf.call(accounts[3]); //for check balance accounts[3]
			assert.equal(balanceOf, 0);     //stRary balance accounts[3], after _delegateTo

			balanceOf = await staking.balanceOf.call(accounts[4]); //for check balance accounts[4]
			assert.equal(balanceOf, 152702);    //stRary balance accounts[4], after _delegateTo

			await incrementBlock(WEEK); //1 week later cliff works
			balanceOf = await staking.balanceOf.call(accounts[4]);
			assert.equal(balanceOf, 152702);

			await incrementBlock(WEEK * 7); //1 week later all will finish
			balanceOf = await staking.balanceOf.call(accounts[4]);
			assert.equal(balanceOf, 0);
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 0);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 1000000);			//tail user balance
		});

		it("Test2.3 delegate() and check balance delegated stRari, in slope time, cliff > 0 after redelegate", async () => {
			await token.mint(accounts[2], 1000000);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[3], 630000, 100000, 2, { from: accounts[2] });  //first time stake
			let idLock = 1;

			let balanceOf = await staking.balanceOf.call(accounts[3]);
			assert.equal(await token.balanceOf(staking.address), 630000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 370000);			//tail user balance
			assert.equal(idLock, 1);
			assert.equal(balanceOf, 152702);

			await incrementBlock(WEEK * 4); //4 week later, cliff finished, slope works
			balanceOf = await staking.balanceOf.call(accounts[3]);
			assert.equal(balanceOf, 109072);    //slope=11856
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 430000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 570000);

			await staking.delegateTo(idLock, accounts[4], { from: accounts[2] });  //delegate from accounts[3]

			balanceOf = await staking.balanceOf.call(accounts[3]); //for check balance accounts[3]
			assert.equal(balanceOf, 0);     //stRary balance accounts[3], after _delegateTo

			balanceOf = await staking.balanceOf.call(accounts[4]); //for check balance accounts[4]
			assert.equal(balanceOf, 109072);    //stRary balance accounts[4], after _delegateTo

			await incrementBlock(WEEK * 5); //5 week later cliff, slope finished, tail finished
			balanceOf = await staking.balanceOf.call(accounts[4]);
			assert.equal(balanceOf, 0);
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 0);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 1000000);			//tail user balance
		});

		it("Test2.4 delegate() and check balance delegated stRari, in tail time, cliff > 0 after redelegate", async () => {
			await token.mint(accounts[2], 1000000);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[3], 630000, 100000, 2, { from: accounts[2] });  //first time stake
			let idLock = 1;

			let balanceOf = await staking.balanceOf.call(accounts[3]);
			assert.equal(await token.balanceOf(staking.address), 630000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 370000);			//tail user balance
			assert.equal(idLock, 1);
			assert.equal(balanceOf, 152702);

			await incrementBlock(WEEK * 8); //8 week later, cliff finished, slope finished, tail works
			balanceOf = await staking.balanceOf.call(accounts[3]);
			assert.equal(balanceOf, 21812);
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 30000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 970000);

			await staking.delegateTo(idLock, accounts[4], { from: accounts[2] });  //delegate from accounts[3]

			balanceOf = await staking.balanceOf.call(accounts[3]); //for check balance accounts[3]
			assert.equal(balanceOf, 0);     //stRary balance accounts[3], after _delegateTo

			balanceOf = await staking.balanceOf.call(accounts[4]); //for check balance accounts[4]
			assert.equal(balanceOf, 21812);    //stRary balance accounts[4], after _delegateTo

			await incrementBlock(WEEK); //1 week later cliff, slope finished, tail finished
			balanceOf = await staking.balanceOf.call(accounts[4]);
			assert.equal(balanceOf, 0);
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 0);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 1000000);			//tail user balance
		});

		it("Test3. delegate() and check totalBalance, balance delegated stRari, after that redelegate and redelegate back", async () => {
			await token.mint(accounts[2], 100000);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[3], 60000, 2000, 0, { from: accounts[2] });  //first time stake
			let idLock = 1;

			//check balances after _stake()
			let balanceOf = await staking.balanceOf.call(accounts[3]);
			let totalBalance = await staking.totalSupply.call(); //totalBalance check
			assert.equal(await token.balanceOf(staking.address), 60000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 40000);			//tail user balance
			assert.equal(idLock, 1);
			assert.equal(balanceOf, 18923);
			assert.equal(totalBalance, 18923);

			await incrementBlock(WEEK * 20); //20 week later
			balanceOf = await staking.balanceOf.call(accounts[3]);
			assert.equal(balanceOf, 6303);
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 20000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 80000);			      //miss user balance stRari

			await staking.delegateTo(idLock, accounts[4], { from: accounts[2] });  //delegate from accounts[3] to accounts[4]
			balanceOf = await staking.balanceOf.call(accounts[3]); //for check balance accounts[3]
			assert.equal(balanceOf, 0);     //stRary balance accounts[3], after _delegateTo()

			balanceOf = await staking.balanceOf.call(accounts[4]); //for check balance accounts[4]
			assert.equal(balanceOf, 6303);    //stRary balance accounts[3], after _delegateTo()

			await incrementBlock(WEEK * 5); //5 week later
			await staking.delegateTo(idLock, accounts[3], { from: accounts[2] });  //delegate from accounts[4] to accounts[3] (delegate back)
			balanceOf = await staking.balanceOf.call(accounts[4]);
			assert.equal(balanceOf, 0);
			balanceOf = await staking.balanceOf.call(accounts[3]);
			assert.equal(balanceOf, 3148);
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 10000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 90000);			//tail user balance

			await incrementBlock(WEEK * 5); //5 week later
			balanceOf = await staking.balanceOf.call(accounts[3]);
			assert.equal(balanceOf, 0);
			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 0);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100000);			//tail user balance
			totalBalance = await staking.totalSupply.call();
			assert.equal(totalBalance, 0);
		});

		it("Test4. delegate() stRari, after finish time Line, throw", async () => {
			await token.mint(accounts[2], 100000);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[3], 60000, 2000, 0, { from: accounts[2] });  //first time stake
			let idLock = 1;

			await incrementBlock(WEEK * 30); //20 week later
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

			await staking.withdraw({ from: accounts[2] });  //chek withdraw
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
			await token.mint(accounts[2], 100000);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 60000, 2000, 0, { from: accounts[2] });  //first time stake
			let idLock = 1;

			await staking.startMigration(newStaking.address);    //Start migration!!!, only owner

			let balanceOf = await staking.balanceOf.call(accounts[2]); //check balance account
			assert.equal(balanceOf, 18923);
			assert.equal(await token.balanceOf(staking.address), 60000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 40000);			      //tail user balance

			let totalBalance = await staking.totalSupply.call(); //check balance total
			assert.equal(totalBalance, 18923);

			await staking.migrate([idLock], { from: accounts[2] });            //migrate

			balanceOf = await staking.balanceOf.call(accounts[2]); //check balance account
			assert.equal(balanceOf, 0);
			assert.equal(await token.balanceOf(staking.address), 0);				//balance Lock on deposite after migrate
			assert.equal(await token.balanceOf(newStaking.address), 60000);		//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 40000);			      //tail user balance

			totalBalance = await staking.totalSupply.call(); //check balance total
			assert.equal(totalBalance, 0);
		});

		it("Test2. After 10 weeks migrate() slope works", async () => {
			await token.mint(accounts[2], 100000);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[3], 60000, 2000, 0, { from: accounts[2] });  //first time stake
			let idLock = 1;

			let balanceOf = await staking.balanceOf.call(accounts[3]); //check balance account
			assert.equal(balanceOf, 18923);

			await incrementBlock(WEEK * 10);
			await staking.startMigration(newStaking.address);    //Start migration!!!, only owner
			await staking.migrate([idLock], { from: accounts[2] });            //migrate

			balanceOf = await staking.balanceOf.call(accounts[3]); //check balance account
			assert.equal(balanceOf, 0);
			assert.equal(await token.balanceOf(staking.address), 20000);				//balance Lock on deposite after migrate, till withdraw
			assert.equal(await token.balanceOf(newStaking.address), 40000);		//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 40000);			      //tail user balance

			let totalBalance = await staking.totalSupply.call(); //check balance total
			assert.equal(totalBalance, 0);

			await staking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(staking.address), 0);         //after withdraw
			assert.equal(await token.balanceOf(accounts[2]), 60000);			      //tail user balance
		});

		it("Test3. After 10 weeks migrate() tial works", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[3], 65, 6, 0, { from: accounts[2] });  //first time stake
			let idLock = 1;

			await incrementBlock(WEEK * 10);
			await staking.startMigration(newStaking.address);                   //Start migration!!!, only owner
			await staking.migrate([idLock], { from: accounts[2] });             //migrate

			assert.equal(await token.balanceOf(staking.address), 60);				    //balance Lock on deposite after migrate, till withdraw
			assert.equal(await token.balanceOf(newStaking.address), 5);		      //balance Lock on deposite newContract
			assert.equal(await token.balanceOf(accounts[2]), 35);			          //tail user balance

			let totalBalance = await staking.totalSupply.call(); //check balance total
			assert.equal(totalBalance, 0);

			await staking.withdraw({ from: accounts[2] });
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

		it("Test1. Set different parameters getStake(amount, slope, cliff), check result newAmount, newSlope", async () => {
			let result = [];
			// slope = 720, cliff = 30,
			result = await staking.getStakeTest(60000, 2000, 30);
			assert.equal(result[0], 32838);
			assert.equal(result[1], 1095);

			// slope = 1031, cliff = 48
			result = await staking.getStakeTest(96000, 2000, 48);
			assert.equal(result[0], 72546);
			assert.equal(result[1], 1512);

			// slope = 104, cliff = 0,
			result = await staking.getStakeTest(104000, 1000, 0);
			assert.equal(result[0], 62400);
			assert.equal(result[1], 600);

			// slope = 1, cliff = 104,
			result = await staking.getStakeTest(104000, 104000, 103);
			assert.equal(result[0], 104011);
			assert.equal(result[1], 104011);

		});

		it("Test2. CreateLock(), there is tail in stAmount, check st finish  the same as token finish", async () => {
			await token.mint(accounts[2], 6000);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 5200, 100, 53, { from: accounts[2] });
			let balanceOf = await staking.balanceOf.call(accounts[2]);

			assert.equal(await token.balanceOf(staking.address), 5200);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 800);			//tail user balance
			assert.equal(balanceOf, 4210);

			await incrementBlock(WEEK * 103);
			await staking.withdraw({ from: accounts[2] });
			balanceOf = await staking.balanceOf.call(accounts[2]);
			assert.equal(balanceOf, 160);  //slope =81, tail =79

			await incrementBlock(WEEK);
			await staking.withdraw({ from: accounts[2] });
			balanceOf = await staking.balanceOf.call(accounts[2]);
			assert.equal(balanceOf, 79);
			assert.equal(await token.balanceOf(staking.address), 100);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 5900);			//tail user balance

			await incrementBlock(WEEK);
			await staking.withdraw({ from: accounts[2] });
			balanceOf = await staking.balanceOf.call(accounts[2]);
			assert.equal(balanceOf, 0);
			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 6000);			//tail user balance
		});

		it("Test3. CreateLock(), there is no tail in stAmount", async () => {
			await token.mint(accounts[2], 600000);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			await staking.stake(accounts[2], accounts[2], 520000, 26000, 20, { from: accounts[2] }); //
			let balanceOf = await staking.balanceOf.call(accounts[2]);

			assert.equal(await token.balanceOf(staking.address), 520000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 80000);			//tail user balance
			assert.equal(balanceOf, 224399);

			await incrementBlock(WEEK * 20);
			await staking.withdraw({ from: accounts[2] });
			balanceOf = await staking.balanceOf.call(accounts[2]);
			assert.equal(balanceOf, 224399);
			assert.equal(await token.balanceOf(staking.address), 520000);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 80000);			//tail user balance

			await incrementBlock(WEEK * 20);
			await staking.withdraw({ from: accounts[2] });
			balanceOf = await staking.balanceOf.call(accounts[2]);
			assert.equal(balanceOf, 0);
			assert.equal(await token.balanceOf(staking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 600000);			//tail user balance
		});
	})

	describe("Part9. Check events emit()", () => {
		it("Test1. check emit Stake()", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			resultLock = await staking.stake(accounts[2], accounts[3], 20, 10, 7, { from: accounts[2] });

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
			resultReStake = await staking.restake(id, accounts[3], 30, 5, 17, { from: accounts[2] });

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
			resultDelegate = await staking.delegateTo(id, accounts[4], { from: accounts[2] });

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
			await incrementBlock(WEEK * 8);
			resultWithdraw = await await staking.withdraw({ from: accounts[2] });
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
			resultMigrate = await staking.migrate([1, 2, 3], { from: accounts[2] });
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
			resultLock = await staking.stake(accounts[2], accounts[3], 20, 10, 7, { from: accounts[2] });

			startMigrationRezult = await staking.startMigration(newStaking.address, { from: accounts[0] });

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

		it("Test6.1 check emit SetMinSlopePeriod()", async () => {
			let setMinSlopePeriodResult = await staking.setMinSlopePeriod(20, { from: accounts[0] });

			let newMinSlope;
			truffleAssert.eventEmitted(setMinSlopePeriodResult, 'SetMinSlopePeriod', (ev) => {
				newMinSlope = ev.newMinSlopePeriod;
				return true;
			});
			assert.equal(newMinSlope, 20);
		});

		it("Test6.2 check emit SetMinCliffPeriod()", async () => {
			let setMinCliffPeriodResult = await staking.setMinCliffPeriod(20, { from: accounts[0] });

			let newMinCliff;
			truffleAssert.eventEmitted(setMinCliffPeriodResult, 'SetMinCliffPeriod', (ev) => {
				newMinCliff = ev.newMinCliffPeriod;
				return true;
			});
			assert.equal(newMinCliff, 20);
		});

		it("Test7. check emit StopStaking()", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(staking.address, 1000000, { from: accounts[2] });
			resultLock = await staking.stake(accounts[2], accounts[3], 20, 10, 7, { from: accounts[2] });

			stopResult = await staking.stop({ from: accounts[0] });

			let account;
			truffleAssert.eventEmitted(stopResult, 'StopStaking', (ev) => {
				account = ev.account;
				return true;
			});
			assert.equal(account, accounts[0]);
		});
	})

	async function incrementBlock(amount) {
		await staking.incrementBlock(amount);
	}

})