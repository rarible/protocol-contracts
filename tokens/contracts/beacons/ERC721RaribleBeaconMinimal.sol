pragma solidity ^0.7.0;

import "@openzeppelin/contracts/proxy/UpgradeableBeacon.sol";

contract ERC721RaribleBeaconMinimal is UpgradeableBeacon {
    constructor(address impl) UpgradeableBeacon(impl) {

    }
}
