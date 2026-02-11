import { ethers } from "hardhat";

async function main() {
  const signers = await ethers.getSigners();
  console.log(`\nTotal signers: ${signers.length}\n`);

  const roles = ["Factory Owner", "Collection Creator", "Minter"];
  for (let i = 0; i < signers.length; i++) {
    const bal = await signers[i].getBalance();
    console.log(
      `  Signer ${i} (${roles[i] || "extra"}): ${signers[i].address} | ${ethers.utils.formatEther(bal)} ETH`
    );
  }
  console.log("");
}

main().catch(console.error);
