// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/royalties/contracts/LibPart.sol";

library LibOrderDataV3 {
    bytes4 constant public V3_SELL = bytes4(keccak256("V3_SELL"));
    bytes4 constant public V3_BUY = bytes4(keccak256("V3_BUY"));

    bytes4 constant public V3_SELL_ROYALTIES = bytes4(keccak256("V3_SELL_ROYALTIES"));
    
    struct DataV3_SELL {
        uint[] payouts;
        uint originFee;
        uint maxFeesBasePoint;
    }

    struct DataV3_SELL_ROYALTIES {
        uint[] payouts;
        uint originFee;
        uint maxFeesBasePoint;
        uint royalties;
    }

    struct DataV3_BUY {
        uint[] payouts;
        uint originFee;
    }

    function decodeOrderDataV3_SELL(bytes memory data) internal pure returns (DataV3_SELL memory orderData) {
        orderData = abi.decode(data, (DataV3_SELL));
    }

    function decodeOrderDataV3_BUY(bytes memory data) internal pure returns (DataV3_BUY memory orderData) {
        orderData = abi.decode(data, (DataV3_BUY));
    }

    function decodeOrderDataV3_SELL_ROYALTIES(bytes memory data) internal pure returns (DataV3_SELL_ROYALTIES memory orderData) {
        orderData = abi.decode(data, (DataV3_SELL_ROYALTIES));
    }

}
