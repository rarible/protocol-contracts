import { DeployFunction, DeployResult } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployNativeSplitPayments: DeployFunction = async (
  hre: HardhatRuntimeEnvironment
) => {
  const { deploy } = hre.deployments;
  const { getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();

  console.log("Deployer:", deployer);
  console.log("Network:", hre.network.name);

  const deployResult: DeployResult = await deploy("NativeSplitPayments", {
    from: deployer,
    log: true,
    waitConfirmations: 1,
    skipIfAlreadyDeployed: true,
  });

  if (deployResult.newlyDeployed) {
    console.log("NativeSplitPayments deployed at:", deployResult.address);
    console.log("Transaction hash:", deployResult.transactionHash);
  } else {
    console.log("NativeSplitPayments already deployed at:", deployResult.address);
  }
};

export default deployNativeSplitPayments;
deployNativeSplitPayments.tags = ["all", "NativeSplitPayments"];
