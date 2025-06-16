import { ZERO_WORD } from "@rarible/exchange-v2/sdk/constants";

export async function mintToken(
    tokenContract: any,
    tokenId: string,
    sellerAddress: string,
    options?: {
      is1155?: boolean;
      supply?: number;
    }
  ) {
    const is1155 = options?.is1155 ?? false;
    const supply = options?.supply ?? 1;
  
    const mintData: any = {
      tokenId,
      tokenURI: "ipfs:/",
      creators: [{ account: sellerAddress, value: 10000 }],
      royalties: [],
      signatures: [ZERO_WORD],
    };
  
    if (is1155) {
      mintData.supply = supply;
      await tokenContract.mintAndTransfer(mintData, sellerAddress, supply);
    } else {
      await tokenContract.mintAndTransfer(mintData, sellerAddress);
    }
  }