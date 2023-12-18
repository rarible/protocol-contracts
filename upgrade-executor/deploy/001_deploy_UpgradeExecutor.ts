import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

type NetworkSettings = {
  executors: string[];
}

const mainnet : NetworkSettings = {
  executors: [
    "0x7e9c956e3EFA81Ace71905Ff0dAEf1A71f42CBC5"
  ]
}
const goerli : NetworkSettings = {
  executors: []
}
const def : NetworkSettings = {
  executors: [],
}

let settings: any = {
  "default": def,
  "mainnet": mainnet,
  "goerli": goerli
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
  console.log(`using settings`, settings)

  const receipt = await deploy("UpgradeExecutor", {
    from: deployer,
    log: true,
    autoMine: true,
    args: [settings.executors]
  });

};
export default func;
func.tags = ['all'];
