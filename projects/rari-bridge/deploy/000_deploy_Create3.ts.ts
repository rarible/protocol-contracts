import { DeployFunction, DeployResult } from "hardhat-deploy-immutable-proxy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DETERMENISTIC_DEPLOYMENT_SALT } from "@rarible/deploy-utils";

const deployCreate3: DeployFunction = async (
    hre: HardhatRuntimeEnvironment
) => {
    const { deploy } = hre.deployments;
    const { getNamedAccounts } = hre;
    const {deployer,} = await getNamedAccounts();
    console.log('deployer', deployer)
    
    const deployResult: DeployResult = await deploy("CREATE3Factory", {
        from: deployer,
        log: true,
        waitConfirmations: 1,
        deterministicDeployment: DETERMENISTIC_DEPLOYMENT_SALT,
    });
    console.log("transactionHash", deployResult.transactionHash)
};

export default deployCreate3;
deployCreate3.tags = ["000", "CREATE3Factory"];