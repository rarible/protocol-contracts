import hre from "hardhat"
import "@nomiclabs/hardhat-ethers"

describe("OpenEdition", () => {
	it("should do something", async () => {
		const f = await hre.ethers.getContractFactory("OpenEditionCustomFee")
		const a = await f.deploy()
		console.log("deployed", a.address)
	})
})