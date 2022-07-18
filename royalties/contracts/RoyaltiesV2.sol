// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.9.0;
pragma abicoder v2;

import "@rarible/lib-part/contracts/LibPart.sol";

interface RoyaltiesV2 {
    event RoyaltiesSet(uint256 tokenId, LibPart.Part[] royalties);

    function getRaribleV2Royalties(uint256 id) external view returns (LibPart.Part[] memory);
}
