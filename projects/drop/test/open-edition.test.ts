import hre from "hardhat"
import "@nomiclabs/hardhat-ethers"
import {
	EIP173Proxy,
	EIP173Proxy__factory,
	IDrop,
	OpenEditionCustomFee,
	OpenEditionCustomFee__factory
} from "../typechain-types"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { expect } from "chai"
import { randomAddress } from "hardhat/internal/hardhat-network/provider/utils/random"

type FeesStruct = OpenEditionCustomFee.FeesStruct
type AllowlistProofStruct = IDrop.AllowlistProofStruct

describe("OpenEdition", () => {
	let factory: OpenEditionCustomFee__factory
	let impl: OpenEditionCustomFee
	let proxyFactory: EIP173Proxy__factory
	let proxy: EIP173Proxy
	let drop: OpenEditionCustomFee
	let first: SignerWithAddress
	let signers: SignerWithAddress[]
	let protocolRecipient: string
	let creatorFinderFeeRecipient1: string
	let creatorFinderFeeRecipient2: string
	let buyerFinderFeeRecipient1: string
	let buyerFinderFeeRecipient2: string

	before(async () => {
		signers = await hre.ethers.getSigners()
		first = signers[0]

		factory = await hre.ethers.getContractFactory("OpenEditionCustomFee")
		impl = await factory.deploy()
		proxyFactory = await hre.ethers.getContractFactory("EIP173Proxy")
	})

	beforeEach(async () => {
		proxy = await proxyFactory.deploy(impl.address, first.address, "0x")
		drop = factory.attach(proxy.address)

		protocolRecipient = randomAddress().toString()
		creatorFinderFeeRecipient1 = randomAddress().toString()
		creatorFinderFeeRecipient2 = randomAddress().toString()
		buyerFinderFeeRecipient1 = randomAddress().toString()
		buyerFinderFeeRecipient2 = randomAddress().toString()
	})

	it("should send buyerFee to protocol if not specified", async () => {
		await prepareDropContract()

		await drop.claim(signers[5].address, 1, ETH_CURRENCY, 1000000000, proof, "0x", {
			value: 1000000000
		})

		await expect(getBalance(protocolRecipient)).eventually.to.equal(300)
		await expect(getBalance(buyerFinderFeeRecipient1)).eventually.to.equal(0)
		await expect(getBalance(buyerFinderFeeRecipient2)).eventually.to.equal(0)
		await expect(getBalance(creatorFinderFeeRecipient1)).eventually.to.equal(150)
		await expect(getBalance(creatorFinderFeeRecipient2)).eventually.to.equal(0)
	})

	it("should send buyerFee to 1 recipient", async () => {
		await prepareDropContract()

		const data = `0x${buyerFinderFeeRecipient1.substring(2)}000000000000000000002710`
		await drop.claim(signers[5].address, 1, ETH_CURRENCY, 1000000000, proof, data, {
			value: 1000000000
		})

		await expect(getBalance(protocolRecipient)).eventually.to.equal(100)
		await expect(getBalance(buyerFinderFeeRecipient1)).eventually.to.equal(200)
		await expect(getBalance(buyerFinderFeeRecipient2)).eventually.to.equal(0)
		await expect(getBalance(creatorFinderFeeRecipient1)).eventually.to.equal(150)
		await expect(getBalance(creatorFinderFeeRecipient2)).eventually.to.equal(0)
	})

	it("should send buyerFee to 2 recipients", async () => {
		await prepareDropContract()

		const data = `0x${buyerFinderFeeRecipient1.substring(2)}000000000000000000001770${buyerFinderFeeRecipient2.substring(2)}000000000000000000000FA0`
		await drop.claim(signers[5].address, 1, ETH_CURRENCY, 1000000000, proof, data, {
			value: 1000000000
		})

		await expect(getBalance(protocolRecipient)).eventually.to.equal(100)
		await expect(getBalance(buyerFinderFeeRecipient1)).eventually.to.equal(120)
		await expect(getBalance(buyerFinderFeeRecipient2)).eventually.to.equal(80)
		await expect(getBalance(creatorFinderFeeRecipient1)).eventually.to.equal(150)
		await expect(getBalance(creatorFinderFeeRecipient2)).eventually.to.equal(0)
	})

	async function prepareDropContract(secondCreatorFinderFeeBps: number = 0) {
		await initialize(
			{
				protocolFee: 100,
				protocolFeeRecipient: protocolRecipient,
				creatorFinderFee: 150,
				creatorFinderFeeRecipient1: {
					recipient: creatorFinderFeeRecipient1,
					value: 10000 - secondCreatorFinderFeeBps,
				},
				creatorFinderFeeRecipient2: {
					recipient: creatorFinderFeeRecipient2,
					value: secondCreatorFinderFeeBps,
				},
				buyerFinderFee: 200,
			}
		)
	}

	async function initialize(fees: FeesStruct) {
		await drop.initialize(
			first.address,
			"TST",
			"TST",
			"uri",
			[],
			signers[1].address,
			signers[2].address,
			1000,
			fees,
		)

		await drop.setSharedMetadata({
			name: "TST",
			description: "TST",
			imageURI: "image",
			animationURI: "animation",
		})

		await drop.setClaimConditions([
			{
				startTimestamp: 0,
				maxClaimableSupply: 1000000,
				supplyClaimed: 0,
				quantityLimitPerWallet: 1000000,
				merkleRoot: "0x0000000000000000000000000000000000000000000000000000000000000000",
				pricePerToken: 1000000000,
				currency: ETH_CURRENCY,
				metadata: "ipfs://QmVu98eczZRpSYcF3UKYRDkHsM2RMQR62KUYmk29UDbWTP/0"
			}
		], false)
	}

	function getBalance(address: string) {
		return hre.ethers.provider.getBalance(address)
	}
})

const ETH_CURRENCY = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"

const proof: AllowlistProofStruct = {
	proof: ["0x0000000000000000000000000000000000000000000000000000000000000000"],
	currency: ETH_CURRENCY,
	pricePerToken: 1000000000,
	quantityLimitPerWallet: 1000000
}
