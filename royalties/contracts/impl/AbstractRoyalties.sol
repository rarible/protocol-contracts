// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;

import "../LibFee.sol";

abstract contract AbstractRoyalties {
    mapping (uint256 => LibFee.Fee[]) public fees;

    function _saveFees(uint256 _id, LibFee.Fee[] memory _fees) internal {
        for (uint i = 0; i < _fees.length; i++) {
            require(_fees[i].account != address(0x0), "Recipient should be present");
            require(_fees[i].value != 0, "Fee value should be positive");
            fees[_id].push(_fees[i]);
        }
    }

    function _updateAccount(uint256 _id, address _from, address _to) internal {
        uint length = fees[_id].length;
        for(uint i = 0; i < length; i++) {
            if (fees[_id][i].account == _from) {
                fees[_id][i].account = address(uint160(_to));
            }
        }
    }

    function _onRoyaltiesSet(uint256 _id, LibFee.Fee[] memory _fees) virtual internal;
}
