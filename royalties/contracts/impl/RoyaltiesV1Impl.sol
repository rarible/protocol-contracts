// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;

import "./AbstractRoyalties.sol";
import "../RoyaltiesV1.sol";

contract RoyaltiesV1Impl is AbstractRoyalties, RoyaltiesV1 {

    function getFeeRecipients(uint256 id) public override view returns (address payable[] memory) {
        LibFee.Fee[] memory _fees = fees[id];
        address payable[] memory result = new address payable[](_fees.length);
        for (uint i = 0; i < _fees.length; i++) {
            result[i] = address(uint160(_fees[i].account));
        }
        return result;
    }

    function getFeeBps(uint256 id) public override view returns (uint[] memory) {
        LibFee.Fee[] memory _fees = fees[id];
        uint[] memory result = new uint[](_fees.length);
        for (uint i = 0; i < _fees.length; i++) {
            result[i] = _fees[i].value;
        }
        return result;
    }

    function _onRoyaltiesSet(uint256 _id, LibFee.Fee[] memory _fees) override internal {
        address[] memory recipients = new address[](_fees.length);
        uint[] memory bps = new uint[](_fees.length);
        for (uint i = 0; i < _fees.length; i++) {
            recipients[i] = _fees[i].account;
            bps[i] = _fees[i].value;
        }
        emit SecondarySaleFees(_id, recipients, bps);
    }
}
