// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "../../../contracts/providers/RoyaltyV2Legacy.sol";

contract RoyaltiesV2LegacyImpl is RoyaltyV2Legacy {

    mapping (uint256 => LibPart.Part[]) internal royalties;

    function _saveRoyalties(uint256 id, LibPart.Part[] memory _royalties) public {
        uint256 totalValue;
        for (uint i = 0; i < _royalties.length; ++i) {
            require(_royalties[i].account != address(0x0), "Recipient should be present");
            require(_royalties[i].value != 0, "Royalty value should be positive");
            totalValue += _royalties[i].value;
            royalties[id].push(_royalties[i]);
        }
        require(totalValue < 10000, "Royalty total value should be < 10000");
        _onRoyaltiesSet(id, _royalties);
    }

    function _updateAccount(uint256 _id, address _from, address _to) internal {
        uint length = royalties[_id].length;
        for(uint i = 0; i < length; ++i) {
            if (royalties[_id][i].account == _from) {
                royalties[_id][i].account = address(uint160(_to));
            }
        }
    }

    function getRoyalties(uint256 id) override external view returns (LibPart.Part[] memory) {
        return royalties[id];
    }

    function _onRoyaltiesSet(uint256 id, LibPart.Part[] memory _royalties) internal {
        emit RoyaltiesSet(id, _royalties);
    }
}
