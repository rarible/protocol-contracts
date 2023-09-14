// SPDX-License-Identifier: MIT

pragma solidity ^0.7.6;
pragma abicoder v2;

import "../../../contracts/erc-1155/ERC1155Rarible.sol";

contract ERC1155RaribleTest is ERC1155Rarible {

    address OFR;
    function setOFR(address _OFR) external {
        OFR = _OFR;
    }

    function OPERATOR_FILTER_REGISTRY() public view override returns(address) {
        return OFR;
    }
}
