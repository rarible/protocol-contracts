pragma solidity 0.8.16;

import {TransparentUpgradeableProxy} from "@openzeppelin/contracts-sol08/proxy/transparent/TransparentUpgradeableProxy.sol";

import {ProxyAdmin} from "hardhat-deploy-immutable-proxy/solc_0.8/openzeppelin/proxy/transparent/ProxyAdmin.sol";

contract DefaultProxyAdmin is ProxyAdmin {
    constructor(address initialOwner) ProxyAdmin(initialOwner) {}
}