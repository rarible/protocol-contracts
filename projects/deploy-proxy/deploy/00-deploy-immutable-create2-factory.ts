import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction, DeployResult } from 'hardhat-deploy/types';

const deployLock: DeployFunction = async (
    hre: HardhatRuntimeEnvironment
) => {
    const { deploy } = hre.deployments;
    const { getNamedAccounts } = hre;
    const na = await getNamedAccounts()
    const {deployer,} = await getNamedAccounts();
    console.log('deployer', deployer, JSON.stringify(na))
    const deployResult: DeployResult = await deploy("ImmutableCreate2Factory", {
        from: deployer,
        log: true,
        args: [], // Unlock timestamp in seconds
        waitConfirmations: 1,
        nonce: 0,
    });
    console.log("transactionHash", deployResult.transactionHash)

};

export default deployLock;
deployLock.tags = ["00", "ImmutableCreate2Factory"];