// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "../../../contracts/access/MinterAccessControl.sol";

contract MinterAccessControlTest is MinterAccessControl {

    function version() public view returns (uint256) {
        return 2;
    }

}
