// <ai_context> Helper function for signing ERC1155 lazy mint data. Matches logic from old Truffle scripts/mint1155.js. </ai_context>

import type * as ethersTypes from "ethers";

export async function sign(
  signer: ethersTypes.Signer,
  tokenId: bigint,
  tokenURI: string,
  supply: bigint,
  creators: Array<{ account: string; value: bigint }>,
  royalties: Array<{ account: string; value: bigint }>,
  verifyingContract: string,
) {
  const domain = {
    name: "Mint1155",
    version: "1",
    chainId: (await signer.provider?.getNetwork())?.chainId,
    verifyingContract,
  };

  const types = {
    Part: [
      { name: "account", type: "address" },
      { name: "value", type: "uint96" },
    ],
    Mint1155: [
      { name: "tokenId", type: "uint256" },
      { name: "tokenURI", type: "string" },
      { name: "supply", type: "uint256" },
      { name: "creators", type: "Part[]" },
      { name: "royalties", type: "Part[]" },
    ],
  };

  const value = {
    tokenId,
    tokenURI,
    supply,
    creators,
    royalties,
  };

  return signer.signTypedData(domain, types, value);
}