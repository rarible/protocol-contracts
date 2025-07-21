import { ethers } from "hardhat";
import { DeployFunction, DeployResult } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DETERMENISTIC_DEPLOYMENT_SALT } from "../utils/utils";
import { WLCollectionRegistry__factory, WLCollectionListing__factory } from "../typechain-types";

const deployLock: DeployFunction = async (
    hre: HardhatRuntimeEnvironment
) => {
    const { deploy, get } = hre.deployments;
    const { getNamedAccounts } = hre;
    const {deployer,} = await getNamedAccounts();
    console.log('deployer', deployer)
    // 1. avoid gasLimit
    // 2. gas price auto

    
    const deployResult: DeployResult = await deploy("WLCollectionListing", {
        from: deployer,
        args: [deployer, deployer],
        log: true,
        waitConfirmations: 1,
        deterministicDeployment: DETERMENISTIC_DEPLOYMENT_SALT,
        skipIfAlreadyDeployed: true,
    });

    // Retrieve the full transaction to verify its nonce
    const tx = await ethers.provider.getTransaction(
        deployResult.transactionHash!
    );

    console.log("deploy tx nonce", tx.nonce); // should print 0
    console.log("transactionHash", deployResult.transactionHash)
    console.log("deployResult.address", deployResult.address)
    console.log("setting wlCollectionRegistry")
    const wlCollectionRegistry = await get("WLCollectionRegistry");
    const wlCollectionListing = WLCollectionListing__factory.connect(deployResult.address, hre.ethers.provider);
    await wlCollectionListing.setWLCollectionRegistry(wlCollectionRegistry.address);
    console.log("setting wlCollectionRegistry done")
};

export default deployLock;
deployLock.tags = ["all", "1006", "WLCollectionListing"];
