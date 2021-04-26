// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "./impl/RoyaltiesV2Impl.sol";

contract RoyaltiesV2TestImpl is RoyaltiesV2Impl {

    function saveRoyalties(uint256 _id, LibPart.Part[] memory _royalties) external {
        _saveRoyalties(_id, _royalties);
    }

    function updateAccount(uint256 _id, address _from, address _to) external {
        _updateAccount(_id, _from, _to);
    }
}
