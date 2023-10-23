// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/lib-part/contracts/LibPart.sol";
import "@rarible/lib-asset/contracts/LibAsset.sol";
import "./LibFeeSide.sol";

library LibDeal {
    struct DealSide {
        LibAsset.Asset asset;
        LibPart.Part[] payouts;
        LibPart.Part[] originFees;
        address proxy;
        address from;
    }

    struct DealData {
        uint protocolFee;
        uint maxFeesBasePoint;
        LibFeeSide.FeeSide feeSide;
    }
}
