// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "./AbstractSecondareSaleFees.sol";
import "../SecondarySaleFeesV2.sol";

contract SecondarySaleFeesV2Impl is AbstractSecondareSaleFees, SecondarySaleFeesV2 {
    function getFees(uint256 id) override external view returns (LibFee.Fee[] memory) {
        return fees[id];
    }

    function _onSecondarySaleFees(uint256 _id, LibFee.Fee[] memory _fees) override internal {
        emit SecondarySaleFees(_id, _fees);
    }
}
