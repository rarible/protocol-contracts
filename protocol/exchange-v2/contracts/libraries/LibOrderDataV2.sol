// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import "@rarible/lib-part/contracts/LibPart.sol";

library LibOrderDataV2 {
    bytes4 constant public V2 = bytes4(keccak256("V2"));

    struct DataV2 {
        LibPart.Part[] payouts;
        LibPart.Part[] originFees;
        bool isMakeFill;
    }

}
