const ERC20 = artifacts.require("TestERC20.sol");
const TestNewLocking = artifacts.require("TestNewLocking.sol");
const TestLocking = artifacts.require("TestLocking.sol");
const TestNewLockingNoInterface = artifacts.require("TestNewLockingNoInteface.sol");
const truffleAssert = require('truffle-assertions');
const { expectThrow } = require("@daonomic/tests-common");
const { assertStorageUpgradeSafe } = require('@openzeppelin/upgrades-core');
require('dotenv').config();

const zeroAddress = "0x0000000000000000000000000000000000000000";

contract("Locking", accounts => {
	let locking;
	let token;
	let deposite;
	let currentBlock;

	//const DAY = 7200; // blocks in 1 day
	let WEEK;

	beforeEach(async () => {
		deposite = accounts[1];
		token = await ERC20.new();
		locking = await TestLocking.new();
		newLocking = await TestNewLocking.new();
		newLockingNoInterface = await TestNewLockingNoInterface.new();
		await locking.__Locking_init(token.address, 0, 0, 0); //initialize, set owner

		WEEK = await locking.WEEK()
		await incrementBlock(WEEK + 1); //to avoid lock() from ZERO point timeStamp
	})

	describe("locking votes", () => {
		it("locking votes events and balances", async () => {
			const user = accounts[2];
			const delegate = accounts[3];
			const reLockDelegate = accounts[4]

			//minting tokens
			await token.mint(user, 1000000);
			await token.approve(locking.address, 1000000, { from: user });

			//locking tokens
			const lockTx = await locking.lock(user, user, 3000, 3, 0, { from: user }); //address account, address delegate, uint amount, uint slopePeriod, uint cliff
			const lockId = await locking.counter()

			//checking events
			//DelegateChanged event
			const DelegateChangedFromLockTx = (await locking.getPastEvents("DelegateChanged", {
				fromBlock: lockTx.receipt.blockNumber,
				toBlock: lockTx.receipt.blockNumber
			}));
			assert.equal(DelegateChangedFromLockTx[0].args.delegator, user)
			assert.equal(DelegateChangedFromLockTx[0].args.fromDelegate, zeroAddress)
			assert.equal(DelegateChangedFromLockTx[0].args.toDelegate, user)

			//DelegateVotesChanged event
			const DelegateVotesChangedFromLockTx = (await locking.getPastEvents("DelegateVotesChanged", {
				fromBlock: lockTx.receipt.blockNumber,
				toBlock: lockTx.receipt.blockNumber
			}));
			assert.equal(DelegateVotesChangedFromLockTx[0].args.delegate, user)
			assert.equal(DelegateVotesChangedFromLockTx[0].args.previousBalance, 0)
			assert.equal(DelegateVotesChangedFromLockTx[0].args.newBalance, 634)

			//checking balances
			assert.equal(await token.balanceOf(locking.address), 3000);
			assert.equal(await locking.balanceOf(user), 634);
			assert.equal(await locking.getVotes(user), 0)
			assert.equal(await locking.getPastVotes(user, (currentBlock - 1)), 0)
			assert.equal(await locking.getPastTotalSupply((currentBlock - 1)), 0)

			//moving ahead 1 week
			await incrementBlock(WEEK)

			assert.equal(await locking.balanceOf(user), 422);
			assert.equal(await locking.getVotes(user), 634)
			assert.equal(await locking.getPastVotes(user, (currentBlock - 1)), 634)
			assert.equal(await locking.getPastTotalSupply((currentBlock - 1)), 634)

			//redelegating the lock
			const txDelegateTo = await locking.delegateTo(lockId, delegate, { from: user })

			//DelegateChanged event
			const DelegateChangedFromDelegateToTx = (await locking.getPastEvents("DelegateChanged", {
				fromBlock: txDelegateTo.receipt.blockNumber,
				toBlock: txDelegateTo.receipt.blockNumber
			}));
			assert.equal(DelegateChangedFromDelegateToTx[0].args.delegator, user)
			assert.equal(DelegateChangedFromDelegateToTx[0].args.fromDelegate, user)
			assert.equal(DelegateChangedFromDelegateToTx[0].args.toDelegate, delegate)

			//DelegateVotesChanged event
			const DelegateVotesChangedFromelegateToTx = (await locking.getPastEvents("DelegateVotesChanged", {
				fromBlock: txDelegateTo.receipt.blockNumber,
				toBlock: txDelegateTo.receipt.blockNumber
			}));
			assert.equal(DelegateVotesChangedFromelegateToTx[0].args.delegate, user)
			assert.equal(DelegateVotesChangedFromelegateToTx[0].args.previousBalance, 0)
			assert.equal(DelegateVotesChangedFromelegateToTx[0].args.newBalance, 0)

			assert.equal(DelegateVotesChangedFromelegateToTx[1].args.delegate, delegate)
			assert.equal(DelegateVotesChangedFromelegateToTx[1].args.previousBalance, 0)
			assert.equal(DelegateVotesChangedFromelegateToTx[1].args.newBalance, 422)

			assert.equal(await locking.balanceOf(user), 0);
			assert.equal(await locking.getVotes(user), 634)

			assert.equal(await locking.getPastVotes(user, (currentBlock - 1)), 634)
			assert.equal(await locking.getPastTotalSupply((currentBlock - 1)), 634)

			assert.equal(await locking.balanceOf(delegate), 422);
			assert.equal(await locking.getVotes(delegate), 0)
			assert.equal(await locking.getPastVotes(delegate, (currentBlock - 1)), 0)

			//moving ahead 1 week
			await incrementBlock(WEEK)

			assert.equal(await locking.balanceOf(user), 0);
			assert.equal(await locking.getVotes(user), 0)
			assert.equal(await locking.getPastVotes(user, (currentBlock - 1)), 0)
			assert.equal(await locking.balanceOf(delegate), 210);
			assert.equal(await locking.getVotes(delegate), 422)
			assert.equal(await locking.getPastVotes(delegate, (currentBlock - 1)), 422)
			assert.equal(await locking.getPastTotalSupply((currentBlock - 1)), 422)

			const txReLock = await locking.relock(lockId, reLockDelegate, 4000, 4, 0, { from: user })
			//DelegateChanged event
			const DelegateChangedFromReLockTx = (await locking.getPastEvents("DelegateChanged", {
				fromBlock: txReLock.receipt.blockNumber,
				toBlock: txReLock.receipt.blockNumber
			}));
			assert.equal(DelegateChangedFromReLockTx[0].args.delegator, user)
			assert.equal(DelegateChangedFromReLockTx[0].args.fromDelegate, delegate)
			assert.equal(DelegateChangedFromReLockTx[0].args.toDelegate, reLockDelegate)

			//DelegateVotesChanged event
			const DelegateVotesChangedFromReLockTx = (await locking.getPastEvents("DelegateVotesChanged", {
				fromBlock: txReLock.receipt.blockNumber,
				toBlock: txReLock.receipt.blockNumber
			}));
			assert.equal(DelegateVotesChangedFromReLockTx[0].args.delegate, delegate)
			assert.equal(DelegateVotesChangedFromReLockTx[0].args.previousBalance, 0)
			assert.equal(DelegateVotesChangedFromReLockTx[0].args.newBalance, 0)

			assert.equal(DelegateVotesChangedFromReLockTx[1].args.delegate, reLockDelegate)
			assert.equal(DelegateVotesChangedFromReLockTx[1].args.previousBalance, 0)
			assert.equal(DelegateVotesChangedFromReLockTx[1].args.newBalance, 861)

			assert.equal(await token.balanceOf(locking.address), 4000);
			assert.equal(await locking.balanceOf(user), 0);
			assert.equal(await locking.getVotes(user), 0)
			assert.equal(await locking.balanceOf(delegate), 0);
			assert.equal(await locking.getVotes(delegate), 422)
			assert.equal(await locking.getPastVotes(delegate, (currentBlock - 1)), 422)
			assert.equal(await locking.getPastTotalSupply((currentBlock - 1)), 422)

			assert.equal(await locking.balanceOf(reLockDelegate), 861);
			assert.equal(await locking.getVotes(reLockDelegate), 0)
			assert.equal(await locking.getPastVotes(reLockDelegate, (currentBlock - 1)), 0)

			//moving ahead 1 week
			await incrementBlock(WEEK)

			assert.equal(await locking.balanceOf(user), 0);
			assert.equal(await locking.getVotes(user), 0)
			assert.equal(await locking.getPastVotes(user, (currentBlock - 1)), 0)
			assert.equal(await locking.balanceOf(delegate), 0);
			assert.equal(await locking.getVotes(delegate), 0)
			assert.equal(await locking.getPastVotes(delegate, (currentBlock - 1)), 0)
			assert.equal(await locking.getPastTotalSupply((currentBlock - 1)), 861)

			assert.equal(await locking.balanceOf(reLockDelegate), 645);
			assert.equal(await locking.getVotes(reLockDelegate), 861)
			assert.equal(await locking.getPastVotes(reLockDelegate, (currentBlock - 1)), 861)

			//moving ahead half a week
			await incrementBlock(WEEK / 2)

			assert.equal(await locking.balanceOf(user), 0);
			assert.equal(await locking.getVotes(user), 0)
			assert.equal(await locking.getPastVotes(user, (currentBlock - 1)), 0)
			assert.equal(await locking.balanceOf(delegate), 0);
			assert.equal(await locking.getVotes(delegate), 0)
			assert.equal(await locking.getPastVotes(delegate, (currentBlock - 1)), 0)
			assert.equal(await locking.getPastTotalSupply((currentBlock - 1)), 861)

			assert.equal(await locking.balanceOf(reLockDelegate), 645);
			assert.equal(await locking.getVotes(reLockDelegate), 861)
			assert.equal(await locking.getPastVotes(reLockDelegate, (currentBlock - 1)), 861)

			//moving ahead 1 week
			await incrementBlock(WEEK)

			assert.equal(await locking.balanceOf(user), 0);
			assert.equal(await locking.getVotes(user), 0)
			assert.equal(await locking.getPastVotes(user, (currentBlock - 1)), 0)
			assert.equal(await locking.balanceOf(delegate), 0);
			assert.equal(await locking.getVotes(delegate), 0)
			assert.equal(await locking.getPastVotes(delegate, (currentBlock - 1)), 0)
			assert.equal(await locking.getPastTotalSupply((currentBlock - 1)), 645)

			assert.equal(await locking.balanceOf(reLockDelegate), 429);
			assert.equal(await locking.getVotes(reLockDelegate), 645)
			assert.equal(await locking.getPastVotes(reLockDelegate, (currentBlock - 1)), 645)

			//moving ahead 1 week
			await incrementBlock(WEEK)

			assert.equal(await locking.balanceOf(user), 0);
			assert.equal(await locking.getVotes(user), 0)
			assert.equal(await locking.getPastVotes(user, (currentBlock - 1)), 0)
			assert.equal(await locking.balanceOf(delegate), 0);
			assert.equal(await locking.getVotes(delegate), 0)
			assert.equal(await locking.getPastVotes(delegate, (currentBlock - 1)), 0)
			assert.equal(await locking.getPastTotalSupply((currentBlock - 1)), 429)

			assert.equal(await locking.balanceOf(reLockDelegate), 213);
			assert.equal(await locking.getVotes(reLockDelegate), 429)
			assert.equal(await locking.getPastVotes(reLockDelegate, (currentBlock - 1)), 429)

			//moving ahead 1 week
			await incrementBlock(WEEK)

			assert.equal(await locking.balanceOf(user), 0);
			assert.equal(await locking.getVotes(user), 0)
			assert.equal(await locking.getPastVotes(user, (currentBlock - 1)), 0)
			assert.equal(await locking.balanceOf(delegate), 0);
			assert.equal(await locking.getVotes(delegate), 0)
			assert.equal(await locking.getPastVotes(delegate, (currentBlock - 1)), 0)
			assert.equal(await locking.getPastTotalSupply((currentBlock - 1)), 213)

			assert.equal(await locking.balanceOf(reLockDelegate), 0);
			assert.equal(await locking.getVotes(reLockDelegate), 213)
			assert.equal(await locking.getPastVotes(reLockDelegate, (currentBlock - 1)), 213)

			//moving ahead 1 week
			await incrementBlock(WEEK)

			assert.equal(await locking.balanceOf(user), 0);
			assert.equal(await locking.getVotes(user), 0)
			assert.equal(await locking.getPastVotes(user, (currentBlock - 1)), 0)
			assert.equal(await locking.balanceOf(delegate), 0);
			assert.equal(await locking.getVotes(delegate), 0)
			assert.equal(await locking.getPastVotes(delegate, (currentBlock - 1)), 0)
			assert.equal(await locking.getPastTotalSupply((currentBlock - 1)), 0)

			assert.equal(await locking.balanceOf(reLockDelegate), 0);
			assert.equal(await locking.getVotes(reLockDelegate), 0)
			assert.equal(await locking.getPastVotes(reLockDelegate, (currentBlock - 1)), 0)

			//revert if current block
			await expectThrow(
				locking.getPastVotes(user, currentBlock)
			);

			await expectThrow(
				locking.getPastTotalSupply(currentBlock)
			);

		});

		it("locking epoch shift works", async () => {
			//setting block and epoch shift
			let block = 15691519;
			const epochShift = 39725;

			await locking.setEpochShift(epochShift);
			await locking.setBlock(block);

			//const nextEpoch = 311 * Number(WEEK) + epochShift;

			const network = process.env["NETWORK"];
			if (network == 'goerli') {
				//313035 block left til lthe next epoch
				assert.equal(await locking.getWeek(), 313035);
				assert.equal(await locking.blockTillNextPeriod(), 6);

				//2 blocks don't increment epoch
				await locking.incrementBlock(2);
				assert.equal(await locking.getWeek(), 313035);

				//3 more blocks don't increment epoch
				await locking.incrementBlock(3);
				assert.equal(await locking.getWeek(), 313035);

				//1 more block do
				await locking.incrementBlock(1);
				assert.equal(await locking.getWeek(), 313036);
			} else {
				//22606 block left til lthe next epoch
				assert.equal(await locking.getWeek(), 310)
				assert.equal(await locking.blockTillNextPeriod(), 22606)

				//22000 blocks don't increment epoch
				await locking.incrementBlock(22000);
				assert.equal(await locking.getWeek(), 310)

				//600 more blocks don't increment epoch
				await locking.incrementBlock(600)
				assert.equal(await locking.getWeek(), 310)

				//10 more block do
				await locking.incrementBlock(10)
				assert.equal(await locking.getWeek(), 311)
			}


		});
	})

	describe("Part1. Check base metods Locking contract, createLock, withdraw", () => {

		it("Test0 Try to createLock() slope == amount, cliff == 103 and check balance", async () => {
			await token.mint(accounts[2], 1500);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 1000, 1, 103, { from: accounts[2] }); //address account, address delegate, uint amount, uint slopePeriod, uint cliff
			balanceOf = await locking.balanceOf.call(accounts[2]);

			assert.equal(await token.balanceOf(locking.address), 1000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 500);			      //tail user balance
			assert.equal(balanceOf, 1003);                                    //stRari calculated by formula
		});

		it("Test1. Try to createLock() slope only, cliff == 0 and check balance", async () => {
			await token.mint(accounts[2], 1500);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 1000, 10, 0, { from: accounts[2] }); //address account, address delegate, uint amount, uint slopePeriod, uint cliff
			balanceOf = await locking.balanceOf.call(accounts[2]);

			assert.equal(await token.balanceOf(locking.address), 1000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 500);			      //tail user balance
			assert.equal(balanceOf, 238);                                     //stRari calculated by formula
		});

		it("Test1.1 Try to createLock() throw, lock period < minimal lock period", async () => {
			await token.mint(accounts[2], 3300);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.setMinCliffPeriod(5);
			await locking.setMinSlopePeriod(5);
			await expectThrow(          //slopePeriod < minSlopePeriod
				locking.lock(accounts[2], accounts[2], 3000, 2, 2, { from: accounts[2] })
			);
			await expectThrow(          //cliffPeriod < minCliffPeriod
				locking.lock(accounts[2], accounts[2], 3000, 20, 4, { from: accounts[2] })
			);
			await locking.lock(accounts[2], accounts[2], 3000, 5, 5, { from: accounts[2] });

			balanceOf = await locking.balanceOf.call(accounts[2]);
			assert.equal(await token.balanceOf(locking.address), 3000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 300);			//tail user balance
			assert.equal(balanceOf, 600);                               //by formula=(3000*(2000 + (8040*(5-5))/(104-0)+(4000*(5-5))/(104-0)))/10000
		});

		it("Test2. Try to createLock() and check totalBalance", async () => {
			await token.mint(accounts[2], 2200);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 2000, 10, 0, { from: accounts[2] });

			let totalBalance = await locking.totalSupply.call();
			assert.equal(await token.balanceOf(locking.address), 2000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 200);			      //tail user balance
			assert.equal(totalBalance, 476);                                  //stRari calculated by formula
		});

		it("Test3.1. CreateLock() and check withdraw()", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 30, 3, 0, { from: accounts[2] });
			//3 week later
			await incrementBlock(WEEK * 3);
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
			//one week later
			await incrementBlock(WEEK);
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 0);	//balance Lock ondeposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test3.2. CreateLock() and check locked()", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 85, 9, 0, { from: accounts[2] });

			let lockedValue = await locking.locked.call(accounts[2]);
			assert.equal(lockedValue, 85);			//locked from: accounts[2]

			lockedValue = await locking.locked.call(accounts[3]);
			assert.equal(lockedValue, 0);			//locked from: accounts[3]
		});

		it("Test3.3. CreateLock() and check getAvailableForWithdraw()", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 30, 3, 0, { from: accounts[2] });
			//3 week later
			await incrementBlock(WEEK * 2);
			let availableForWithdraw = await locking.getAvailableForWithdraw.call(accounts[2]);
			assert.equal(await token.balanceOf(locking.address), 30);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
			assert.equal(availableForWithdraw, 20);			//availableForWithdraw after 2 weeks
		});

		it("Test3.4. CreateLock() and check getAccountAndDelegate()", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[3], 30, 3, 0, { from: accounts[2] });
			//3 week later
			await incrementBlock(WEEK * 2);
			let accountAndDelegate = await locking.getAccountAndDelegate.call(1);
			assert.equal(accountAndDelegate[0], accounts[2]);
			assert.equal(accountAndDelegate[1], accounts[3]);
		});

		it("Test3.5. Check getWeek()", async () => {
			let week = await locking.getWeek.call();
			//assert.equal(week, 20); checked 08.07.21, later test crashed
		});

		it("Test4. Try to createLock() and check withdraw(), with cliff", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 30, 3, 3, { from: accounts[2] });
			//3 week later nothing change, because cliff
			await incrementBlock(WEEK * 3);
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 30);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
			//one week later
			await incrementBlock(WEEK);
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 20);	//balance Lock ondeposite
			assert.equal(await token.balanceOf(accounts[2]), 80);			//tail user balance
		});

		it("Test5. Try to createLock() and check withdraw(), from another account, no changes", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 30, 3, 0, { from: accounts[2] });
			//one week later
			await incrementBlock(WEEK);
			await locking.withdraw({ from: accounts[3] });
			assert.equal(await token.balanceOf(locking.address), 30);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
		});

		it("Test6. Try to createLock() to another user and check withdraw(), from creator lock account, no changes", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[3], accounts[3], 30, 3, 0, { from: accounts[2] });
			//one week later
			await incrementBlock(WEEK);
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 30);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
		});

		it("Test7. Try to createLock() to another user and check withdraw(), from account address, amount changes", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[3], accounts[3], 30, 3, 0, { from: accounts[2] });
			//one week later
			await incrementBlock(WEEK);
			await locking.withdraw({ from: accounts[3] });
			assert.equal(await token.balanceOf(locking.address), 20);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
			assert.equal(await token.balanceOf(accounts[3]), 10);			//tail user balance
		});

		it("Test8.1. Try to createLock() more than 2 year slopePeriod, throw", async () => {
			await token.mint(accounts[2], 2000);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await expectThrow(
				locking.lock(accounts[2], accounts[2], 1050, 105, 0, { from: accounts[2] })
			);
		});

		it("Test8.2. Try to createLock() more than 2 year slopePeriod, because tail, throw", async () => {
			await token.mint(accounts[2], 2000);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await expectThrow(
				locking.lock(accounts[2], accounts[2], 1041, 105, 0, { from: accounts[2] })
			);
		});

		it("Test9. Try to createLock() more than 2 year cliffPeriod, throw", async () => {
			await token.mint(accounts[2], 2000);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await expectThrow(
				locking.lock(accounts[2], accounts[2], 105, 11, 105, { from: accounts[2] })
			);
		});

		it("Test10. Try to createLock() more amount == 0, throw", async () => {
			await token.mint(accounts[2], 2000);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await expectThrow(
				locking.lock(accounts[2], accounts[2], 0, 10, 10, { from: accounts[2] })
			);
		});

		it("Test11. Try to createLock() more slopePeriod == 0, throw", async () => {
			await token.mint(accounts[2], 2000);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await expectThrow(
				locking.lock(accounts[2], accounts[2], 20, 0, 10, { from: accounts[2] })
			);
		});

		it("Test12. Try to createLock() more slope more amount, throw", async () => {
			await token.mint(accounts[2], 2000);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await expectThrow(
				locking.lock(accounts[2], accounts[2], 20, 40, 0, { from: accounts[2] })
			);
		});
	})

	describe("Part2. Check relock() One line only, change slope ", () => {

		it("Test1.1.1 Change slope, increase amount(prevent cut), line with cliff, in cliff time", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 30, 3, 3, { from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 30);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
			let idLock = 1;

			await incrementBlock(WEEK * 2); //2 week later nothing change, because cliff
			let newAmount = 45;
			let newSlopePeriod = 9;
			let newCliff = 0;
			await locking.relock(idLock, accounts[2], newAmount, newSlopePeriod, newCliff, { from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 45);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 55);			//tail user balance

			await incrementBlock(WEEK * 9); //9 week later
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test1.1.2 Change slope, increase cliff(prevent cut), line with cliff, in cliff time", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 30, 3, 3, { from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 30);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
			let idLock = 1;

			await incrementBlock(WEEK * 2); //2 week later nothing change, because cliff
			let newAmount = 30;
			let newSlopePeriod = 3;
			let newCliff = 4;
			await locking.relock(idLock, accounts[2], newAmount, newSlopePeriod, newCliff, { from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 30);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance

			await incrementBlock(WEEK * 7); //7 week later
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test1.1.3 Change slope, decrease slope(prevent cut), line with cliff, in cliff time", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 30, 3, 3, { from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 30);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
			let idLock = 1;

			await incrementBlock(WEEK * 2); //2 week later nothing change, because cliff
			let newAmount = 35;
			let newSlopePeriod = 18;
			let newCliff = 0;
			await locking.relock(idLock, accounts[2], newAmount, newSlopePeriod, newCliff, { from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 35);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 65);			//tail user balance

			await incrementBlock(WEEK * 18); //18 week later
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test1.2. Change slope, amount, cliff, line with cliff, in cliff time, transfer erc20", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 30, 3, 3, { from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 30);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
			let idLock = 1;

			await incrementBlock(WEEK * 2); //2 week later nothing change, because cliff
			let newAmount = 80;
			let newSlopePeriod = 16;
			let newCliff = 6;
			await locking.relock(idLock, accounts[2], newAmount, newSlopePeriod, newCliff, { from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 80);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 20);			//tail user balance

			await incrementBlock(WEEK * 6); //6 week later
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 80);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 20);			//user balance

			await incrementBlock(WEEK * 16); //16 week later
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test1.3. Change slope, amount, cliff, line with cliff, in slope time, need transfer tokens", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 30, 3, 0, { from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 30);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
			let idLock = 1;

			await incrementBlock(WEEK * 2); //2 week later nothing change, because cliff
			let newAmount = 80;
			let newSlopePeriod = 16;
			let newCliff = 6;
			await locking.relock(idLock, accounts[2], newAmount, newSlopePeriod, newCliff, { from: accounts[2] });
			//after two weeks: residue = 10, addAmount = 80 - residue = 70
			//amount = 30, bias = 10 balance = amount - bias = 20
			//needTransfer = addAmount - balance = 50
			assert.equal(await token.balanceOf(locking.address), 80);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 20);			//tail user balance

			await incrementBlock(WEEK * 6); //6 week later
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 80);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 20);			//user balance

			await incrementBlock(WEEK * 16); //16 week later
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test1.4. Change slope, amount, cliff, line with cliff, in slope time, withdraw before relock, need transfer tokens", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 30, 3, 0, { from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 30);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
			let idLock = 1;

			await incrementBlock(WEEK * 2); //2 week later nothing change, because cliff
			let newAmount = 80;
			let newSlopePeriod = 16;
			let newCliff = 6;
			await locking.withdraw({ from: accounts[2] }); //withdraw before relock
			await locking.relock(idLock, accounts[2], newAmount, newSlopePeriod, newCliff, { from: accounts[2] });
			//after two weeks: residue = 10, addAmount = 80 - residue = 70
			//amount = 10, balance = amount - residue = 0
			//needTransfer = addAmount - balance = 70
			assert.equal(await token.balanceOf(locking.address), 80);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 20);			//tail user balance

			await incrementBlock(WEEK * 6); //6 week later
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 80);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 20);			//user balance

			await incrementBlock(WEEK * 16); //16 week later
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test2. Change slope, line with cliff, in slope time", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 30, 3, 3, { from: accounts[2] });
			let idLock = 1;

			await incrementBlock(WEEK * 4); //4 week later change, because slope
			let newAmount = 30;
			let newSlopePeriod = 6;
			let newCliff = 0;
			await locking.relock(idLock, accounts[2], newAmount, newSlopePeriod, newCliff, { from: accounts[2] });
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 30);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance

			await incrementBlock(WEEK * 6); //2 week later
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//user balance
		});

		it("Test3. Change slope, amount, cliff, with cliff, in tail time, enough ERC20 for relock", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 37, 4, 3, { from: accounts[2] });
			let idLock = 1;

			await incrementBlock(WEEK * 6); //4 week later change, because slope
			let newAmount = 10;
			let newSlopePeriod = 2;
			let newCliff = 2;
			locking.relock(idLock, accounts[2], newAmount, newSlopePeriod, newCliff, { from: accounts[2] });
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 10);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 90);			//tail user balance

			await incrementBlock(WEEK * 2); //2 week later cliff works nothing changebias>newSlope
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 10);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 90);			//user balance

			await incrementBlock(WEEK * 2);
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test4. Change slope, cliff, amount, line with cliff, in tail time, additionally transfer ERC20 for relock", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 37, 4, 3, { from: accounts[2] });
			let idLock = 1;

			await incrementBlock(WEEK * 6); //4 week later change, because slope
			await locking.withdraw({ from: accounts[2] });
			let newAmount = 10;
			let newSlopePeriod = 2;
			let newCliff = 2;
			await locking.relock(idLock, accounts[2], newAmount, newSlopePeriod, newCliff, { from: accounts[2] });

			assert.equal(await token.balanceOf(locking.address), 10);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 90);			//tail user balance

			await incrementBlock(WEEK * 2); //2 week later cliff works nothing changebias>newSlope
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 10);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 90);			//user balance

			await incrementBlock(WEEK * 2);
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test5. Change slope, amount, with cliff, in tail time, less amount, then now is, throw", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 38, 4, 3, { from: accounts[2] });
			let idLock = 1;

			await incrementBlock(WEEK * 6); //6 week later change, because slope
			let newAmount = 5;
			let newSlopePeriod = 1;
			let newCliff = 2;
			await expectThrow(
				locking.relock(idLock, accounts[2], newAmount, newSlopePeriod, newCliff, { from: accounts[2] })
			);
		});

		it("Test6. Change slope, amount, with cliff, in cliff time, New line period lock too short, throw", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 38, 4, 3, { from: accounts[2] });
			let idLock = 1;

			await incrementBlock(WEEK * 2); //2 week later no change, because cliff
			let newAmount = 5;
			let newSlopePeriod = 1;
			let newCliff = 2;
			await expectThrow(
				locking.relock(idLock, accounts[2], newAmount, newSlopePeriod, newCliff, { from: accounts[2] })
			);
		});

		it("Test7. Change slope, amount, with cliff, in cliff time, New line amount == 0, throw", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 38, 4, 3, { from: accounts[2] });
			let idLock = 1;

			await incrementBlock(WEEK * 2); //2 week later no change, because cliff
			let newAmount = 0;
			let newSlopePeriod = 5;
			let newCliff = 2;
			await expectThrow(
				locking.relock(idLock, accounts[2], newAmount, newSlopePeriod, newCliff, { from: accounts[2] })
			);
		});

		it("Test8. Change slope, amount, with cliff, in cliff time, New line slope == 0, throw", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 38, 4, 3, { from: accounts[2] });
			let idLock = 1;

			await incrementBlock(WEEK * 2); //2 week later no change, because cliff
			let newAmount = 60;
			let newSlopePeriod = 0;
			let newCliff = 2;
			await expectThrow(
				locking.relock(idLock, accounts[2], newAmount, newSlopePeriod, newCliff, { from: accounts[2] })
			);
		});

		it("Test9. Change slope, amount, with cliff, in cliff time, New line new cliffPeriod more 2 years, throw", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 38, 4, 3, { from: accounts[2] });
			let idLock = 1;

			await incrementBlock(WEEK * 2); //2 week later no change, because cliff
			let newAmount = 60;
			let newSlopePeriod = 12;
			let newCliff = 105;
			await expectThrow(
				locking.relock(idLock, accounts[2], newAmount, newSlopePeriod, newCliff, { from: accounts[2] })
			);
		});

		it("Test10.1. Change slope, amount, with cliff, in cliff time, New line new slopePeriod more 2 years, throw", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 38, 4, 3, { from: accounts[2] });
			let idLock = 1;

			await incrementBlock(WEEK * 2); //2 week later no change, because cliff
			let newAmount = 1050;
			let newSlopePeriod = 210;
			let newCliff = 10;
			await expectThrow(
				locking.relock(idLock, accounts[2], newAmount, newSlopePeriod, newCliff, { from: accounts[2] })
			);
		});

		it("Test10.2 Change slope, amount, with cliff, in cliff time, New line new slopePeriod more 2 years, because slope, throw", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 38, 4, 3, { from: accounts[2] });
			let idLock = 1;

			await incrementBlock(WEEK * 2); //2 week later no change, because cliff
			let newAmount = 1041;
			let newSlopePeriod = 105;
			let newCliff = 10;
			await expectThrow(
				locking.relock(idLock, accounts[2], newAmount, newSlopePeriod, newCliff, { from: accounts[2] })
			);
		});

		it("Test11. Change slope, line with cliff, in cliff time cut corner, throw", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 30, 3, 3, { from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 30);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 70);			//tail user balance
			let idLock = 1;

			await incrementBlock(WEEK * 2); //2 week later nothing change, because cliff
			let newAmount = 30;
			let newSlopePeriod = 6;
			let newCliff = 0;
			await expectThrow(
				locking.relock(idLock, accounts[2], newAmount, newSlopePeriod, newCliff, { from: accounts[2] })
			);
		});
	})

	describe("Part3. Check relock metods Locking() Two and more lines ", () => {
		it("Test1.1 Two Lines. Relock, in cliff time nedd to transfer, another throw, because cut corner", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await token.mint(accounts[3], 100);
			await token.approve(locking.address, 1000000, { from: accounts[3] });

			await locking.lock(accounts[2], accounts[2], 30, 3, 3, { from: accounts[2] });
			let idLock1 = 1;
			await locking.lock(accounts[2], accounts[2], 50, 5, 3, { from: accounts[2] });
			let idLock2 = 2;
			assert.equal(await token.balanceOf(locking.address), 80);	    //balance Lock on deposite
			assert.equal(await locking.balanceOf.call(accounts[2]), 19);  //stRari calculated by formula

			await incrementBlock(WEEK * 2); //2 week later nothing change, because cliff
			let newAmount = 60;
			let newSlopePeriod = 6;
			let newCliff = 0;
			await locking.relock(idLock2, accounts[3], newAmount, newSlopePeriod, newCliff, { from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 90);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 10);			//tail user balance

			await incrementBlock(WEEK); //1 week later
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 80);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 20);			//user balance

			await incrementBlock(WEEK * 5); //5 week later
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test1.2 Two Lines. Relock, in cliff time transfer", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await token.mint(accounts[3], 100);
			await token.approve(locking.address, 1000000, { from: accounts[3] });

			await locking.lock(accounts[2], accounts[2], 30, 3, 3, { from: accounts[2] });
			let idLock1 = 1;
			await locking.lock(accounts[2], accounts[2], 50, 5, 3, { from: accounts[2] });
			let idLock2 = 2;
			assert.equal(await token.balanceOf(locking.address), 80);	//balance Lock on deposite
			assert.equal(await locking.balanceOf.call(accounts[2]), 19); //stRari calculated by formula

			await incrementBlock(WEEK * 2); //2 week later nothing change, because cliff
			let newAmount = 50;
			let newSlopePeriod = 10;
			let newCliff = 0;
			await locking.relock(idLock1, accounts[3], newAmount, newSlopePeriod, newCliff, { from: accounts[2] });
			//after two weeks: Lock residue = 30, addAmount = 50 - residue = 20
			//amount = 80, bias = 80(cliff nothing change), balance = amount - bias = 0
			//needTransfer = addAmount - balance = 20
			assert.equal(await token.balanceOf(locking.address), 100);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 0);			//tail user balance

			await incrementBlock(WEEK); //1 week later
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 95);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 5);			//user balance

			await incrementBlock(WEEK * 9); //9 week later
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test2.1. Two Lines. Relock, in slope time, need to transfer", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });

			await locking.lock(accounts[2], accounts[2], 30, 3, 0, { from: accounts[2] });
			let idLock1 = 1;
			await locking.lock(accounts[2], accounts[2], 30, 3, 0, { from: accounts[2] });
			let idLock2 = 2;
			assert.equal(await token.balanceOf(locking.address), 60);	//balance Lock on deposite

			await incrementBlock(WEEK * 2); //2 week later change, because slope
			let newAmount = 60;
			let newSlopePeriod = 12;
			let newCliff = 0;
			await locking.relock(idLock2, accounts[3], newAmount, newSlopePeriod, newCliff, { from: accounts[2] });
			//after two weeks: Lock residue = 10, addAmount = 60 - residue = 50
			//amount = 30*2(two lines), bias = 20, balance = amount - bias = 40
			//needTransfer = addAmount - balance = 10
			assert.equal(await token.balanceOf(locking.address), 70);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 30);			//tail user balance

			await incrementBlock(WEEK); //1 week later
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 55);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 45);			//user balance

			await incrementBlock(WEEK * 11); //11 week later
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//user balance
		});

		it("Test2.1. Two Lines. Relock, in slope time, NO need to transfer", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });

			await locking.lock(accounts[2], accounts[2], 30, 3, 0, { from: accounts[2] });
			let idLock1 = 1;
			await locking.lock(accounts[2], accounts[2], 30, 3, 0, { from: accounts[2] });
			let idLock2 = 2;
			assert.equal(await token.balanceOf(locking.address), 60);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 40);			//tail user balance

			await incrementBlock(WEEK * 2); //2 week later change, because slope
			let newAmount = 50;
			let newSlopePeriod = 10;
			let newCliff = 0;
			await locking.relock(idLock2, accounts[3], newAmount, newSlopePeriod, newCliff, { from: accounts[2] });
			//after two weeks: Lock residue = 10, addAmount = 50 - residue = 40
			//amount = 30*2(two lines), bias = 20, balance = amount - bias = 40
			//needTransfer = addAmount - balance = 0
			assert.equal(await token.balanceOf(locking.address), 60);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 40);			//tail user balance

			await incrementBlock(WEEK); //1 week later
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 45);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 55);			//user balance

			await incrementBlock(WEEK * 9); //11 week later
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//user balance
		});

		it("Test2.3. Relock, in slope time, need to transfer because withdraw before relock", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });

			await locking.lock(accounts[2], accounts[2], 30, 3, 0, { from: accounts[2] });
			let idLock1 = 1;
			await locking.lock(accounts[2], accounts[2], 30, 3, 0, { from: accounts[2] });
			let idLock2 = 2;
			assert.equal(await token.balanceOf(locking.address), 60);	//balance Lock on deposite

			await incrementBlock(WEEK * 2); //2 week later change, because slope
			let newAmount = 60;
			let newSlopePeriod = 12;
			let newCliff = 0;
			await locking.withdraw({ from: accounts[2] }); //withdraw 40
			assert.equal(await token.balanceOf(locking.address), 20);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 80);			//tail user balance
			await locking.relock(idLock2, accounts[3], newAmount, newSlopePeriod, newCliff, { from: accounts[2] });
			//after two weeks: Lock residue  = 10, addAmount = 60 - residue = 50
			//amount = 20(because withdraw), bias = 20, balance = amount - bias = 0
			//needTransfer = addAmount - balance = 50
			assert.equal(await token.balanceOf(locking.address), 70);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 30);			//tail user balance

			await incrementBlock(WEEK); //1 week later
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 55);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 45);			//user balance

			await incrementBlock(WEEK * 11); //11 week later
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//user balance
		});

		it("Test3. 3 Lines. Change slope, amount, with cliff, in cliff time", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await token.mint(accounts[3], 100);
			await token.approve(locking.address, 1000000, { from: accounts[3] });
			await token.mint(accounts[4], 100);
			await token.approve(locking.address, 1000000, { from: accounts[4] });

			await locking.lock(accounts[2], accounts[2], 20, 4, 2, { from: accounts[2] });
			let idLock1 = 1;
			await locking.lock(accounts[3], accounts[3], 30, 3, 3, { from: accounts[3] });
			let idLock2 = 2;
			await locking.lock(accounts[4], accounts[4], 40, 4, 4, { from: accounts[4] });
			let idLock3 = 3;

			await incrementBlock(WEEK * 4); //4 week later nothing change, because cliff
			let newAmount = 30;
			let newSlopePeriod = 6;
			let newCliff = 1;
			await locking.relock(idLock2, accounts[3], newAmount, newSlopePeriod, newCliff, { from: accounts[3] });
			await locking.withdraw({ from: accounts[2] });
			await locking.withdraw({ from: accounts[3] });
			await locking.withdraw({ from: accounts[4] });
			assert.equal(await token.balanceOf(locking.address), 80);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 90);			//tail user balance
			assert.equal(await token.balanceOf(accounts[3]), 70);			//tail user balance
			assert.equal(await token.balanceOf(accounts[4]), 60);			//tail user balance

			await incrementBlock(WEEK); //1 week later
			await locking.withdraw({ from: accounts[2] });
			await locking.withdraw({ from: accounts[3] });
			await locking.withdraw({ from: accounts[4] });
			assert.equal(await token.balanceOf(locking.address), 65);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 95);			//tail user balance
			assert.equal(await token.balanceOf(accounts[3]), 70);			//tail user balance clif work
			assert.equal(await token.balanceOf(accounts[4]), 70);			//tail user balance

			await incrementBlock(WEEK); //1 week later
			await locking.withdraw({ from: accounts[2] });
			await locking.withdraw({ from: accounts[3] });
			await locking.withdraw({ from: accounts[4] });
			assert.equal(await token.balanceOf(locking.address), 45);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
			assert.equal(await token.balanceOf(accounts[3]), 75);			//tail user balance clif work
			assert.equal(await token.balanceOf(accounts[4]), 80);			//tail user balance

			await incrementBlock(WEEK * 2); //2 week later finish Line
			await locking.withdraw({ from: accounts[2] });
			await locking.withdraw({ from: accounts[3] });
			await locking.withdraw({ from: accounts[4] });
			assert.equal(await token.balanceOf(locking.address), 15);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
			assert.equal(await token.balanceOf(accounts[3]), 85);			//tail user balance clif work
			assert.equal(await token.balanceOf(accounts[4]), 100);			//tail user balance

			await incrementBlock(WEEK * 3); //3 week later
			await locking.withdraw({ from: accounts[2] });
			await locking.withdraw({ from: accounts[3] });
			await locking.withdraw({ from: accounts[4] });
			assert.equal(await token.balanceOf(locking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
			assert.equal(await token.balanceOf(accounts[3]), 100);			//tail user balance
			assert.equal(await token.balanceOf(accounts[4]), 100);			//tail user balance
		});

		it("Test4. 3 Lines. Change slope, amount, with cliff, in tail time, cut corner, throw", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await token.mint(accounts[3], 100);
			await token.approve(locking.address, 1000000, { from: accounts[3] });
			await token.mint(accounts[4], 100);
			await token.approve(locking.address, 1000000, { from: accounts[4] });

			await locking.lock(accounts[2], accounts[2], 20, 4, 2, { from: accounts[2] });
			let idLock1 = 1;
			await locking.lock(accounts[3], accounts[3], 32, 4, 3, { from: accounts[3] });
			let idLock2 = 2;
			await locking.lock(accounts[4], accounts[4], 40, 4, 4, { from: accounts[4] });
			let idLock3 = 3;

			await incrementBlock(WEEK * 6); //6 week later nothing change, because cliff
			let newAmount = 22;
			let newSlopePeriod = 5;
			let newCliff = 1;
			await locking.relock(idLock2, accounts[3], newAmount, newSlopePeriod, newCliff, { from: accounts[3] });
			await locking.withdraw({ from: accounts[2] });
			await locking.withdraw({ from: accounts[3] });
			await locking.withdraw({ from: accounts[4] });
			assert.equal(await token.balanceOf(locking.address), 42);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
			assert.equal(await token.balanceOf(accounts[3]), 78);			//tail user balance
			assert.equal(await token.balanceOf(accounts[4]), 80);			//tail user balance

			await incrementBlock(WEEK); //2 week later
			await locking.withdraw({ from: accounts[2] });
			await locking.withdraw({ from: accounts[3] });
			await locking.withdraw({ from: accounts[4] });
			assert.equal(await token.balanceOf(locking.address), 32);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
			assert.equal(await token.balanceOf(accounts[3]), 78);			//tail user balance clif work
			assert.equal(await token.balanceOf(accounts[4]), 90);			//tail user balance

			await incrementBlock(WEEK); // week later
			await locking.withdraw({ from: accounts[2] });
			await locking.withdraw({ from: accounts[3] });
			await locking.withdraw({ from: accounts[4] });
			assert.equal(await token.balanceOf(locking.address), 17);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
			assert.equal(await token.balanceOf(accounts[3]), 83);			//tail user balance clif work
			assert.equal(await token.balanceOf(accounts[4]), 100);			//tail user balance

			await incrementBlock(WEEK * 4); //4 week later
			await locking.withdraw({ from: accounts[2] });
			await locking.withdraw({ from: accounts[3] });
			await locking.withdraw({ from: accounts[4] });
			assert.equal(await token.balanceOf(locking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
			assert.equal(await token.balanceOf(accounts[3]), 100);			//tail user balance
			assert.equal(await token.balanceOf(accounts[4]), 100);			//tail user balance
		});

		it("Test5. Two Lines. Relock, in cliff time no transfer, but cut corner, throw", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await token.mint(accounts[3], 100);
			await token.approve(locking.address, 1000000, { from: accounts[3] });

			await locking.lock(accounts[2], accounts[2], 30, 3, 3, { from: accounts[2] });
			let idLock1 = 1;
			await locking.lock(accounts[2], accounts[2], 50, 5, 3, { from: accounts[2] });
			let idLock2 = 2;
			assert.equal(await token.balanceOf(locking.address), 80);	//balance Lock on deposite
			assert.equal(await locking.balanceOf.call(accounts[2]), 19); //stRari calculated by formula

			await incrementBlock(WEEK * 2); //2 week later nothing change, because cliff
			let newAmount = 50;
			let newSlopePeriod = 10;
			let newCliff = 0;
			await expectThrow(
				locking.relock(idLock2, accounts[3], newAmount, newSlopePeriod, newCliff, { from: accounts[2] })
			);
		});
	})

	describe("Part4. Check relock() with delegation ", () => {

		it("Test1. relock() and check balance delegated stRari", async () => {
			await token.mint(accounts[2], 100000);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[3], 60000, 30, 0, { from: accounts[2] });
			let idLock = 1;

			balanceOf = await locking.balanceOf.call(accounts[3]);
			assert.equal(await token.balanceOf(locking.address), 60000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 40000);			//tail user balance
			assert.equal(idLock, 1);
			assert.equal(balanceOf, 18923);

			await incrementBlock(WEEK * 29); //29 week later, lock cliff = 631
			balanceOf = await locking.balanceOf.call(accounts[3]);
			assert.equal(balanceOf, 624);       //tail
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 2000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 98000);			//tail user balance

			await incrementBlock(WEEK); // week later
			balanceOf = await locking.balanceOf.call(accounts[3]);
			assert.equal(balanceOf, 0);
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 0);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100000);			//tail user balance
		});

		it("Test2. relock() and check balance delegated stRari, after that redelegate", async () => {
			await token.mint(accounts[2], 100000);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[3], 60000, 30, 0, { from: accounts[2] });  //first time lock
			let idLock = 1;

			let balanceOf = await locking.balanceOf.call(accounts[3]);
			assert.equal(await token.balanceOf(locking.address), 60000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 40000);			//tail user balance
			assert.equal(idLock, 1);
			assert.equal(balanceOf, 18923);

			await incrementBlock(WEEK * 20); //20 week later
			balanceOf = await locking.balanceOf.call(accounts[3]);
			assert.equal(balanceOf, 6303);
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 20000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 80000);			//tail user balance

			let newAmount = 20000;
			let newSlopePeriod = 10;
			let newCliff = 0;
			await locking.relock(idLock, accounts[4], newAmount, newSlopePeriod, newCliff, { from: accounts[2] });

			balanceOf = await locking.balanceOf.call(accounts[3]); //for check balance accounts[3]
			assert.equal(balanceOf, 0);

			balanceOf = await locking.balanceOf.call(accounts[4]); //for check balance accounts[4]
			assert.equal(balanceOf, 4769);

			await incrementBlock(WEEK * 10); //10 week later
			balanceOf = await locking.balanceOf.call(accounts[3]);
			assert.equal(balanceOf, 0);
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 0);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100000);			//tail user balance
		});

		it("Test3. relock() and check balance delegated stRari, unknown idLine, throw", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[3], 60, 30, 0, { from: accounts[2] });  //first time lock
			let idLock = 1;

			await incrementBlock(WEEK * 30); //20 week later
			let newAmount = 30;
			let newSlopePeriod = 15;
			let newCliff = 0;
			await locking.withdraw({ from: accounts[2] });
			let idLockUndefined = 4;
			await expectThrow(
				locking.relock(idLockUndefined, accounts[4], newAmount, newSlopePeriod, newCliff, { from: accounts[2] })
			);
		});
	})

	describe("Part5. Check delegate()", () => {

		it("Test1. delegate() and check balance delegated stRari, after redelegate", async () => {
			await token.mint(accounts[2], 100000);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[3], 60000, 30, 0, { from: accounts[2] });  //first time lock
			let idLock = 1;

			let balanceOf = await locking.balanceOf.call(accounts[3]);
			assert.equal(await token.balanceOf(locking.address), 60000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 40000);			//tail user balance
			assert.equal(idLock, 1);
			assert.equal(balanceOf, 18923);

			await incrementBlock(WEEK * 20); //20 week later
			balanceOf = await locking.balanceOf.call(accounts[3]);
			assert.equal(balanceOf, 6303);                                    //miss user balance stRari
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 20000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 80000);

			await locking.delegateTo(idLock, accounts[4], { from: accounts[2] });  //delegate from accounts[3]

			balanceOf = await locking.balanceOf.call(accounts[3]); //for check balance accounts[3]
			assert.equal(balanceOf, 0);     //stRary balance accounts[3], after _delegateTo

			balanceOf = await locking.balanceOf.call(accounts[4]); //for check balance accounts[4]
			assert.equal(balanceOf, 6303);    //stRary balance accounts[4], after _delegateTo

			await incrementBlock(WEEK * 10); //10 week later
			balanceOf = await locking.balanceOf.call(accounts[4]);
			assert.equal(balanceOf, 0);
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 0);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100000);			//tail user balance
		});

		it("Test2.1 delegate() and check balance delegated stRari, in tail time, after redelegate", async () => {
			await token.mint(accounts[2], 10000);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[3], 6300, 7, 0, { from: accounts[2] });  //first time lock
			let idLock = 1;

			let balanceOf = await locking.balanceOf.call(accounts[3]);
			assert.equal(await token.balanceOf(locking.address), 6300);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 3700);			//tail user balance
			assert.equal(idLock, 1);
			assert.equal(balanceOf, 1429);

			await incrementBlock(WEEK * 6); //6 week later
			balanceOf = await locking.balanceOf.call(accounts[3]);
			assert.equal(balanceOf, 199);
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 900);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 9100);

			await locking.delegateTo(idLock, accounts[4], { from: accounts[2] });  //delegate from accounts[3]

			balanceOf = await locking.balanceOf.call(accounts[3]); //for check balance accounts[3]
			assert.equal(balanceOf, 0);     //stRary balance accounts[3], after _delegateTo

			balanceOf = await locking.balanceOf.call(accounts[4]); //for check balance accounts[4]
			assert.equal(balanceOf, 199);    //stRary balance accounts[4], after _delegateTo

			await incrementBlock(WEEK); //1 week later
			balanceOf = await locking.balanceOf.call(accounts[4]);
			assert.equal(balanceOf, 0);
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 0);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 10000);			//tail user balance
		});

		it("Test2.2 delegate() and check balance delegated stRari, in cliff time, cliff > 0 after redelegate", async () => {
			await token.mint(accounts[2], 1000000);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[3], 630000, 7, 2, { from: accounts[2] });  //first time lock
			let idLock = 1;

			let balanceOf = await locking.balanceOf.call(accounts[3]);
			assert.equal(await token.balanceOf(locking.address), 630000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 370000);			//tail user balance
			assert.equal(idLock, 1);
			assert.equal(balanceOf, 152747);

			await incrementBlock(WEEK); //1 week later, cliff works
			balanceOf = await locking.balanceOf.call(accounts[3]);
			assert.equal(balanceOf, 152747);
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 630000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 370000);

			await locking.delegateTo(idLock, accounts[4], { from: accounts[2] });  //delegate from accounts[3]

			balanceOf = await locking.balanceOf.call(accounts[3]); //for check balance accounts[3]
			assert.equal(balanceOf, 0);     //stRary balance accounts[3], after _delegateTo

			balanceOf = await locking.balanceOf.call(accounts[4]); //for check balance accounts[4]
			assert.equal(balanceOf, 152747);    //stRary balance accounts[4], after _delegateTo

			await incrementBlock(WEEK); //1 week later cliff works
			balanceOf = await locking.balanceOf.call(accounts[4]);
			assert.equal(balanceOf, 152747);

			await incrementBlock(WEEK * 7); //1 week later all will finish
			balanceOf = await locking.balanceOf.call(accounts[4]);
			assert.equal(balanceOf, 0);
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 0);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 1000000);			//tail user balance
		});

		it("Test2.3 delegate() and check balance delegated stRari, in slope time, cliff > 0 after redelegate", async () => {
			await token.mint(accounts[2], 1000000);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[3], 630000, 7, 2, { from: accounts[2] });  //first time lock
			let idLock = 1;

			let balanceOf = await locking.balanceOf.call(accounts[3]);
			assert.equal(await token.balanceOf(locking.address), 630000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 370000);			//tail user balance
			assert.equal(idLock, 1);
			assert.equal(balanceOf, 152747);

			await incrementBlock(WEEK * 4); //4 week later, cliff finished, slope works
			balanceOf = await locking.balanceOf.call(accounts[3]);
			assert.equal(balanceOf, 109105);    //slope=21821
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 450000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 550000);

			await locking.delegateTo(idLock, accounts[4], { from: accounts[2] });  //delegate from accounts[3]

			balanceOf = await locking.balanceOf.call(accounts[3]); //for check balance accounts[3]
			assert.equal(balanceOf, 0);     //stRary balance accounts[3], after _delegateTo

			balanceOf = await locking.balanceOf.call(accounts[4]); //for check balance accounts[4]
			assert.equal(balanceOf, 109105);    //stRary balance accounts[4], after _delegateTo

			await incrementBlock(WEEK * 5); //5 week later cliff, slope finished, tail finished
			balanceOf = await locking.balanceOf.call(accounts[4]);
			assert.equal(balanceOf, 0);
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 0);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 1000000);			//tail user balance
		});

		it("Test2.4 delegate() and check balance delegated stRari, in tail time, cliff > 0 after redelegate", async () => {
			await token.mint(accounts[2], 1000000);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[3], 630000, 7, 2, { from: accounts[2] });  //first time lock
			let idLock = 1;

			let balanceOf = await locking.balanceOf.call(accounts[3]);
			assert.equal(await token.balanceOf(locking.address), 630000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 370000);			//tail user balance
			assert.equal(idLock, 1);
			assert.equal(balanceOf, 152747);

			await incrementBlock(WEEK * 8); //8 week later, cliff finished, slope finished, tail works
			balanceOf = await locking.balanceOf.call(accounts[3]);
			assert.equal(balanceOf, 21821);
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 90000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 910000);

			await locking.delegateTo(idLock, accounts[4], { from: accounts[2] });  //delegate from accounts[3]

			balanceOf = await locking.balanceOf.call(accounts[3]); //for check balance accounts[3]
			assert.equal(balanceOf, 0);     //stRary balance accounts[3], after _delegateTo

			balanceOf = await locking.balanceOf.call(accounts[4]); //for check balance accounts[4]
			assert.equal(balanceOf, 21821);    //stRary balance accounts[4], after _delegateTo

			await incrementBlock(WEEK); //1 week later cliff, slope finished, tail finished
			balanceOf = await locking.balanceOf.call(accounts[4]);
			assert.equal(balanceOf, 0);
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 0);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 1000000);			//tail user balance
		});

		it("Test3. delegate() and check totalBalance, balance delegated stRari, after that redelegate and redelegate back", async () => {
			await token.mint(accounts[2], 100000);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[3], 60000, 30, 0, { from: accounts[2] });  //first time lock
			let idLock = 1;

			//check balances after _lock()
			let balanceOf = await locking.balanceOf.call(accounts[3]);
			let totalBalance = await locking.totalSupply.call(); //totalBalance check
			assert.equal(await token.balanceOf(locking.address), 60000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 40000);			//tail user balance
			assert.equal(idLock, 1);
			assert.equal(balanceOf, 18923);
			assert.equal(totalBalance, 18923);

			await incrementBlock(WEEK * 20); //20 week later
			balanceOf = await locking.balanceOf.call(accounts[3]);
			assert.equal(balanceOf, 6303);
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 20000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 80000);			      //miss user balance stRari

			await locking.delegateTo(idLock, accounts[4], { from: accounts[2] });  //delegate from accounts[3] to accounts[4]
			balanceOf = await locking.balanceOf.call(accounts[3]); //for check balance accounts[3]
			assert.equal(balanceOf, 0);     //stRary balance accounts[3], after _delegateTo()

			balanceOf = await locking.balanceOf.call(accounts[4]); //for check balance accounts[4]
			assert.equal(balanceOf, 6303);    //stRary balance accounts[3], after _delegateTo()

			await incrementBlock(WEEK * 5); //5 week later
			await locking.delegateTo(idLock, accounts[3], { from: accounts[2] });  //delegate from accounts[4] to accounts[3] (delegate back)
			balanceOf = await locking.balanceOf.call(accounts[4]);
			assert.equal(balanceOf, 0);
			balanceOf = await locking.balanceOf.call(accounts[3]);
			assert.equal(balanceOf, 3148);
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 10000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 90000);			//tail user balance

			await incrementBlock(WEEK * 5); //5 week later
			balanceOf = await locking.balanceOf.call(accounts[3]);
			assert.equal(balanceOf, 0);
			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 0);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100000);			//tail user balance
			totalBalance = await locking.totalSupply.call();
			assert.equal(totalBalance, 0);
		});

		it("Test4. delegate() stRari, after finish time Line, throw", async () => {
			await token.mint(accounts[2], 100000);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[3], 60000, 30, 0, { from: accounts[2] });  //first time lock
			let idLock = 1;

			await incrementBlock(WEEK * 30); //20 week later
			await expectThrow(
				locking.delegateTo(idLock, accounts[4], { from: accounts[2] })  //delegate from accounts[3]
			);
		});
	})

	describe("Part6. Check setStopLock()", () => {

		it("Test1. stop() and check account and total balance stRari", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[3], 60, 30, 0, { from: accounts[2] });  //first time lock
			let idLock = 1;

			await locking.stop();    //STOP!!! only owner

			balanceOf = await locking.balanceOf.call(accounts[3]); //check balance account
			assert.equal(balanceOf, 0);
			assert.equal(await token.balanceOf(locking.address), 60);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 40);			//tail user balance

			totalBalance = await locking.totalSupply.call(); //check balance total
			assert.equal(totalBalance, 0);
		});

		it("Test2. stop() after check lock(), relock() methods", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[3], 60, 30, 0, { from: accounts[2] });  //first time lock
			let idLock = 1;

			await locking.stop();    //STOP!!! only owner

			await expectThrow(locking.lock(accounts[2], accounts[4], 60, 30, 0, { from: accounts[2] }));
		});

		it("Test3. stop() and check withdraw()", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[3], 60, 30, 0, { from: accounts[2] });  //first time lock
			let idLock = 1;

			await locking.stop();    //STOP!!! only owner

			await locking.withdraw({ from: accounts[2] });  //chek withdraw
			assert.equal(await token.balanceOf(locking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 100);			//tail user balance
		});

		it("Test4. stop()  from not owner, throw", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[3], 60, 30, 0, { from: accounts[2] });  //first time lock
			let idLock = 1;

			await expectThrow(
				locking.stop({ from: accounts[8] })    //STOP!!! not owner
			);
		});
	})

	describe("Part7. Check Migration()", () => {

		it("Test1. migrate() after start", async () => {
			await token.mint(accounts[2], 100000);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 60000, 30, 0, { from: accounts[2] });  //first time lock
			let idLock = 1;

			await locking.startMigration(newLocking.address);    //Start migration!!!, only owner

			let balanceOf = await locking.balanceOf.call(accounts[2]); //check balance account
			assert.equal(balanceOf, 18923);
			assert.equal(await token.balanceOf(locking.address), 60000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 40000);			      //tail user balance

			let totalBalance = await locking.totalSupply.call(); //check balance total
			assert.equal(totalBalance, 18923);

			await locking.migrate([idLock], { from: accounts[2] });            //migrate

			balanceOf = await locking.balanceOf.call(accounts[2]); //check balance account
			assert.equal(balanceOf, 0);
			assert.equal(await token.balanceOf(locking.address), 0);				//balance Lock on deposite after migrate
			assert.equal(await token.balanceOf(newLocking.address), 60000);		//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 40000);			      //tail user balance

			totalBalance = await locking.totalSupply.call(); //check balance total
			assert.equal(totalBalance, 0);
		});

		it("Test2. After 10 weeks migrate() slope works", async () => {
			await token.mint(accounts[2], 100000);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[3], 60000, 30, 0, { from: accounts[2] });  //first time lock
			let idLock = 1;

			let balanceOf = await locking.balanceOf.call(accounts[3]); //check balance account
			assert.equal(balanceOf, 18923);

			await incrementBlock(WEEK * 10);
			await locking.startMigration(newLocking.address);    //Start migration!!!, only owner
			await locking.migrate([idLock], { from: accounts[2] });            //migrate

			balanceOf = await locking.balanceOf.call(accounts[3]); //check balance account
			assert.equal(balanceOf, 0);
			assert.equal(await token.balanceOf(locking.address), 20000);				//balance Lock on deposite after migrate, till withdraw
			assert.equal(await token.balanceOf(newLocking.address), 40000);		//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 40000);			      //tail user balance

			let totalBalance = await locking.totalSupply.call(); //check balance total
			assert.equal(totalBalance, 0);

			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 0);         //after withdraw
			assert.equal(await token.balanceOf(accounts[2]), 60000);			      //tail user balance
		});

		it("Test3. After 10 weeks migrate() tial works", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[3], 65, 11, 0, { from: accounts[2] });  //first time lock
			let idLock = 1;

			await incrementBlock(WEEK * 10);
			await locking.startMigration(newLocking.address);                   //Start migration!!!, only owner
			await locking.migrate([idLock], { from: accounts[2] });             //migrate

			assert.equal(await token.balanceOf(locking.address), 60);				    //balance Lock on deposite after migrate, till withdraw
			assert.equal(await token.balanceOf(newLocking.address), 5);		      //balance Lock on deposite newContract
			assert.equal(await token.balanceOf(accounts[2]), 35);			          //tail user balance

			let totalBalance = await locking.totalSupply.call(); //check balance total
			assert.equal(totalBalance, 0);

			await locking.withdraw({ from: accounts[2] });
			assert.equal(await token.balanceOf(locking.address), 0);        //after withdraw oldContract
			assert.equal(await token.balanceOf(newLocking.address), 5);		  //balance Lock on deposite newContract
			assert.equal(await token.balanceOf(accounts[2]), 95);			      //tail user balance
		});

		it("Test4. migrate() to contract no supported INextVersionLock, throw", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[3], 60, 30, 0, { from: accounts[2] });  //first time lock
			let idLock = 1;

			await locking.startMigration(newLockingNoInterface.address);    //Start migration!!!, only owner
			await truffleAssert.reverts(locking.migrate([idLock], { from: accounts[2] }));
		});

		it("Test5. startMigration() from not owner, throw", async () => {
			await expectThrow(
				locking.startMigration(newLocking.address, { from: accounts[8] })    //startMigration!!! not owner
			);
		});
	})

	describe("Part8. Check calculation token newAmount, newSlope by formula", () => {

		it("Test1. Set different parameters getLock(amount, slope, cliff), check result newAmount, newSlope", async () => {
			let result = [];
			// slope = 720, cliff = 30,
			result = await locking.getLockTest(60000, 30, 30);
			assert.equal(result[0], 32903);
			assert.equal(result[1], 1097);

			// slope = 1031, cliff = 48
			result = await locking.getLockTest(96000, 48, 48);
			assert.equal(result[0], 72713);
			assert.equal(result[1], 1515);

			// slope = 104, cliff = 0,
			result = await locking.getLockTest(104000, 104, 0);
			assert.equal(result[0], 62400);
			assert.equal(result[1], 600);

			// slope = 1, cliff = 104,
			result = await locking.getLockTest(104000, 1, 103);
			assert.equal(result[0], 104399);
			assert.equal(result[1], 104399);

		});

		it("Test2. CreateLock(), there is tail in stAmount, check st finish  the same as token finish", async () => {
			await token.mint(accounts[2], 6000);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 5200, 52, 53, { from: accounts[2] });
			let balanceOf = await locking.balanceOf.call(accounts[2]);

			assert.equal(await token.balanceOf(locking.address), 5200);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 800);			//tail user balance
			assert.equal(balanceOf, 4220);

			await incrementBlock(WEEK * 103);
			await locking.withdraw({ from: accounts[2] });
			balanceOf = await locking.balanceOf.call(accounts[2]);
			assert.equal(balanceOf, 120);  //slope =82, tail =38

			await incrementBlock(WEEK);
			await locking.withdraw({ from: accounts[2] });
			balanceOf = await locking.balanceOf.call(accounts[2]);
			assert.equal(balanceOf, 38);
			assert.equal(await token.balanceOf(locking.address), 100);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 5900);			//tail user balance

			await incrementBlock(WEEK);
			await locking.withdraw({ from: accounts[2] });
			balanceOf = await locking.balanceOf.call(accounts[2]);
			assert.equal(balanceOf, 0);
			assert.equal(await token.balanceOf(locking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 6000);			//tail user balance
		});

		it("Test3. CreateLock(), there is no tail in stAmount", async () => {
			await token.mint(accounts[2], 600000);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 520000, 20, 20, { from: accounts[2] }); //
			let balanceOf = await locking.balanceOf.call(accounts[2]);

			assert.equal(await token.balanceOf(locking.address), 520000);				//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 80000);			//tail user balance
			assert.equal(balanceOf, 224776);

			await incrementBlock(WEEK * 20);
			await locking.withdraw({ from: accounts[2] });
			balanceOf = await locking.balanceOf.call(accounts[2]);
			assert.equal(balanceOf, 224776);
			assert.equal(await token.balanceOf(locking.address), 520000);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 80000);			//tail user balance

			await incrementBlock(WEEK * 20);
			await locking.withdraw({ from: accounts[2] });
			balanceOf = await locking.balanceOf.call(accounts[2]);
			assert.equal(balanceOf, 0);
			assert.equal(await token.balanceOf(locking.address), 0);	//balance Lock on deposite
			assert.equal(await token.balanceOf(accounts[2]), 600000);			//tail user balance
		});
	})

	describe("Part9. Check events emit()", () => {
		it("Test1. check emit Lock()", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			resultLock = await locking.lock(accounts[2], accounts[3], 20, 2, 7, { from: accounts[2] });

			let account;
			let delegate;
			let amount;
			let slopePeriod;
			let cliff;
			truffleAssert.eventEmitted(resultLock, 'LockCreate', (ev) => {
				account = ev.account;
				delegate = ev.delegate;
				amount = ev.amount;
				slopePeriod = ev.slopePeriod;
				cliff = ev.cliff;
				return true;
			});
			assert.equal(account, accounts[2]);
			assert.equal(delegate, accounts[3]);
			assert.equal(amount, 20);
			assert.equal(slopePeriod, 2);
			assert.equal(cliff, 7);
		});

		it("Test2. check emit Relock()", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			let id = 1;
			await locking.lock(accounts[2], accounts[2], 20, 2, 7, { from: accounts[2] });
			resultReLock = await locking.relock(id, accounts[3], 30, 6, 17, { from: accounts[2] });

			let delegate;
			let amount;
			let slopePeriod;
			let cliff;
			let account;
			let counter;
			truffleAssert.eventEmitted(resultReLock, 'Relock', (ev) => {
				id = ev.id;
				account = ev.account;
				delegate = ev.delegate;
				counter = ev.counter;
				amount = ev.amount;
				slopePeriod = ev.slopePeriod;
				cliff = ev.cliff;
				return true;
			});
			assert.equal(id, 1);
			assert.equal(account, accounts[2]);
			assert.equal(delegate, accounts[3]);
			assert.equal(counter, 2);
			assert.equal(amount, 30);
			assert.equal(slopePeriod, 6);
			assert.equal(cliff, 17);
		});

		it("Test3. check emit Delegate()", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			let id = 1;
			await locking.lock(accounts[2], accounts[3], 20, 2, 7, { from: accounts[2] });
			resultDelegate = await locking.delegateTo(id, accounts[4], { from: accounts[2] });

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
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			let id = 1;
			await locking.lock(accounts[2], accounts[3], 20, 2, 7, { from: accounts[2] });
			await incrementBlock(WEEK * 8);
			resultWithdraw = await await locking.withdraw({ from: accounts[2] });
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
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 20, 2, 7, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 30, 3, 7, { from: accounts[2] });
			await locking.lock(accounts[2], accounts[2], 40, 4, 7, { from: accounts[2] });
			await locking.startMigration(newLocking.address);
			resultMigrate = await locking.migrate([1, 2, 3], { from: accounts[2] });
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
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			resultLock = await locking.lock(accounts[2], accounts[3], 20, 2, 7, { from: accounts[2] });

			startMigrationRezult = await locking.startMigration(newLocking.address, { from: accounts[0] });

			let account;
			let newContract;
			truffleAssert.eventEmitted(startMigrationRezult, 'StartMigration', (ev) => {
				account = ev.account;
				newContract = ev.to;
				return true;
			});
			assert.equal(account, accounts[0]);
			assert.equal(newContract, newLocking.address);
		});

		it("Test6.1 check emit SetMinSlopePeriod()", async () => {
			let setMinSlopePeriodResult = await locking.setMinSlopePeriod(20, { from: accounts[0] });

			let newMinSlope;
			truffleAssert.eventEmitted(setMinSlopePeriodResult, 'SetMinSlopePeriod', (ev) => {
				newMinSlope = ev.newMinSlopePeriod;
				return true;
			});
			assert.equal(newMinSlope, 20);
		});

		it("Test6.2 check emit SetMinCliffPeriod()", async () => {
			let setMinCliffPeriodResult = await locking.setMinCliffPeriod(20, { from: accounts[0] });

			let newMinCliff;
			truffleAssert.eventEmitted(setMinCliffPeriodResult, 'SetMinCliffPeriod', (ev) => {
				newMinCliff = ev.newMinCliffPeriod;
				return true;
			});
			assert.equal(newMinCliff, 20);
		});

		it("Test6.1 check emit SetMinSlopePeriod()", async () => {
			let setMinSlopePeriodResult = await locking.setMinSlopePeriod(20, { from: accounts[0] });

			let newMinSlope;
			truffleAssert.eventEmitted(setMinSlopePeriodResult, 'SetMinSlopePeriod', (ev) => {
				newMinSlope = ev.newMinSlopePeriod;
				return true;
			});
			assert.equal(newMinSlope, 20);
		});

		it("Test6.3 check emit SetMinCliffPeriod()", async () => {
			await incrementBlock(WEEK * 20)
			let SetStartingPointWeek = await locking.setStartingPointWeek(19, { from: accounts[0] });

			let newStartingPointWeek;
			truffleAssert.eventEmitted(SetStartingPointWeek, 'SetStartingPointWeek', (ev) => {
				newStartingPointWeek = ev.newStartingPointWeek;
				return true;
			});
			assert.equal(newStartingPointWeek, 19);
		});

		it("Test7. check emit StopLocking()", async () => {
			await token.mint(accounts[2], 100);
			await token.approve(locking.address, 1000000, { from: accounts[2] });
			resultLock = await locking.lock(accounts[2], accounts[3], 20, 2, 7, { from: accounts[2] });

			stopResult = await locking.stop({ from: accounts[0] });

			let account;
			truffleAssert.eventEmitted(stopResult, 'StopLocking', (ev) => {
				account = ev.account;
				return true;
			});
			assert.equal(account, accounts[0]);
		});
	})

	async function incrementBlock(amount) {
		await locking.incrementBlock(amount);
		currentBlock = await locking.blockNumberMocked();
	}

})