// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "./ERC721Rarible.sol";
import "@openzeppelin/contracts/proxy/IBeacon.sol";
import "@openzeppelin/contracts/proxy/BeaconProxy.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev This contract is for creating proxy to access ERC721Rarible token.
 *
 * The beacon should be initialized before call ERC721RaribleFactory constructor.
 *
 */
contract ERC721RaribleFactory is Ownable {
    IBeacon public beacon;
    address transferProxy;
    address lazyTransferProxy;

    event Create721RaribleProxy(BeaconProxy proxy);
    event Create721RaribleUserProxy(BeaconProxy proxy);

    constructor(IBeacon _beacon, address _transferProxy, address _lazyTransferProxy) {
        beacon = _beacon;
        transferProxy = _transferProxy;
        lazyTransferProxy = _lazyTransferProxy;
    }

    function createPublicToken(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI) external {
        bytes memory data = abi.encodeWithSelector(ERC721Rarible(0).__ERC721Rarible_init.selector, _name, _symbol, baseURI, contractURI, transferProxy, lazyTransferProxy);
        BeaconProxy beaconProxy = new BeaconProxy(address(beacon), data);
        ERC721Rarible(address(beaconProxy)).transferOwnership(_msgSender());
        emit Create721RaribleProxy(beaconProxy);
    }

    function createPrivateToken(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address[] memory operators) external {
        bytes memory data = abi.encodeWithSelector(ERC721Rarible(0).__ERC721RaribleUser_init.selector, _name, _symbol, baseURI, contractURI, operators);
        BeaconProxy beaconProxy = new BeaconProxy(address(beacon), data);
        ERC721Rarible(address(beaconProxy)).transferOwnership(_msgSender());
        emit Create721RaribleUserProxy(beaconProxy);
    }
}
