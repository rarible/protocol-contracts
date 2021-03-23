// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;

import "./LibOrder.sol";
import "./LibOrderData.sol";
import "./LibOrderDataV1.sol";
import "@rarible/royalties/contracts/LibPart.sol";

library LibOrderData {

    function parseOrder(LibOrder.Order memory order) pure internal returns (LibPart.Part[] memory beneficiary) {
        if (order.dataType == LibOrderDataV1.V1) {
            (LibOrderDataV1.DataV1 memory orderData) = LibOrderDataV1.decodeOrderDataV1(order.data);
            beneficiary = orderData.payouts;
        } else{
            beneficiary = new LibPart.Part[](1);
            beneficiary[0].account = payable(order.maker);
            beneficiary[0].value = 10000;
        }
    }

    function getOriginFees(LibOrder.Order memory order) pure internal returns (LibPart.Part[] memory originOrderFees) {
        if (order.dataType == LibOrderDataV1.V1) {
            (LibOrderDataV1.DataV1 memory orderData) = LibOrderDataV1.decodeOrderDataV1(order.data);
            originOrderFees = orderData.originFees;
        }
    }

}
