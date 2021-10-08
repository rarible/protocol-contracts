// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "./ERC721RaribleUserMinimal.sol";
import "@openzeppelin/contracts/proxy/IBeacon.sol";
import "@openzeppelin/contracts/proxy/BeaconProxy.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev This contract is for creating proxy to access ERC721RaribleUser token.
 *
 * The beacon should be initialized before call ERC721RaribleUserFactory constructor.
 *
 */
contract ERC721RaribleUserFactoryMinimal is Ownable {
    IBeacon public beacon;

    event Create721RaribleUserProxy(BeaconProxy proxy);

    constructor(IBeacon _beacon) {
        beacon = _beacon;
    }

    function createToken(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address[] memory operators) external {
        bytes memory data = abi.encodeWithSelector(ERC721RaribleUserMinimal(0).__ERC721RaribleUser_init.selector, _name, _symbol, baseURI, contractURI, operators);
        BeaconProxy beaconProxy = new BeaconProxy(address(beacon), data);
        ERC721RaribleUserMinimal token = ERC721RaribleUserMinimal(address(beaconProxy));
        token.transferOwnership(_msgSender());
        emit Create721RaribleUserProxy(beaconProxy);
    }
}
