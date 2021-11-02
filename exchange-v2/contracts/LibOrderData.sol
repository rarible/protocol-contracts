// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "./LibOrder.sol";
import "@rarible/royalties/contracts/LibPart.sol";

library LibOrderData {

    function parse(LibOrder.Order memory order) pure internal returns (LibOrderDataV2.DataV1 memory dataOrder) {
        dataOrder = LibOrderDataV2.decodeOrderDataV1(order.data, order.dataType);

        if (dataOrder.payouts.length == 0) {
            dataOrder = payoutSet(order.maker, dataOrder);
        }
    }

    function payoutSet(
        address orderAddress,
        LibOrderDataV2.DataV1 memory dataOrderOnePayoutIn
    ) pure internal returns (LibOrderDataV2.DataV1 memory ) {
        LibPart.Part[] memory payout = new LibPart.Part[](1);
        payout[0].account = payable(orderAddress);
        payout[0].value = 10000;
        dataOrderOnePayoutIn.payouts = payout;
        return dataOrderOnePayoutIn;
    }
}
