import { ethers } from "hardhat";
import { DeployFunction, DeployResult } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DETERMENISTIC_DEPLOYMENT_SALT } from "../utils/utils";

const deployLock: DeployFunction = async (
    hre: HardhatRuntimeEnvironment
) => {
    const { deploy, } = hre.deployments;
    const { getNamedAccounts } = hre;
    const {deployer,} = await getNamedAccounts();
    console.log('deployer', deployer)
    // 1. avoid gasLimit
    // 2. gas price auto
    
    const deployResult: DeployResult = await deploy("WLCollectionRegistry", {
        from: deployer,
        args: [deployer],
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
};

export default deployLock;
deployLock.tags = ["all", "1005", "WLCollectionRegistry", "WLCollection"];
