const Impl = artifacts.require("FeesV2Impl.sol");
const Test = artifacts.require("FeesV2Test.sol");

contract("v2", () => {
	let impl;
	let testing;

	beforeEach(async () => {
		impl = await Impl.new();
		testing = await Test.new(impl.address);
	})

	it("simple impl works", async () => {
		const tx = await testing.feesTest();
		console.log("used gas", tx.receipt.gasUsed);
	})
})