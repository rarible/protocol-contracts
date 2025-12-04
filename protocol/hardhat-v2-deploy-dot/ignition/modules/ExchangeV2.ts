// Hardhat Ignition module for deploying ExchangeV2 with OpenZeppelin TransparentUpgradeableProxy
// and AssetMatcherCollection, then configuring them together
// Learn more at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"
import * as fs from "fs"
import * as path from "path"

// Asset type constants from the protocol
const ERC721_LAZY = "0xd8f960c1"
const ERC1155_LAZY = "0x1cdfaa40"
const COLLECTION = "0xf63c2825"

// Read deployed addresses from previous deployments
function getDeployedAddresses(): Record<string, string> {
    const deploymentsDir = path.join(__dirname, "../deployments")
    
    // Find chain directory (e.g., chain-420420422)
    if (!fs.existsSync(deploymentsDir)) {
        throw new Error(`Deployments directory not found: ${deploymentsDir}`)
    }
    
    const chainDirs = fs.readdirSync(deploymentsDir).filter(d => d.startsWith("chain-"))
    if (chainDirs.length === 0) {
        throw new Error("No chain deployment directories found")
    }
    
    // Use the first chain directory (or you can make this configurable)
    const chainDir = chainDirs[0]
    const addressesFile = path.join(deploymentsDir, chainDir, "deployed_addresses.json")
    
    if (!fs.existsSync(addressesFile)) {
        throw new Error(`Deployed addresses file not found: ${addressesFile}`)
    }
    
    return JSON.parse(fs.readFileSync(addressesFile, "utf-8"))
}

// Get specific address from deployed addresses
function getAddress(addresses: Record<string, string>, key: string): string {
    const address = addresses[key]
    if (!address) {
        throw new Error(`Address not found for key: ${key}`)
    }
    return address
}

const ExchangeV2Module = buildModule("ExchangeV2Module", (m) => {
    // ============================================
    // Read addresses from previous deployments
    // ============================================
    const deployedAddresses = getDeployedAddresses()
    
    const transferProxyAddress = getAddress(deployedAddresses, "TransferProxiesModule#TransferProxyProxy")
    const erc20TransferProxyAddress = getAddress(deployedAddresses, "TransferProxiesModule#ERC20TransferProxyProxy")
    const erc721LazyMintTransferProxyAddress = getAddress(deployedAddresses, "TransferProxiesModule#ERC721LazyMintTransferProxyProxy")
    const erc1155LazyMintTransferProxyAddress = getAddress(deployedAddresses, "TransferProxiesModule#ERC1155LazyMintTransferProxyProxy")
    const royaltiesRegistryAddress = getAddress(deployedAddresses, "RoyaltiesRegistryModule#RoyaltiesRegistryProxy")

    // ============================================
    // Parameters
    // ============================================
    const owner = m.getParameter<string>("owner")
    const protocolFee = m.getParameter<number>("protocolFee", 0)

    // ============================================
    // 1. Deploy ExchangeV2 Implementation
    // ============================================
    const exchangeV2Impl = m.contract("ExchangeV2", [], {
        id: "ExchangeV2Implementation",
    })

    // Encode initialization call: __ExchangeV2_init(
    //   address _transferProxy,
    //   address _erc20TransferProxy,
    //   uint newProtocolFee,
    //   address newDefaultFeeReceiver,
    //   IRoyaltiesProvider newRoyaltiesProvider,
    //   address initialOwner
    // )
    const exchangeV2InitData = m.encodeFunctionCall(
        exchangeV2Impl,
        "__ExchangeV2_init",
        [
            transferProxyAddress,
            erc20TransferProxyAddress,
            protocolFee,
            owner,                    // defaultFeeReceiver
            royaltiesRegistryAddress,
            owner,                    // initialOwner
        ]
    )

    // Deploy TransparentUpgradeableProxy for ExchangeV2
    const exchangeV2Proxy = m.contract(
        "TransparentUpgradeableProxy",
        [exchangeV2Impl, owner, exchangeV2InitData],
        {
            id: "ExchangeV2Proxy",
        }
    )

    // ============================================
    // 2. Deploy AssetMatcherCollection (no proxy needed)
    // ============================================
    const assetMatcherCollection = m.contract("AssetMatcherCollection", [], {
        id: "AssetMatcherCollection",
    })

    // ============================================
    // 3. Configure Transfer Proxies - Add ExchangeV2 as operator
    // ============================================
    // Use contractAt to interact with already deployed proxies
    const transferProxy = m.contractAt("TransferProxy", transferProxyAddress, {
        id: "TransferProxyInstance",
    })
    
    const erc20TransferProxy = m.contractAt("ERC20TransferProxy", erc20TransferProxyAddress, {
        id: "ERC20TransferProxyInstance",
    })
    
    const erc721LazyMintTransferProxy = m.contractAt("ERC721LazyMintTransferProxy", erc721LazyMintTransferProxyAddress, {
        id: "ERC721LazyMintTransferProxyInstance",
    })
    
    const erc1155LazyMintTransferProxy = m.contractAt("ERC1155LazyMintTransferProxy", erc1155LazyMintTransferProxyAddress, {
        id: "ERC1155LazyMintTransferProxyInstance",
    })

    // Add ExchangeV2 as operator to all transfer proxies
    m.call(transferProxy, "addOperator", [exchangeV2Proxy], {
        id: "TransferProxy_addOperator",
        after: [exchangeV2Proxy],
    })
    
    m.call(erc20TransferProxy, "addOperator", [exchangeV2Proxy], {
        id: "ERC20TransferProxy_addOperator",
        after: [exchangeV2Proxy],
    })
    
    m.call(erc721LazyMintTransferProxy, "addOperator", [exchangeV2Proxy], {
        id: "ERC721LazyMintTransferProxy_addOperator",
        after: [exchangeV2Proxy],
    })
    
    m.call(erc1155LazyMintTransferProxy, "addOperator", [exchangeV2Proxy], {
        id: "ERC1155LazyMintTransferProxy_addOperator",
        after: [exchangeV2Proxy],
    })

    // ============================================
    // 4. Configure ExchangeV2 - Set lazy transfer proxies and asset matcher
    // ============================================
    // Use contractAt to interact with the proxy as ExchangeV2
    const exchangeV2 = m.contractAt("ExchangeV2", exchangeV2Proxy, {
        id: "ExchangeV2Instance",
    })

    // Set ERC721 lazy mint transfer proxy
    m.call(exchangeV2, "setTransferProxy", [ERC721_LAZY, erc721LazyMintTransferProxyAddress], {
        id: "ExchangeV2_setTransferProxy_ERC721_LAZY",
        after: [exchangeV2Proxy],
    })

    // Set ERC1155 lazy mint transfer proxy
    m.call(exchangeV2, "setTransferProxy", [ERC1155_LAZY, erc1155LazyMintTransferProxyAddress], {
        id: "ExchangeV2_setTransferProxy_ERC1155_LAZY",
        after: [exchangeV2Proxy],
    })

    // Set AssetMatcherCollection for COLLECTION asset type
    m.call(exchangeV2, "setAssetMatcher", [COLLECTION, assetMatcherCollection], {
        id: "ExchangeV2_setAssetMatcher_COLLECTION",
        after: [exchangeV2Proxy, assetMatcherCollection],
    })

    return {
        exchangeV2Impl,
        exchangeV2Proxy,
        assetMatcherCollection,
    }
})

export default ExchangeV2Module
