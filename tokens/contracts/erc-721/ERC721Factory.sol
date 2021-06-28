// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "./ERC721Base.sol";
import "@openzeppelin/contracts/proxy/UpgradeableBeacon.sol";
import "@openzeppelin/contracts/proxy/BeaconProxy.sol";

contract ERC721Factory {
    BeaconProxy public proxy;
    UpgradeableBeacon public beacon;

    event CreateERC721Proxy(address proxy);

    function craeate(address implenmentation) external {

        emit CreateERC721Proxy(proxy);
    }

}
