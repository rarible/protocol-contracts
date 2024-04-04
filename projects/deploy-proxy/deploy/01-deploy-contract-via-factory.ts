import { DeployFunction, DeployResult } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployLock: DeployFunction = async (
    hre: HardhatRuntimeEnvironment
) => {
    const { deploy } = hre.deployments;
    const { getNamedAccounts } = hre;
    const {deployer,} = await getNamedAccounts();
    console.log('deployer', deployer)
    
    const deployResult: DeployResult = await deploy("TestDeployContract", {
        from: deployer,
        log: true,
        args: [100, 200], // Unlock timestamp in seconds
        waitConfirmations: 1,
        deterministicDeployment: true,
    });
    console.log("transactionHash", deployResult.transactionHash)
};

export default deployLock;
deployLock.tags = ["all", "TestDeployContract"];