// <ai_context>
// sdk/mintNft.ts
// Exports a function that mints an NFT from a precompiled Hedera token
// using the RariNFTCreator contract
// Updated to remove direct Hardhat references
// </ai_context>

import { Signer } from "ethers";
import { RariNFTCreator__factory, IHederaTokenService__factory } from "../typechain-types";
import { IERC721Enumerable, IERC721Enumerable__factory } from "../typechain-types";
export interface MintNftParams {
  collectionAddress: string;
  gasLimit?: number;
}

/**
 * Mints an NFT using RariNFTCreator::mintNftTo
 *
 * Now returns the newly minted NFT token index (serial) as a string
 */
export async function mintNft(
  signer: Signer,
  rariNFTCreatorAddress: string,
  params: MintNftParams
): Promise<string> {
  const { collectionAddress, gasLimit = 4_000_000 } = params;
  const fromAddress = await signer.getAddress();

  const rariNFTCreator = RariNFTCreator__factory.connect(rariNFTCreatorAddress, signer);


  // Then run the actual transaction
  const mintTx = await rariNFTCreator.mintNftTo(collectionAddress, fromAddress, { gasLimit });
  await mintTx.wait();

  const tokenService = IERC721Enumerable__factory.connect(collectionAddress, signer);

  const totalSupply = await tokenService.totalSupply();

  // Return the minted token index as a string
  return totalSupply.toString();
}