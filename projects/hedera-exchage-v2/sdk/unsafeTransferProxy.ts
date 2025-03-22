// <ai_context>
// hedera-exchage-v2/sdk/unsafeTransferProxy.ts
// Updated to remove direct Hardhat references and accept external signer
// </ai_context>

import { Signer, BigNumber } from "ethers";
import {
  UnsafeTransferProxy__factory,
  UnsafeTransferProxy,
} from "../typechain-types";
import { IERC721, IERC721__factory } from "@rarible/hedera-tokens/typechain-types";

/**
 * addOperatorRole
 * Grants operator role to a specified address
 */
export async function addOperatorRole(
  signer: Signer,
  transferProxyAddress: string,
  to: string,
  gasLimit: number = 4_000_000
) {
  const transferProxy: UnsafeTransferProxy = UnsafeTransferProxy__factory.connect(
    transferProxyAddress,
    signer
  );
  const tx = await transferProxy.addOperator(to, { gasLimit });
  await tx.wait();
  return tx;
}

/**
 * transferFrom
 * Transfers an NFT from "from" -> "to" via the unsafeTransferProxy
 * Approves the proxy if needed
 */
export async function transferFrom(
  signer: Signer,
  transferProxyAddress: string,
  from: string,
  to: string,
  token: string,
  tokenId: string,
  gasLimit: number = 4_000_000
) {
  const transferProxy = UnsafeTransferProxy__factory.connect(
    transferProxyAddress,
    signer
  );
  const erc721: IERC721 = IERC721__factory.connect(token, signer);

  // Approve the transfer proxy for all tokens
  const txApprove = await erc721.setApprovalForAll(transferProxyAddress, true, {
    gasLimit,
  });
  await txApprove.wait();

  // Use the unsafe transfer proxy
  const tx = await transferProxy.erc721safeTransferFrom(
    token,
    from,
    to,
    BigNumber.from(tokenId),
    { gasLimit }
  );
  const receipt = await tx.wait();
  return receipt;
}