import { HardhatRuntimeEnvironment } from "hardhat/types";

export async function getOwner(hre: HardhatRuntimeEnvironment): Promise<string> {
  const { deployer } = await hre.getNamedAccounts();
  //if it's local tests
  if (hre.network.name === "hardhat") {
    return deployer;
  }
  // if there is an owner set in .env and it's not local tests
  if(process.env.INITIAL_OWNER) {
    return process.env.INITIAL_OWNER;
  }
  
  //if owner is not set
  return deployer;
}