import { task } from "hardhat/config";
import { IERC721, IERC721__factory } from "../typechain-types";

task("transferNFT", "Mint a non-fungible token with fix fee using the precompiled contract")
  .addParam("tokenAddress", "The address of the token to mint")
  .addParam("to", "The address of the recipient")
  .addParam("tokenId", "The token id to transfer")
  .setAction(async (params, hre) => {
    const signers = await hre.ethers.getSigners();
    const [deployer, feeCollector] = signers;

    console.log("Using deployer address:", deployer.address);
    const erc721 = IERC721__factory.connect(params.tokenAddress, deployer);
    const tokenAddress = params.tokenAddress;
    // https://console.filebase.com/object/rarible-drops/Eclipse/cat/metadata/1.json
    // QmYVnaTG4Fo5kPxkuZCCUp7B5XT5P88aARQe44WcxYs11r
    const mintTx = await erc721.transferFrom(deployer.address, params.to, params.tokenId, {gasLimit: 6_000_000});
    const txReceipt = await mintTx.wait();
    console.log("Mint tx hash", mintTx.hash);
    
});