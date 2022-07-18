// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.9.0;
pragma abicoder v2;

import "@rarible/exchange-interfaces/contracts/IRoyaltiesProvider.sol";
import "./RoyaltyV2Legacy.sol";

contract RoyaltiesProviderV2Legacy is IRoyaltiesProvider {
    function getRoyalties(address token, uint tokenId) override external view returns(LibPart.Part[] memory) {
        return RoyaltyV2Legacy(token).getRoyalties(tokenId);
    }
}
