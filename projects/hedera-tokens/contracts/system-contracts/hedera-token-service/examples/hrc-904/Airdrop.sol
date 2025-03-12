// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;

import {HederaResponseCodes} from "../../../HederaResponseCodes.sol";
import {HederaTokenService} from "../../HederaTokenService.sol";
import {IHederaTokenService} from "../../IHederaTokenService.sol";
pragma experimental ABIEncoderV2;

// @title Airdrop Contract
// @notice Facilitates token airdrops for both fungible and non-fungible tokens
// @dev Implements HRC-904 standard for token airdrops
//
// Recipients will receive tokens in one of these ways:
// - Immediately if already associated with the token
// - Immediately with auto-association if they have available slots
// - As a pending airdrop requiring claim if they have "receiver signature required"
// - As a pending airdrop requiring claim if they have no available auto-association slots
//
// All transfer fees and auto-renewal rent costs are charged to the transaction submitter
contract Airdrop is HederaTokenService {
    // @notice Airdrops a fungible token from a sender to a single receiver
    // @dev Builds airdrop struct and submits airdropTokens system contract call
    // @param token The token address to airdrop
    // @param sender The address sending the tokens
    // @param receiver The address receiving the tokens
    // @param amount The amount of tokens to transfer
    // @return responseCode The response code from the airdrop operation (22 = success)
    function tokenAirdrop(address token, address sender, address receiver, int64 amount) public payable returns (int64 responseCode) {
        IHederaTokenService.TokenTransferList[] memory tokenTransfers = new IHederaTokenService.TokenTransferList[](1);
        IHederaTokenService.TokenTransferList memory airdrop;

        airdrop.token = token;
        airdrop.transfers = createAccountTransferPair(sender, receiver, amount);
        tokenTransfers[0] = airdrop;
        responseCode = airdropTokens(tokenTransfers);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
        return responseCode;
    }

    // @notice Airdrops a non-fungible token from a sender to a single receiver
    // @dev Builds NFT airdrop struct and submits airdropTokens system contract call
    // @param token The NFT token address
    // @param sender The address sending the NFT
    // @param receiver The address receiving the NFT
    // @param serial The serial number of the NFT to transfer
    // @return responseCode The response code from the airdrop operation (22 = success)
    function nftAirdrop(address token, address sender, address receiver, int64 serial) public payable returns (int64 responseCode) {
        IHederaTokenService.TokenTransferList[] memory tokenTransfers = new IHederaTokenService.TokenTransferList[](1);
        IHederaTokenService.TokenTransferList memory airdrop;

        airdrop.token = token;
        IHederaTokenService.NftTransfer memory nftTransfer = prepareNftTransfer(sender, receiver, serial);
        IHederaTokenService.NftTransfer[] memory nftTransfers = new IHederaTokenService.NftTransfer[](1);
        nftTransfers[0] = nftTransfer;
        airdrop.nftTransfers = nftTransfers;
        tokenTransfers[0] = airdrop;
        responseCode = airdropTokens(tokenTransfers);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
        return responseCode;
    }

    // @notice Airdrops multiple fungible tokens of the same amount from a sender to a single receiver
    // @dev Builds multiple token transfer structs and submits a single airdropTokens system contract call
    // @param tokens Array of token addresses to airdrop
    // @param sender The address sending all tokens
    // @param receiver The address receiving all tokens
    // @param amount The amount of each token to transfer
    // @return responseCode The response code from the airdrop operation (22 = success)
    function multipleFtAirdrop(address[] memory tokens, address sender, address receiver, int64 amount) public payable returns (int64 responseCode) {
        uint256 length = tokens.length;
        IHederaTokenService.TokenTransferList[] memory tokenTransfers = new IHederaTokenService.TokenTransferList[](length);
        for (uint256 i = 0; i < length; i++)
        {
            IHederaTokenService.TokenTransferList memory airdrop;
            airdrop.token = tokens[i];
            airdrop.transfers = createAccountTransferPair(sender, receiver, amount);
            tokenTransfers[i] = airdrop;
        }
        responseCode = airdropTokens(tokenTransfers);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
        return responseCode;
    }

    // @notice Airdrops multiple NFTs from a sender to a single receiver
    // @dev Builds multiple NFT transfer structs and submits a single airdropTokens system contract call
    // @param nfts Array of NFT token addresses
    // @param sender The address sending all NFTs
    // @param receiver The address receiving all NFTs
    // @param serials Array of serial numbers corresponding to each NFT
    // @return responseCode The response code from the airdrop operation (22 = success)
    function multipleNftAirdrop(address[] memory nfts, address sender, address receiver, int64[] memory serials) public returns (int64 responseCode) {
        uint256 length = nfts.length;
        IHederaTokenService.TokenTransferList[] memory tokenTransfers = new IHederaTokenService.TokenTransferList[](length);
        for (uint256 i = 0; i < length; i++)
        {
            IHederaTokenService.TokenTransferList memory airdrop;
            airdrop.token = nfts[i];
            IHederaTokenService.NftTransfer[] memory nftTransfers = new IHederaTokenService.NftTransfer[](1);
            nftTransfers[0] = prepareNftTransfer(sender, receiver, serials[i]);
            airdrop.nftTransfers = nftTransfers;
            tokenTransfers[i] = airdrop;
        }
        responseCode = airdropTokens(tokenTransfers);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
        return responseCode;
    }

    // @notice Distributes the same amount of a fungible token from one sender to multiple receivers
    // @dev Optimizes gas by building a single transfer list with multiple receivers
    // @param token The token address to distribute
    // @param sender The address sending the tokens
    // @param receivers Array of addresses to receive the tokens
    // @param amount The amount each receiver should get
    // @return responseCode The response code from the airdrop operation (22 = success)
    function tokenAirdropDistribute(
        address token,
        address sender,
        address[] memory receivers,
        int64 amount
    ) public payable returns (int64 responseCode) {
        uint256 length = receivers.length + 1;

        IHederaTokenService.TokenTransferList[] memory tokenTransfers = new IHederaTokenService.TokenTransferList[](1);
        IHederaTokenService.TokenTransferList memory airdrop;
        airdrop.token = token;

        IHederaTokenService.AccountAmount memory senderAA;
        senderAA.accountID = sender;

        int64 totalAmount = 0;
        for (uint i = 0; i < receivers.length; i++) {
            totalAmount += amount;
        }
        senderAA.amount = -totalAmount;

        IHederaTokenService.AccountAmount[] memory transfers = new IHederaTokenService.AccountAmount[](length);
        transfers[0] = senderAA;

        for (uint i = 1; i < length; i++) {
            IHederaTokenService.AccountAmount memory receiverAA;
            receiverAA.accountID = receivers[i - 1];
            receiverAA.amount = amount;
            transfers[i] = receiverAA;
        }

        airdrop.transfers = transfers;
        tokenTransfers[0] = airdrop;

        responseCode = airdropTokens(tokenTransfers);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }

        return responseCode;
    }

    // @notice Distributes sequential NFTs from one sender to multiple receivers
    // @dev Assigns sequential serial numbers starting from 1 to each receiver
    // @param token The NFT token address
    // @param sender The address sending the NFTs
    // @param receivers Array of addresses to receive the NFTs
    // @param serials Array of serial numbers to assign to each receiver
    // @return responseCode The response code from the airdrop operation (22 = success)
    function nftAirdropDistribute(address token, address sender, address[] memory receivers, int64[] memory serials) public payable returns (int64 responseCode) {
        uint256 length = receivers.length;
        IHederaTokenService.TokenTransferList[] memory tokenTransfers = new IHederaTokenService.TokenTransferList[](1);
        IHederaTokenService.TokenTransferList memory airdrop;
        airdrop.token = token;
        IHederaTokenService.NftTransfer[] memory nftTransfers = new IHederaTokenService.NftTransfer[](length);
        for (uint i = 0; i < length; i++) {
            nftTransfers[i] = prepareNftTransfer(sender, receivers[i], serials[i]);
        }
        airdrop.nftTransfers = nftTransfers;
        tokenTransfers[0] = airdrop;

        responseCode = airdropTokens(tokenTransfers);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
        return responseCode;
    }

    // @notice Performs a mixed airdrop of both fungible and non-fungible tokens
    // @dev Combines multiple token types into a single airdropTokens call for gas efficiency
    // @param token Array of fungible token addresses
    // @param nft Array of NFT token addresses
    // @param tokenSenders Array of addresses sending the fungible tokens
    // @param tokenReceivers Array of addresses receiving the fungible tokens
    // @param nftSenders Array of addresses sending the NFTs
    // @param nftReceivers Array of addresses receiving the NFTs
    // @param tokenAmount Amount of each fungible token to transfer
    // @param serials Array of serial numbers for the NFTs
    // @return responseCode The response code from the airdrop operation (22 = success)
    function mixedAirdrop(address[] memory token, address[] memory nft, address[] memory tokenSenders, address[] memory tokenReceivers, address[] memory nftSenders, address[] memory nftReceivers, int64 tokenAmount, int64[] memory serials) public payable returns (int64 responseCode) {
        uint256 length = tokenSenders.length + nftSenders.length;
        IHederaTokenService.TokenTransferList[] memory tokenTransfers = new IHederaTokenService.TokenTransferList[](length);
        for (uint i = 0; i < tokenSenders.length; i++)
        {
            IHederaTokenService.TokenTransferList memory airdrop;
            airdrop.token = token[i];
            airdrop.transfers = createAccountTransferPair(tokenSenders[i], tokenReceivers[i], tokenAmount);
            tokenTransfers[i] = airdrop;
        }
        uint nftIndex = tokenSenders.length;
        for (uint v = 0; nftIndex < length; v++)
        {
            IHederaTokenService.TokenTransferList memory airdrop;
            airdrop.token = nft[v];
            IHederaTokenService.NftTransfer[] memory nftTransfers = new IHederaTokenService.NftTransfer[](1);
            nftTransfers[0] = prepareNftTransfer(nftSenders[v], nftReceivers[v], serials[v]);
            airdrop.nftTransfers = nftTransfers;
            tokenTransfers[nftIndex] = airdrop;
            nftIndex++;
        }
        responseCode = airdropTokens(tokenTransfers);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
        return responseCode;
    }

    // @notice Internal helper to prepare AccountAmount array for token transfers
    // @dev Creates a transfer pair with negative amount for sender and positive for receiver
    // @param sender The address sending tokens
    // @param receiver The address receiving tokens
    // @param amount The amount to transfer
    // @return transfers Array containing the sender and receiver transfer details
    function createAccountTransferPair(address sender, address receiver, int64 amount) internal pure returns (IHederaTokenService.AccountAmount[] memory transfers) {
        IHederaTokenService.AccountAmount memory aa1;
        aa1.accountID = sender;
        aa1.amount = -amount;
        IHederaTokenService.AccountAmount memory aa2;
        aa2.accountID = receiver;
        aa2.amount = amount;
        transfers = new IHederaTokenService.AccountAmount[](2);
        transfers[0] = aa1;
        transfers[1] = aa2;
        return transfers;
    }

    // @notice Internal helper to prepare NFT transfer struct
    // @dev Sets up sender, receiver and serial number for an NFT transfer
    // @param sender The address sending the NFT
    // @param receiver The address receiving the NFT
    // @param serial The serial number of the NFT
    // @return nftTransfer The prepared NFT transfer struct
    function prepareNftTransfer(address sender, address receiver, int64 serial) internal pure returns (IHederaTokenService.NftTransfer memory nftTransfer) {
        nftTransfer.senderAccountID = sender;
        nftTransfer.receiverAccountID = receiver;
        nftTransfer.serialNumber = serial;
        return nftTransfer;
    }
}
