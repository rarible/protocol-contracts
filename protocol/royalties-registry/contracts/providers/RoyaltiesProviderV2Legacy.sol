// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import "@rarible/exchange-interfaces/contracts/IRoyaltiesProvider.sol";
import "./RoyaltyV2Legacy.sol";

contract RoyaltiesProviderV2Legacy is IRoyaltiesProvider {
    function getRoyalties(address token, uint tokenId) external view override returns (LibPart.Part[] memory) {
        return RoyaltyV2Legacy(token).getRoyalties(tokenId);
    }
}
