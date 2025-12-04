// ExchangeV2 acceptance test for Polkadot Hub Testnet
// Tests deployed contracts via Hardhat Ignition

import { expect } from "chai"
import hre, { ethers } from "hardhat"
import { Signer, Wallet, AbiCoder } from "ethers"
import * as fs from "fs"
import * as path from "path"

// Import typechain types
import type {
    RoyaltiesRegistry,
    TransferProxy,
    ExchangeV2,
    ERC721RaribleMinimal,
} from "../typechain-types"

import {
    RoyaltiesRegistry__factory,
    TransferProxy__factory,
    ExchangeV2__factory,
    ERC721RaribleMinimal__factory,
} from "../typechain-types"

// Deployed address keys from Ignition
const DEPLOYED_ADDRESS_KEYS = {
    RoyaltiesRegistry: "RoyaltiesRegistryModule#RoyaltiesRegistryProxy",
    TransferProxy: "TransferProxiesModule#TransferProxyProxy",
    ERC20TransferProxy: "TransferProxiesModule#ERC20TransferProxyProxy",
    ERC721LazyMintTransferProxy: "TransferProxiesModule#ERC721LazyMintTransferProxyProxy",
    ERC1155LazyMintTransferProxy: "TransferProxiesModule#ERC1155LazyMintTransferProxyProxy",
    ExchangeV2: "ExchangeV2Module#ExchangeV2Proxy",
    AssetMatcherCollection: "ExchangeV2Module#AssetMatcherCollection",
    ERC721RaribleMinimal: "ERC721TokenModule#ERC721RaribleMinimalProxy",
    ERC721RaribleMinimalBeacon: "ERC721TokenModule#ERC721RaribleMinimalBeacon",
    ERC721RaribleFactoryC2: "ERC721TokenModule#ERC721RaribleFactoryC2",
    ERC1155Rarible: "ERC1155TokenModule#ERC1155RaribleProxy",
    ERC1155RaribleBeacon: "ERC1155TokenModule#ERC1155RaribleBeacon",
    ERC1155RaribleFactoryC2: "ERC1155TokenModule#ERC1155RaribleFactoryC2",
    RaribleExchangeWrapper: "ExchangeWrapperModule#RaribleExchangeWrapper",
} as const

type DeployedAddressKey = keyof typeof DEPLOYED_ADDRESS_KEYS

// Constants
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

// Asset class IDs (bytes4 keccak256)
const ETH = ethers.id("ETH").slice(0, 10)
const ERC721 = ethers.id("ERC721").slice(0, 10)
const ORDER_DATA_V3 = ethers.id("V3").slice(0, 10)

// Types for EIP-712 signing
const OrderTypes = {
    AssetType: [
        { name: "assetClass", type: "bytes4" },
        { name: "data", type: "bytes" },
    ],
    Asset: [
        { name: "assetType", type: "AssetType" },
        { name: "value", type: "uint256" },
    ],
    Order: [
        { name: "maker", type: "address" },
        { name: "makeAsset", type: "Asset" },
        { name: "taker", type: "address" },
        { name: "takeAsset", type: "Asset" },
        { name: "salt", type: "uint256" },
        { name: "start", type: "uint256" },
        { name: "end", type: "uint256" },
        { name: "dataType", type: "bytes4" },
        { name: "data", type: "bytes" },
    ],
}

interface AssetType {
    assetClass: string
    data: string
}

interface Asset {
    assetType: AssetType
    value: bigint
}

interface Order {
    maker: string
    makeAsset: Asset
    taker: string
    takeAsset: Asset
    salt: bigint
    start: bigint
    end: bigint
    dataType: string
    data: string
}

// Helper to encode asset data
function encodeAssetData(token: string, tokenId?: bigint): string {
    const abiCoder = AbiCoder.defaultAbiCoder()
    if (tokenId === undefined) {
        return abiCoder.encode(["address"], [token])
    }
    return abiCoder.encode(["address", "uint256"], [token, tokenId])
}

