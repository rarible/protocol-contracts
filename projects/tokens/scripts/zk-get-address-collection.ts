// factory at 0x5F577Dd877b0136ab7ed8A4d7b303aD38348a1Ea

// "0x9301194711E0015316AA0d9e0F184dFB87f70582",
// "0x85a26E6D52239817570Ff643bA09E3AA5393A805",
// "0x11983886da3c379E507A874649C96D7EEd086c32"

import { ERC721RaribleFactoryC2 } from "../typechain-types"

import hre from "hardhat";

// https://sepolia.explorer.zksync.io/tx/0xadb7f5955bb0f87fe2de2fa777a0d03ded56c3a11ffdca7e6f47883f89a5d47e#eventlog
// taget address 0xff0e7865e797bac2fe9cf30996abcd9ddc8de84c

async function main() {
  console.log("zk-get-address-collection.ts");
  const factoryFactory721 = await hre.zksyncEthers.getContractFactory("ERC721RaribleFactoryC2") as ERC721RaribleFactoryC2;
  console.log("start deploy")
  const factory721 = factoryFactory721.attach("0x5F577Dd877b0136ab7ed8A4d7b303aD38348a1Ea");
  const targetAddress = await factory721["getAddress(string,string,string,string,uint256)"]("test", "test", "test", "test", 1000);

  console.log("factory721 deployed to:", factory721.address);

  console.log("factory721 cacl collection address:", targetAddress);
  console.log("factory721 true collection address:", "0xff0e7865e797bac2fe9cf30996abcd9ddc8de84c");
  console.log(factory721.address);
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});