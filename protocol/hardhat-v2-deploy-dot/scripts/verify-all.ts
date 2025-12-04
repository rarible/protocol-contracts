import * as fs from "fs"
import * as path from "path"
import { execSync } from "child_process"

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
    address: string
    contractName: string
    constructorArgs: any[]
    futureId: string
}

// Contracts that are proxies (TransparentUpgradeableProxy) - need special handling
const PROXY_CONTRACT_PATTERNS = [
    "Proxy",
]

// Contracts that are instances (contractAt) - skip verification
const INSTANCE_PATTERNS = [
    "Instance",
]

function getDeploymentsDir(): string {
    const deploymentsDir = path.join(__dirname, "../ignition/deployments")
    
    if (!fs.existsSync(deploymentsDir)) {
        throw new Error(`Deployments directory not found: ${deploymentsDir}`)
    }
    
    const chainDirs = fs.readdirSync(deploymentsDir).filter(d => d.startsWith("chain-"))
    if (chainDirs.length === 0) {
        throw new Error("No chain deployment directories found")
    }
    
    return path.join(deploymentsDir, chainDirs[0])
}

function readJournal(deploymentDir: string): JournalEntry[] {
    const journalPath = path.join(deploymentDir, "journal.jsonl")
    if (!fs.existsSync(journalPath)) {
        throw new Error(`Journal file not found: ${journalPath}`)
    }
    
    const content = fs.readFileSync(journalPath, "utf-8")
    const lines = content.trim().split("\n")
    
    return lines.map(line => JSON.parse(line))
}

function readDeployedAddresses(deploymentDir: string): Record<string, string> {
    const addressesPath = path.join(deploymentDir, "deployed_addresses.json")
    if (!fs.existsSync(addressesPath)) {
        throw new Error(`Deployed addresses file not found: ${addressesPath}`)
    }
    
    return JSON.parse(fs.readFileSync(addressesPath, "utf-8"))
}

function extractDeploymentInfo(journal: JournalEntry[]): Map<string, DeploymentInfo> {
    const deployments = new Map<string, DeploymentInfo>()
    
    // First pass: find all DEPLOYMENT_EXECUTION_STATE_INITIALIZE entries
    for (const entry of journal) {
        if (entry.type === "DEPLOYMENT_EXECUTION_STATE_INITIALIZE" && entry.futureId) {
            const futureId = entry.futureId
            
            // Skip instances (contractAt)
            if (INSTANCE_PATTERNS.some(pattern => futureId.includes(pattern))) {
                continue
            }
            
            // Skip encode function calls
            if (futureId.includes("encodeFunctionCall")) {
                continue
            }
            
            deployments.set(futureId, {
                address: "",
                contractName: entry.contractName || "",
                constructorArgs: entry.constructorArgs || [],
                futureId,
            })
        }
    }
    
    // Second pass: find addresses from DEPLOYMENT_EXECUTION_STATE_COMPLETE
    for (const entry of journal) {
        if (entry.type === "DEPLOYMENT_EXECUTION_STATE_COMPLETE" && entry.futureId && entry.result?.address) {
            const existing = deployments.get(entry.futureId)
            if (existing) {
                existing.address = entry.result.address
            }
        }
    }
    
    return deployments
}

function formatConstructorArgs(args: any[]): string {
    if (!args || args.length === 0) {
        return ""
    }
    
    return args.map(arg => {
        if (Array.isArray(arg)) {
            // Handle arrays - format as JSON
            return JSON.stringify(arg)
        }
        if (typeof arg === "object" && arg !== null) {
            return JSON.stringify(arg)
        }
        if (typeof arg === "bigint") {
            return arg.toString()
        }
        return String(arg)
    }).join(" ")
}

async function main() {
    const network = process.env.NETWORK || "polkadotHubTestnet"
    const dryRun = process.env.DRY_RUN === "true"
    
    console.log(`\n🔍 Verifying contracts on network: ${network}`)
    if (dryRun) {
        console.log("📋 DRY RUN MODE - commands will be printed but not executed\n")
    }
    
    const deploymentDir = getDeploymentsDir()
    console.log(`📁 Deployment directory: ${deploymentDir}\n`)
    
    const journal = readJournal(deploymentDir)
    const deployedAddresses = readDeployedAddresses(deploymentDir)
    const deployments = extractDeploymentInfo(journal)
    
    // Filter to only contracts that have addresses
    const contractsToVerify: DeploymentInfo[] = []
    
    for (const [futureId, info] of deployments) {
        if (info.address && info.contractName) {
            contractsToVerify.push(info)
        }
    }
    
    console.log(`📝 Found ${contractsToVerify.length} contracts to verify:\n`)
    
    const results: { contract: string, address: string, status: string, error?: string }[] = []
    
    for (const deployment of contractsToVerify) {
        const { address, contractName, constructorArgs, futureId } = deployment
        
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
        console.log(`📦 Contract: ${contractName}`)
        console.log(`🆔 Future ID: ${futureId}`)
        console.log(`📍 Address: ${address}`)
        console.log(`🔧 Constructor args: ${JSON.stringify(constructorArgs)}`)
        
        const argsStr = formatConstructorArgs(constructorArgs)
        const cmd = `npx hardhat verify ${address} --network ${network}${argsStr ? ` ${argsStr}` : ""}`
        
        console.log(`\n💻 Command: ${cmd}`)
        
        if (dryRun) {
            results.push({ contract: contractName, address, status: "skipped (dry run)" })
            continue
        }
        
        try {
            console.log(`\n⏳ Verifying...`)
            execSync(cmd, { 
                stdio: "inherit",
                cwd: path.join(__dirname, ".."),
            })
            results.push({ contract: contractName, address, status: "✅ verified" })
        } catch (error: any) {
            const errorMsg = error.message || "Unknown error"
            if (errorMsg.includes("Already Verified") || errorMsg.includes("already verified")) {
                results.push({ contract: contractName, address, status: "✅ already verified" })
            } else {
                results.push({ contract: contractName, address, status: "❌ failed", error: errorMsg })
            }
        }
    }
    
    // Print summary
    console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`📊 VERIFICATION SUMMARY`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
    
    for (const result of results) {
        console.log(`${result.status} ${result.contract} (${result.address})`)
        if (result.error) {
            console.log(`   Error: ${result.error.substring(0, 100)}...`)
        }
    }
    
    const verified = results.filter(r => r.status.includes("✅")).length
    const failed = results.filter(r => r.status.includes("❌")).length
    
    console.log(`\n✅ Verified: ${verified}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`📝 Total: ${results.length}`)
}

main().catch(console.error)

