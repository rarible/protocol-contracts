import {IDropERC721, DropERC721Reader} from "../typechain-types";
import {ThirdwebStorage} from "@thirdweb-dev/storage";
import {ClaimVerification, SnapshotEntryWithProof, ThirdwebSDK} from "@thirdweb-dev/sdk";
import {AddressZero} from "@ethersproject/constants";
import {BigNumber, utils} from "ethers";
import {getClaimerProofs, prepareClaim} from "./utils";

export interface DropData {
    activeClaimConditionIndex: BigNumber;
    conditions: IDropERC721.ClaimConditionStructOutput[];
    globalData: DropERC721Reader.GlobalDataStructOutput;
    snapshot: SnapshotEntryWithProof | null;
    claimVerification: ClaimVerification | null;
}

export async function getDropData(
    erc721Reader: DropERC721Reader,
    erc721: IDropERC721,
    quantity: number,
    storage: ThirdwebStorage,
    sdk: ThirdwebSDK,
    addressToCheck?: string
): Promise<DropData> {
    const data = await erc721Reader.getAllData(erc721.address, addressToCheck || AddressZero)
    if (data.conditions.length > 0) {
        const claimCondition = data.conditions[data.activeClaimConditionIndex.toNumber()] as IClaimCondition.ClaimConditionStructOutput
        // check for merkle root inclusion
        const merkleRootArray = utils.stripZeros(claimCondition.merkleRoot);
        const hasAllowList = merkleRootArray.length > 0;
        let allowListEntry: SnapshotEntryWithProof | null = null;
        let claimVerification: ClaimVerification | null = null;
        if (hasAllowList) {
            allowListEntry = await getClaimerProofs(
                addressToCheck || AddressZero,
                claimCondition,
                merkleRootArray,
                data.globalData.contractURI,
                storage,
                sdk);
            if (allowListEntry) {
                claimVerification = prepareClaim(
                    addressToCheck || AddressZero,
                    quantity,
                    claimCondition,
                    allowListEntry)
            }
        }
        return {
            ...data,
            claimVerification: claimVerification,
            snapshot: allowListEntry
        }
    }
    return {
        ...data,
        claimVerification: null,
        snapshot: null
    }
}