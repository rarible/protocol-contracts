// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "../../../contracts/access/MinterAccessControl.sol";

contract MinterAccessControlTestV2 is MinterAccessControl {
    bytes4 constant public V2 = bytes4(keccak256("V2"));

    function initialize() external initializer {
        __Ownable_init_unchained();
        __MinterAccessControl_init_unchained();
    }

    function version() public view returns (bytes4) {
        return V2;
    }

    uint256[50] private __gap;
}
