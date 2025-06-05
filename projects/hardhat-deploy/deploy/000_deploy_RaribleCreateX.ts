import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { RaribleCreateX__factory } from "@rarible/deploy-proxy/js/factories/contracts/RaribleCreateX__factory";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();

  const deployResult = await deploy("RaribleCreateX", {
    from: deployer,
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
    args: [],
    contract: {
      abi: RaribleCreateX__factory.abi as any,
      bytecode: RaribleCreateX__factory.bytecode,
    },
  });

  console.log(`✅ Deployed ${deployResult.newlyDeployed ? "new" : "existing"} RaribleCreateX at ${deployResult.address}`);
};

export default func;
func.tags = ["createx"];
