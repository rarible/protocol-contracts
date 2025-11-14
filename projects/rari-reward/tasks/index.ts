/*
<ai_context>
Hardhat task to compute and verify the claim message hash for RariReward claims.
Computes off-chain using ethers, prints intermediate results, and verifies by calling the contract's claimMessageHash method.
</ai_context>
*/
import { task } from "hardhat/config";
import { BigNumber } from "ethers";

task("get-claim-message-hash", "Computes the claim message hash off-chain and verifies on-chain")
  .addParam("chainId", "The chain ID (e.g., 2)", undefined, undefined, true)
  .addParam("contractAddress", "The RariReward contract address")
  .addParam("epoch", "The epoch index")
  .addParam("user", "The user address")
  .addParam("points", "The cumulative points")
  .setAction(async (taskArgs, hre) => {
    const { chainId: chainIdStr, contractAddress, epoch: epochStr, user, points: pointsStr } = taskArgs;
    
    // Parse inputs
    const chainId = Number(chainIdStr);
    const epoch = BigNumber.from(epochStr);
    const points = BigNumber.from(pointsStr);
    
    console.log("Inputs:");
    console.log(`- chainId: ${chainId}`);
    console.log(`- contractAddress: ${contractAddress}`);
    console.log(`- epoch: ${epoch.toString()}`);
    console.log(`- user: ${user}`);
    console.log(`- points: ${points.toString()}`);
    
    // Compute dataHash off-chain
    const dataHash = hre.ethers.utils.solidityKeccak256(
      ["uint256", "address", "uint256", "address", "uint256"],
      [chainId, contractAddress, epoch, user, points]
    );
    console.log(`\nIntermediate dataHash: ${dataHash}`);
    
    // Compute ethSignedMessageHash
    const ethSignedHash = hre.ethers.utils.hashMessage(hre.ethers.utils.arrayify(dataHash));
    console.log(`Off-chain claimMessageHash: ${ethSignedHash}`);
    
    // Connect to contract and call claimMessageHash for verification
    const { RariReward__factory } = await import("../typechain-types");
    const reward = RariReward__factory.connect(contractAddress, hre.ethers.provider);
    const onChainHash = await reward.claimMessageHash(user, epoch, points);
    console.log(`\nOn-chain claimMessageHash: ${onChainHash}`);
    
    // Compare
    if (onChainHash === ethSignedHash) {
      console.log("Verification: Off-chain and on-chain hashes match.");
    } else {
      console.log("Verification: Hashes do NOT match. Possible reasons: mismatched chainId (network chainId may differ), incorrect contract address, or deployment mismatch.");
    }
  });

