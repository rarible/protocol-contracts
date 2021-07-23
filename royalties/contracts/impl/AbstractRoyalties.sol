// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;

import "../LibPart.sol";

abstract contract AbstractRoyalties {
    mapping (uint256 => LibPart.Part[]) internal _royalties;

    function _saveRoyalties(uint256 id, LibPart.Part[] memory royalties) internal {
        uint256 totalValue;
        for (uint i = 0; i < royalties.length; i++) {
            require(royalties[i].account != address(0x0), "Recipient should be present");
            require(royalties[i].value != 0, "Royalty value should be positive");
            totalValue += royalties[i].value;
            _royalties[id].push(royalties[i]);
        }
        require(totalValue < 10000, "Royalty total value should be < 10000");
        _onRoyaltiesSet(id, royalties);
    }

    function _updateAccount(uint256 _id, address _from, address _to) internal {
        uint length = _royalties[_id].length;
        for(uint i = 0; i < length; i++) {
            if (_royalties[_id][i].account == _from) {
                _royalties[_id][i].account = address(uint160(_to));
            }
        }
    }

    function _onRoyaltiesSet(uint256 id, LibPart.Part[] memory royalties) virtual internal;
}