// Build tokenId from creator address and offset
// TokenId format: address (160 bits) + offset (96 bits)
// In hex: address (40 chars) + offset (24 chars)
// This is required for ERC721RaribleMinimal lazy mint
function buildTokenId(creator: string, offset: bigint): bigint {
    // Ensure offset fits in 96 bits
    const maxOffset = 2n ** 96n - 1n
    const safeOffset = offset % (maxOffset + 1n)
    
    // Convert address to BigInt and shift left by 96 bits
    const addressBigInt = BigInt(creator.toLowerCase())
    return (addressBigInt << 96n) + safeOffset
}

// Alternative: build tokenId using string concatenation (like JS tests)
function buildTokenIdFromHex(creator: string, offsetHex: string): bigint {
    // offsetHex should be 24 hex chars (96 bits)
    const paddedOffset = offsetHex.padStart(24, "0").slice(-24)
    const tokenIdHex = creator.toLowerCase() + paddedOffset
    return BigInt(tokenIdHex)
}

// Helper to encode V3 order data
function encodeV3Data(isMakeFill: boolean = true): string {
    const abiCoder = AbiCoder.defaultAbiCoder()
    // DataV3 { Part[] payouts, Part[] originFees, bool isMakeFill }
    return abiCoder.encode(
        ["tuple(tuple(address,uint96)[],tuple(address,uint96)[],bool)"],
        [[[], [], isMakeFill]]
    )
}

// Helper to create Asset
function createAsset(assetClass: string, data: string, value: bigint): Asset {
    return {
        assetType: { assetClass, data },
        value,
    }
}

// Helper to create Order
function createOrder(
    maker: string,
    makeAsset: Asset,
    taker: string,
    takeAsset: Asset,
    salt: bigint,
    start: bigint,
    end: bigint,
    dataType: string,
    data: string
): Order {
    return {
        maker,
        makeAsset,
        taker,
        takeAsset,
        salt,
        start,
        end,
        dataType,
        data,
    }
}

// Sign order with EIP-712
async function signOrder(
    signer: Signer,
    order: Order,
    exchangeAddress: string,
    chainId: bigint
): Promise<string> {
    const domain = {
        name: "Exchange",
        version: "2",
        chainId,
        verifyingContract: exchangeAddress,
    }
    return (signer as any).signTypedData(domain, OrderTypes, order)
}

// Read deployed addresses from Ignition for a specific chain
function getDeployedAddresses(chainId: bigint): Record<string, string> {
    const deploymentsPath = path.join(__dirname, "..", "ignition", "deployments")
    const chainDir = `chain-${chainId.toString()}`
    const deployedAddressesPath = path.join(deploymentsPath, chainDir, "deployed_addresses.json")
    
    if (!fs.existsSync(deployedAddressesPath)) {
        // Fallback: try to find any chain directory
        const chainDirs = fs.readdirSync(deploymentsPath).filter((d) => d.startsWith("chain-"))
        if (chainDirs.length === 0) {
            throw new Error("No chain deployment directory found in " + deploymentsPath)
        }
        console.log(`Warning: No deployment found for chain ${chainId}, using ${chainDirs[0]}`)
        const fallbackPath = path.join(deploymentsPath, chainDirs[0], "deployed_addresses.json")
        return JSON.parse(fs.readFileSync(fallbackPath, "utf8"))
    }
    
    return JSON.parse(fs.readFileSync(deployedAddressesPath, "utf8"))
}

// Get a specific deployed address
function getDeployedAddress(addresses: Record<string, string>, key: DeployedAddressKey): string {
    const fullKey = DEPLOYED_ADDRESS_KEYS[key]
    const address = addresses[fullKey]
    if (!address) {
        throw new Error(`Deployed address not found for ${key} (key: ${fullKey})`)
    }
    return address
}

