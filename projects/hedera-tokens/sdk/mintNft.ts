// <ai_context>
// sdk/mintNft.ts
// Exports a function that mints an NFT from a precompiled Hedera token
// using the RariNFTCreator contract
// </ai_context>

import { ethers, deployments } from "hardhat";
import { RariNFTCreator, RariNFTCreator__factory } from "../typechain-types";

export interface MintNftParams {
  collectionAddress: string;
  gasLimit?: number;
}

export async function mintNft(params: MintNftParams): Promise<string> {
  const { collectionAddress, gasLimit = 4_000_000 } = params;

  const signers = await ethers.getSigners();
  const [deployer] = signers;
  console.log("Using deployer address:", deployer.address);

  const contractName = "RariNFTCreator";
  const tokenCreateFactory = (await ethers.getContractFactory(contractName)) as RariNFTCreator__factory;
  const factoryAddress = (await deployments.get(contractName)).address;
  const rariNFTCreator = tokenCreateFactory.attach(factoryAddress) as RariNFTCreator;

  console.log(`Using RariNFTCreator at address: ${factoryAddress}`);

  const mintTx = await rariNFTCreator.mintNftTo(
    collectionAddress,
    deployer.address,
    { gasLimit }
  );
  await mintTx.wait();

  console.log("Mint tx hash:", mintTx.hash);
  return mintTx.hash;
}