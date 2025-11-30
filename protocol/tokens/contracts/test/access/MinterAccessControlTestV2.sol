// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import "../../../contracts/access/MinterAccessControl.sol";

contract MinterAccessControlTestV2 is MinterAccessControl {
    bytes4 constant public V2 = bytes4(keccak256("V2"));

    function initialize(address initialOwner) external initializer {
        __Ownable_init_unchained(initialOwner);
        __MinterAccessControl_init_unchained();
    }

    function version() public view returns (bytes4) {
        return V2;
    }

    uint256[50] private __gap;
}
