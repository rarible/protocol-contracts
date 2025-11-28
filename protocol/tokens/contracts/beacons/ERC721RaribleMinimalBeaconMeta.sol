// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
contract ERC721RaribleMinimalBeaconMeta is UpgradeableBeacon {
    constructor(address impl) UpgradeableBeacon(impl) {
    }
}