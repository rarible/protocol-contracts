// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import "../AssetMatcher.sol";

contract AssetMatcherTest is Initializable, OwnableUpgradeable, AssetMatcher {
    function __AssetMatcherTest_init(address initialOwner) external initializer {
        __Ownable_init_unchained(initialOwner);
    }

    function matchAssetsTest(
        LibAsset.AssetType calldata leftAssetType,
        LibAsset.AssetType calldata rightAssetType
    ) external view returns (LibAsset.AssetType memory) {
        return matchAssets(leftAssetType, rightAssetType);
    }
}

contract TestAssetMatcher is IAssetMatcher {
    function matchAssets(
        LibAsset.AssetType memory leftAssetType,
        LibAsset.AssetType memory rightAssetType
    ) external pure override returns (LibAsset.AssetType memory) {
        if (rightAssetType.assetClass == bytes4(keccak256("BLA"))) {
            return leftAssetType;
        }
        if (leftAssetType.assetClass == bytes4(keccak256("BLA"))) {
            return rightAssetType;
        }
        return LibAsset.AssetType(0, "");
    }
}
