import { RariFeesConfig } from "../typechain-types"
import hre from "hardhat"
import { expect } from "chai"

describe("RariFeesConfig", () => {
	let config: RariFeesConfig

	beforeEach(async () => {
		const f = await hre.ethers.getContractFactory("RariFeesConfig")
		config = await f.deploy(zero)
	})

	it("should not let anyone invoke setters", async () => {
		const signers = await hre.ethers.getSigners()
		await expect(config.connect(signers[1]).setRecipient(signers[0].address)).to.eventually.rejectedWith("Ownable: caller is not the owner")
		await expect(config.connect(signers[1]).setFee(zero, 100)).to.eventually.rejectedWith("Ownable: caller is not the owner")
	})

	it("should set and read data", async () => {
		const signers = await hre.ethers.getSigners()

		await expect(config.getRecipient()).to.eventually.eq(zero)
		await expect(config.getFee(zero)).to.eventually.eq(0)

		await config.setRecipient(signers[0].address)
		await config.setFee(zero, 100000)

		await expect(config.getRecipient()).to.eventually.eq(signers[0].address)
		await expect(config.getFee(zero)).to.eventually.eq(100000)
	})

	it("should let transfer ownership", async () => {
		const signers = await hre.ethers.getSigners()
		await expect(config.connect(signers[1]).transferOwnership(signers[0].address)).to.eventually.rejectedWith("Ownable: caller is not the owner")

		await config.transferOwnership(signers[1].address)

		await config.connect(signers[1]).setRecipient(signers[0].address)
		await config.connect(signers[1]).setFee(zero, 100)
	})

})

const zero = "0x0000000000000000000000000000000000000000"