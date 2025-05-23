import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { address } from 'hardhat/src/internal/core/config/config-validation';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

  console.log(`deploying contracts on network ${hre.network.name}`)

  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();
  console.log("deploying contracts with the account:", deployer);

  const NATIVE1 = "0x0000000000000000000000000000000000000000";
  const NATIVE2 = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

  // keep deployer as an owner because read only contract
  await deploy('DropERC721Reader', {
    from: deployer,
    proxy: {
      execute: {
        init: {
          methodName: "initialize",
          args: [NATIVE1, NATIVE2, deployer],
        },
      },
      proxyContract: "OpenZeppelinTransparentProxy",
    },
    log: true,
    autoMine: true,
    // deterministicDeployment: process.env.DETERMENISTIC_DEPLOYMENT_SALT,
    // skipIfAlreadyDeployed: process.env.SKIP_IF_ALREADY_DEPLOYED ? true: false,
  });

};
export default func;
func.tags = ['all', "006"];
