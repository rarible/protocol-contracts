// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "./LibOrder.sol";

library LibOrderData {

    struct GenericOrderData {
        LibPart.Part[] payouts;
        LibPart.Part[] originFees;
        bool isMakeFill;
        uint maxFeesBasePoint;
    } 

    function parse(LibOrder.Order memory order) pure internal returns (GenericOrderData memory dataOrder) {
        if (order.dataType == LibOrderDataV1.V1) {
            LibOrderDataV1.DataV1 memory data = LibOrderDataV1.decodeOrderDataV1(order.data);
            dataOrder.payouts = data.payouts;
            dataOrder.originFees = data.originFees;
        } else if (order.dataType == LibOrderDataV2.V2) {
            LibOrderDataV2.DataV2 memory data = LibOrderDataV2.decodeOrderDataV2(order.data);
            dataOrder.payouts = data.payouts;
            dataOrder.originFees = data.originFees;
            dataOrder.isMakeFill = data.isMakeFill;
        } else if (order.dataType == LibOrderDataV3.V3_SELL) {
            LibOrderDataV3.DataV3_SELL memory data = LibOrderDataV3.decodeOrderDataV3_SELL(order.data);
            dataOrder.payouts = parsePayouts(data.payouts);
            dataOrder.originFees = parseOriginFeeData(data.originFee);
            dataOrder.isMakeFill = true;
            dataOrder.maxFeesBasePoint = data.maxFeesBasePoint;
        } else if (order.dataType == LibOrderDataV3.V3_BUY) {
            LibOrderDataV3.DataV3_BUY memory data = LibOrderDataV3.decodeOrderDataV3_BUY(order.data);
            dataOrder.payouts = parsePayouts(data.payouts);
            dataOrder.originFees = parseOriginFeeData(data.originFee);
            dataOrder.isMakeFill = false;
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

    function parseOriginFeeData(uint data) internal pure returns(LibPart.Part[] memory) {
        LibPart.Part[] memory originFee = new LibPart.Part[](1);
        originFee[0].account = payable(address(data));
        originFee[0].value = uint96(data >> 160);
        return originFee;
    }

    function parsePayouts(uint[] memory data) internal pure returns(LibPart.Part[] memory) {
        uint len = data.length;
        LibPart.Part[] memory payouts = new LibPart.Part[](len);

        for (uint i; i < data.length; i++) {
            payouts[i].account = payable(address(data[i]));
            payouts[i].value = uint96(data[i] >> 160);
        }
        return payouts;
    }

}
