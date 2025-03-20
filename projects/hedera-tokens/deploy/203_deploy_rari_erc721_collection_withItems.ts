import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ERC721RaribleFactoryC2, ERC721RaribleFactoryC2__factory } from "@rarible/tokens";
import { ERC721RaribleMinimal, ERC721RaribleMinimal__factory } from "@rarible/tokens";
import { ethers, BigNumber } from 'ethers';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deploy } = hre.deployments;
    const { deployer } = await hre.getNamedAccounts();

    const signer = await hre.ethers.getSigner(deployer);

    let contractName: string = "ERC721RaribleFactoryC2";
    const factoryAddress = (await hre.deployments.get(contractName)).address
    console.log(`using factory: ${factoryAddress}`);

    const factory: ERC721RaribleFactoryC2 = ERC721RaribleFactoryC2__factory.connect(factoryAddress, signer);

    // Deploy new ERC721 using the factory
    const address = await factory['getAddress(string,string,string,string,address[],uint256)'](
        "Mystical Cats 3",
        "MYSTICAL3",
        "https://rarible-drops.s3.filebase.com/hyper/mystical/metadata/",
        "https://rarible-drops.s3.filebase.com/hyper/mystical/collection.json",
        [signer.address],
        140
    );

    try {
        const tx = await factory['createToken(string,string,string,string,address[],uint256)'](
            "Mystical Cats 3",
            "MYSTICAL3",
            "https://rarible-drops.s3.filebase.com/hyper/mystical/metadata/",
            "https://rarible-drops.s3.filebase.com/hyper/mystical/collection.json",
            [signer.address],
            140
        );
        console.log(`factory.createToken => tx: ${tx.hash}, address: ${address}`);
    } catch (error) {
        console.log(`error: ${error}`);
    }
    console.log(`collection 721 address: ${address}`);

    const erc721: ERC721RaribleMinimal = ERC721RaribleMinimal__factory.connect(address, signer);
    // await erc721.addMinter(signer.address);

    // Single function that loops from 1..60. Adjust to your liking:
    for (let i = 1; i <= 5; i++) {
        // Construct the tokenId with the top 160 bits = signer address
        const tokenId = BigNumber
            .from(signer.address) // 20-byte address
            .shl(96)              // shift left by 96 bits
            .add(i);              // i fits into the low 96 bits

        let to = signer.address;

        try {
            const tx = await erc721.mintAndTransfer({
                tokenId: tokenId.toString(),
                tokenURI: `https://rarible-drops.s3.filebase.com/hyper/mystical/metadata/${i}.json`,
                creators: [{
                account: signer.address,
                value: 10000
            }],
            royalties: [{
                account: signer.address,
                value: 100
            }],
            // Must be length 1 to match creators' length of 1
            signatures: ["0x"]
            }, to, {gasLimit: 4_000_000});
            await tx.wait();
            console.log(`Minted tokenId #${i}, tx: ${tx.hash}; tokenId: ${tokenId}`);
        } catch (error) {
            console.log(`error: ${error}`);
        }
        const owner = await erc721.ownerOf(tokenId.toString());
        console.log(`Token #${i}, collection: ${address}, tokenId: ${tokenId}, owner: ${owner} ${await erc721.balanceOf(owner)}`);
    }
};

export default func;
func.tags = ['test-erc721-collection-withItems', '203'];
