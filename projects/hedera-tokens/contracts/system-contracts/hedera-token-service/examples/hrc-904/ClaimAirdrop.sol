// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;

import {HederaResponseCodes} from "../../../HederaResponseCodes.sol";
import {HederaTokenService} from "../../HederaTokenService.sol";
import {IHederaTokenService} from "../../IHederaTokenService.sol";
pragma experimental ABIEncoderV2;

// @title Claim Airdrop Contract
// @notice Facilitates claiming of pending token airdrops on the Hedera network
// @dev Implements HRC-904 standard for claiming pending airdrops
//
// Pending airdrops can be claimed in these cases:
// - When receiver has "receiver signature required" enabled
// - When receiver has no available auto-association slots
// - After the sender has airdropped tokens but before they are cancelled
contract ClaimAirdrop is HederaTokenService {
    
    // @notice Claims a pending fungible token airdrop sent to the caller
    // @dev Builds pending airdrop struct and submits claimAirdrops system contract call
    // @param sender The address that sent the tokens
    // @param receiver The address claiming the tokens
    // @param token The token address of the pending airdrop
    // @return responseCode The response code from the claim operation (22 = success)
    function claim(address sender, address receiver, address token) public returns(int64 responseCode){
        IHederaTokenService.PendingAirdrop[] memory pendingAirdrops = new IHederaTokenService.PendingAirdrop[](1);

        IHederaTokenService.PendingAirdrop memory pendingAirdrop;
        pendingAirdrop.sender = sender;
        pendingAirdrop.receiver = receiver;
        pendingAirdrop.token = token;

        pendingAirdrops[0] = pendingAirdrop;

        responseCode = claimAirdrops(pendingAirdrops);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
        return responseCode;
    }

    // @notice Claims a pending non-fungible token airdrop sent to the caller
    // @dev Builds pending NFT airdrop struct and submits claimAirdrops system contract call
    // @param sender The address that sent the NFT
    // @param receiver The address claiming the NFT
    // @param token The NFT token address
    // @param serial The serial number of the NFT
    // @return responseCode The response code from the claim operation (22 = success)
    function claimNFTAirdrop(address sender, address receiver, address token, int64 serial) public returns(int64 responseCode){
        IHederaTokenService.PendingAirdrop[] memory pendingAirdrops = new IHederaTokenService.PendingAirdrop[](1);

        IHederaTokenService.PendingAirdrop memory pendingAirdrop;
        pendingAirdrop.sender = sender;
        pendingAirdrop.receiver = receiver;
        pendingAirdrop.token = token;
        pendingAirdrop.serial = serial;

        pendingAirdrops[0] = pendingAirdrop;

        responseCode = claimAirdrops(pendingAirdrops);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
        return responseCode;
    }

    // @notice Claims multiple pending airdrops in a single transaction
    // @dev Builds array of pending airdrop structs and submits batch claimAirdrops call
    // @param senders Array of addresses that sent the tokens/NFTs
    // @param receivers Array of addresses claiming the tokens/NFTs
    // @param tokens Array of token addresses for the pending airdrops
    // @param serials Array of serial numbers for NFT airdrops (use 0 for fungible tokens)
    // @return responseCode The response code from the batch claim operation (22 = success)
    function claimMultipleAirdrops(address[] memory senders, address[] memory receivers, address[] memory tokens, int64[] memory serials) public returns (int64 responseCode) {
        uint length = senders.length;
        IHederaTokenService.PendingAirdrop[] memory pendingAirdrops = new IHederaTokenService.PendingAirdrop[](length);
        for (uint i = 0; i < length; i++) {
            IHederaTokenService.PendingAirdrop memory pendingAirdrop;
            pendingAirdrop.sender = senders[i];
            pendingAirdrop.receiver = receivers[i];
            pendingAirdrop.token = tokens[i];
            pendingAirdrop.serial = serials[i];

            pendingAirdrops[i] = pendingAirdrop;
        }

        responseCode = claimAirdrops(pendingAirdrops);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
        return responseCode;
    }
}
