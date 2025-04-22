// 0x2CC11132c7dBA4d55459c0BE2792aB700B15D512
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ImmutableCreate2Factory__factory } from "@rarible/deploy-proxy/js/factories/ImmutableCreate2Factory__factory";
import { DETERMENISTIC_DEPLOYMENT_SALT } from "../utils/utils";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log('\n=== Starting ImmutableCreate2Factory Deployment ===');
  console.log(`Network: ${hre.network.name}`);
  console.log(`Chain ID: ${hre.network.config.chainId}`);

  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();
  if (deployer != "0x2CC11132c7dBA4d55459c0BE2792aB700B15D512") {
    console.log("Deployer is not equal to 0x2CC11132c7dBA4d55459c0BE2792aB700B15D512, need to deploy with the same deployer")
    return
  }
  console.log(`\nDeployer Address: ${deployer}`);

  console.log('\nDeployment Configuration:');
  console.log(`- Deterministic Deployment: ${DETERMENISTIC_DEPLOYMENT_SALT ? 'Enabled' : 'Disabled'}`);
  console.log(`- Skip If Already Deployed: ${process.env.SKIP_IF_ALREADY_DEPLOYED ? 'Yes' : 'No'}`);

  console.log('\nDeploying ImmutableCreate2Factory contract...');
  const deployResult = await deploy('ImmutableCreate2Factory', {
    from: deployer,
    log: true,
    autoMine: true,
    args: [],
    deterministicDeployment: false,
    skipIfAlreadyDeployed: true,
    contract: {
      abi: ImmutableCreate2Factory__factory.abi as any,
      bytecode: ImmutableCreate2Factory__factory.bytecode,
    },
  });

  console.log('\n=== Deployment Results ===');
  console.log(`Contract Address: ${deployResult.address}`);
  console.log(`Transaction Hash: ${deployResult.transactionHash}`);
  console.log(`Newly Deployed: ${deployResult.newlyDeployed ? 'Yes' : 'No'}`);
  console.log('=== Deployment Complete ===\n');
};

export default func;
func.tags = ["000", "c2-factory"];