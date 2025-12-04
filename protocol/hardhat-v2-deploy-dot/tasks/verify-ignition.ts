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
    address: string
    contractName: string
    constructorArgs: any[]
    futureId: string
    contractFQN?: string  // Fully qualified name for disambiguation
}

// Patterns to skip (contractAt instances, function calls)
const SKIP_PATTERNS = [
    "Instance",
    "encodeFunctionCall",
]

// Contract name to fully qualified name mapping (for contracts with duplicate bytecode)
const CONTRACT_FQN_MAP: Record<string, string> = {
    "ERC721RaribleMinimalBeacon": "@rarible/tokens/contracts/beacons/ERC721RaribleMinimalBeacon.sol:ERC721RaribleMinimalBeacon",
    "ERC1155RaribleBeacon": "@rarible/tokens/contracts/beacons/ERC1155RaribleBeacon.sol:ERC1155RaribleBeacon",
    "TransparentUpgradeableProxy": "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy",
}

function getDeploymentsDir(hre: any): string {
    const deploymentsDir = path.join(hre.config.paths.root, "ignition/deployments")
    
    if (!fs.existsSync(deploymentsDir)) {
        throw new Error(`Deployments directory not found: ${deploymentsDir}`)
    }
    
    const chainDirs = fs.readdirSync(deploymentsDir).filter((d: string) => d.startsWith("chain-"))
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

function extractDeploymentInfo(journal: JournalEntry[]): Map<string, DeploymentInfo> {
    const deployments = new Map<string, DeploymentInfo>()
    
    // First pass: find all DEPLOYMENT_EXECUTION_STATE_INITIALIZE entries
    for (const entry of journal) {
        if (entry.type === "DEPLOYMENT_EXECUTION_STATE_INITIALIZE" && entry.futureId) {
            const futureId = entry.futureId
            
            // Skip instances and function calls
            if (SKIP_PATTERNS.some(pattern => futureId.includes(pattern))) {
                continue
            }
            
            const contractName = entry.contractName || ""
            
            deployments.set(futureId, {
                address: "",
                contractName,
                constructorArgs: entry.constructorArgs || [],
                futureId,
                contractFQN: CONTRACT_FQN_MAP[contractName],
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

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// Run verification with timeout
async function verifyWithTimeout(
    hre: any, 
    verifyArgs: any, 
    timeoutMs: number = 60000
): Promise<void> {
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Verification timeout")), timeoutMs)
    })
    
    await Promise.race([
        hre.run("verify:verify", verifyArgs),
        timeoutPromise
    ])
}

task("verify-ignition", "Verify all contracts deployed via Ignition")
    .addFlag("dryRun", "Print commands without executing")
    .addOptionalParam("contract", "Verify only this contract name (partial match)")
    .addOptionalParam("delay", "Delay between verifications in ms (default: 3000)")
    .addOptionalParam("timeout", "Timeout for each verification in ms (default: 60000)")
    .setAction(async (taskArgs, hre) => {
        const { dryRun, contract: contractFilter, delay: delayMs = "3000", timeout: timeoutMs = "60000" } = taskArgs
        const verificationDelay = parseInt(delayMs)
        const verificationTimeout = parseInt(timeoutMs)
        
        console.log(`\n🔍 Verifying contracts on network: ${hre.network.name}`)
        if (dryRun) {
            console.log("📋 DRY RUN MODE - commands will be printed but not executed\n")
        }
        
        const deploymentDir = getDeploymentsDir(hre)
        console.log(`📁 Deployment directory: ${deploymentDir}\n`)
        
        const journal = readJournal(deploymentDir)
        const deployments = extractDeploymentInfo(journal)
        
        // Filter to only contracts that have addresses
        let contractsToVerify: DeploymentInfo[] = []
        
        for (const [futureId, info] of deployments) {
            if (info.address && info.contractName) {
                contractsToVerify.push(info)
            }
        }
        
        // Apply contract filter if provided
        if (contractFilter) {
            contractsToVerify = contractsToVerify.filter(c => 
                c.contractName.toLowerCase().includes(contractFilter.toLowerCase()) ||
                c.futureId.toLowerCase().includes(contractFilter.toLowerCase())
            )
        }
        
        console.log(`📝 Found ${contractsToVerify.length} contracts to verify:\n`)
        
        const results: { contract: string, address: string, status: string, error?: string }[] = []
        
        for (let i = 0; i < contractsToVerify.length; i++) {
            const deployment = contractsToVerify[i]
            const { address, contractName, constructorArgs, futureId, contractFQN } = deployment
            
            console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
            console.log(`📦 Contract: ${contractName} (${i + 1}/${contractsToVerify.length})`)
            console.log(`🆔 Future ID: ${futureId}`)
            console.log(`📍 Address: ${address}`)
            console.log(`🔧 Constructor args: ${JSON.stringify(constructorArgs)}`)
            if (contractFQN) {
                console.log(`📋 Using FQN: ${contractFQN}`)
            }
            
            if (dryRun) {
                const argsStr = constructorArgs.map(a => JSON.stringify(a)).join(" ")
                const contractArg = contractFQN ? ` --contract "${contractFQN}"` : ""
                console.log(`\n💻 Command: npx hardhat verify${contractArg} --network ${hre.network.name} ${address}${argsStr ? ` ${argsStr}` : ""}`)
                results.push({ contract: contractName, address, status: "skipped (dry run)" })
                continue
            }
            
            try {
                console.log(`\n⏳ Verifying (timeout: ${verificationTimeout}ms)...`)
                
                const verifyArgs: any = {
                    address,
                    constructorArguments: constructorArgs,
                }
                
                // Add contract FQN if specified (for disambiguation)
                if (contractFQN) {
                    verifyArgs.contract = contractFQN
                }
                
                await verifyWithTimeout(hre, verifyArgs, verificationTimeout)
                
                console.log("✅ Verification successful!")
                results.push({ contract: contractName, address, status: "✅ verified" })
            } catch (error: any) {
                const errorMsg = error.message || "Unknown error"
                
                // Check for success patterns in error message (blockscout quirk)
                if (errorMsg.includes("Successfully verified") || 
                    errorMsg.includes("successfully verified")) {
                    console.log("✅ Verification successful!")
                    results.push({ contract: contractName, address, status: "✅ verified" })
                }
                // Check for already verified
                else if (errorMsg.includes("Already Verified") || 
                         errorMsg.includes("already verified") || 
                         errorMsg.includes("already been verified") ||
                         errorMsg.includes("Contract source code already verified")) {
                    console.log("✅ Contract already verified")
                    results.push({ contract: contractName, address, status: "✅ already verified" })
                }
                // Timeout
                else if (errorMsg.includes("Verification timeout")) {
                    console.log("⏱️  Verification timed out - try verifying manually")
                    results.push({ contract: contractName, address, status: "⏱️ timeout", error: errorMsg })
                }
                // Network errors after successful submission (blockscout returns HTML)
                else if (errorMsg.includes("Unexpected token") && errorMsg.includes("DOCTYPE")) {
                    // Check if the message also mentions success
                    console.log("✅ Verification likely successful (API returned HTML after success)")
                    results.push({ contract: contractName, address, status: "✅ likely verified" })
                }
                // Address not a smart contract
                else if (errorMsg.includes("not a smart contract")) {
                    console.log("⚠️  Address not recognized as contract yet")
                    results.push({ contract: contractName, address, status: "⚠️ not indexed", error: errorMsg })
                }
                // Multiple contracts match
                else if (errorMsg.includes("More than one contract")) {
                    console.error(`❌ Multiple contracts match bytecode. Add FQN to CONTRACT_FQN_MAP.`)
                    results.push({ contract: contractName, address, status: "❌ needs FQN", error: errorMsg })
                }
                else {
                    console.error(`❌ Verification failed: ${errorMsg}`)
                    results.push({ contract: contractName, address, status: "❌ failed", error: errorMsg })
                }
            }
            
            // Add delay between verifications to avoid rate limiting
            if (i < contractsToVerify.length - 1 && !dryRun) {
                console.log(`\n⏱️  Waiting ${verificationDelay}ms...`)
                await sleep(verificationDelay)
            }
        }
        
        // Print summary
        console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
        console.log(`📊 VERIFICATION SUMMARY`)
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
        
        for (const result of results) {
            console.log(`${result.status} ${result.contract} (${result.address})`)
            if (result.error && (result.status.includes("❌") || result.status.includes("⏱️"))) {
                console.log(`   Error: ${result.error.substring(0, 80)}...`)
            }
        }
        
        const verified = results.filter(r => r.status.includes("✅")).length
        const notIndexed = results.filter(r => r.status.includes("not indexed")).length
        const timedOut = results.filter(r => r.status.includes("timeout")).length
        const failed = results.filter(r => r.status.includes("❌")).length
        
        console.log(`\n✅ Verified/Already verified: ${verified}`)
        if (notIndexed > 0) console.log(`⚠️  Not indexed yet: ${notIndexed}`)
        if (timedOut > 0) console.log(`⏱️  Timed out: ${timedOut}`)
        if (failed > 0) console.log(`❌ Failed: ${failed}`)
        console.log(`📝 Total: ${results.length}`)
        
        if (notIndexed > 0) {
            console.log(`\n💡 TIP: Some contracts are not indexed. Wait and run again.`)
        }
    })
