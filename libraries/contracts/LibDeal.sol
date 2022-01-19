// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/royalties/contracts/LibPart.sol";
import "@rarible/lib-asset/contracts/LibAsset.sol";

library LibDeal {
    struct Data {
        LibPart.Part[] payouts;
        LibPart.Part[] originFees;
    }

    struct DealSide {
        LibAsset.AssetType assetType;
        uint value;
        LibPart.Part[] payouts;
        LibPart.Part[] originFees;
        address sideAddress;
        uint protocolFee;
    }
}
