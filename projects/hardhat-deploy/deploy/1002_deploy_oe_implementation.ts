import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { OpenEditionERC721FlatFee__factory } from "@rarible/external-contracts/js/factories/OpenEditionERC721FlatFee__factory";
import { DETERMENISTIC_DEPLOYMENT_SALT } from "../utils/utils";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log('\n=== Starting OpenEditionERC721FlatFee Deployment ===');
  console.log(`Network: ${hre.network.name}`);
  console.log(`Chain ID: ${hre.network.config.chainId}`);

  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();
  console.log(`\nDeployer Address: ${deployer}`);

  console.log('\nDeployment Configuration:');
  console.log(`- Deterministic Deployment: ${DETERMENISTIC_DEPLOYMENT_SALT ? 'Enabled' : 'Disabled'}`);
  console.log(`- Skip If Already Deployed: ${process.env.SKIP_IF_ALREADY_DEPLOYED ? 'Yes' : 'No'}`);

  console.log('\nDeploying OpenEditionERC721FlatFee contract...');
  const deployResult = await deploy('OpenEditionERC721FlatFee', {
    from: deployer,
    log: true,
    autoMine: true,
    args: [],
    deterministicDeployment: DETERMENISTIC_DEPLOYMENT_SALT,
    skipIfAlreadyDeployed: true,
    contract: {
      abi: OpenEditionERC721FlatFee__factory.abi as any,
      bytecode: OpenEditionERC721FlatFee__factory.bytecode,
    },
  });

  console.log('\n=== Deployment Results ===');
  console.log(`Contract Address: ${deployResult.address}`);
  console.log(`Transaction Hash: ${deployResult.transactionHash}`);
  console.log(`Newly Deployed: ${deployResult.newlyDeployed ? 'Yes' : 'No'}`);
  console.log('=== Deployment Complete ===\n');
};

export default func;
func.tags = ["1002", "oe-collection"];