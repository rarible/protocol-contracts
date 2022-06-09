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
            dataOrder.originFees = parseOriginFeeData(data.originFeeFirst, data.originFeeSecond);
            dataOrder.isMakeFill = true;
            dataOrder.maxFeesBasePoint = data.maxFeesBasePoint;
        } else if (order.dataType == LibOrderDataV3.V3_BUY) {
            LibOrderDataV3.DataV3_BUY memory data = LibOrderDataV3.decodeOrderDataV3_BUY(order.data);
            dataOrder.payouts = parsePayouts(data.payouts);
            dataOrder.originFees = parseOriginFeeData(data.originFeeFirst, data.originFeeSecond);
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

    function parseOriginFeeData(uint dataFirst, uint dataSecond) internal pure returns(LibPart.Part[] memory) {
        LibPart.Part[] memory originFee;

        if (dataFirst > 0 && dataSecond > 0){
            originFee = new LibPart.Part[](2);

            originFee[0].account = payable(address(dataFirst));
            originFee[0].value = uint96(dataFirst >> 160);

            originFee[1].account = payable(address(dataSecond));
            originFee[1].value = uint96(dataSecond >> 160);
        }

        if (dataFirst > 0 && dataSecond == 0) {
            originFee = new LibPart.Part[](1);

            originFee[0].account = payable(address(dataFirst));
            originFee[0].value = uint96(dataFirst >> 160);
        }

        if (dataFirst == 0 && dataSecond > 0) {
            originFee = new LibPart.Part[](1);

            originFee[0].account = payable(address(dataSecond));
            originFee[0].value = uint96(dataSecond >> 160);
        }

        return originFee;
    }

    function parsePayouts(uint data) internal pure returns(LibPart.Part[] memory) {
        LibPart.Part[] memory payouts;

        if (data > 0) {
            payouts = new LibPart.Part[](1);
            payouts[0].account = payable(address(data));
            payouts[0].value = uint96(data >> 160);
        }

        return payouts;
    }

}
