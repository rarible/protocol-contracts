const FeesV1Impl = artifacts.require("FeesV1Impl.sol");
const TestV1 = artifacts.require("FeesV1Test.sol");

contract("v1", () => {
	let v1;
	let testV1;

	beforeEach(async () => {
		v1 = await FeesV1Impl.new();
		testV1 = await TestV1.new(v1.address);
	})

	it("simple impl works", async () => {
		const tx = await testV1.feesTest();
		console.log("used gas", tx.receipt.gasUsed);
	})
})