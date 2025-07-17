import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeploymentsExtension } from "hardhat-deploy/types";
import "@nomiclabs/hardhat-ethers";
import { Signer } from "ethers";

export async function getContractsWithProxy(deployments: DeploymentsExtension) {
  const allDeployments = await deployments.all();
  let contractsWithProxy: string[] = [];
  for (const [contractName, deployment] of Object.entries(allDeployments)) {
    const shortenedName = contractName.replace(/(_Implementation|_Proxy)$/, '');
    if (contractsWithProxy.includes(shortenedName)) {
      continue;
    }
    if (contractName.endsWith("_Implementation") || contractName.endsWith("_Proxy")) {
      contractsWithProxy.push(shortenedName);
      console.log(`Added ${shortenedName} to contractsWithProxy`);
    }
  }
  return contractsWithProxy;
}

export async function transferOwnership(
    hre: HardhatRuntimeEnvironment,
    deployments: DeploymentsExtension,
    contractsWithProxy: string[],
    signer: Signer,
    newOwner: string
) {
  const allDeployments = await deployments.all();
  console.log(`Transferring ownership to: ${newOwner}`);
  let transferredContracts: string[] = [];
  for (const [contractName, deployment] of Object.entries(allDeployments)) {
    console.log(`\n→ Processing: ${contractName} at ${deployment.address}`);
    const shortenedName = contractName.replace(/(_Implementation|_Proxy)$/, '');
    if (contractsWithProxy.includes(shortenedName)) {
      console.log(`\n⏩ Skipped: ${contractName} is handled by ProxyAdmin`);
      continue;
    }
    try {
      const contract = await hre.ethers.getContractAt(
        deployment.abi,
        deployment.address,
        signer
      );

      const currentOwner = await contract.owner();

      if (currentOwner.toLowerCase() === newOwner.toLowerCase()) {
        console.log(`\n⏩ Skipped: ${contractName} is already owned by target.`);
        continue;
      }

      const tx = await contract.transferOwnership(newOwner);
      console.log(`  Tx hash: ${tx.hash}`);
      await tx.wait();
      transferredContracts.push(contractName);
      console.log(`\n✅ Ownership transferred for ${contractName}.`);
    } catch (err: any) {
      console.error(`\n❌ Failed to transfer ownership for ${contractName}: ${err.message}`);
    }
  }
  return transferredContracts;
}
