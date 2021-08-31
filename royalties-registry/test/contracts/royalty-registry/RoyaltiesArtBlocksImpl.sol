// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "../../../contracts/providers/RoyaltyArtBlocks.sol";

contract RoyaltiesArtBlocksImpl is RoyaltyArtBlocks {
    struct Project {
        address artistAddress;
        address additionalPayee;
        uint256 additionalPayeePercentage;
        uint256 secondMarketRoyalty;
    }

    mapping(uint256 => Project) projects;

    function getRoyaltyData(uint256 _tokenId)
        external
        view
        override
        returns (
            address artistAddress,
            address additionalPayee,
            uint256 additionalPayeePercentage,
            uint256 royaltyFeeByID
        )
    {
        return (
            projects[_tokenId].artistAddress,
            projects[_tokenId].additionalPayee,
            projects[_tokenId].additionalPayeePercentage,
            projects[_tokenId].secondMarketRoyalty
        );
    }

    function updateProjectAdditionalPayeeInfo(
        uint256 _projectId,
        address payable _additionalPayee,
        uint256 _additionalPayeePercentage
    ) public {
        projects[_projectId].additionalPayee = _additionalPayee;
        projects[_projectId]
        .additionalPayeePercentage = _additionalPayeePercentage;
    }

    function updateProjectSecondaryMarketRoyaltyPercentage(
        uint256 _projectId,
        uint256 _secondMarketRoyalty
    ) public {
        projects[_projectId].secondMarketRoyalty = _secondMarketRoyalty;
    }
}
