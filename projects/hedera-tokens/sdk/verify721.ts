// <ai_context>
// sdk/verify721.ts
// Exports a function to verify an ERC721 contract (interfaces, standard methods, etc.)
// Updated to remove direct Hardhat references. Now accepts a signer from outside
// </ai_context>

import { Signer, BigNumber } from "ethers";
import { IERC721__factory } from "../typechain-types";

export interface Verify721Params {
  collectionAddress: string;
  tokenId: string;
  to?: string;
  operator?: string;
  gasLimit?: number;
}

/**
 * Verifies ERC721 functionality. This function tries:
 *  - supportsInterface checks
 *  - balanceOf, ownerOf
 *  - Approve tests
 *  - Transfer tests (if "to" is supplied)
 */
export async function verify721(
  signer: Signer,
  params: Verify721Params
): Promise<void> {
  const {
    collectionAddress,
    tokenId,
    to,
    operator,
    gasLimit = 4_000_000,
  } = params;

  const deployerAddress = await signer.getAddress();
  const tokenIdBN = BigNumber.from(tokenId);
  const erc721 = IERC721__factory.connect(collectionAddress, signer);

  console.log("Checking ERC165 / ERC721 / ERC721Metadata...");

  // constants
  const ERC165_ID = "0x01ffc9a7";
  const ERC721_ID = "0x80ac58cd";
  const ERC721_METADATA_ID = "0x5b5e139f";

  try {
    const supportsERC165 = await erc721.supportsInterface(ERC165_ID);
    console.log(`supportsInterface(ERC165)? ${supportsERC165}`);
  } catch {
    console.log("❌ Could not call supportsInterface for ERC165");
  }
  try {
    const supports721 = await erc721.supportsInterface(ERC721_ID);
    console.log(`supportsInterface(ERC721)? ${supports721}`);
  } catch {
    console.log("❌ Could not call supportsInterface for ERC721");
  }
  try {
    const supportsMetadata = await erc721.supportsInterface(ERC721_METADATA_ID);
    console.log(`supportsInterface(ERC721Metadata)? ${supportsMetadata}`);
  } catch {
    console.log("❌ Could not call supportsInterface for ERC721 Metadata");
  }

  console.log("Testing balanceOf / ownerOf...");
  try {
    const balance = await erc721.balanceOf(deployerAddress);
    console.log(`balanceOf(${deployerAddress}): ${balance.toString()}`);
  } catch (err) {
    console.log("❌ balanceOf call failed:", err);
  }
  try {
    const owner = await erc721.ownerOf(tokenIdBN);
    console.log(`ownerOf(${tokenId}): ${owner}`);
  } catch (err) {
    console.log("❌ ownerOf call failed:", err);
  }

  // Approve if "to" is provided
  if (to) {
    try {
      console.log(`Approving ${to} for tokenId=${tokenId}...`);
      const tx = await erc721.approve(to, tokenIdBN, { gasLimit });
      await tx.wait();
      const approved = await erc721.getApproved(tokenIdBN);
      console.log(`Approved => ${approved}`);
    } catch (error) {
      console.log("❌ approve or getApproved call failed:", error);
    }
  }

  // setApprovalForAll if operator is provided
  if (operator) {
    try {
      const tx = await erc721.setApprovalForAll(operator, true, { gasLimit });
      await tx.wait();
      const isApprovedForAll = await erc721.isApprovedForAll(deployerAddress, operator);
      console.log(`isApprovedForAll => ${isApprovedForAll}`);
    } catch (error) {
      console.log("❌ setApprovalForAll or isApprovedForAll call failed:", error);
    }
  }

  // Transfer tests if "to" is provided
  if (to) {
    try {
      const tx = await erc721.transferFrom(deployerAddress, to, tokenIdBN, { gasLimit });
      await tx.wait();
      console.log("✅ transferFrom() success");
    } catch (error) {
      console.log("❌ transferFrom failed:", error);
    }
  }

  console.log("Verification complete.");
}