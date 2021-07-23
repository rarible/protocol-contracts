// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "./AbstractRoyalties.sol";
import "../RoyaltiesV2.sol";

contract RoyaltiesV2Impl is AbstractRoyalties, RoyaltiesV2 {

    function getRaribleV2Royalties(uint256 id) override external view returns (LibPart.Part[] memory) {
        return _royalties[id];
    }

    function _onRoyaltiesSet(uint256 id, LibPart.Part[] memory royalties) override internal {
        emit RoyaltiesSet(id, royalties);
    }
}
