import { Signer } from "ethers";
import { DropERC721, DropERC721__factory } from "../typechain-types";

export async function updateBatchBaseURI(dropContractAddress: string, batchIndex: number, batchUri: string, signer: Signer) {
    const drop: DropERC721 = DropERC721__factory.connect(dropContractAddress, signer);
    const tx = await drop.updateBatchBaseURI(batchIndex, batchUri);
    const receipt = await tx.wait();
    return receipt;
}