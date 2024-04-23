import { HardhatRuntimeEnvironment } from "hardhat/types";

export async function getOwner(hre: HardhatRuntimeEnvironment): Promise<string> {
  if(process.env.INITIAL_OWNER) return process.env.INITIAL_OWNER;
  const { deployer } = await hre.getNamedAccounts();
  return deployer;
}