// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./LibOrder.sol";

library LibOrderData {

    struct GenericOrderData {
        LibPart.Part[] payouts;
        LibPart.Part[] originFees;
        bool isMakeFill;
    } 

    function parse(LibOrder.Order memory order) pure internal returns (GenericOrderData memory dataOrder) {
        if (order.dataType == LibOrderDataV1.V1) {
            LibOrderDataV1.DataV1 memory data = abi.decode(order.data, (LibOrderDataV1.DataV1));
            dataOrder.payouts = data.payouts;
            dataOrder.originFees = data.originFees;
        } else if (order.dataType == LibOrderDataV2.V2) {
            LibOrderDataV2.DataV2 memory data = abi.decode(order.data, (LibOrderDataV2.DataV2));
            dataOrder.payouts = data.payouts;
            dataOrder.originFees = data.originFees;
            dataOrder.isMakeFill = data.isMakeFill;
        } else if (order.dataType == LibOrderDataV3.V3) {
            LibOrderDataV3.DataV3 memory data = abi.decode(order.data, (LibOrderDataV3.DataV3));
            dataOrder.payouts = data.payouts;
            dataOrder.originFees = data.originFees;
            dataOrder.isMakeFill = data.isMakeFill;
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

            originFee[0] = uintToLibPart(dataFirst);
            originFee[1] = uintToLibPart(dataSecond);
        }

        if (dataFirst > 0 && dataSecond == 0) {
            originFee = new LibPart.Part[](1);

            originFee[0] = uintToLibPart(dataFirst);
        }

        if (dataFirst == 0 && dataSecond > 0) {
            originFee = new LibPart.Part[](1);

            originFee[0] = uintToLibPart(dataSecond);
        }

        return originFee;
    }

    function parsePayouts(uint data) internal pure returns(LibPart.Part[] memory) {
        LibPart.Part[] memory payouts;

        if (data > 0) {
            payouts = new LibPart.Part[](1);
            payouts[0] = uintToLibPart(data);
        }

        return payouts;
    }

    /**
        @notice converts uint to LibPart.Part
        @param data address and value encoded in uint (first 12 bytes )
        @return result LibPart.Part 
     */
    function uintToLibPart(uint data) internal pure returns(LibPart.Part memory result) {
        if (data > 0){
            result.account = payable(address(data));
            result.value = uint96(data >> 160);
        }
    }

}
