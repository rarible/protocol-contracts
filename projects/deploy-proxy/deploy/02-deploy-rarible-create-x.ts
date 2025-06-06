import { DeployFunction, DeployResult } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployLock: DeployFunction = async (
    hre: HardhatRuntimeEnvironment
) => {
    const { deploy } = hre.deployments;
    const { getNamedAccounts } = hre;
    const {deployer,} = await getNamedAccounts();
    console.log('deployer', deployer)
    
    const deployResult: DeployResult = await deploy("RaribleCreateX", {
        from: deployer,
        log: true,
        waitConfirmations: 1,
        nonce: 0, // nonce must be 0
    });
    console.log("transactionHash", deployResult.transactionHash)
};

export default deployLock;
deployLock.tags = ["02", "RaribleCreateX"];