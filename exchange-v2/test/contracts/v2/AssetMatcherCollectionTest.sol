// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

pragma abicoder v2;

import "../../../../custom-matchers/contracts/AssetMatcherCollection.sol";

contract AssetMatcherCollectionTest is AssetMatcherCollection {

    function matchAssetsTest(LibAsset.AssetType memory leftAssetType, LibAsset.AssetType memory rightAssetType) external returns (LibAsset.AssetType memory) {
        return matchAssets(leftAssetType, rightAssetType);
    }
}