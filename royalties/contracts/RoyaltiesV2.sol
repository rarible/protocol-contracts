// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "./LibFee.sol";

interface RoyaltiesV2 {
    event RoyaltiesSet(uint256 tokenId, LibFee.Fee[] fees);

    function getFees(uint256 id) external view returns (LibFee.Fee[] memory);
}
