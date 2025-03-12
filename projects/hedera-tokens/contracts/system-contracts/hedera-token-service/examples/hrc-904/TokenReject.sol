// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;

import {HederaResponseCodes} from "../../../HederaResponseCodes.sol";
import {HederaTokenService} from "../../HederaTokenService.sol";
import {IHederaTokenService} from "../../IHederaTokenService.sol";
pragma experimental ABIEncoderV2;

// @title Token Reject Contract
// @notice Facilitates rejection of both fungible and non-fungible tokens on the Hedera network
// @dev Implements token rejection functionality by building NFT structs and calling the rejectTokens system contract
//
// Allows accounts to reject:
// - Multiple fungible tokens in a single transaction
// - Multiple NFTs in a single transaction
// - Both fungible and non-fungible tokens together
contract TokenReject is HederaTokenService {

    // @notice Rejects multiple fungible and non-fungible tokens for an account
    // @dev Builds NFT ID structs and submits rejectTokens system contract call
    // @param rejectingAddress The address rejecting the tokens
    // @param ftAddresses Array of fungible token addresses to reject
    // @param nftAddresses Array of NFT token addresses to reject
    // @return responseCode The response code from the reject operation (22 = success)
    function rejectTokens(address rejectingAddress, address[] memory ftAddresses, address[] memory nftAddresses) public returns(int64 responseCode) {
        IHederaTokenService.NftID[] memory nftIDs = new IHederaTokenService.NftID[](nftAddresses.length);
        for (uint i; i < nftAddresses.length; i++) 
        {
            IHederaTokenService.NftID memory nftId;
            nftId.nft = nftAddresses[i];
            nftId.serial = 1;
            nftIDs[i] = nftId;
        }
        responseCode = rejectTokens(rejectingAddress, ftAddresses, nftIDs);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
        return responseCode;
    }
}
