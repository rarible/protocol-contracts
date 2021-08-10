// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./IAssetMatcher.sol";

/*
 * Custom matcher for collection (any elements/or all from collection)
 */
contract AssetMatcherCollection is IAssetMatcher {

    bytes constant EMPTY = "";

    function matchAssets(LibAsset.AssetType memory leftAssetType, LibAsset.AssetType memory rightAssetType) external view override returns (LibAsset.AssetType memory) {
        if ((rightAssetType.assetClass == LibAsset.ERC721_ASSET_CLASS) || (rightAssetType.assetClass == LibAsset.ERC1155_ASSET_CLASS)) {
            (address leftToken) = abi.decode(leftAssetType.data, (address));
            (address rightToken, uint tokenId) = abi.decode(rightAssetType.data, (address, uint));
            if (leftToken == rightToken) {
                return LibAsset.AssetType(rightAssetType.assetClass, rightAssetType.data);
            }
        }
        return LibAsset.AssetType(0, EMPTY);
    }
}