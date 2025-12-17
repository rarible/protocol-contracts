import { network } from "hardhat";

const IMPL_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
const PACK_MANAGER_PROXY = "0x58ecFDB68868b655849199aD415e79c1c88B451E";

async function main() {
  const connection = await network.connect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ethers = (connection as any).ethers;
  
  const implSlotValue = await ethers.provider.getStorage(PACK_MANAGER_PROXY, IMPL_SLOT);
  const implAddress = "0x" + implSlotValue.slice(26);
  
  console.log(`\n📋 PackManager Proxy: ${PACK_MANAGER_PROXY}`);
  console.log(`📦 Implementation Address (on-chain): ${implAddress}`);
}

main().catch(console.error);
