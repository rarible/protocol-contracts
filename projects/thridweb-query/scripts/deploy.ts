import * as ethers from "ethers";

const hre = require("hardhat");
import { BaseContract, Contract, ContractFactory } from "@ethersproject/contracts";
import {sleep} from "@nomicfoundation/hardhat-verify/internal/utilities";
async function main() {
    console.log("deploy reader")

    let erc721Reader: Contract = (await hre.ethers.deployContract(
        "DropERC721Reader"
    ))
    console.log(erc721Reader.address)
    erc721Reader = await erc721Reader.deployed()
    console.log("deployment done", erc721Reader.address)
    // verify
    await erc721Reader.deployTransaction.wait(20)
    await sleep(5000);
    console.log("verify")
    await hre.run("verify:verify", {
        address: erc721Reader.address,
        constructorArguments: [
        ],
    });
    console.log("verify done")
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});