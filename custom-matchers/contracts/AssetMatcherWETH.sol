// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/exchange-interfaces/contracts/IAssetMatcher.sol";
import "@rarible/exchange-interfaces/contracts/IWETH.sol";

/*
 * Custom matcher for WETH_UNWRAP
 */
contract AssetMatcherWETH is IAssetMatcher {

    bytes constant EMPTY = "";

    function matchAssets(LibAsset.AssetType memory leftAssetType, LibAsset.AssetType memory rightAssetType) public view override returns (LibAsset.AssetType memory) {
        bytes4 resultAssetClass;
        if (
            (leftAssetType.assetClass == LibAsset.ERC20_ASSET_CLASS) &&
            (rightAssetType.assetClass == LibAsset.WETH_UNWRAP)
        ) {
            resultAssetClass = rightAssetType.assetClass;
        } else if (
            (leftAssetType.assetClass == LibAsset.WETH_UNWRAP) &&
            (rightAssetType.assetClass == LibAsset.ERC20_ASSET_CLASS)
        ) {
            resultAssetClass = leftAssetType.assetClass;
        } else {
            return LibAsset.AssetType(0, EMPTY);
        }
        (address tokenLeft) = abi.decode(leftAssetType.data, (address));
        (address tokenRight) = abi.decode(rightAssetType.data, (address));
        if (tokenLeft == tokenRight) {
            return LibAsset.AssetType(resultAssetClass, leftAssetType.data);
        }
        return LibAsset.AssetType(0, EMPTY);
    }
}