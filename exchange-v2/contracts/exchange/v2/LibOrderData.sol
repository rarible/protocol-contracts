// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;

import "./LibOrder.sol";
import "./LibOrderData.sol";
import "./LibOrderDataV1.sol";
import "@rarible/royalties/contracts/LibPart.sol";

library LibOrderData {

    function parse(LibOrder.Order memory order) pure internal returns (LibOrderDataV1.DataV1 memory dataOrder) {
        if (order.dataType == LibOrderDataV1.V1) {
            dataOrder = LibOrderDataV1.decodeOrderDataV1(order.data);
        } else if (order.dataType == 0xffffffff) {
            LibPart.Part[] memory payout = new LibPart.Part[](1);
            payout[0].account = payable(order.maker);
            payout[0].value = 10000;
            dataOrder.payouts = payout;
        } else {
            revert("Unknown Order data type");
        }
    }

}
