import hre from "hardhat";
import { zksyncEthers } from "hardhat";


// "0x9301194711E0015316AA0d9e0F184dFB87f70582",
// "0x85a26E6D52239817570Ff643bA09E3AA5393A805",
// "0x11983886da3c379E507A874649C96D7EEd086c32"

async function main() {
  console.log("zk-deploy-721-factory.ts");
  const factoryFactory721 = await hre.zksyncEthers.getContractFactory("ERC721RaribleFactoryC2");
  console.log("start deploy")
  const factory721 = await factoryFactory721.deploy("0x9301194711E0015316AA0d9e0F184dFB87f70582", "0x85a26E6D52239817570Ff643bA09E3AA5393A805", "0x11983886da3c379E507A874649C96D7EEd086c32");

  await factory721.deployed();

  console.log("factory721 deployed to:", factory721.address);
  console.log(factory721.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});