import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DETERMENISTIC_DEPLOYMENT_SALT } from "../utils";

const deployRariOFTAdapter: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  if (network.name !== "sepolia") {
    console.log("Skipping: Not sepolia");
    return;
  }

  const lzEndpoint = "0x6EDCE65403992e310a62460808c4b910D972f10f"; // V2 testnet endpoint
  const rariToken = "0xfAc63865D9cA6f1E70e9C441d4B01255519F7A54"; // RARI on Sepolia test

  await deploy("RariOFTAdapter", {
    from: deployer,
    args: [rariToken, lzEndpoint, deployer],
    log: true,
    waitConfirmations: 1,
    deterministicDeployment: DETERMENISTIC_DEPLOYMENT_SALT,
  });
};

deployRariOFTAdapter.tags = ["RariOFTAdapter"];

export default deployRariOFTAdapter;