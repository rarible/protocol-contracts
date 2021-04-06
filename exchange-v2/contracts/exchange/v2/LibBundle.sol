// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;

import "./LibAsset.sol";

library LibBundle {
    bytes4 constant public BUNDLE_CLASS = bytes4(keccak256("BUNDLE"));

    bytes32 constant BUNDLE_TYPE_TYPEHASH = keccak256(
        "Bundle(Asset[] bundles)"
    );

    struct Bundle {
        LibAsset.Asset[] bundles;
    }

    function hash(Bundle memory bundle) internal pure returns (bytes32) {
        return keccak256(abi.encode(
                BUNDLE_TYPE_TYPEHASH
//                bundle.bundles  TODO: think how to encode bundles (Asset[]), but first need to know how and what decode
            ));
    }

}
