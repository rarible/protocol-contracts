import { ethers } from "hardhat";
import { UnsafeTransferProxy__factory } from "../typechain-types";

export async function transferFrom(transferProxy: string, from: string, to: string, token: string, id: string) {
  const [deployer] = await ethers.getSigners();
  const transferProxyContract = UnsafeTransferProxy__factory.connect(transferProxy, deployer)
  const tx = await (await transferProxyContract.erc721safeTransferFrom(from, to, token, id)).wait()
  console.log("Transfer proxy transferFrom", tx.transactionHash)
  return tx
}


