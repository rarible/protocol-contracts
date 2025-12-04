// Hardhat Ignition module for deploying RaribleExchangeWrapper
// Learn more at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"
import * as fs from "fs"
import * as path from "path"

const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000"

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

const ExchangeWrapperModule = buildModule("ExchangeWrapperModule", (m) => {
    // ============================================
    // Read addresses from previous deployments
    // ============================================
    const deployedAddresses = getDeployedAddresses()
    
    // Get ExchangeV2 and ERC20TransferProxy addresses
    const exchangeV2Address = getAddress(deployedAddresses, "ExchangeV2Module#ExchangeV2Proxy")
    const erc20TransferProxyAddress = getAddress(deployedAddresses, "TransferProxiesModule#ERC20TransferProxyProxy")

    // ============================================
    // Parameters
    // ============================================
    const owner = m.getParameter<string>("owner")
    
    // WETH address (default to zero for networks without WETH)
    const weth = m.getParameter<string>("weth", ADDRESS_ZERO)
    
    // Marketplace addresses (can be overridden via parameters)
    // Order: wyvernExchange, exchangeV2, seaPort_1_1, x2y2, looksRare, sudoswap, seaPort_1_4, looksRareV2, blur, seaPort_1_5, seaPort_1_6
    const wyvernExchange = m.getParameter<string>("wyvernExchange", ADDRESS_ZERO)
    const seaPort_1_1 = m.getParameter<string>("seaPort_1_1", ADDRESS_ZERO)
    const x2y2 = m.getParameter<string>("x2y2", ADDRESS_ZERO)
    const looksRare = m.getParameter<string>("looksRare", ADDRESS_ZERO)
    const sudoswap = m.getParameter<string>("sudoswap", ADDRESS_ZERO)
    const seaPort_1_4 = m.getParameter<string>("seaPort_1_4", ADDRESS_ZERO)
    const looksRareV2 = m.getParameter<string>("looksRareV2", ADDRESS_ZERO)
    const blur = m.getParameter<string>("blur", ADDRESS_ZERO)
    const seaPort_1_5 = m.getParameter<string>("seaPort_1_5", ADDRESS_ZERO)
    const seaPort_1_6 = m.getParameter<string>("seaPort_1_6", ADDRESS_ZERO)

    // ============================================
    // Deploy RaribleExchangeWrapper
    // ============================================
    // Constructor: (address[11] marketplaces, address weth, address[] transferProxies, address owner)
    // Marketplaces order:
    // 0 - wyvernExchange
    // 1 - exchangeV2 (rarible)
    // 2 - seaPort_1_1
    // 3 - x2y2
    // 4 - looksRare
    // 5 - sudoswap
    // 6 - seaPort_1_4
    // 7 - looksRareV2
    // 8 - blur
    // 9 - seaPort_1_5
    // 10 - seaPort_1_6
    
    const exchangeWrapper = m.contract(
        "RaribleExchangeWrapper",
        [
            [
                wyvernExchange,      // 0
                exchangeV2Address,   // 1 - from previous deployment
                seaPort_1_1,         // 2
                x2y2,                // 3
                looksRare,           // 4
                sudoswap,            // 5
                seaPort_1_4,         // 6
                looksRareV2,         // 7
                blur,                // 8
                seaPort_1_5,         // 9
                seaPort_1_6,         // 10
            ],
            weth,
            [erc20TransferProxyAddress],  // transferProxies array
            owner,
        ],
        {
            id: "RaribleExchangeWrapper",
        }
    )

    return {
        exchangeWrapper,
    }
})

export default ExchangeWrapperModule

