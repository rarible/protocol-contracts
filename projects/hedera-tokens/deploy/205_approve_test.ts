import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ERC721RaribleMinimal, ERC721RaribleMinimal__factory } from "@rarible/tokens";
import { BigNumber } from "ethers";


const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // Get signers
    const signers = await hre.ethers.getSigners();
    const signer = signers[0];
    const makerRight = signers[1];
    console.log("signer", signer.address);
    console.log("makerRight", makerRight.address);

    // Example NFT
    const erc721Address = "0x7cA29c59D76E45FdBE5F5E900eFCC8dF37485E31";
    const erc721: ERC721RaribleMinimal = ERC721RaribleMinimal__factory.connect(erc721Address, signer);
    const tokenId = BigNumber.from("48827653089252063377009650346866330927455685249615897861731929327047129694209");
    console.log(`tokenId = ${tokenId.toString()}`);


    const txapp =await erc721.setApprovalForAll(makerRight.address, true, {gasLimit: 8_000_000});
    const status = await txapp.wait();
    console.log("setApprovalForAll =>", txapp.hash, status.status);
    const tx = await erc721.transferFrom(signer.address, makerRight.address, tokenId)
    console.log("transferFrom =>", tx.hash);
};

export default func;
func.tags = ['approve-test', '205'];

// hedera testnet
// Token #1, collection: 0x7cA29c59D76E45FdBE5F5E900eFCC8dF37485E31, tokenId: 48827653089252063377009650346866330927455685249615897861731929327047129694209, owner: 0x6Bf378e79F736057f64cD647e7Da99fD76800C9B 1
// Minted tokenId #2, tx: 0xf992a5e00fa269945c0975a373257cf54d9bd14998a61a275d9544d71d9e0375; tokenId: 48827653089252063377009650346866330927455685249615897861731929327047129694210
// Token #2, collection: 0x7cA29c59D76E45FdBE5F5E900eFCC8dF37485E31, tokenId: 48827653089252063377009650346866330927455685249615897861731929327047129694210, owner: 0x6Bf378e79F736057f64cD647e7Da99fD76800C9B 2
// Minted tokenId #3, tx: 0x8b593cc7c079dde649cb8b1a71797463ff4938efe92bc0ec2b6a2ef1d0c1d5d6; tokenId: 48827653089252063377009650346866330927455685249615897861731929327047129694211
// Token #3, collection: 0x7cA29c59D76E45FdBE5F5E900eFCC8dF37485E31, tokenId: 48827653089252063377009650346866330927455685249615897861731929327047129694211, owner: 0x6Bf378e79F736057f64cD647e7Da99fD76800C9B 3
// Minted tokenId #4, tx: 0x9bb79ea356d102d43205e9b375ec910e9f345c09218152c523b15e902a5c86ee; tokenId: 48827653089252063377009650346866330927455685249615897861731929327047129694212
// Token #4, collection: 0x7cA29c59D76E45FdBE5F5E900eFCC8dF37485E31, tokenId: 48827653089252063377009650346866330927455685249615897861731929327047129694212, owner: 0x6Bf378e79F736057f64cD647e7Da99fD76800C9B 4
// Minted tokenId #5, tx: 0x74489eba3705db0eb55bbbe82a2c552c585c52f835e49e2ed82833c1eb9429d8; tokenId: 48827653089252063377009650346866330927455685249615897861731929327047129694213
// Token #5, collection: 0x7cA29c59D76E45FdBE5F5E900eFCC8dF37485E31, tokenId: 48827653089252063377009650346866330927455685249615897861731929327047129694213, owner: 0x6Bf378e79F736057f64cD647e7Da99fD76800C9B 5
//
