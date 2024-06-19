import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

  console.log(`deploying contracts on network ${hre.network.name}`)

  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();

  console.log("deploying contracts with the account:", deployer);

  const c = await deploy('EIP173Proxy', {
    from: deployer,
    log: true,
    autoMine: true,
    deterministicDeployment: "0xaaaaaaaa",
    args: ["0x0000000000000000000000000000000000000000", "0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4", "0x"]
  });

  await deploy('RariBridgedToken', {
    from: deployer,
    log: true,
    autoMine: true,
  });

  console.log("address", c.address);

};
export default func;
func.tags = ['deploy-rari-bridged-token'];
