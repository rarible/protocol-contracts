import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ERC721RaribleMinimal, ERC721RaribleMinimal__factory } from "@rarible/tokens/jszk";
import { BigNumber } from 'ethers';
import { getSigner } from '../utils/signer';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

    // need to get signer from hre deployment !
    const { deploy, execute } = hre.deployments;
    const { deployer } = await hre.getNamedAccounts();

    const signer = await getSigner(hre);

    const signerAddress = await signer.getAddress()

    let contractName: string = "ERC721RaribleFactoryC2";
    const factoryAddress = (await hre.deployments.get(contractName)).address
    console.log(`using factory: ${factoryAddress}`);

    console.log(`using factory 2: ${factoryAddress}, signer: ${signerAddress}`);
    // Deploy new ERC721 using the factory
    let address = "0x0ECA5f8b4CA915f143a98cB96E41f946136cced2"

    try {
        const receipt = await execute(contractName, { from: deployer, log: true, gasLimit: 1500000 }, "createToken(string,string,string,string,address[],uint256)", "Mystical Cats 7",
            "MYST02",
            "https://rarible-drops.s3.filebase.com/hyper/mystical/metadata/",
            "https://rarible-drops.s3.filebase.com/hyper/mystical/collection.json",
            [signerAddress],
            140
        )
        
        console.log('\nTransaction Events:');
        receipt.events?.forEach((event, index) => {
            console.log(`\nEvent ${index + 1}: ${event.event}`);
            console.log('Arguments:', event.args);
            if (event.event == "Create721RaribleUserProxy" && event.args) {
                address = event.args[0]
            }
        });
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
            .from(signerAddress) // 20-byte address
            .shl(96)              // shift left by 96 bits
            .add(i);              // i fits into the low 96 bits

        let to = signerAddress;

        try {
            console.log("mint token and transfer", tokenId)
            const tx = await erc721.mintAndTransfer({
                tokenId: tokenId,
                tokenURI: `https://rarible-drops.s3.filebase.com/hyper/mystical/metadata/${i}.json`,
                creators: [{
                    account: signerAddress,
                    value: BigNumber.from("10000")
                }],
                royalties: [{
                    account: signerAddress,
                    value: BigNumber.from("100")
                }],
                signatures: ["0x"]
            }, to);
            await tx.wait();
            console.log(`Minted tokenId #${i}, tx: ${tx.hash}; tokenId: ${tokenId}`);
        } catch (error) {
            console.log(`error: ${error}`);
        }
    }
};

export default func;
func.tags = ['test-erc721-collection-withItems', '305'];
