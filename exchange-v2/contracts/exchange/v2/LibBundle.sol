// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;

//import "./LibAsset.sol";

library LibBundle {

    bytes32 constant BUNDLE_TYPEHASH = keccak256(
        "Bundle(BundleItem[] bundles)"
    );

    bytes32 constant BUNDLE_ITEM_TYPEHASH = keccak256(
        "BundleItem(bytes4 type, address token)"
    );

    struct BundleItem{
        bytes4 typeItem;
        address token;
    }

    struct Bundle {
        BundleItem[] bundles;
    }

    function hash(BundleItem memory item) internal pure returns (bytes32) {
        return keccak256(abi.encode(
                BUNDLE_ITEM_TYPEHASH,
                item.typeItem,
                item.token
            ));
    }

    function hash(Bundle memory data) internal pure returns (bytes32) {
        bytes32[] memory bundlesScope = new bytes32[](data.bundles.length);
        for (uint i = 0; i < data.bundles.length; i++){
            bundlesScope[i] = hash(data.bundles[i]);
        }
        return keccak256(abi.encode(
                BUNDLE_TYPEHASH,
                keccak256(abi.encodePacked(bundlesScope))
            ));
    }

}
