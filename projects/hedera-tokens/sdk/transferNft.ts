// <ai_context>
// sdk/transferNft.ts
// Exports a function that associates & then transfers a Hedera NFT
// </ai_context>

import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { IHRC719__factory, IERC721Payble__factory } from "../typechain-types";

export interface TransferNftParams {
  tokenAddress: string;
  to: string;
  tokenId: string;  // or number but we parse to BigNumber
  doAssociate?: boolean;
  gasLimit?: number;
}

export async function transferNft(params: TransferNftParams): Promise<string> {
  const {
    tokenAddress,
    to,
    tokenId,
    doAssociate = true,
    gasLimit = 6_000_000,
  } = params;

  const signers = await ethers.getSigners();
  // We'll assume [0] is deployer, [1] is "receiver" if needed
  const [deployer, receiver] = signers;

  console.log("Using deployer:", deployer.address);

  const erc721 = IERC721Payble__factory.connect(tokenAddress, deployer);

  // Optionally associate the token for the "receiver"
  if (doAssociate) {
    const associateTokenInterface = IHRC719__factory.connect(tokenAddress, receiver);
    const associateTokenTx = await associateTokenInterface.associate({ gasLimit: 1_000_000 });
    console.log("Token associated tx hash:", associateTokenTx.hash);
    await associateTokenTx.wait();
  }

  const transferTx = await erc721.transferFrom(
    deployer.address,
    to,
    BigNumber.from(tokenId),
    {
      gasLimit,
      value: 0
    }
  );
  await transferTx.wait();

  console.log("transfer tx hash:", transferTx.hash);
  return transferTx.hash;
}