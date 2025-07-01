import {RaribleCloneFactory, RaribleCloneFactory__factory} from "../typechain-types";
import { Signer } from "ethers";

export function getCloneFactory(signer: Signer, address: string): RaribleCloneFactory {
    const rariNFTCreator = RaribleCloneFactory__factory.connect(address, signer);
    return rariNFTCreator;
}
