// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "./ERC1155Rarible.sol";
import "@openzeppelin/contracts/proxy/IBeacon.sol";
import "@openzeppelin/contracts/proxy/BeaconProxy.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev This contract is for creating proxy to access ERC1155Rarible token.
 *
 * The beacon should be initialized before call ERC1155RaribleFactory constructor.
 *
 */
contract ERC1155RaribleFactory is Ownable {
    IBeacon public beacon;

    event Create1155RaribleProxy(BeaconProxy proxy);

    constructor(IBeacon _beacon) {
        beacon = _beacon;
    }

    function createToken(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI) external {
        BeaconProxy beaconProxy = new BeaconProxy(address(beacon), "");
        ERC1155Rarible token = ERC1155Rarible(address(beaconProxy));
        token.__ERC1155Rarible_init(_name, _symbol, baseURI, contractURI);
        token.transferOwnership(_msgSender());
        emit Create1155RaribleProxy(beaconProxy);
    }
}
