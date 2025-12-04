// Hardhat Ignition module for deploying ExchangeV2 with OpenZeppelin TransparentUpgradeableProxy
// and AssetMatcherCollection, then configuring them together
// Learn more at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"
import RoyaltiesRegistryModule from "./RoyaltiesRegistry"
import TransferProxiesModule from "./TransferProxies"

// Asset type constants from the protocol
const ERC721_LAZY = "0xd8f960c1"
const ERC1155_LAZY = "0x1cdfaa40"
const COLLECTION = "0xf63c2825"

const ExchangeV2Module = buildModule("ExchangeV2Module", (m) => {
    // ============================================
    // Import previously deployed modules
    // ============================================
    const { proxy: royaltiesRegistryProxy } = m.useModule(RoyaltiesRegistryModule)
    const { 
        transferProxy,
        erc20TransferProxy,
        erc721LazyMintTransferProxy,
        erc1155LazyMintTransferProxy,
    } = m.useModule(TransferProxiesModule)

    // ============================================
    // Parameters
    // ============================================
    // Owner/deployer address
    const owner = m.getParameter<string>("owner")
    
    // Protocol fee (default 0)
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
            transferProxy,           // from TransferProxiesModule
            erc20TransferProxy,      // from TransferProxiesModule
            protocolFee,
            owner,                   // defaultFeeReceiver
            royaltiesRegistryProxy,  // from RoyaltiesRegistryModule
            owner,                   // initialOwner
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
    // Use contractAt to interact with the proxies as their implementation types
    const transferProxyInstance = m.contractAt("TransferProxy", transferProxy, {
        id: "TransferProxyInstance",
    })
    
    const erc20TransferProxyInstance = m.contractAt("ERC20TransferProxy", erc20TransferProxy, {
        id: "ERC20TransferProxyInstance",
    })
    
    const erc721LazyMintTransferProxyInstance = m.contractAt("ERC721LazyMintTransferProxy", erc721LazyMintTransferProxy, {
        id: "ERC721LazyMintTransferProxyInstance",
    })
    
    const erc1155LazyMintTransferProxyInstance = m.contractAt("ERC1155LazyMintTransferProxy", erc1155LazyMintTransferProxy, {
        id: "ERC1155LazyMintTransferProxyInstance",
    })

    // Add ExchangeV2 as operator to all transfer proxies
    m.call(transferProxyInstance, "addOperator", [exchangeV2Proxy], {
        id: "TransferProxy_addOperator",
        after: [exchangeV2Proxy],
    })
    
    m.call(erc20TransferProxyInstance, "addOperator", [exchangeV2Proxy], {
        id: "ERC20TransferProxy_addOperator",
        after: [exchangeV2Proxy],
    })
    
    m.call(erc721LazyMintTransferProxyInstance, "addOperator", [exchangeV2Proxy], {
        id: "ERC721LazyMintTransferProxy_addOperator",
        after: [exchangeV2Proxy],
    })
    
    m.call(erc1155LazyMintTransferProxyInstance, "addOperator", [exchangeV2Proxy], {
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
    m.call(exchangeV2, "setTransferProxy", [ERC721_LAZY, erc721LazyMintTransferProxy], {
        id: "ExchangeV2_setTransferProxy_ERC721_LAZY",
        after: [exchangeV2Proxy],
    })

    // Set ERC1155 lazy mint transfer proxy
    m.call(exchangeV2, "setTransferProxy", [ERC1155_LAZY, erc1155LazyMintTransferProxy], {
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
