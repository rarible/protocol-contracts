// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.13;

import "@openzeppelin/contracts-sol08/proxy/transparent/ProxyAdmin.sol";

contract ProxyUpgradeAction {
    function perform(address admin, address payable target, address newLogic) public {
        ProxyAdmin(admin).upgrade(TransparentUpgradeableProxy(target), newLogic);
    }
}
