// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;

import "./LibOrder.sol";
import "./LibOrderData.sol";
import "./LibOrderDataV1.sol";
import "@rarible/royalties/contracts/LibPart.sol";

library LibOrderData {

    struct OrderData{
        LibPart.Part[] payoutCalculate;
        LibPart.Part[] payoutNft;
        LibPart.Part[] originCalculate;
        LibPart.Part[] originNft;
    }

    function parseOrders (LibOrder.Order memory orderCalculate, LibOrder.Order memory orderNft
    ) pure internal returns (LibOrderData.OrderData memory ordersData) {
        LibOrderDataV1.DataV1 memory dataCalculate = parseData(orderCalculate.maker, orderCalculate.dataType, orderCalculate.data);
        LibOrderDataV1.DataV1 memory dataNft = parseData(orderNft.maker, orderNft.dataType, orderNft.data);
        ordersData.originCalculate = dataCalculate.originFees;
        ordersData.payoutCalculate = dataCalculate.payouts;
        ordersData.originNft = dataNft.originFees;
        ordersData.payoutNft = dataNft.payouts;
    }

    function parseData (address orderAddress, bytes4 dataType, bytes memory data) pure internal returns (LibOrderDataV1.DataV1 memory dataOrder) {
        if (dataType == LibOrderDataV1.V1){
            dataOrder = LibOrderDataV1.decodeOrderDataV1(data);
        } else{
            LibPart.Part[] memory payout = new LibPart.Part[](1);
            payout[0].account = payable(orderAddress);
            payout[0].value = 10000;
            dataOrder.payouts = payout;
        }
    }

}
