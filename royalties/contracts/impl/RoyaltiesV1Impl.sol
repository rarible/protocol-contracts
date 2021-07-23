// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;

import "./AbstractRoyalties.sol";
import "../RoyaltiesV1.sol";

contract RoyaltiesV1Impl is AbstractRoyalties, RoyaltiesV1 {

    function getFeeRecipients(uint256 id) public override view returns (address payable[] memory) {
        LibPart.Part[] memory royalties = _royalties[id];
        address payable[] memory result = new address payable[](royalties.length);
        for (uint i = 0; i < royalties.length; i++) {
            result[i] = address(uint160(royalties[i].account));
        }
        return result;
    }

    function getFeeBps(uint256 id) public override view returns (uint[] memory) {
        LibPart.Part[] memory royalties = _royalties[id];
        uint[] memory result = new uint[](royalties.length);
        for (uint i = 0; i < royalties.length; i++) {
            result[i] = royalties[i].value;
        }
        return result;
    }

    function _onRoyaltiesSet(uint256 id, LibPart.Part[] memory royalties) override internal {
        address[] memory recipients = new address[](royalties.length);
        uint[] memory bps = new uint[](royalties.length);
        for (uint i = 0; i < royalties.length; i++) {
            recipients[i] = royalties[i].account;
            bps[i] = royalties[i].value;
        }
        emit SecondarySaleFees(id, recipients, bps);
    }
}
