// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDropERC721 {
    // This struct describes a single claim condition
    struct ClaimCondition {
        uint256 startTimestamp;
        uint256 maxClaimableSupply;
        uint256 supplyClaimed;
        uint256 quantityLimitPerWallet;
        bytes32 merkleRoot;
        uint256 pricePerToken;
        address currency;
        string metadata;
    }

    // Events
    event ClaimConditionsUpdated(
        ClaimCondition[] claimConditions,
        bool resetEligibility
    );
    event TokensClaimed(
        uint256 indexed claimConditionIndex,
        address indexed claimer,
        address indexed receiver,
        uint256 startTokenId,
        uint256 quantityClaimed
    );

    // View functions for global data
    function totalMinted() external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function maxTotalSupply() external view returns (uint256);
    function nextTokenIdToMint() external view returns (uint256);
    function nextTokenIdToClaim() external view returns (uint256);
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function contractURI() external view returns (string memory);
    function getBaseURICount() external view returns (uint256);
    function getDefaultRoyaltyInfo() external view returns (address, uint16);
    function getPlatformFeeInfo() external view returns (address, uint16);

    // Specific claim condition methods
    function claimCondition() external view returns (uint256 currentStartId, uint256 count);
    function getClaimConditionById(uint256 _conditionId) external view returns (ClaimCondition memory condition);
    function getActiveClaimConditionId() external view returns (uint256);
    function getSupplyClaimedByWallet(uint256 _conditionId, address _claimer) external view returns (uint256);
}
