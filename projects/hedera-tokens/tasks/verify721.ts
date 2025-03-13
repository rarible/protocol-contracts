import { task, types } from "hardhat/config";
import { BigNumber } from "ethers";
import {
  IERC721__factory,
  IERC721
} from "../typechain-types";

// import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
// import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";

task("verify721", "Verify an ERC721 contract (ERC165 + standard methods)")
  .addParam("collectionAddress", "The address of the NFT collection to verify")
  .addParam("tokenId", "A token ID to test methods like ownerOf", undefined, types.string)
  .addOptionalParam("to", "Optional: an address to test a transfer", undefined, types.string)
  .addOptionalParam("operator", "Optional: an address to set approval for all", undefined, types.string)
  .setAction(async (params, hre) => {
    const [deployer] = await hre.ethers.getSigners();
    const { collectionAddress, tokenId, to, operator } = params;

    console.log("================================================================================");
    console.log("VERIFY ERC721 TASK");
    console.log("================================================================================");
    console.log(`Using deployer/primary signer: ${deployer.address}`);
    console.log(`Collection address: ${collectionAddress}`);
    console.log(`Token ID: ${tokenId}`);

    // Convert tokenId to BigNumber for convenience
    const tokenIdBN = BigNumber.from(tokenId);

    // Connect to the contract
    const erc721: IERC721 = IERC721__factory.connect(collectionAddress, deployer);

    console.log("\n--- 1) Checking ERC165 / ERC721 / ERC721 Metadata ---");

    // ERC165 interface id = 0x01ffc9a7
    // ERC721 interface id = 0x80ac58cd
    // ERC721 Metadata interface id = 0x5b5e139f
    const ERC165_ID = "0x01ffc9a7";
    const ERC721_ID = "0x80ac58cd";
    const ERC721_METADATA_ID = "0x5b5e139f";

    try {
      const supportsERC165 = await erc721.supportsInterface(ERC165_ID);
      console.log(`supportsInterface(ERC165: 0x01ffc9a7)? ${supportsERC165}`);
    } catch {
      console.log("❌ Could not call supportsInterface for ERC165 (function may not exist).");
    }

    try {
      const supportsERC721 = await erc721.supportsInterface(ERC721_ID);
      console.log(`supportsInterface(ERC721: 0x80ac58cd)? ${supportsERC721}`);
    } catch {
      console.log("❌ Could not call supportsInterface for ERC721 (function may not exist).");
    }

    try {
      const supportsMetadata = await erc721.supportsInterface(ERC721_METADATA_ID);
      console.log(`supportsInterface(ERC721Metadata: 0x5b5e139f)? ${supportsMetadata}`);

      if (supportsMetadata) {
        try {
          const name = await (erc721 as any).name();
          const symbol = await (erc721 as any).symbol();
          console.log(`name(): ${name}`);
          console.log(`symbol(): ${symbol}`);
        } catch (metaError) {
          console.log("⚠️  Contract claims ERC721 Metadata but name()/symbol() calls failed:", metaError);
        }
      }
    } catch {
      console.log("❌ Could not call supportsInterface for ERC721 Metadata.");
    }

    console.log("\n--- 2) Testing standard ERC721 methods ---");

    // 2a) balanceOf
    try {
      const balance = await erc721.balanceOf(deployer.address);
      console.log(`✅ balanceOf(${deployer.address}): ${balance.toString()}`);
    } catch (error) {
      console.log("❌ balanceOf call failed:", error);
    }

    // 2b) ownerOf(tokenId)
    try {
      const owner = await erc721.ownerOf(tokenIdBN);
      console.log(`✅ ownerOf(${tokenId}): ${owner}`);
    } catch (error) {
      console.log("❌ ownerOf call failed (token may not exist):", error);
    }

    // 2c) approve
    // Attempt to approve "to" address if provided, otherwise skip
    if (to) {
      try {
        console.log(`Approving ${to} for tokenId=${tokenId}...`);
        const tx = await erc721.approve(to, tokenIdBN);
        await tx.wait();
        const approved = await erc721.getApproved(tokenIdBN);
        console.log(`✅ getApproved(${tokenId}): ${approved}`);
      } catch (error) {
        console.log("❌ approve or getApproved call failed:", error);
      }
    } else {
      console.log("Skipping approve() test: no 'to' address provided.");
    }

    // 2d) setApprovalForAll
    // Attempt to set approval for all if operator is provided
    if (operator) {
      try {
        console.log(`Setting approval for all for operator=${operator}...`);
        const tx = await erc721.setApprovalForAll(operator, true);
        await tx.wait();
        const isApprovedForAll = await erc721.isApprovedForAll(deployer.address, operator);
        console.log(`✅ isApprovedForAll(${deployer.address}, ${operator})? ${isApprovedForAll}`);
      } catch (error) {
        console.log("❌ setApprovalForAll or isApprovedForAll call failed:", error);
      }
    } else {
      console.log("Skipping setApprovalForAll() test: no 'operator' address provided.");
    }

    console.log("\n--- 3) Testing Transfers ---");

    // 3a) transferFrom
    // Only attempt if 'to' is provided
    if (to) {
      try {
        console.log(`Attempting transferFrom(${deployer.address}, ${to}, ${tokenId})...`);
        const transferTx = await erc721.transferFrom(deployer.address, to, tokenIdBN, 
          {
          
          gasLimit: 4_000_000,
      });
        const receipt = await transferTx.wait();
        console.log(`✅ transferFrom() tx hash: ${receipt.transactionHash}`);
      } catch (error) {
        console.log("❌ transferFrom call failed:", error);
      }

      // 3b) safeTransferFrom (overload without data)
      try {
        console.log(`Attempting safeTransferFrom(${deployer.address}, ${to}, ${tokenId})...`);
        const safeTx = await erc721["safeTransferFrom(address,address,uint256)"](deployer.address, to, tokenIdBN);
        const safeReceipt = await safeTx.wait();
        console.log(`✅ safeTransferFrom() (no data) tx hash: ${safeReceipt.transactionHash}`);
      } catch (error) {
        console.log("❌ safeTransferFrom call (no data) failed:", error);
      }

      // 3c) safeTransferFrom (overload with data)
      try {
        console.log(`Attempting safeTransferFrom(${deployer.address}, ${to}, ${tokenId}, 0x1234)...`);
        const safeTx = await erc721["safeTransferFrom(address,address,uint256,bytes)"](
          deployer.address,
          to,
          tokenIdBN,
          "0x1234" // arbitrary data
        );
        const safeReceipt = await safeTx.wait();
        console.log(`✅ safeTransferFrom() (with data) tx hash: ${safeReceipt.transactionHash}`);
      } catch (error) {
        console.log("❌ safeTransferFrom call (with data) failed:", error);
      }

    } else {
      console.log("Skipping transfers: no 'to' address provided.");
    }

    console.log("\n✅ Finished verifying methods on ERC721 contract:", collectionAddress);
    console.log("================================================================================\n");
  });
