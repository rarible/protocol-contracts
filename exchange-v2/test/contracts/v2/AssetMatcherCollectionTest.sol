// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

pragma abicoder v2;

import "@rarible/custom-matchers/contracts/AssetMatcherCollection.sol";
import "./OperatorRoleTest.sol";

contract AssetMatcherCollectionTest is AssetMatcherCollection, OperatorRoleTest {

    function matchAssetsTest(LibAsset.AssetType memory leftAssetType, LibAsset.AssetType memory rightAssetType) onlyOperator external returns (LibAsset.AssetType memory) {
        return matchAssets(leftAssetType, rightAssetType);
    }
}