/**
 * For any claim conditions that a particular wallet is violating,
 * this function returns human readable information about the
 * breaks in the condition that can be used to inform the user.
 *
 * @param quantity - The desired quantity that would be claimed.
 * @param addressToCheck - The wallet address, defaults to the connected wallet.
 *
 */
import {
    ClaimEligibility,
    includesErrorMessage,
    SnapshotEntryWithProof,
    ThirdwebSDK
} from "@thirdweb-dev/sdk";
import {BigNumber, ethers, utils} from "ethers";
import {DropERC721, DropERC721Reader} from "../typechain-types";
import {IClaimCondition} from "../typechain-types/contracts/drop-reader/DropERC721Reader";
import {ThirdwebStorage} from "@thirdweb-dev/storage";
import {getClaimerProofs, prepareClaim} from "./utils";

export async function getClaimIneligibilityReasons(
    erc721Reader: DropERC721Reader,
    erc721: DropERC721,
    quantity: number,
    storage: ThirdwebStorage,
    sdk: ThirdwebSDK,
    addressToCheck?: string,
): Promise<ClaimEligibility | null> {
    let activeConditionIndex: BigNumber;

    // If we have been unable to get a signer address, we can't check eligibility, so return a NoWallet error reason
    if (!addressToCheck) {
        return ClaimEligibility.NoWallet;
    }

    try {
        // Fetch eligibility data for the given address
        const eligibilityData = await erc721Reader.getAllData(erc721.address, addressToCheck);

        // If no claim conditions are set, return NoClaimConditionSet
        if (eligibilityData.conditions.length === 0) {
            return ClaimEligibility.NoClaimConditionSet;
        }

        activeConditionIndex = eligibilityData.activeClaimConditionIndex;
        const claimCondition = eligibilityData.conditions[activeConditionIndex.toNumber()] as IClaimCondition.ClaimConditionStructOutput;

        // Check if the claim phase has not started yet
        if (claimCondition.startTimestamp.gt(eligibilityData.globalData.blockTimeStamp)) {
            return ClaimEligibility.ClaimPhaseNotStarted;
        }

        // Check if there is not enough supply remaining
        if (claimCondition.maxClaimableSupply.sub(claimCondition.supplyClaimed).lt(quantity)) {
            return ClaimEligibility.NotEnoughSupply;
        }

        // Check if minting more tokens would exceed the total supply
        if (eligibilityData.globalData.totalMinted.add(quantity).gt(eligibilityData.globalData.nextTokenIdToMint)) {
            return ClaimEligibility.NotEnoughSupply;
        }

        // Check for merkle root inclusion
        const merkleRootArray = utils.stripZeros(claimCondition.merkleRoot);
        const hasAllowList = merkleRootArray.length > 0;
        let allowListEntry: SnapshotEntryWithProof | null = null;

        if (hasAllowList) {
            // Fetch claimer proofs for the address
            allowListEntry = await getClaimerProofs(
                addressToCheck,
                claimCondition,
                merkleRootArray,
                eligibilityData.globalData.contractURI,
                storage,
                sdk,
            );

            if (!allowListEntry) {
                return ClaimEligibility.AddressNotAllowed;
            }

            // Check if the quantity claimed exceeds the maximum allowed per wallet
            if (claimCondition.quantityLimitPerWallet.gt(0) &&
                BigNumber.from(allowListEntry.maxClaimable).lt(eligibilityData.globalData.claimedByUser.add(quantity))) {
                return ClaimEligibility.OverMaxClaimablePerWallet;
            }

            if (allowListEntry) {
                try {
                    // Verify the claim
                    const claimVerification = prepareClaim(addressToCheck, quantity, claimCondition, allowListEntry);

                    await erc721.verifyClaim(
                        activeConditionIndex,
                        addressToCheck,
                        quantity,
                        claimCondition.currency,
                        claimCondition.pricePerToken,
                        {
                            proof: claimVerification.proofs,
                            quantityLimitPerWallet: claimVerification.maxClaimable,
                            currency: claimVerification.currencyAddressInProof,
                            pricePerToken: claimVerification.priceInProof,
                        },
                    );
                } catch (e: any) {
                    console.warn("Merkle proof verification failed:", "reason" in e ? e.reason : e);
                    const reason = (e as any).reason;

                    switch (reason) {
                        case "!Qty":
                            return ClaimEligibility.OverMaxClaimablePerWallet;
                        case "!PriceOrCurrency":
                            return ClaimEligibility.WrongPriceOrCurrency;
                        case "!MaxSupply":
                            return ClaimEligibility.NotEnoughSupply;
                        case "cant claim yet":
                            return ClaimEligibility.ClaimPhaseNotStarted;
                        default: {
                            return ClaimEligibility.AddressNotAllowed;
                        }
                    }
                }
            }
        } else {
            // Public phase without an allow list

            // Check if the quantity claimed exceeds the maximum allowed per wallet
            if (claimCondition.quantityLimitPerWallet.lt(quantity)) {
                return ClaimEligibility.OverMaxClaimablePerWallet;
            }

            // Check if the claim has a price per token and the user has enough tokens
            if (claimCondition.pricePerToken.gt(0)) {
                const totalPrice = claimCondition.pricePerToken.mul(quantity);
                if (eligibilityData.globalData.userBalance.lt(totalPrice)) {
                    return ClaimEligibility.NotEnoughTokens;
                }
            }
        }
    } catch (err: any) {
        if (includesErrorMessage(err, "!CONDITION") || includesErrorMessage(err, "no active mint condition")) {
            return ClaimEligibility.NoClaimConditionSet;
        }
        console.warn("Failed to get active claim condition", err);
        return ClaimEligibility.Unknown;
    }

    return null;
}
