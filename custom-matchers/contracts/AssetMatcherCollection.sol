// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/exchange-interfaces/contracts/IAssetMatcher.sol";

/*
 * Custom matcher for collection (assetClass, that need any/all elements from collection)
 */
contract AssetMatcherCollection is IAssetMatcher {

    bytes constant EMPTY = "";

    function matchAssets(LibAsset.AssetType memory leftAssetType, LibAsset.AssetType memory rightAssetType) public pure override returns (LibAsset.AssetType memory) {
        if ((rightAssetType.assetClass == LibAsset.ERC721_ASSET_CLASS) || (rightAssetType.assetClass == LibAsset.ERC1155_ASSET_CLASS)) {
            (address leftToken) = abi.decode(leftAssetType.data, (address));
            (address rightToken,) = abi.decode(rightAssetType.data, (address, uint));
            if (leftToken == rightToken) {
                return LibAsset.AssetType(rightAssetType.assetClass, rightAssetType.data);
            }
        }
        return LibAsset.AssetType(0, EMPTY);
    }
}