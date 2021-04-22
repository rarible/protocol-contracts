//const StakingTest = artifacts.require("StakingTest.sol");
const Staking = artifacts.require("Staking.sol");

contract("Staking", accounts => {
//	let forTest;
	let staking;

	beforeEach(async () => {
//		forTest = await StakingTest.new();
		staking = await Staking.new();
	})

	describe("Check metods Staking()", () => {

		it("Try to createLock()", async () => {
			let tmp;
			console.log("before idLock");
//			tmp  = await staking.createLock(accounts[2], 20, 2678, 0, {from: accounts[2], value: 100, gasPrice: 0});
			tmp  = await staking.createLock(accounts[2], 20, 2678, 0);
			console.log("After idLock:"+ JSON.stringify(tmp));
			//срочно делаем обертку ибо сложно вернуть результат функции
		});

		it("Should balanceOf()", async () => {
			console.log("before balanceOf");
			let tmp  = await staking.balanceOf(accounts[2]);
			console.log("After balanceOf:"+ tmp);
		});

	})

})