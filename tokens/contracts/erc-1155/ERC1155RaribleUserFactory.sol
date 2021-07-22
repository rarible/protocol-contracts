// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "./ERC1155RaribleUser.sol";
import "@openzeppelin/contracts/proxy/IBeacon.sol";
import "@openzeppelin/contracts/proxy/BeaconProxy.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev This contract is for creating proxy to access ERC1155UserRarible token.
 *
 * The beacon should be initialized before call ERC1155RaribleUserFactory constructor.
 *
 */
contract ERC1155RaribleUserFactory is Ownable {
    IBeacon public beacon;

    event Create1155RaribleUserProxy(BeaconProxy proxy);

    constructor(IBeacon _beacon) {
        beacon = _beacon;
    }

    function createToken(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address[] memory operators) external {
        BeaconProxy beaconProxy = new BeaconProxy(address(beacon), "");
        ERC1155RaribleUser token = ERC1155RaribleUser(address(beaconProxy));
        token.__ERC1155RaribleUser_init(_name, _symbol, baseURI, contractURI, operators);
        token.transferOwnership(_msgSender());
        emit Create1155RaribleUserProxy(beaconProxy);
    }
}
