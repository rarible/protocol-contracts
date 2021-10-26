// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/exchange-v2/contracts/LibOrderDataV1.sol";

library LibBidDataV1 {
    bytes4 constant public V1 = bytes4(keccak256("V1"));

    struct DataV1 {
        LibPart.Part[] payouts;
        LibPart.Part[] originFees;
    }

    function parse(bytes memory data, bytes4 dataType) internal pure returns (DataV1 memory aucData) {
        if (dataType == V1) {
            aucData = abi.decode(data, (DataV1));
        }
    }

    function getPaymentData(bytes memory data, bytes4 dataType) internal pure returns (LibOrderDataV1.DataV1 memory payment){
        if (dataType == V1) {
            DataV1 memory aucData = abi.decode(data, (DataV1));
            payment = LibOrderDataV1.DataV1(aucData.payouts, aucData.originFees);
        }
    }

    function getOrigin(bytes memory data, bytes4 dataType) internal pure returns (LibPart.Part[] memory originFees){
        if (dataType == V1) {
            originFees = (abi.decode(data, (DataV1))).originFees;
        }
    }
}
