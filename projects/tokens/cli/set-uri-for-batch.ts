// call-contract.js  (ES-module style)
import "dotenv/config";
import { ethers } from "ethers";                  // v5 import

// 1️⃣  Provider & signer ------------------------------
const provider = new ethers.providers.JsonRpcProvider(
  process.env.RPC_URL
);

const pk = process.env.PRIVATE_KEY;
if (!pk) throw new Error("Missing PRIVATE_KEY in .env");

const wallet = new ethers.Wallet(pk, provider);

// 2️⃣  Contract instance ------------------------------
const address = process.env.CONTRACT_ADDRESS || "0x6c36e06285330D1bA0661aEc3567b14E60ea04E8";
const abi = [
  "function updateBatchBaseURI(uint256 _index, string _uri) external",
];

const contract = new ethers.Contract(address, abi, wallet);

// 3️⃣  Send the transaction ---------------------------
async function main() {
  const _index = 0;                               // your index
  const _uri   = "ipfs://QmbEDxG6huiJB1tGd89TYEcnwuGNdYrvEf1RcECnAtqQuY/";                  // your new base URI

  const tx = await contract.updateBatchBaseURI(_index, _uri);
  console.log(`Tx sent ⛽  ${tx.hash}`);

  const receipt = await tx.wait();                // wait for mining
  console.log(`Tx mined in block ${receipt.blockNumber}`);
}

main().catch(console.error);