describe("ExchangeV2 on Polkadot Hub Testnet", function () {
    // Increase timeout for testnet operations
    this.timeout(300000)

    let registry: RoyaltiesRegistry
    let transferProxy: TransferProxy
    let exchange: ExchangeV2
    let erc721: ERC721RaribleMinimal

    let owner: Signer
    let seller: Wallet
    let buyer: Wallet
    let royaltyRecipient: string

    let tokenId: bigint
    const price = ethers.parseEther("0.001")
    let chainId: bigint

    let protocolFeeBpsBuyer: bigint
    let protocolFeeBpsSeller: bigint

    before(async function () {
        // Get signers
        const signers = await ethers.getSigners()
        owner = signers[0]

        const PRIVATE_KEY1 = process.env.PRIVATE_KEY1
        const PRIVATE_KEY2 = process.env.PRIVATE_KEY2

        if (!PRIVATE_KEY1 || !PRIVATE_KEY2) {
            console.log("PRIVATE_KEY1 and PRIVATE_KEY2 not set, using owner for seller/buyer")
            seller = new Wallet(process.env.PRIVATE_KEY!, ethers.provider)
            buyer = new Wallet(process.env.PRIVATE_KEY!, ethers.provider)
        } else {
            seller = new Wallet(PRIVATE_KEY1, ethers.provider)
            buyer = new Wallet(PRIVATE_KEY2, ethers.provider)
        }

        royaltyRecipient = seller.address

        // Get chain ID
        const network = await ethers.provider.getNetwork()
        chainId = network.chainId
        console.log("Chain ID:", chainId.toString())
        console.log("Network:", hre.network.name)

        // Get deployed addresses from Ignition
        const deployedAddresses = getDeployedAddresses(chainId)
        
        // Get addresses using typed keys
        const registryAddress = getDeployedAddress(deployedAddresses, "RoyaltiesRegistry")
        const transferProxyAddress = getDeployedAddress(deployedAddresses, "TransferProxy")
        const exchangeAddress = getDeployedAddress(deployedAddresses, "ExchangeV2")
        const erc721Address = getDeployedAddress(deployedAddresses, "ERC721RaribleMinimal")

        console.log("\n=== Deployed Addresses (from Ignition) ===")
        console.log("RoyaltiesRegistry:", registryAddress)
        console.log("TransferProxy:", transferProxyAddress)
        console.log("ExchangeV2:", exchangeAddress)
        console.log("ERC721RaribleMinimal:", erc721Address)

        // Connect to deployed contracts using typechain factories
        registry = RoyaltiesRegistry__factory.connect(registryAddress, owner)
        transferProxy = TransferProxy__factory.connect(transferProxyAddress, owner)
        exchange = ExchangeV2__factory.connect(exchangeAddress, owner)
        erc721 = ERC721RaribleMinimal__factory.connect(erc721Address, seller)

        console.log("\n=== Account Balances ===")
        console.log("Owner:", await owner.getAddress())
        console.log("  Balance:", ethers.formatEther(await ethers.provider.getBalance(await owner.getAddress())))
        console.log("Seller:", seller.address)
        console.log("  Balance:", ethers.formatEther(await ethers.provider.getBalance(seller.address)))
        console.log("Buyer:", buyer.address)
        console.log("  Balance:", ethers.formatEther(await ethers.provider.getBalance(buyer.address)))

        // Get protocol fees
        const [, buyerFee, sellerFee] = await exchange.protocolFee()
        protocolFeeBpsBuyer = buyerFee
        protocolFeeBpsSeller = sellerFee
        console.log("\n=== Protocol Fees ===")
        console.log("Buyer fee:", protocolFeeBpsBuyer.toString(), "bps")
        console.log("Seller fee:", protocolFeeBpsSeller.toString(), "bps")

        // Generate unique token ID with creator address encoded
        // TokenId format for ERC721RaribleMinimal: address (160 bits) + offset (96 bits)
        // Using hex string concatenation like in the original JS tests
        const offsetHex = Date.now().toString(16).padStart(24, "0").slice(-24)
        tokenId = buildTokenIdFromHex(seller.address, offsetHex)
        
        // Also compute using BigInt for comparison
        const tokenIdBigInt = buildTokenId(seller.address, BigInt(Date.now()))
        
        console.log("\nToken ID generation:")
        console.log("  Seller address:", seller.address)
        console.log("  Offset (hex):", offsetHex)
        console.log("  TokenId (from hex):", tokenId.toString())
        console.log("  TokenId (from BigInt):", tokenIdBigInt.toString())
        console.log("  TokenId hex:", "0x" + tokenId.toString(16))
    })

    describe("Mint and Trade NFT", function () {
        it("should mint NFT with royalties via lazy mint", async function () {
            console.log("\n=== Minting NFT ===")

            const gasPrice = (await ethers.provider.getFeeData()).gasPrice! * 2n

            // Check contract owner
            const contractOwner = await erc721.owner()
            console.log("ERC721 contract owner:", contractOwner)
            console.log("Seller address:", seller.address)

            // Check if seller is a minter
            const isMinter = await erc721.isMinter(seller.address)
            console.log("Seller is minter:", isMinter)

            // If seller is not owner and not minter, add as minter
            if (!isMinter && contractOwner.toLowerCase() !== seller.address.toLowerCase()) {
                console.log("Adding seller as minter...")
                const addMinterTx = await erc721.connect(owner).addMinter(seller.address, { gasPrice })
                await addMinterTx.wait(1)
                console.log("Seller added as minter")
            }

            // Verify tokenId extraction matches seller address
            // Contract does: address minter = address(uint160(data.tokenId >> 96));
            const extractedMinter = "0x" + (tokenId >> 96n).toString(16).padStart(40, "0")
            console.log("TokenId:", tokenId.toString())
            console.log("TokenId (hex):", "0x" + tokenId.toString(16))
            console.log("Extracted minter from tokenId:", extractedMinter)
            console.log("Expected creator (seller):", seller.address)
            console.log("Addresses match:", extractedMinter.toLowerCase() === seller.address.toLowerCase())

            // Prepare mint data with royalties (10% = 1000 bps)
            // For lazy mint, creator encoded in tokenId must match creators array
            const mintData = {
                tokenId,
                tokenURI: "ipfs://QmTest" + tokenId.toString(),
                creators: [{ account: seller.address, value: 10000n }], // 100%
                royalties: [{ account: royaltyRecipient, value: 1000n }], // 10%
                signatures: ["0x"], // Empty signature - valid when caller is creator/minter
            }

            console.log("Mint data:", JSON.stringify(mintData, (_, v) => (typeof v === "bigint" ? v.toString() : v)))

            // Mint the token
            console.log("Minting token...")
            try {
                const mintTx = await erc721.connect(seller).mintAndTransfer(mintData, seller.address, { gasPrice })
                const receipt = await mintTx.wait(1)
                console.log("Mint TX:", receipt?.hash)
            } catch (error: any) {
                console.error("Mint error:", error.message)
                throw error
            }

            // Verify ownership
            const ownerOfToken = await erc721.ownerOf(tokenId)
            expect(ownerOfToken.toLowerCase()).to.equal(seller.address.toLowerCase())
            console.log("Token minted to seller!")

            // Check royalties
            const royalties = await erc721.getRaribleV2Royalties(tokenId)
            console.log("Royalties:", JSON.stringify(royalties, (_, v) => (typeof v === "bigint" ? v.toString() : v)))
            expect(royalties.length).to.equal(1)
            expect(royalties[0].account.toLowerCase()).to.equal(royaltyRecipient.toLowerCase())
            expect(royalties[0].value).to.equal(1000n)
        })

        it("should approve transfer proxy", async function () {
            console.log("\n=== Approving Transfer Proxy ===")

            const gasPrice = (await ethers.provider.getFeeData()).gasPrice! * 2n
            const transferProxyAddress = await transferProxy.getAddress()

            // Check current approval
            const isApproved = await erc721.isApprovedForAll(seller.address, transferProxyAddress)
            console.log("Already approved for all:", isApproved)

            if (!isApproved) {
                // Approve for all (better for multiple trades)
                console.log("Setting approval for all...")
                const approveTx = await erc721.connect(seller).setApprovalForAll(transferProxyAddress, true, { gasPrice })
                await approveTx.wait(1)
                console.log("Transfer proxy approved!")
            }

            // Verify approval
            const approvedAfter = await erc721.isApprovedForAll(seller.address, transferProxyAddress)
            expect(approvedAfter).to.equal(true)
        })

        it("should execute trade via matchOrders", async function () {
            console.log("\n=== Executing Trade ===")

            // Check if token exists (was minted in previous test)
            try {
                await erc721.ownerOf(tokenId)
            } catch {
                this.skip() // Skip if token doesn't exist
            }

            const gasPrice = (await ethers.provider.getFeeData()).gasPrice! * 2n
            const erc721Address = await erc721.getAddress()
            const exchangeAddress = await exchange.getAddress()

            // Snapshot balances before
            const sellerBalanceBefore = await ethers.provider.getBalance(seller.address)
            const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address)

            console.log("Balances before:")
            console.log("  Seller:", ethers.formatEther(sellerBalanceBefore))
            console.log("  Buyer:", ethers.formatEther(buyerBalanceBefore))

            // Create sell order (seller sells NFT for ETH)
            const sellOrder = createOrder(
                seller.address,
                createAsset(ERC721, encodeAssetData(erc721Address, tokenId), 1n),
                ZERO_ADDRESS, // Any buyer
                createAsset(ETH, "0x", price),
                BigInt(Date.now()),
                0n,
                0n,
                ORDER_DATA_V3,
                encodeV3Data(true)
            )

            // Create buy order (buyer buys NFT with ETH)
            const buyOrder = createOrder(
                buyer.address,
                createAsset(ETH, "0x", price),
                seller.address,
                createAsset(ERC721, encodeAssetData(erc721Address, tokenId), 1n),
                BigInt(Date.now()) + 1n,
                0n,
                0n,
                ORDER_DATA_V3,
                encodeV3Data(true)
            )

            console.log("Signing orders...")
            const sellSignature = await signOrder(seller, sellOrder, exchangeAddress, chainId)
            const buySignature = await signOrder(buyer, buyOrder, exchangeAddress, chainId)

            console.log("Executing matchOrders...")
            const tx = await exchange.connect(buyer).matchOrders(
                sellOrder,
                sellSignature,
                buyOrder,
                buySignature,
                { value: price, gasPrice }
            )
            const receipt = await tx.wait(1)
            console.log("Trade TX:", receipt?.hash)

            // Verify NFT ownership transferred
            const newOwner = await erc721.ownerOf(tokenId)
            expect(newOwner.toLowerCase()).to.equal(buyer.address.toLowerCase())
            console.log("NFT transferred to buyer!")

            // Check balances after
            const sellerBalanceAfter = await ethers.provider.getBalance(seller.address)
            const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address)

            console.log("\nBalances after:")
            console.log("  Seller:", ethers.formatEther(sellerBalanceAfter))
            console.log("  Buyer:", ethers.formatEther(buyerBalanceAfter))

            // Calculate expected amounts
            const royaltyAmount = (price * 1000n) / 10000n // 10%
            const protocolFee = (price * protocolFeeBpsSeller) / 10000n
            const expectedSellerReceived = price - royaltyAmount - protocolFee

            console.log("\nExpected calculations:")
            console.log("  Price:", ethers.formatEther(price))
            console.log("  Royalty (10%):", ethers.formatEther(royaltyAmount))
            console.log("  Protocol fee:", ethers.formatEther(protocolFee))
            console.log("  Expected seller receives:", ethers.formatEther(expectedSellerReceived))

            // Verify seller received payment
            const sellerReceived = sellerBalanceAfter - sellerBalanceBefore
            console.log("  Actual seller received:", ethers.formatEther(sellerReceived))

            // Allow small tolerance for gas variations
            const tolerance = ethers.parseEther("0.0001")
            expect(sellerReceived).to.be.closeTo(expectedSellerReceived, tolerance)

            console.log("\n✅ Trade completed successfully!")
        })
    })

    describe("Royalties Registry", function () {
        it("should return royalties for token", async function () {
            console.log("\n=== Checking Royalties Registry ===")

            // Check if token exists (was minted)
            try {
                await erc721.ownerOf(tokenId)
            } catch {
                console.log("Token doesn't exist, skipping royalties test")
                this.skip()
            }

            const erc721Address = await erc721.getAddress()

            // Use staticCall to get the return value
            const royalties = await registry.getRoyalties.staticCall(erc721Address, tokenId)
            console.log("Royalties from registry:", JSON.stringify(royalties, (_, v) => (typeof v === "bigint" ? v.toString() : v)))

            expect(royalties.length).to.be.greaterThan(0)
            expect(royalties[0].account.toLowerCase()).to.equal(royaltyRecipient.toLowerCase())
        })
    })
})

