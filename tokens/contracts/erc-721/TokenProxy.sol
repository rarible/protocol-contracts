// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/proxy/BeaconProxy.sol";

contract TokenProxy is BeaconProxy {

    constructor(address beacon, bytes memory data) BeaconProxy(beacon, data) {
    }

    function implementation() external returns (address) {
        return _implementation();
    }
}
