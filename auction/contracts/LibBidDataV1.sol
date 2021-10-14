// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/royalties/contracts/LibPart.sol";

library LibBidDataV1 {
    bytes4 constant public V1 = bytes4(keccak256("V1"));

    struct DataV1 {
        //LibPart.Part[] payouts;
        LibPart.Part[] originFees;
    }

    function parse(bytes memory data, bytes4 dataType) internal pure returns (DataV1 memory aucData) {
        if (dataType == V1) {
            aucData = abi.decode(data, (DataV1));
        }
    }
}
