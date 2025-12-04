// Hardhat Ignition module for deploying Transfer Proxies with OpenZeppelin TransparentUpgradeableProxy
// Learn more at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"

const TransferProxiesModule = buildModule("TransferProxiesModule", (m) => {
    // Get the owner parameter (proxy admin owner and contract owner)
    // Type annotation is required for address parameters
    // Default value allows reuse from previous deployment
    const owner = m.getParameter<string>("owner")

    // ============================================
    // 1. Deploy TransferProxy
    // ============================================
    const transferProxyImpl = m.contract("TransferProxy", [], {
        id: "TransferProxyImplementation",
    })

    const transferProxyInitData = m.encodeFunctionCall(
        transferProxyImpl,
        "__TransferProxy_init",
        [owner]
    )

    const transferProxy = m.contract(
        "TransparentUpgradeableProxy",
        [transferProxyImpl, owner, transferProxyInitData],
        {
            id: "TransferProxyProxy",
        }
    )

    // ============================================
    // 2. Deploy ERC20TransferProxy
    // ============================================
    const erc20TransferProxyImpl = m.contract("ERC20TransferProxy", [], {
        id: "ERC20TransferProxyImplementation",
    })

    const erc20TransferProxyInitData = m.encodeFunctionCall(
        erc20TransferProxyImpl,
        "__ERC20TransferProxy_init",
        [owner]
    )

    const erc20TransferProxy = m.contract(
        "TransparentUpgradeableProxy",
        [erc20TransferProxyImpl, owner, erc20TransferProxyInitData],
        {
            id: "ERC20TransferProxyProxy",
        }
    )

    // ============================================
    // 3. Deploy ERC721LazyMintTransferProxy
    // ============================================
    const erc721LazyMintTransferProxyImpl = m.contract("ERC721LazyMintTransferProxy", [], {
        id: "ERC721LazyMintTransferProxyImplementation",
    })

    const erc721LazyMintTransferProxyInitData = m.encodeFunctionCall(
        erc721LazyMintTransferProxyImpl,
        "__ERC721LazyMintTransferProxy_init",
        [owner]
    )

    const erc721LazyMintTransferProxy = m.contract(
        "TransparentUpgradeableProxy",
        [erc721LazyMintTransferProxyImpl, owner, erc721LazyMintTransferProxyInitData],
        {
            id: "ERC721LazyMintTransferProxyProxy",
        }
    )

    // ============================================
    // 4. Deploy ERC1155LazyMintTransferProxy
    // ============================================
    const erc1155LazyMintTransferProxyImpl = m.contract("ERC1155LazyMintTransferProxy", [], {
        id: "ERC1155LazyMintTransferProxyImplementation",
    })

    const erc1155LazyMintTransferProxyInitData = m.encodeFunctionCall(
        erc1155LazyMintTransferProxyImpl,
        "__ERC1155LazyMintTransferProxy_init",
        [owner]
    )

    const erc1155LazyMintTransferProxy = m.contract(
        "TransparentUpgradeableProxy",
        [erc1155LazyMintTransferProxyImpl, owner, erc1155LazyMintTransferProxyInitData],
        {
            id: "ERC1155LazyMintTransferProxyProxy",
        }
    )

    return {
        // Implementations
        transferProxyImpl,
        erc20TransferProxyImpl,
        erc721LazyMintTransferProxyImpl,
        erc1155LazyMintTransferProxyImpl,
        // Proxies
        transferProxy,
        erc20TransferProxy,
        erc721LazyMintTransferProxy,
        erc1155LazyMintTransferProxy,
    }
})

export default TransferProxiesModule
