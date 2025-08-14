import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DETERMENISTIC_DEPLOYMENT_SALT } from "../utils";

const deployRariOFT: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  if (network.name !== "base-sepolia") {
    console.log("Skipping: Not base-sepolia");
    return;
  }

  const lzEndpoint = "0x6EDCE65403992e310a62460808c4b910D972f10f"; // V2 testnet endpoint

  await deploy("RariOFT", {
    from: deployer,
    args: [lzEndpoint, deployer],
    log: true,
    waitConfirmations: 1,
    deterministicDeployment: DETERMENISTIC_DEPLOYMENT_SALT,
  });
};

deployRariOFT.tags = ["RariOFT"];

export default deployRariOFT;