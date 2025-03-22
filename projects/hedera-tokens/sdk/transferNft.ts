// <ai_context>
// sdk/transferNft.ts
// Exports a function that associates & then transfers a Hedera NFT
// Updated to remove direct Hardhat references and accept signers from the outside
// </ai_context>

import { BigNumber, Signer } from "ethers";
import { IHRC719__factory, IERC721Payble__factory } from "../typechain-types";

export interface TransferNftParams {
  tokenAddress: string;
  to: string;
  tokenId: string;  // or number but we parse to BigNumber
  doAssociate?: boolean;
  gasLimit?: number;
}

/**
 * @param fromSigner Signer for the owner of the NFT (the "sender")
 * @param toSigner Signer for the receiving address (if doAssociate is needed)
 * @param params TransferNftParams
 */
export async function transferNft(
  fromSigner: Signer,
  toSigner: Signer | undefined,
  params: TransferNftParams
): Promise<string> {
  const {
    tokenAddress,
    to,
    tokenId,
    doAssociate = true,
    gasLimit = 6_000_000,
  } = params;

  // Optionally associate the token for the "receiver"
  if (doAssociate) {
    if (!toSigner) {
      throw new Error("doAssociate is true but no toSigner provided");
    }
    const associateTokenInterface = IHRC719__factory.connect(tokenAddress, toSigner);
    const associateTokenTx = await associateTokenInterface.associate({ gasLimit: 1_000_000 });
    await associateTokenTx.wait();
  }

  // Transfer from the 'fromSigner'
  const erc721 = IERC721Payble__factory.connect(tokenAddress, fromSigner);
  const bnTokenId = BigNumber.from(tokenId);
  const fromAddress = await fromSigner.getAddress();

  const transferTx = await erc721.transferFrom(fromAddress, to, bnTokenId, {
    gasLimit,
    value: 0
  });
  await transferTx.wait();

  return transferTx.hash;
}