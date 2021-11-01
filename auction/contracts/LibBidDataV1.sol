// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/exchange-v2/contracts/LibOrderDataV1.sol";

/// @dev library that works with data field of Bid struct
library LibBidDataV1 {
    bytes4 constant public V1 = bytes4(keccak256("V1"));

    /// @dev struct of Bid data field, version 1
    struct DataV1 {
        // auction payouts, shows how sell item is going to be distributed if the bid wins
        LibPart.Part[] payouts;
        // auction originFees
        LibPart.Part[] originFees;
    }

    /// @dev returns parsed data field of a Bid (so returns DataV1 struct)
    function parse(bytes memory data, bytes4 dataType) internal pure returns (DataV1 memory aucData) {
        if (dataType == V1) {
            aucData = abi.decode(data, (DataV1));
        }
    }

    /// @dev returns payouts and originFees from Bid data
    function getPaymentData(bytes memory data, bytes4 dataType) internal pure returns (LibOrderDataV1.DataV1 memory payment){
        if (dataType == V1) {
            DataV1 memory aucData = abi.decode(data, (DataV1));
            payment = LibOrderDataV1.DataV1(aucData.payouts, aucData.originFees);
        }
    }

    /// @dev returns originFees from Bid data
    function getOrigin(bytes memory data, bytes4 dataType) internal pure returns (LibPart.Part[] memory originFees){
        if (dataType == V1) {
            originFees = (abi.decode(data, (DataV1))).originFees;
        }
    }
}
