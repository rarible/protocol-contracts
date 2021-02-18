// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "./AbstractRoyalties.sol";
import "../RoyaltiesV2.sol";

contract RoyaltiesV2Impl is AbstractRoyalties, RoyaltiesV2 {
    function getFees(uint256 id) override external view returns (LibFee.Fee[] memory) {
        return fees[id];
    }

    function _onRoyaltiesSet(uint256 _id, LibFee.Fee[] memory _fees) override internal {
        emit RoyaltiesSet(_id, _fees);
    }
}
