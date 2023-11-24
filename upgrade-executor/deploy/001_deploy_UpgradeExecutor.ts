import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

type NetworkSettings = {
  admin: string;
  executors: string[];
}

const mainnet : NetworkSettings = {
  admin: "0x0000000000000000000000000000000000000000",
  executors: []
}
const goerli : NetworkSettings = {
  admin: "0x0000000000000000000000000000000000000000",
  executors: []
}
const def : NetworkSettings = {
  admin: "0x0000000000000000000000000000000000000000",
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
  if (settings.admin === "0x0000000000000000000000000000000000000000") {
    settings.admin = deployer;
  }
  console.log(`using settings`, settings)

  const receipt = await deploy("UpgradeExecutor", {
    from: deployer,
    log: true,
    autoMine: true,
  });

  const UpgradeExecutor = await hre.ethers.getContractFactory("UpgradeExecutor");
  const upgradeExecutor = await UpgradeExecutor.attach(receipt.address);

  const initTx = await upgradeExecutor.initialize(settings.admin, settings.executors);
  await initTx.wait()

};
export default func;
func.tags = ['all'];
