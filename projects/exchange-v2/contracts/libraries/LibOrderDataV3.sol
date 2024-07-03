// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/lib-part/contracts/LibPart.sol";

library LibOrderDataV3 {
    bytes4 constant public V3 = bytes4(keccak256("V3"));

    struct DataV3 {
        LibPart.Part[] payouts;
        LibPart.Part[] originFees;
        bool isMakeFill;
    }
}
