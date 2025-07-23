import { ethers } from "hardhat";
import { DeployFunction, DeployResult } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DETERMENISTIC_DEPLOYMENT_SALT } from "../utils/utils";
import { WLCollectionRegistry__factory, WLCollectionListing__factory } from "../typechain-types";


const deployLock: DeployFunction = async (
    hre: HardhatRuntimeEnvironment
) => {
    const { deploy, get, execute } = hre.deployments;
    const { getNamedAccounts } = hre;
    const {deployer,} = await getNamedAccounts();
    const WL_ADMIN_ROLE = ethers.utils.id("WL_ADMIN_ROLE");
    console.log('deployer', deployer)
    // 1. avoid gasLimit
    // 2. gas price auto
    
    const deployResult: DeployResult = await deploy("WLCollectionListing", {
        from: deployer,
        proxy: {
            execute: {
                init: {
                    methodName: "initialize",
                    args: [deployer, deployer],
                },
            },
            proxyContract: 'UUPS',
        },
        log: true,
        waitConfirmations: 1,
        deterministicDeployment: DETERMENISTIC_DEPLOYMENT_SALT,
        skipIfAlreadyDeployed: true,

    });

    // Retrieve the full transaction to verify its nonce
    const tx = await ethers.provider.getTransaction(
        deployResult.transactionHash!
    );

    const registryAddress = await get("WLCollectionRegistry");

    console.log("deploy tx nonce", tx.nonce); // should print 0
    console.log("transactionHash", deployResult.transactionHash)
    console.log("deployResult.address", deployResult.address)
    console.log("setting wlCollectionRegistry")

    const receit = await execute(
        "WLCollectionListing",
        { from: deployer, log: true },
        "setWLCollectionRegistry",
        registryAddress.address
      );
    console.log("setting wlCollectionRegistry done", receit.status)
    

    const receitWlAdmin = await execute(
        "WLCollectionRegistry",
        { from: deployer, log: true },
        "grantRole",
        WL_ADMIN_ROLE,
        deployResult.address
      );
    console.log("setting grantRole done", receitWlAdmin.status)
};

export default deployLock;
deployLock.tags = ["all", "1006", "WLCollectionListing", "WLCollection"];
