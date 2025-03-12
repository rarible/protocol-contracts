// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.4.9 <0.9.0;

/**
 * notice: This interface is applicable when msg.sender is an EOA or a contract and the target address is an HTS token.
 */
interface IHRC904TokenFacade {
    /// @notice Cancels a pending fungible token airdrop to a specific receiver
    /// @notice Responsible service: HTS
    /// @param receiverAddress The address of the receiver whose airdrop should be cancelled
    /// @return responseCode The response code indicating the result of the operation
    function cancelAirdropFT(address receiverAddress) external returns (int64 responseCode);

    /// @notice Cancels a pending non-fungible token airdrop to a specific receiver
    /// @notice Responsible service: HTS
    /// @param receiverAddress The address of the receiver whose airdrop should be cancelled
    /// @param serialNumber The serial number of the NFT to cancel
    /// @return responseCode The response code indicating the result of the operation
    function cancelAirdropNFT(address receiverAddress, int64 serialNumber) external returns (int64 responseCode);

    /// @notice Claims a pending fungible token airdrop from a specific sender
    /// @notice Responsible service: HTS
    /// @param senderAddress The address of the sender whose airdrop should be claimed
    /// @return responseCode The response code indicating the result of the operation
    function claimAirdropFT(address senderAddress) external returns (int64 responseCode);

    /// @notice Claims a pending non-fungible token airdrop from a specific sender
    /// @notice Responsible service: HTS
    /// @param senderAddress The address of the sender whose airdrop should be claimed
    /// @param serialNumber The serial number of the NFT to claim
    /// @return responseCode The response code indicating the result of the operation
    function claimAirdropNFT(address senderAddress, int64 serialNumber) external returns (int64 responseCode);

    /// @notice Rejects all pending fungible token airdrops
    /// @notice Responsible service: HTS
    /// @return responseCode The response code indicating the result of the operation
    function rejectTokenFT() external returns (int64 responseCode);

    /// @notice Rejects pending non-fungible token airdrops for specific serial numbers
    /// @notice Responsible service: HTS
    /// @param serialNumbers Array of NFT serial numbers to reject
    /// @return responseCode The response code indicating the result of the operation
    function rejectTokenNFTs(int64[] memory serialNumbers) external returns (int64 responseCode);
}