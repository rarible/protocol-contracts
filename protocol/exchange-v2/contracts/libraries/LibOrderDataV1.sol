// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import "@rarible/lib-part/contracts/LibPart.sol";

library LibOrderDataV1 {
    bytes4 constant public V1 = bytes4(keccak256("V1"));

    struct DataV1 {
        LibPart.Part[] payouts;
        LibPart.Part[] originFees;
    }

}
