// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/exchange-interfaces/contracts/IAssetMatcher.sol";
import "@rarible/lazy-mint/contracts/erc-721/LibERC721LazyMint.sol";
import "@rarible/lazy-mint/contracts/erc-1155/LibERC1155LazyMint.sol";
import "@rarible/transfer-proxy/contracts/roles/OperatorRole.sol";

/*
 * Custom matcher for collection (assetClass, that need any/all elements from collection)
 */
contract AssetMatcherCollection is IAssetMatcher, Initializable, OperatorRole {

    bytes constant EMPTY = "";

    function __AssetMatcherCollection_init() initializer external {
//        __Ownable_init();
//        __OperatorRole_init();
        __Context_init_unchained();
        __Ownable_init_unchained();
    }

    function matchAssets(LibAsset.AssetType memory leftAssetType, LibAsset.AssetType memory rightAssetType) onlyOperator public view override returns (LibAsset.AssetType memory) {
        if ((rightAssetType.assetClass == LibAsset.ERC721_ASSET_CLASS) || (rightAssetType.assetClass == LibERC721LazyMint.ERC721_LAZY_ASSET_CLASS) ||
        (rightAssetType.assetClass == LibAsset.ERC1155_ASSET_CLASS) || (rightAssetType.assetClass == LibERC1155LazyMint.ERC1155_LAZY_ASSET_CLASS)) {
            (address leftToken) = abi.decode(leftAssetType.data, (address));
            (address rightToken,) = abi.decode(rightAssetType.data, (address, uint));
            if (leftToken == rightToken) {
                return LibAsset.AssetType(rightAssetType.assetClass, rightAssetType.data);
            }
        }
        return LibAsset.AssetType(0, EMPTY);
    }

    function getOperator(address askedAddr) public view returns (bool) {
        return operators[askedAddr];
    }
}