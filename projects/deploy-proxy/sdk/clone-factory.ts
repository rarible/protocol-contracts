import {TWCloneFactory, TWCloneFactory__factory} from "../typechain-types";
import { Signer } from "ethers";

export function getCloneFactory(signer: Signer, address: string): TWCloneFactory {
    const rariNFTCreator = TWCloneFactory__factory.connect(address, signer);
    return rariNFTCreator;
}
