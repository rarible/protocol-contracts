import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

type NetworkConfig = {
  l1Address: `0x${string}`,
  previousAddress: `0x${string}`,
  customGatewayAddress: `0x${string}`,
  routerAddress: `0x${string}`,
  minterAddress: `0x${string}`
}

const zero = "0x0000000000000000000000000000000000000000"
const configs: Record<string, NetworkConfig> = {
  "arbitrum": {
    l1Address: "0xFca59Cd816aB1eaD66534D82bc21E7515cE441CF",
    previousAddress: "0xCF8600347Dc375C5f2FdD6Dab9BB66e0b6773cd7",
    customGatewayAddress: "0x8bE956aB42274056ef4471BEb211b33e258b7324",
    routerAddress: "0x2623C144B4d167f70893f6A8968B98c89a6C5F97",
    minterAddress: "0x096760F208390250649E3e8763348E783AEF5562"
  },
  "rari": {
    l1Address: "0xcf78572a8fe97b2b9a4b9709f6a7d9a863c1b8e0",
    previousAddress: "0xC6e8a38FA44720d9d89Fef0A9E71F5a15E0b2C38",
    customGatewayAddress: zero,
    routerAddress: zero,
    minterAddress: "0x90E43f5d772e50B01B3F9596f65AD5653467d010"
  },
  "arbitrum_sepolia": {
    l1Address: "0xfac63865d9ca6f1e70e9c441d4b01255519f7a54",
    previousAddress: "0xcca8413d36c6061934e13ab1ad685a638dc2210a",
    customGatewayAddress: "0x7EDA0d4c14Af6B0920F4e3C0F0cA18d18212fB0A",
    routerAddress: "0xece5902AD6Bbf4689EA8aD4B95237fAf5B65FB26",
    minterAddress: "0x8ca1e1ac0f260bc4da7dd60aca6ca66208e642c5"
  },
  "rari_sepolia": {
    l1Address: "0x1Bb02CB1A846d14c3741b5f7d74Be1A3f2b22d7d",
    previousAddress: zero,
    customGatewayAddress: "0x7EDA0d4c14Af6B0920F4e3C0F0cA18d18212fB0A",
    routerAddress: zero,
    minterAddress: "0x311c5fe27874fbc8ea9d06beda2ff316e37c3e2f"
  }
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

  console.log(`deploying contracts on network ${hre.network.name}`)

  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();

  console.log("deploying contracts with the account:", deployer);

  const proxyResult = await deploy('EIP173Proxy', {
    from: deployer,
    log: true,
    autoMine: true,
    deterministicDeployment: "0x11111115",
    args: ["0x0000000000000000000000000000000000000000", deployer, "0x"]
  });

  console.log("deployed proxy, result is", proxyResult.address)

  const implResult = await deploy('RariBridgedToken', {
    from: deployer,
    log: true,
    autoMine: true,
  });

  console.log("deployed impl, result is", implResult.address)

  const proxyFactory = await hre.ethers.getContractFactory("EIP173Proxy")
  const proxy = proxyFactory.attach(proxyResult.address)
  const upgradeResult = await proxy.upgradeTo(implResult.address)

  console.log("Upgraded. result=", upgradeResult.hash)

  const tokenFactory = await hre.ethers.getContractFactory("RariBridgedToken")
  const token = tokenFactory.attach(proxyResult.address)

  const config = configs[hre.network.name]
  console.log("using config", config)
  const initResult = await token.__RariBridgedToken_init(config.previousAddress, zero, config.minterAddress, config.l1Address, config.customGatewayAddress, config.routerAddress)

  console.log("initialized. result is", initResult.hash)
};

export default func;
func.tags = ['deploy-rari-bridged-token'];
