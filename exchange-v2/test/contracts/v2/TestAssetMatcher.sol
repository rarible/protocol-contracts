// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;
pragma abicoder v2;

import "../../../contracts/IAssetMatcher.sol";

contract TestAssetMatcher is IAssetMatcher {

    function matchAssets(
        LibAsset.AssetType memory leftAssetType,
        LibAsset.AssetType memory rightAssetType
    ) external view override returns (LibAsset.AssetType memory) {
        if (leftAssetType.assetClass == bytes4(keccak256("BLA"))) {
            (address leftToken) = abi.decode(leftAssetType.data, (address));
            (address rightToken) = abi.decode(rightAssetType.data, (address));
            if (leftToken == rightToken) {
                return LibAsset.AssetType(rightAssetType.assetClass, rightAssetType.data);
            }
        }
        return LibAsset.AssetType(0, "");
    }

}
