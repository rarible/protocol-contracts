import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction, DeployResult } from "hardhat-deploy/dist/types";
import { DETERMENISTIC_DEPLOYMENT_SALT } from "../utils";

const deployFactory: DeployFunction = async (
  hre: HardhatRuntimeEnvironment
) => {
  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();
  const chainId = hre.network.config.chainId;

  console.log("\n=== Starting LiveDropFactory Deployment ===");
  console.log(`Network: ${hre.network.name}`);
  console.log(`Chain ID: ${chainId}`);
  console.log(`Deployer: ${deployer}`);

  // --- Configuration ---
  const feeRecipient =
    process.env.FEE_RECIPIENT || deployer;
  const defaultFeeBps = parseInt(process.env.DEFAULT_FEE_BPS || "500");
  const defaultFeeFixedNative = process.env.DEFAULT_FEE_FIXED_NATIVE || "0";
  const defaultFeeFixedErc20 = process.env.DEFAULT_FEE_FIXED_ERC20 || "0";

  // USDC addresses by chain
  let defaultErc20 = process.env.DEFAULT_ERC20 || "";
  if (!defaultErc20) {
    if (chainId === 8453) {
      defaultErc20 = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base USDC
    } else if (chainId === 84532) {
      defaultErc20 = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Base Sepolia USDC
    } else {
      throw new Error(
        `No default ERC-20 configured for chain ${chainId}. Set DEFAULT_ERC20 env var.`
      );
    }
  }

  console.log("\nDeployment Configuration:");
  console.log(`  Fee Recipient: ${feeRecipient}`);
  console.log(`  Default Fee BPS: ${defaultFeeBps}`);
  console.log(`  Default Fee Fixed Native: ${defaultFeeFixedNative}`);
  console.log(`  Default Fee Fixed ERC-20: ${defaultFeeFixedErc20}`);
  console.log(`  Default ERC-20: ${defaultErc20}`);

  // --- Deploy ---
  console.log("\nDeploying LiveDropFactory...");

  const deployResult: DeployResult = await deploy("LiveDropFactory", {
    from: deployer,
    args: [
      deployer,
      feeRecipient,
      defaultFeeBps,
      defaultFeeFixedNative,
      defaultFeeFixedErc20,
      defaultErc20,
    ],
    log: true,
    autoMine: true,
    waitConfirmations: 1,
    deterministicDeployment: DETERMENISTIC_DEPLOYMENT_SALT,
    skipIfAlreadyDeployed: true,
  });

  console.log("\n=== Deployment Results ===");
  console.log(`Contract Address: ${deployResult.address}`);
  console.log(`Transaction Hash: ${deployResult.transactionHash}`);
  console.log(`Newly Deployed: ${deployResult.newlyDeployed ? "Yes" : "No"}`);
  console.log("=== Deployment Complete ===\n");
};

export default deployFactory;
deployFactory.tags = ["all", "001", "LiveDropFactory"];
