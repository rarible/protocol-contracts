import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { DETERMENISTIC_DEPLOYMENT_SALT, ROYALTIES_REGISTRY_TYPE } from '../utils/utils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

  console.log(`deploying contracts on network ${hre.network.name}`)

  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();

  console.log("deploying contracts with the account:", deployer);

  if (ROYALTIES_REGISTRY_TYPE === "RoyaltiesRegistryPermissioned") {

    await deploy('ProxyAdminRoyaltiesRegistryPermissioned', {
      from: deployer,
      log: true,
      autoMine: true,
      args: [deployer],
      deterministicDeployment: DETERMENISTIC_DEPLOYMENT_SALT,
      skipIfAlreadyDeployed: true,
      contract: "hardhat-deploy-immutable-proxy/solc_0.8/openzeppelin/proxy/transparent/ProxyAdmin.sol:ProxyAdmin"
    });

    await deploy('RoyaltiesRegistryPermissioned', {
      from: deployer,
      proxy: {
        execute: {
          init: {
            methodName: "__RoyaltiesRegistry_init",
            args: [deployer],
          },
        },
        proxyContract: "OpenZeppelinTransparentProxy",
        viaAdminContract: {
          name: "ProxyAdminRoyaltiesRegistryPermissioned",
        },
      },
      log: true,
      autoMine: true,
      deterministicDeployment: DETERMENISTIC_DEPLOYMENT_SALT,
      skipIfAlreadyDeployed: true,
    });
  } else {
    await deploy('RoyaltiesRegistry', {
      from: deployer,
      proxy: {
        execute: {
          init: {
            methodName: "__RoyaltiesRegistry_init",
            args: [],
          },
        },
        proxyContract: "OpenZeppelinTransparentProxy",
      },
      log: true,
      autoMine: true,
    });
  }

};
export default func;
func.tags = ['all', 'all-no-tokens', 'all-with-sanity-check', 'deploy-rr', '001'];