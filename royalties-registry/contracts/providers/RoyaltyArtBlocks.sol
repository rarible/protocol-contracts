// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "@rarible/lib-part/contracts/LibPart.sol";

abstract contract RoyaltyArtBlocks {
    
    function getRoyaltyData(uint256 _tokenId) external virtual view returns (address artistAddress, address additionalPayee, uint256 additionalPayeePercentage, uint256 royaltyFeeByID);

}
