import { task } from "hardhat/config"
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

function getChainDir(hre: any): string {
    const deploymentsDir = path.join(hre.config.paths.root, "ignition/deployments")
    
    if (!fs.existsSync(deploymentsDir)) {
        throw new Error(`Deployments directory not found: ${deploymentsDir}`)
    }
    
    const chainId = hre.network.config.chainId
    const targetDir = `chain-${chainId}`
    const chainDirs = fs.readdirSync(deploymentsDir).filter((d: string) => d.startsWith("chain-"))
    
    if (chainDirs.includes(targetDir)) {
        return path.join(deploymentsDir, targetDir)
    }
    
    if (chainDirs.length > 0) {
        console.log(`Warning: No deployment for chain ${chainId}, using ${chainDirs[0]}`)
        return path.join(deploymentsDir, chainDirs[0])
    }
    
    throw new Error("No chain deployment directories found")
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
    
    for (const entry of journal) {
        if (entry.type === "DEPLOYMENT_EXECUTION_STATE_INITIALIZE" && entry.futureId) {
            futureIdToInfo.set(entry.futureId, {
                contractName: entry.contractName || "",
                constructorArgs: entry.constructorArgs || [],
            })
        }
    }
    
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

task("get-constructor-args", "Get constructor arguments for a deployed contract")
    .addOptionalParam("address", "Contract address to look up")
    .addFlag("list", "List all deployed contracts")
    .addFlag("json", "Output as JSON")
    .setAction(async (taskArgs, hre) => {
        const { address, list, json: jsonOutput } = taskArgs
        
        const chainDir = getChainDir(hre)
        console.log(`\n📁 Deployment: ${chainDir}\n`)
        
        const journal = readJournal(chainDir)
        const deployedAddresses = readDeployedAddresses(chainDir)
        const deployments = extractDeployments(journal, deployedAddresses)
        
        if (list || !address) {
            if (jsonOutput) {
                console.log(JSON.stringify(deployments, null, 2))
                return
            }
            
            console.log("📋 Deployed Contracts:\n")
            for (const deployment of deployments) {
                console.log(`📦 ${deployment.contractName}`)
                console.log(`   Address: ${deployment.address}`)
                console.log(`   Args: ${deployment.constructorArgs.length > 0 ? "yes (" + deployment.constructorArgs.length + ")" : "none"}`)
                console.log("")
            }
            return
        }
        
        const normalizedAddress = address.toLowerCase()
        const deployment = deployments.find(d => d.address.toLowerCase() === normalizedAddress)
        
        if (!deployment) {
            console.error(`❌ No deployment found for address: ${address}`)
            console.log("\nUse --list to see all deployed contracts")
            return
        }
        
        if (jsonOutput) {
            console.log(JSON.stringify({
                contractName: deployment.contractName,
                address: deployment.address,
                futureId: deployment.futureId,
                constructorArgs: deployment.constructorArgs,
            }, null, 2))
            return
        }
        
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        console.log(`📦 Contract: ${deployment.contractName}`)
        console.log(`📍 Address: ${deployment.address}`)
        console.log(`🆔 Future ID: ${deployment.futureId}`)
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
        
        if (deployment.constructorArgs.length === 0) {
            console.log("🔧 Constructor Arguments: none\n")
        } else {
            console.log("🔧 Constructor Arguments:\n")
            deployment.constructorArgs.forEach((arg, i) => {
                console.log(`  [${i}]: ${typeof arg === "object" ? JSON.stringify(arg) : arg}`)
            })
            console.log("")
        }
        
        console.log("📋 JSON format:")
        console.log(JSON.stringify(deployment.constructorArgs, null, 2))
        console.log("")
        
        // Generate verify command
        const argsStr = deployment.constructorArgs.map(arg => {
            if (Array.isArray(arg)) {
                return `'${JSON.stringify(arg)}'`
            }
            if (typeof arg === "string" && arg.startsWith("0x")) {
                return arg
            }
            return `"${arg}"`
        }).join(" ")
        
        console.log("💻 Verify command:")
        console.log(`npx hardhat verify --network ${hre.network.name} ${deployment.address}${argsStr ? " " + argsStr : ""}`)
        console.log("")
    })

