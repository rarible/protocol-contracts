// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "../../contracts/impl/RoyaltiesV1Impl.sol";

contract RoyaltiesV1TestImpl is RoyaltiesV1Impl {
    function saveFees(uint256 _id, LibPart.Part[] memory _fees) external {
        _saveFees(_id, _fees);
    }

    function updateAccount(uint256 _id, address _from, address _to) external {
        _updateAccount(_id, _from, _to);
    }
}
