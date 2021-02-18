// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "../../contracts/impl/SecondarySaleFeesV2Impl.sol";

contract FeesV2Impl is SecondarySaleFeesV2Impl {
    function saveFees(uint256 _id, LibFee.Fee[] memory _fees) external {
        _saveFees(_id, _fees);
    }

    function updateAccount(uint256 _id, address _from, address _to) external {
        _updateAccount(_id, _from, _to);
    }
}
