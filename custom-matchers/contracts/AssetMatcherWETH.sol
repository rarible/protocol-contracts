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
    string constant symbolWETH = "WETH";

    function matchAssets(LibAsset.AssetType memory leftAssetType, LibAsset.AssetType memory rightAssetType) public view override returns (LibAsset.AssetType memory) {
        if (
            (rightAssetType.assetClass == LibAsset.WETH_UNWRAP) &&
            (leftAssetType.assetClass == LibAsset.ERC20_ASSET_CLASS)
        ) {
            (address leftToken) = abi.decode(leftAssetType.data, (address));
            try IWETH(leftToken).name() returns (string memory name) {
                if (keccak256(bytes(name)) == keccak256(bytes(nameWETH))) {
                    return LibAsset.AssetType(rightAssetType.assetClass, leftAssetType.data);
                }
            } catch {
                LibAsset.AssetType(0, EMPTY);
            }
        }
        return LibAsset.AssetType(0, EMPTY);
    }
}