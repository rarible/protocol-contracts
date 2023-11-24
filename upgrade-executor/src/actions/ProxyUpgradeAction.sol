// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

contract ProxyUpgradeAction {
    function perform(address admin, address payable target, address newLogic) public payable {
        ProxyAdmin(admin).upgrade(TransparentUpgradeableProxy(target), newLogic);
    }
}
