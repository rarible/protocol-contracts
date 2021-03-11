// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma experimental ABIEncoderV2;

library LibOrderDataV1 {
    bytes4 constant public V1 = bytes4(keccak256("V1"));

    struct DataV1 {
        address benificiary;
        address origin;
        uint originFee;
    }
    //todo think:  different metods return different poles of struct DataV1,
    function decodeOrderDataV1(bytes memory data) internal pure returns (DataV1 memory orderData) {
        orderData = abi.decode(data, (DataV1));
    }
}
