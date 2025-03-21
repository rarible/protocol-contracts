import { ethers } from "hardhat";
import { UnsafeTransferProxy__factory, UnsafeTransferProxy } from "../typechain-types";
import { IERC721, IERC721__factory } from "@rarible/hedera-tokens/typechain-types";

export async function addOperatorRole(transferProxy: string, to: string) {
    const [deployer] = await ethers.getSigners();
    const transferProxyContract: UnsafeTransferProxy = UnsafeTransferProxy__factory.connect(transferProxy, deployer)
    const tx = await transferProxyContract.addOperator(to, { gasLimit: 4000000 })
    await tx.wait()
    console.log("Transfer proxy addOperator", tx.hash)
    return tx
  }
  

export async function transferFrom(transferProxy: string, from: string, to: string, token: string, id: string) {
  const [deployer] = await ethers.getSigners();
  const transferProxyContract = UnsafeTransferProxy__factory.connect(transferProxy, deployer)
  const erc721: IERC721 = IERC721__factory.connect(token, deployer)
  console.log("Approving", token, transferProxy)
  const txApprove = await erc721.setApprovalForAll(transferProxy, true)
  await txApprove.wait()
  console.log("Approve done", txApprove.hash)

  const tx = await (await transferProxyContract.erc721safeTransferFrom(token,from, to, id, { gasLimit: 4000000 })).wait()
  console.log("Transfer proxy transferFrom", tx.transactionHash)
  return tx
}


