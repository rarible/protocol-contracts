// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "@rarible/exchange-interfaces/contracts/IRoyaltiesProvider.sol";
import "./RoyaltyArtBlocksV2.sol";

contract RoyaltiesProviderArtBlocksV2 is IRoyaltiesProvider {

    function getRoyalties(address token, uint tokenId) override external view returns(LibPart.Part[] memory) {
        RoyaltyArtBlocksV2 artBlocksV2 = RoyaltyArtBlocksV2(token);

        (address payable[] memory recipients, uint256[] memory bps) = artBlocksV2.getRoyalties(tokenId);
        
        uint256 len = recipients.length;

        LibPart.Part[] memory result = new LibPart.Part[](len);
        
        for (uint i = 0; i < len; i++) {
            result[i].account = recipients[i];
            result[i].value = uint96(bps[i]);
        }

        return result;
    }

}
