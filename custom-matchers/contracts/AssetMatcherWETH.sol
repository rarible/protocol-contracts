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
    string constant nameWETH = "Wrapped Ether";

    function matchAssets(LibAsset.AssetType memory leftAssetType, LibAsset.AssetType memory rightAssetType) public view override returns (LibAsset.AssetType memory) {
        bytes4 resultAssetClass;
        bytes memory resultData;
        if (
            (leftAssetType.assetClass == LibAsset.ERC20_ASSET_CLASS) &&
            (rightAssetType.assetClass == LibAsset.WETH_UNWRAP)
        ) {
            resultAssetClass = rightAssetType.assetClass;
            resultData = leftAssetType.data;
        } else if (
            (leftAssetType.assetClass == LibAsset.WETH_UNWRAP) &&
            (rightAssetType.assetClass == LibAsset.ERC20_ASSET_CLASS)
        ) {
            resultAssetClass = leftAssetType.assetClass;
            resultData = rightAssetType.data;
        } else {
            return LibAsset.AssetType(0, EMPTY);
        }
        (address token) = abi.decode(resultData, (address));
        try IWETH(token).name() returns (string memory name) {
            if (keccak256(bytes(name)) == keccak256(bytes(nameWETH))) {
                return LibAsset.AssetType(resultAssetClass, resultData);
            }
        } catch {}
        return LibAsset.AssetType(0, EMPTY);
    }
}