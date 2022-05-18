// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

/// @dev library that works with data field of Bid struct
library LibBidDataV1 {
    bytes4 constant public V1 = bytes4(keccak256("V1"));

    /// @dev struct of Bid data field, version 1
    struct DataV1 {
        // auction originFees
        uint originFee;
    }

    /// @dev returns parsed data field of a Bid (so returns DataV1 struct)
    function parse(bytes memory data, bytes4 dataType) internal pure returns (DataV1 memory aucData) {
        if (dataType == V1) {
            if (data.length > 0){
                aucData = abi.decode(data, (DataV1));
            }  
        } else {
            revert("wrong bid dataType");
        }
    }
}
