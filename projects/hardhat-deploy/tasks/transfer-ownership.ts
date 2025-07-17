import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeploymentsExtension } from "hardhat-deploy/types";
import "@nomiclabs/hardhat-ethers";
import { getContractsWithProxy, transferOwnership } from "../sdk/transfer-ownership";
/**
 * This task iterates through ALL deployed contracts for the network specified via --network parameter.
 * 
 * The task expects contracts to follow OpenZeppelin's Ownable pattern if they implement ownership.
 * However, not all contracts need to be Ownable - the task handles both cases:
 * 
 * - For contracts that inherit from OpenZeppelin's Ownable: 
 *   The ownership transfer will be executed
 * 
 * - For non-Ownable contracts:
 *   They will be safely skipped without interrupting the task
 * 
 * This design ensures the task can process an entire deployment, transferring ownership
 * where possible while gracefully handling contracts that don't support ownership.
 * 
 * Sample usage:
 * 
 * npx hardhat transfer-ownership-all --new-owner "0x4e59b44847b379578588920ca78fbf26c0b4956c" --network localhost
 */

task(
  "transfer-ownership-all",
  "Transfers ownership of all deployed contracts for a given network"
)
  .addParam("newOwner", "The address to transfer ownership to")
  .setAction(
    async (
      { newOwner }: { newOwner: string },
      hre: HardhatRuntimeEnvironment
    ) => {
      const { deployments, network } = hre as HardhatRuntimeEnvironment & {
        deployments: DeploymentsExtension;
      };

      const signer = (await hre.ethers.getSigners())[0];
      console.log(`Using network: ${network.name}`);
      console.log(`Using signer: ${signer.address}`);
      console.log(`Transferring ownership to: ${newOwner}`);

      let contractsWithProxy: string[] = await getContractsWithProxy(deployments);

      await transferOwnership(hre, deployments, contractsWithProxy, signer, newOwner);

      console.log("\n✅ Ownership transfer process complete.");
    }
  );

export default {};
