// SPDX-License-Identifier: MIT
// https://etherscan.io/address/0xd22CD47808ae4b13D46Fa8FEFc08C91eb5790Bf8#code
pragma solidity ^0.8.16;

interface IProxyUpgradeAction {
    function perform(address admin, address payable target, address newLogic) external;
}