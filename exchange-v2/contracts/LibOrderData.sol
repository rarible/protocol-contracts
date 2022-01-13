// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "./LibOrder.sol";

library LibOrderData {

    struct OrderDataKeyHash {
        LibOrderDataV2.DataV2 orderData;
        bytes32 keyHash;
    }

    function parse(LibOrder.Order memory order) pure internal returns (LibOrderDataV2.DataV2 memory dataOrder) {
        if (order.dataType == LibOrderDataV1.V1) {
            LibOrderDataV1.DataV1 memory dataV1 = LibOrderDataV1.decodeOrderDataV1(order.data);
            dataOrder.payouts = dataV1.payouts;
            dataOrder.originFees = dataV1.originFees;
            dataOrder.isMakeFill = false;
        } else if (order.dataType == LibOrderDataV2.V2) {
            dataOrder = LibOrderDataV2.decodeOrderDataV2(order.data);
        } else if (order.dataType == 0xffffffff) {
        } else {
            revert("Unknown Order data type");
        }
        if (dataOrder.payouts.length == 0) {
            dataOrder.payouts = payoutSet(order.maker);
        }
    }

    function payoutSet(address orderAddress) pure internal returns (LibPart.Part[] memory) {
        LibPart.Part[] memory payout = new LibPart.Part[](1);
        payout[0].account = payable(orderAddress);
        payout[0].value = 10000;
        return payout;
    }

    function orderDataKeyHash(LibOrderDataV2.DataV2 memory orderData, bytes32 keyHash) internal pure returns (OrderDataKeyHash memory) {
        return OrderDataKeyHash(orderData, keyHash);
    }
}
