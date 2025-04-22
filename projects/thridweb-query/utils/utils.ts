import {ThirdwebStorage} from "@thirdweb-dev/storage";
import {ClaimVerification, fetchSnapshotEntryForAddress, SnapshotEntryWithProof, ThirdwebSDK} from "@thirdweb-dev/sdk";
import {BigNumber, ethers, utils} from "ethers";
import { IDropERC721 } from "../typechain-types";

export async function getClaimerProofs(
    claimerAddress: string,
    claimCondition: IDropERC721.ClaimConditionStructOutput,
    merkleRootArray: Uint8Array,
    collectionUri: string,
    storage: ThirdwebStorage,
    sdk: ThirdwebSDK
): Promise<SnapshotEntryWithProof | null> {
    const merkleRoot = claimCondition.merkleRoot;
    if (merkleRootArray.length > 0) {
        const metadata = await storage.downloadJSON(collectionUri);
        return await fetchSnapshotEntryForAddress(
            claimerAddress,
            merkleRoot.toString(),
            metadata.merkle,
            sdk.getProvider(),
            storage,
            2,
        );
    } else {
        return null;
    }
}

export function prepareClaim(
    addressToClaim: string,
    quantity: number,
    activeClaimCondition: IClaimCondition.ClaimConditionStructOutput,
    snapshotEntry: SnapshotEntryWithProof
): ClaimVerification {
    let maxClaimable = BigNumber.from(0);
    let proofs = [utils.hexZeroPad([0], 32)];
    let priceInProof: BigNumber | undefined = snapshotEntry.price ? BigNumber.from(snapshotEntry.price) : undefined; // the price to send to the contract in claim proofs
    let currencyAddressInProof = snapshotEntry.currencyAddress;
    try {
        if (snapshotEntry) {
            proofs = snapshotEntry.proof;
            // override only if not default values (unlimited for quantity, zero addr for currency)
            maxClaimable =
                snapshotEntry.maxClaimable === "unlimited"
                    ? ethers.constants.MaxUint256
                    : BigNumber.from(snapshotEntry.maxClaimable);
            priceInProof =
                snapshotEntry.price === undefined ||
                snapshotEntry.price === "unlimited"
                    ? ethers.constants.MaxUint256
                    : ethers.utils.parseEther(snapshotEntry.price);
            currencyAddressInProof =
                snapshotEntry.currencyAddress || ethers.constants.AddressZero;
        }

    } catch (e) {
        // have to handle the valid error case that we *do* want to throw on
        if ((e as Error)?.message === "No claim found for this address") {
            throw e;
        }
        // other errors we wanna ignore and try to continue
        console.warn(
            "failed to check claim condition merkle root hash, continuing anyways",
            e,
        );
    }

    // the actual price to check allowance against
    // if proof price is unlimited, then we use the price from the claim condition
    // this mimics the contract behavior
    if (!priceInProof) {
        priceInProof = BigNumber.from(0)
    }
    const pricePerToken =
        priceInProof.toString() !== ethers.constants.MaxUint256.toString()
            ? priceInProof
            : activeClaimCondition.pricePerToken;
    // same for currency address
    if (!currencyAddressInProof) {
        currencyAddressInProof = ethers.constants.AddressZero
    }

    const currencyAddress =
        currencyAddressInProof !== ethers.constants.AddressZero
            ? currencyAddressInProof
            : activeClaimCondition.currency;

    return {
        overrides: {blockTag: undefined, from: addressToClaim},
        proofs,
        maxClaimable,
        price: pricePerToken,
        currencyAddress: currencyAddress,
        priceInProof,
        currencyAddressInProof,
    };
}