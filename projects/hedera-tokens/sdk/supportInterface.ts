// <ai_context>
// sdk/supportInterface.ts
// Exports a function that checks if an interface is supported by a contract
// </ai_context>

import { ethers } from "hardhat";
import { IERC721__factory } from "../typechain-types";


export interface SupportInterfaceParams {
  collectionAddress: string;
  interfaceId: string;
}

export async function supportInterface(params: SupportInterfaceParams): Promise<boolean> {
  const { collectionAddress, interfaceId } = params;

  const signers = await ethers.getSigners();
  const [deployer] = signers;
  console.log("Using deployer address:", deployer.address);

  const erc721 = IERC721__factory.connect(collectionAddress, deployer);
  const isSupported = await erc721.supportsInterface(interfaceId);

  console.log(`Is interface ${interfaceId} supported: ${isSupported}`);
  return isSupported;
}