// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import "@openzeppelin/contracts/proxy/UpgradeableBeacon.sol";

contract ERC721RaribleBeacon is UpgradeableBeacon {
    constructor(address impl) UpgradeableBeacon(impl) {

    }
}
