// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "../../../contracts/access/MinterAccessControl.sol";

contract MinterAccessControlTestV1 is MinterAccessControl {

    function initialize() external initializer {
        __Ownable_init_unchained();
        __MinterAccessControl_init_unchained();
    }

    uint256[50] private __gap;
}
