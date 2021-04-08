// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "./LibAsset.sol";

interface IAssetMatcher {
    function matchAssets(
        LibAsset.AssetType memory leftAssetType,
        LibAsset.AssetType memory rightAssetType
    ) external view returns (LibAsset.AssetType memory);
}
