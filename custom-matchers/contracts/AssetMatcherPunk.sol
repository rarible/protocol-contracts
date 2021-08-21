// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../../exchange-v2/contracts/IAssetMatcher.sol";

/*
 * Custom matcher for Punks
 */
contract AssetMatcherPunk is IAssetMatcher {

    bytes constant EMPTY = "";

    function matchAssets(LibAsset.AssetType memory leftAssetType, LibAsset.AssetType memory rightAssetType) public pure override returns (LibAsset.AssetType memory) {
        (address leftToken, uint leftTokenId) = abi.decode(leftAssetType.data, (address, uint));
        (address rightToken, uint rightTokenId) = abi.decode(rightAssetType.data, (address, uint));
        if ((leftTokenId == rightTokenId) && (leftToken == rightToken)) {
            return LibAsset.AssetType(rightAssetType.assetClass, rightAssetType.data);
        }
        return LibAsset.AssetType(0, EMPTY);
    }
}