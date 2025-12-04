// Hardhat Ignition module for setting protocol fee on ExchangeV2
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

const SetProtocolFeeModule = buildModule("SetProtocolFeeModule", (m) => {
    // ============================================
    // Read addresses from previous deployments
    // ============================================
    const deployedAddresses = getDeployedAddresses()
    
    const exchangeV2Address = getAddress(deployedAddresses, "ExchangeV2Module#ExchangeV2Proxy")

    // ============================================
    // Parameters
    // ============================================
    // Fee receiver address
    const feeReceiver = m.getParameter<string>("feeReceiver")
    
    // Buyer fee in basis points (default 0)
    const buyerFeeBps = m.getParameter<number>("buyerFeeBps", 0)
    
    // Seller fee in basis points (default 200 = 2%)
    const sellerFeeBps = m.getParameter<number>("sellerFeeBps", 200)

    // ============================================
    // Get ExchangeV2 instance and set protocol fee
    // ============================================
    const exchangeV2 = m.contractAt("ExchangeV2", exchangeV2Address, {
        id: "ExchangeV2Instance",
    })

    // Call setAllProtocolFeeData(address receiver, uint48 buyerFee, uint48 sellerFee)
    m.call(exchangeV2, "setAllProtocolFeeData", [feeReceiver, buyerFeeBps, sellerFeeBps], {
        id: "ExchangeV2_setAllProtocolFeeData",
    })

    return {
        exchangeV2,
    }
})

export default SetProtocolFeeModule

