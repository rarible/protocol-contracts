// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../../../contracts/AssetMatcher.sol";

contract AssetMatcherTest is Initializable, OwnableUpgradeable, AssetMatcher {

    function __AssetMatcherTest_init() external {
        __Ownable_init_unchained();
    }

    function matchAssetsTest(LibAsset.AssetType calldata leftAssetType, LibAsset.AssetType calldata rightAssetType) external view returns (LibAsset.AssetType memory) {
        return matchAssets(leftAssetType, rightAssetType);
    }
}
