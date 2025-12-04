// Hardhat Ignition module for deploying ERC1155Rarible token, beacon, and factory
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

const ERC1155TokenModule = buildModule("ERC1155TokenModule", (m) => {
    // ============================================
    // Read addresses from previous deployments
    // ============================================
    const deployedAddresses = getDeployedAddresses()
    
    const transferProxyAddress = getAddress(deployedAddresses, "TransferProxiesModule#TransferProxyProxy")
    const erc1155LazyMintTransferProxyAddress = getAddress(deployedAddresses, "TransferProxiesModule#ERC1155LazyMintTransferProxyProxy")

    // ============================================
    // Parameters
    // ============================================
    const owner = m.getParameter<string>("owner")
    const tokenName = m.getParameter<string>("tokenName", "Rarible")
    const tokenSymbol = m.getParameter<string>("tokenSymbol", "RARI")
    const baseURI = m.getParameter<string>("baseURI", "ipfs:/")
    const contractURI = m.getParameter<string>("contractURI", "")

    // ============================================
    // 1. Deploy ERC1155Rarible Implementation
    // ============================================
    const erc1155Impl = m.contract("ERC1155Rarible", [], {
        id: "ERC1155RaribleImplementation",
    })

    // Encode initialization call: __ERC1155Rarible_init(
    //   string memory _name,
    //   string memory _symbol,
    //   string memory baseURI,
    //   string memory contractURI,
    //   address transferProxy,
    //   address lazyTransferProxy,
    //   address initialOwner
    // )
    const erc1155InitData = m.encodeFunctionCall(
        erc1155Impl,
        "__ERC1155Rarible_init",
        [
            tokenName,
            tokenSymbol,
            baseURI,
            contractURI,
            transferProxyAddress,
            erc1155LazyMintTransferProxyAddress,
            owner,
        ]
    )

    // Deploy TransparentUpgradeableProxy for ERC1155Rarible
    const erc1155Proxy = m.contract(
        "TransparentUpgradeableProxy",
        [erc1155Impl, owner, erc1155InitData],
        {
            id: "ERC1155RaribleProxy",
        }
    )

    // ============================================
    // 2. Deploy ERC1155RaribleBeacon with implementation address
    // ============================================
    const erc1155Beacon = m.contract(
        "ERC1155RaribleBeacon",
        [erc1155Impl, owner],
        {
            id: "ERC1155RaribleBeacon",
            after: [erc1155Impl],
        }
    )

    // ============================================
    // 3. Deploy ERC1155RaribleFactoryC2
    // ============================================
    const erc1155Factory = m.contract(
        "ERC1155RaribleFactoryC2",
        [erc1155Beacon, transferProxyAddress, erc1155LazyMintTransferProxyAddress],
        {
            id: "ERC1155RaribleFactoryC2",
            after: [erc1155Beacon],
        }
    )

    return {
        erc1155Impl,
        erc1155Proxy,
        erc1155Beacon,
        erc1155Factory,
    }
})

export default ERC1155TokenModule

