// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/royalties/contracts/LibPart.sol";

library LibOrderDataV3 {
    bytes4 constant public V3_SELL = bytes4(keccak256("V3_SELL"));
    bytes4 constant public V3_BUY = bytes4(keccak256("V3_BUY"));

    struct DataV3_SELL {
        LibPart.Part[] payouts;
        uint originFee;
        bool isMakeFill;
        uint maxFeesBasePoint;
    }

    struct DataV3_BUY {
        LibPart.Part[] payouts;
        uint originFee;
        bool isMakeFill;
    }

    function decodeOrderDataV3_SELL(bytes memory data) internal pure returns (DataV3_SELL memory orderData) {
        orderData = abi.decode(data, (DataV3_SELL));
    }

    function decodeOrderDataV3_BUY(bytes memory data) internal pure returns (DataV3_BUY memory orderData) {
        orderData = abi.decode(data, (DataV3_BUY));
    }

}
