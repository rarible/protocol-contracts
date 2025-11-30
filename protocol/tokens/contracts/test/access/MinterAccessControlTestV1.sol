// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import "../../../contracts/access/MinterAccessControl.sol";

contract MinterAccessControlTestV1 is MinterAccessControl {

    function initialize(address initialOwner) external initializer {
        __Ownable_init_unchained(initialOwner);
        __MinterAccessControl_init_unchained();
    }

    uint256[50] private __gap;
}
