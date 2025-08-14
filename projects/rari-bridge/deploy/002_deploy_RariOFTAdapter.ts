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
  const rariToken = "0xDe438f962c321680538A95826B14D41B8334AE43"; // RARI on Sepolia test

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