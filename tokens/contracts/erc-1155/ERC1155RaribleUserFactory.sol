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
        bytes memory data = abi.encodeWithSelector(ERC1155RaribleUser(0).__ERC1155RaribleUser_init.selector, _name, _symbol, baseURI, contractURI, operators);
        BeaconProxy beaconProxy = new BeaconProxy(address(beacon), data);
        ERC1155RaribleUser token = ERC1155RaribleUser(address(beaconProxy));
        token.transferOwnership(_msgSender());
        emit Create1155RaribleUserProxy(beaconProxy);
    }
}
