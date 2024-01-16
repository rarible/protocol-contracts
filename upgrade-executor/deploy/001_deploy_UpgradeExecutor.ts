import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

type NetworkSettings = {
  executors: string[];
}

const mainnet : NetworkSettings = {
  executors: [
    "0x7e9c956e3EFA81Ace71905Ff0dAEf1A71f42CBC5", //timelock
    "" //todo: add security council 4/5
  ]
}
const def : NetworkSettings = {
  executors: [
    "0x7e9c956e3EFA81Ace71905Ff0dAEf1A71f42CBC5", //timelock
  ],
}

let settings: any = {
  "default": def,
  "mainnet": mainnet
};

function getSettings(network: string) : NetworkSettings {
  if (settings[network] !== undefined) {
      return settings[network];
  } else {
      return settings["default"];
  }
} 

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(`deploying contracts on network ${hre.network.name}`)

  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();

  console.log("deploying contracts with the account:", deployer);

  let settings = getSettings(hre.network.name)
  settings.executors.push(deployer)
  console.log(`using settings`, settings)

  const receipt = await deploy("UpgradeExecutor", {
    from: deployer,
    log: true,
    autoMine: true,
    args: [settings.executors]
  });

};
export default func;
func.tags = ['executor'];
