// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.9.0;
pragma abicoder v2;

import "../../contracts//impl/RoyaltiesV1Impl.sol";

contract RoyaltiesV1TestImpl is RoyaltiesV1Impl {
    function saveRoyalties(uint256 id, LibPart.Part[] memory royalties) external {
        _saveRoyalties(id, royalties);
    }

    function updateAccount(uint256 id, address from, address to) external {
        _updateAccount(id, from, to);
    }
}
