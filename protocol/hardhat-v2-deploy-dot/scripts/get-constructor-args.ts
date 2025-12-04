// Script to get constructor arguments for a deployed contract
// Usage: npx ts-node scripts/get-constructor-args.ts <address>
// Or via hardhat task: npx hardhat get-constructor-args --address <address>

import * as fs from "fs"
import * as path from "path"

interface JournalEntry {
    type: string
    futureId?: string
    result?: {
        type: string
        address?: string
    }
    constructorArgs?: any[]
    contractName?: string
}

interface DeploymentInfo {
    futureId: string
    contractName: string
    address: string
    constructorArgs: any[]
}

function getDeploymentsDir(): string {
    const deploymentsDir = path.join(__dirname, "..", "ignition", "deployments")
    
    if (!fs.existsSync(deploymentsDir)) {
        throw new Error(`Deployments directory not found: ${deploymentsDir}`)
    }
    
    return deploymentsDir
}

function findChainDir(chainId?: string): string {
    const deploymentsDir = getDeploymentsDir()
    const chainDirs = fs.readdirSync(deploymentsDir).filter(d => d.startsWith("chain-"))
    
    if (chainDirs.length === 0) {
        throw new Error("No chain deployment directories found")
    }
    
    if (chainId) {
        const targetDir = `chain-${chainId}`
        if (chainDirs.includes(targetDir)) {
            return path.join(deploymentsDir, targetDir)
        }
        throw new Error(`Chain directory not found: ${targetDir}`)
    }
    
    // Return first chain dir if no specific chain requested
    return path.join(deploymentsDir, chainDirs[0])
}

function readJournal(chainDir: string): JournalEntry[] {
    const journalPath = path.join(chainDir, "journal.jsonl")
    if (!fs.existsSync(journalPath)) {
        throw new Error(`Journal file not found: ${journalPath}`)
    }
    
    const content = fs.readFileSync(journalPath, "utf-8")
    const lines = content.trim().split("\n")
    
    return lines.map(line => JSON.parse(line))
}

function readDeployedAddresses(chainDir: string): Record<string, string> {
    const addressesPath = path.join(chainDir, "deployed_addresses.json")
    if (!fs.existsSync(addressesPath)) {
        throw new Error(`Deployed addresses file not found: ${addressesPath}`)
    }
    
    return JSON.parse(fs.readFileSync(addressesPath, "utf-8"))
}

function extractDeployments(journal: JournalEntry[], deployedAddresses: Record<string, string>): DeploymentInfo[] {
    const deployments: DeploymentInfo[] = []
    const futureIdToInfo = new Map<string, { contractName: string, constructorArgs: any[] }>()
    
    // First pass: collect contract info from DEPLOYMENT_EXECUTION_STATE_INITIALIZE
    for (const entry of journal) {
        if (entry.type === "DEPLOYMENT_EXECUTION_STATE_INITIALIZE" && entry.futureId) {
            futureIdToInfo.set(entry.futureId, {
                contractName: entry.contractName || "",
                constructorArgs: entry.constructorArgs || [],
            })
        }
    }
    
    // Match with deployed addresses
    for (const [futureId, address] of Object.entries(deployedAddresses)) {
        const info = futureIdToInfo.get(futureId)
        if (info) {
            deployments.push({
                futureId,
                contractName: info.contractName,
                address,
                constructorArgs: info.constructorArgs,
            })
        }
    }
    
    return deployments
}

function findDeploymentByAddress(deployments: DeploymentInfo[], address: string): DeploymentInfo | undefined {
    const normalizedAddress = address.toLowerCase()
    return deployments.find(d => d.address.toLowerCase() === normalizedAddress)
}

function formatConstructorArgs(args: any[]): string {
    if (args.length === 0) {
        return "No constructor arguments"
    }
    
    // Format for command line verification
    return args.map((arg, i) => {
        if (Array.isArray(arg)) {
            return `[${i}]: ${JSON.stringify(arg)}`
        }
        return `[${i}]: ${arg}`
    }).join("\n")
}

function formatArgsForVerify(args: any[]): string {
    if (args.length === 0) {
        return ""
    }
    
    // Format as space-separated arguments for hardhat verify
    return args.map(arg => {
        if (Array.isArray(arg)) {
            return `"${JSON.stringify(arg).replace(/"/g, '\\"')}"`
        }
        if (typeof arg === "string" && arg.startsWith("0x")) {
            return arg
        }
        return `"${arg}"`
    }).join(" ")
}

function main() {
    const args = process.argv.slice(2)
    
    if (args.length === 0) {
        console.log("Usage: npx ts-node scripts/get-constructor-args.ts <address> [chainId]")
        console.log("")
        console.log("Options:")
        console.log("  <address>   Contract address to look up")
        console.log("  [chainId]   Optional chain ID (defaults to first found)")
        console.log("")
        console.log("Examples:")
        console.log("  npx ts-node scripts/get-constructor-args.ts 0x1234...")
        console.log("  npx ts-node scripts/get-constructor-args.ts 0x1234... 420420422")
        console.log("")
        console.log("To list all deployed contracts:")
        console.log("  npx ts-node scripts/get-constructor-args.ts --list")
        process.exit(1)
    }
    
    const chainId = args.length > 1 ? args[1] : undefined
    const chainDir = findChainDir(chainId)
    
    console.log(`\n📁 Using deployment: ${chainDir}\n`)
    
    const journal = readJournal(chainDir)
    const deployedAddresses = readDeployedAddresses(chainDir)
    const deployments = extractDeployments(journal, deployedAddresses)
    
    // List all contracts
    if (args[0] === "--list" || args[0] === "-l") {
        console.log("📋 Deployed Contracts:\n")
        for (const deployment of deployments) {
            console.log(`📦 ${deployment.contractName}`)
            console.log(`   Address: ${deployment.address}`)
            console.log(`   Future ID: ${deployment.futureId}`)
            console.log(`   Args: ${deployment.constructorArgs.length > 0 ? JSON.stringify(deployment.constructorArgs) : "none"}`)
            console.log("")
        }
        return
    }
    
    const address = args[0]
    const deployment = findDeploymentByAddress(deployments, address)
    
    if (!deployment) {
        console.error(`❌ No deployment found for address: ${address}`)
        console.log("\nAvailable addresses:")
        for (const d of deployments) {
            console.log(`  ${d.address} (${d.contractName})`)
        }
        process.exit(1)
    }
    
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log(`📦 Contract: ${deployment.contractName}`)
    console.log(`📍 Address: ${deployment.address}`)
    console.log(`🆔 Future ID: ${deployment.futureId}`)
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    console.log("")
    console.log("🔧 Constructor Arguments:")
    console.log(formatConstructorArgs(deployment.constructorArgs))
    console.log("")
    console.log("📋 JSON format:")
    console.log(JSON.stringify(deployment.constructorArgs, null, 2))
    console.log("")
    console.log("💻 For hardhat verify:")
    console.log(`npx hardhat verify --network <network> ${deployment.address} ${formatArgsForVerify(deployment.constructorArgs)}`)
    console.log("")
}

main()

