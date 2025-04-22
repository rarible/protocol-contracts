// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDropERC721 {
    /**
     *  @param proof Proof of concerned wallet's inclusion in an allowlist.
     *  @param quantityLimitPerWallet The total quantity of tokens the allowlisted wallet is eligible to claim over time.
     *  @param pricePerToken The price per token the allowlisted wallet must pay to claim tokens.
     *  @param currency The currency in which the allowlisted wallet must pay the price for claiming tokens.
     */
    struct AllowlistProof {
        bytes32[] proof;
        uint256 quantityLimitPerWallet;
        uint256 pricePerToken;
        address currency;
    }

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

    // Enums
    enum PlatformFeeType {
        Bps,
        Flat
    }

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
    function getPlatformFeeType() external view returns (PlatformFeeType);
    function getPlatformFeeInfo() external view returns (address, uint16);
    function getFlatPlatformFeeInfo() external view returns (address, uint256);

    // Specific claim condition methods
    function claimCondition() external view returns (uint256 currentStartId, uint256 count);
    function getClaimConditionById(uint256 _conditionId) external view returns (ClaimCondition memory condition);
    function getActiveClaimConditionId() external view returns (uint256);
    function getSupplyClaimedByWallet(uint256 _conditionId, address _claimer) external view returns (uint256);
    function verifyClaim(
        uint256 _conditionId,
        address _claimer,
        uint256 _quantity,
        address _currency,
        uint256 _pricePerToken,
        AllowlistProof calldata _allowlistProof
    ) external view returns (bool isOverride);
}
