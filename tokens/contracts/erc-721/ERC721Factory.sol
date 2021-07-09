// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "./ERC721RaribleUser.sol";
import "@openzeppelin/contracts/proxy/IBeacon.sol";
import "@openzeppelin/contracts/proxy/UpgradeableBeacon.sol";
import "@openzeppelin/contracts/proxy/BeaconProxy.sol";

contract ERC721Factory {

    IBeacon public beacon;
    address public beaconAddress;

    event CreateProxy(BeaconProxy proxy);

    constructor (IBeacon _beacon, address _beaconAddress) {
        beacon = _beacon;
        beaconAddress = _beaconAddress;
    }

    function createToken( string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address[] memory operators) external {
        BeaconProxy beaconProxy = new BeaconProxy(beaconAddress, "");
        ERC721RaribleUser(beacon.implementation()).__ERC721RaribleUser_init(_name, _symbol, baseURI, contractURI, operators);
        emit CreateProxy(beaconProxy);
    }
}
