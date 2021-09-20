// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "@rarible/royalties/contracts/IRoyaltiesProvider.sol";
import "./RoyaltyV2Legacy.sol";

contract RoyaltiesProviderV2Legacy is IRoyaltiesProvider {
    function getRoyalties(address token, uint tokenId) override external view returns(LibPart.Part[] memory) {
        return RoyaltyV2Legacy(token).getRoyalties(tokenId);
    }
}
