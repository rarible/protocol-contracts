// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "../../../contracts/access/MinterAccessControl.sol";

contract MinterAccessControlTestV2 is MinterAccessControl {

    function initialize() external initializer {
        __Ownable_init_unchained();
        __MinterAccessControl_init_unchained();
    }

    function version() public view returns (uint256) {
        return 2;
    }

    uint256[50] private __gap;
}
