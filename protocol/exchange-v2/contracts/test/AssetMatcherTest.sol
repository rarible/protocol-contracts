// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import "../../contracts/AssetMatcher.sol";

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
