import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DropERC721__factory } from "@rarible/external-contracts/js/factories/DropERC721__factory";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { get, save, getArtifact } = hre.deployments;
    const { getNamedAccounts } = hre;
    const { deployer } = await getNamedAccounts();

    console.log('\n=== Starting DropERC721 Proxy Deployment via RaribleCloneFactory ===');
    console.log(`Network: ${hre.network.name}`);
    console.log(`Deployer: ${deployer}`);

    // Configuration from environment variables
    const defaultAdmin = process.env.DROP721_DEFAULT_ADMIN || deployer;
    const name = process.env.DROP721_NAME || "DropERC721";
    const symbol = process.env.DROP721_SYMBOL || "DROP721";
    const contractUri = process.env.DROP721_CONTRACT_URI || "";
    const trustedForwarders: string[] = process.env.DROP721_TRUSTED_FORWARDERS 
        ? process.env.DROP721_TRUSTED_FORWARDERS.split(",").map(addr => addr.trim())
        : [];
    const saleRecipient = process.env.DROP721_SALE_RECIPIENT || deployer;
    const royaltyRecipient = process.env.DROP721_ROYALTY_RECIPIENT || deployer;
    const royaltyBps = parseInt(process.env.DROP721_ROYALTY_BPS || "0");
    const platformFeeBps = parseInt(process.env.DROP721_PLATFORM_FEE_BPS || "0");
    const platformFeeRecipient = process.env.DROP721_PLATFORM_FEE_RECIPIENT || deployer;
    const salt = process.env.DROP721_SALT || "0x0000000000000000000000000000000000000000000000000000000000000000";
    const extraData = process.env.DROP721_EXTRA_DATA || "0x";

    // Get deployed contracts - allow override via env vars
    let cloneFactoryAddress = process.env.DROP721_CLONE_FACTORY;
    let implementationAddress = process.env.DROP721_IMPLEMENTATION;

    if (!cloneFactoryAddress) {
        const cloneFactory = await get("RaribleCloneFactory");
        cloneFactoryAddress = cloneFactory.address;
    }
    if (!implementationAddress) {
        const implementation = await get("DropERC721");
        implementationAddress = implementation.address;
    }

    console.log(`\nCloneFactory Address: ${cloneFactoryAddress}`);
    console.log(`Implementation Address: ${implementationAddress}`);

    // Encode the initializer data for the logic contract
    const initData = DropERC721__factory.createInterface().encodeFunctionData(
        "initialize",
        [
            defaultAdmin,
            name,
            symbol,
            contractUri,
            trustedForwarders,
            saleRecipient,
            royaltyRecipient,
            royaltyBps,
            platformFeeBps,
            platformFeeRecipient,
        ]
    );

    console.log('\nInitialization Parameters:');
    console.log(`- Name: ${name}`);
    console.log(`- Symbol: ${symbol}`);
    console.log(`- Default Admin: ${defaultAdmin}`);
    console.log(`- Sale Recipient: ${saleRecipient}`);
    console.log(`- Royalty Recipient: ${royaltyRecipient}`);
    console.log(`- Royalty BPS: ${royaltyBps}`);
    console.log(`- Platform Fee BPS: ${platformFeeBps}`);
    console.log(`- Platform Fee Recipient: ${platformFeeRecipient}`);

    // Deploy the proxy via RaribleCloneFactory
    console.log('\nDeploying proxy via RaribleCloneFactory...');
    
    // Get or create the RaribleCloneFactory contract instance
    const RaribleCloneFactory = await hre.ethers.getContractFactory("RaribleCloneFactory");
    const cloneFactoryContract = RaribleCloneFactory.attach(cloneFactoryAddress);
    
    const tx = await cloneFactoryContract.deployProxyByImplementationV2(
        implementationAddress,
        initData,
        salt,
        extraData
    );
    const receipt = await tx.wait();

    console.log("Deployment tx status:", receipt.status);
    console.log("Transaction hash:", receipt.transactionHash);

    // Parse the ProxyDeployedV2 event to get the deployed proxy address
    const cloneFactoryInterface = new ethers.utils.Interface([
        "event ProxyDeployedV2(address indexed implementation, address indexed proxy, address indexed deployer, bytes32 inputSalt, bytes data, bytes extraData)"
    ]);

    let proxyAddress: string | undefined;
    for (const log of receipt.logs || []) {
        try {
            const parsed = cloneFactoryInterface.parseLog(log);
            if (parsed.name === "ProxyDeployedV2") {
                proxyAddress = parsed.args.proxy;
                break;
            }
        } catch {
            // Not this event, continue
        }
    }

    if (!proxyAddress) {
        throw new Error("ProxyDeployedV2 event not found in transaction logs");
    }

    console.log(`\nProxy deployed at: ${proxyAddress}`);

    // Save the artifact for the deployed proxy
    const artifact = await getArtifact("DropERC721");
    await save(`DropERC721Proxy_${name.replace(/\s+/g, '_')}`, {
        address: proxyAddress,
        abi: artifact.abi,
        transactionHash: receipt.transactionHash,
        args: [],
        linkedData: {
            implementation: implementationAddress,
            cloneFactory: cloneFactoryAddress,
            name,
            symbol,
            defaultAdmin,
            saleRecipient,
            royaltyRecipient,
            royaltyBps,
            platformFeeBps,
            platformFeeRecipient,
        }
    });

    console.log('\n=== Deployment Complete ===');
    console.log(`Proxy Address: ${proxyAddress}`);
    console.log(`Artifact saved as: DropERC721Proxy_${name.replace(/\s+/g, '_')}`);
};

export default func;
func.tags = ["all", "1009", "drop721-proxy"];
// Dependencies are optional if DROP721_CLONE_FACTORY and DROP721_IMPLEMENTATION are set
// func.dependencies = ["1001", "1003"];
