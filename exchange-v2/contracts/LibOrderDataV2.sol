// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/royalties/contracts/LibPart.sol";

library LibOrderDataV2 {
    bytes4 constant public V2 = bytes4(keccak256("V2"));
    bytes4 constant public V1 = bytes4(keccak256("V1"));

    struct DataV1 {
        LibPart.Part[] payouts;
        LibPart.Part[] originFees;
    }

    struct DataV2 {
        LibPart.Part[] payouts;
        LibPart.Part[] originFees;
        bool isMakeFill;
    }

    function decodeOrderDataV1(bytes memory data, bytes4 dataType) internal pure returns (DataV1 memory orderData) {
        if (dataType == V1){
            orderData = abi.decode(data, (DataV1));
        } else if (dataType == V2) {
            DataV2 memory dataV2 = abi.decode(data, (DataV2));
            orderData.payouts = dataV2.payouts;
            orderData.originFees = dataV2.originFees;
        } else if (dataType == 0xffffffff) {
        } else {
            revert("Unknown Order data type");
        }
        
    }

    function isMakeFill(bytes memory data, bytes4 dataType) internal pure returns(bool){
        if (dataType == V2) {
            DataV2 memory dataV2 = abi.decode(data, (DataV2));
            return dataV2.isMakeFill;
        } else {
            return false;
        }
    }

}
