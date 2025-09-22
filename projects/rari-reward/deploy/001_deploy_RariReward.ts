import { ethers, network } from "hardhat";
import { DeployFunction, DeployResult } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DETERMENISTIC_DEPLOYMENT_SALT } from "../utils";

const deployLock: DeployFunction = async (
    hre: HardhatRuntimeEnvironment
) => {
    const { deploy, execute } = hre.deployments;
    const { getNamedAccounts } = hre;
    const {deployer,} = await getNamedAccounts();
    console.log('deployer', deployer)
    // 1. avoid gasLimit
    // 2. gas price auto
    
    const deployResult: DeployResult = await deploy("RariReward", {
        from: deployer,
        log: true,
        proxy: {
            execute: {
                init: {
                    methodName: "initialize",
                    args: [deployer],
                },
            },
            proxyContract: "OpenZeppelinTransparentProxy",
        },
        waitConfirmations: 1,
        deterministicDeployment: DETERMENISTIC_DEPLOYMENT_SALT,
        skipIfAlreadyDeployed: true,
    });
    // Retrieve the full transaction to verify its nonce
    const tx = await ethers.provider.getTransaction(
        deployResult.transactionHash!
    );

//     console.log("deploy tx nonce", tx.nonce); // should print 0
//     console.log("transactionHash", deployResult.transactionHash)

//     let rewardToken = "0x0000000000000000000000000000000000000000"

    if(network.config.chainId === 11155111) { // sepolia
        rewardToken = "0xDe438f962c321680538A95826B14D41B8334AE43"
    } else if(network.config.chainId === 1) { // mainnet
        rewardToken = "0xfca59cd816ab1ead66534d82bc21e7515ce441cf"
    } else if(network.config.chainId === 8453) { // base
        rewardToken = "0xC61f9663E05fccd84d4D6c56A373093437ECB899"
    } else {
        throw new Error("Unsupported network");
    }

//    const txSetRewardToken = await execute(
//         "RariReward",
//         { from: deployer, log: true },
//         "setRewardToken",
//         rewardToken
//       );
//     console.log("txSetRewardToken", txSetRewardToken.transactionHash)
};

export default deployLock;
deployLock.tags = ["all", "001", "RariReward"];
