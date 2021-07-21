// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "./ERC721RaribleUser.sol";
import "@openzeppelin/contracts/proxy/IBeacon.sol";
import "@openzeppelin/contracts/proxy/BeaconProxy.sol";
import "@rarible/lazy-mint/contracts/erc-721/LibERC721LazyMint.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC721Factory is Ownable{

    IBeacon public beacon;

    event CreateProxy(BeaconProxy proxy);

    constructor(IBeacon _beacon) {
        beacon = _beacon;
    }

    function createToken(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address[] memory operators) external {
        BeaconProxy beaconProxy = new BeaconProxy(address(beacon), "");
        ERC721RaribleUser token = ERC721RaribleUser(address(beaconProxy));
        token.__ERC721RaribleUser_init(_name, _symbol, baseURI, contractURI, operators);
        token.transferOwnership(msg.sender);
        emit CreateProxy(beaconProxy);
    }
}
