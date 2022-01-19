// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/royalties/contracts/LibPart.sol";

/// @dev library that works with data field of Auction struct
library LibAucDataV1 {
    bytes4 constant public V1 = bytes4(keccak256("V1"));

    /// @dev struct of Auction data field, version 1
    struct DataV1 {
        // auction payouts, shows how highest bid is going to be distributed
        LibPart.Part[] payouts;
        // auction originFees
        LibPart.Part[] originFees;
        // auction duration
        uint duration;
        // auction startTime
        uint startTime;
        // auction buyout price
        uint buyOutPrice;
    }

    /// @dev returns parsed data field of an Auction (so returns DataV1 struct)
    function parse(bytes memory data, bytes4 dataType) internal pure returns (DataV1 memory aucData) {
        if (dataType == V1) {
            aucData = abi.decode(data, (DataV1));
        } else {
            revert("auction data type not supported");
        }
    }
}

