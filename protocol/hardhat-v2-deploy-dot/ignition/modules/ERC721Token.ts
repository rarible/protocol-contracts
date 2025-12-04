// Hardhat Ignition module for deploying ERC721RaribleMinimal token, beacon, and factory
// Learn more at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"
import * as fs from "fs"
import * as path from "path"

// Read deployed addresses from previous deployments
function getDeployedAddresses(): Record<string, string> {
    const deploymentsDir = path.join(__dirname, "../deployments")
    
    if (!fs.existsSync(deploymentsDir)) {
        throw new Error(`Deployments directory not found: ${deploymentsDir}`)
    }
    
    const chainDirs = fs.readdirSync(deploymentsDir).filter(d => d.startsWith("chain-"))
    if (chainDirs.length === 0) {
        throw new Error("No chain deployment directories found")
    }
    
    const chainDir = chainDirs[0]
    const addressesFile = path.join(deploymentsDir, chainDir, "deployed_addresses.json")
    
    if (!fs.existsSync(addressesFile)) {
        throw new Error(`Deployed addresses file not found: ${addressesFile}`)
    }
    
    return JSON.parse(fs.readFileSync(addressesFile, "utf-8"))
}

function getAddress(addresses: Record<string, string>, key: string): string {
    const address = addresses[key]
    if (!address) {
        throw new Error(`Address not found for key: ${key}`)
    }
    return address
}

const ERC721TokenModule = buildModule("ERC721TokenModule", (m) => {
    // ============================================
    // Read addresses from previous deployments
    // ============================================
    const deployedAddresses = getDeployedAddresses()
    
    const transferProxyAddress = getAddress(deployedAddresses, "TransferProxiesModule#TransferProxyProxy")
    const erc721LazyMintTransferProxyAddress = getAddress(deployedAddresses, "TransferProxiesModule#ERC721LazyMintTransferProxyProxy")

    // ============================================
    // Parameters
    // ============================================
    const owner = m.getParameter<string>("owner")
    const tokenName = m.getParameter<string>("tokenName", "Rarible")
    const tokenSymbol = m.getParameter<string>("tokenSymbol", "RARI")
    const baseURI = m.getParameter<string>("baseURI", "ipfs:/")
    const contractURI = m.getParameter<string>("contractURI", "")

    // ============================================
    // 1. Deploy ERC721RaribleMinimal Implementation
    // ============================================
    const erc721Impl = m.contract("ERC721RaribleMinimal", [], {
        id: "ERC721RaribleMinimalImplementation",
    })

    // Encode initialization call: __ERC721Rarible_init(
    //   string memory _name,
    //   string memory _symbol,
    //   string memory baseURI,
    //   string memory contractURI,
    //   address transferProxy,
    //   address lazyTransferProxy,
    //   address initialOwner
    // )
    const erc721InitData = m.encodeFunctionCall(
        erc721Impl,
        "__ERC721Rarible_init",
        [
            tokenName,
            tokenSymbol,
            baseURI,
            contractURI,
            transferProxyAddress,
            erc721LazyMintTransferProxyAddress,
            owner,
        ]
    )

    // Deploy TransparentUpgradeableProxy for ERC721RaribleMinimal
    const erc721Proxy = m.contract(
        "TransparentUpgradeableProxy",
        [erc721Impl, owner, erc721InitData],
        {
            id: "ERC721RaribleMinimalProxy",
        }
    )

    // ============================================
    // 2. Deploy ERC721RaribleMinimalBeacon with implementation address
    // ============================================
    const erc721Beacon = m.contract(
        "ERC721RaribleMinimalBeacon",
        [erc721Impl, owner],
        {
            id: "ERC721RaribleMinimalBeacon",
            after: [erc721Impl],
        }
    )

    // ============================================
    // 3. Deploy ERC721RaribleFactoryC2
    // ============================================
    const erc721Factory = m.contract(
        "ERC721RaribleFactoryC2",
        [erc721Beacon, transferProxyAddress, erc721LazyMintTransferProxyAddress],
        {
            id: "ERC721RaribleFactoryC2",
            after: [erc721Beacon],
        }
    )

    return {
        erc721Impl,
        erc721Proxy,
        erc721Beacon,
        erc721Factory,
    }
})

export default ERC721TokenModule

