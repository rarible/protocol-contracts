import { poll } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { DeployFunction, DeployResult } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployLock: DeployFunction = async (
    hre: HardhatRuntimeEnvironment
) => {
    const { deploy, } = hre.deployments;
    const { getNamedAccounts } = hre;
    const {deployer,} = await getNamedAccounts();
    console.log('deployer', deployer)
    // 1. avoid gasLimit
    // 2. gas price auto
    
    const deployResult: DeployResult = await deploy("RaribleCreateX", {
        from: deployer,
        log: true,
        waitConfirmations: 1,
        nonce: 0, // nonce must be 0
    });
    // Retrieve the full transaction to verify its nonce
    const tx = await ethers.provider.getTransaction(
        deployResult.transactionHash!
    );

    console.log("deploy tx nonce", tx.nonce); // should print 0

    if (tx.nonce !== 0) {
        throw new Error(`Expected nonce 0, got ${tx.nonce}`);
    }
    console.log("transactionHash", deployResult.transactionHash)
};

export default deployLock;
deployLock.tags = ["02", "RaribleCreateX"];
