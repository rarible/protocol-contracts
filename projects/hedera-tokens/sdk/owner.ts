// <ai_context>
// sdk/supportInterface.ts
// Exports a function that checks if an interface is supported by a contract
// </ai_context>

import { ethers } from "hardhat";
import { Ownable, Ownable__factory } from "../typechain-types";

export interface OwnerParams {
  collectionAddress: string;
}

export async function owner(params: OwnerParams): Promise<string> {
  const { collectionAddress } = params;

  const signers = await ethers.getSigners();
  const [deployer] = signers;
  console.log("Using deployer address:", deployer.address);

  const ownable = Ownable__factory.connect(collectionAddress, deployer);
  const owner = await ownable.owner();

  console.log(`Owner of ${collectionAddress}: ${owner}`);
  return owner;
}