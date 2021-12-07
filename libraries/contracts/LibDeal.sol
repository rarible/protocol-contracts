// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/royalties/contracts/LibPart.sol";

library LibDeal {
    struct Data {
        LibPart.Part[] payouts;
        LibPart.Part[] originFees;
    }
}
