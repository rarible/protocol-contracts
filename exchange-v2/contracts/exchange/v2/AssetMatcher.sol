// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "./IAssetMatcher.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

abstract contract AssetMatcher is Initializable, OwnableUpgradeable {

    bytes constant EMPTY = "";
    mapping(bytes4 => address) matchers;

    event MatcherChange(bytes4 indexed assetType, address matcher);

    function setAssetMatcher(bytes4 assetType, address matcher) public onlyOwner {
        matchers[assetType] = matcher;
        emit MatcherChange(assetType, matcher);
    }

    function matchAssets(LibAsset.AssetType memory leftAssetType, LibAsset.AssetType memory rightAssetType) internal view returns (LibAsset.AssetType memory) {
        LibAsset.AssetType memory result = matchAssetOneSide(leftAssetType, rightAssetType);
        if (result.tp == 0) {
            return matchAssetOneSide(rightAssetType, leftAssetType);
        } else {
            return result;
        }
    }

    function matchAssetOneSide(LibAsset.AssetType memory leftAssetType, LibAsset.AssetType memory rightAssetType) private view returns (LibAsset.AssetType memory) {
        bytes4 typeLeft = leftAssetType.tp;
        bytes4 typeRight = rightAssetType.tp;
        if (typeLeft == LibAsset.ETH_ASSET_TYPE) {
            if (typeRight == LibAsset.ETH_ASSET_TYPE) {
                return leftAssetType;
            }
            return LibAsset.AssetType(0, EMPTY);
        }
        if (typeLeft == LibAsset.ERC20_ASSET_TYPE) {
            if (typeRight == LibAsset.ERC20_ASSET_TYPE) {
                (address addressLeft) = abi.decode(leftAssetType.data, (address));
                (address addressRight) = abi.decode(rightAssetType.data, (address));
                if (addressLeft == addressRight) {
                    return leftAssetType;
                }
            }
            return LibAsset.AssetType(0, EMPTY);
        }
        if (typeLeft == LibAsset.ERC721_ASSET_TYPE) {
            if (typeRight == LibAsset.ERC721_ASSET_TYPE) {
                (address addressLeft, uint tokenIdLeft) = abi.decode(leftAssetType.data, (address, uint));
                (address addressRight, uint tokenIdRight) = abi.decode(rightAssetType.data, (address, uint));
                if (addressLeft == addressRight && tokenIdLeft == tokenIdRight) {
                    return leftAssetType;
                }
            }
            return LibAsset.AssetType(0, EMPTY);
        }
        if (typeLeft == LibAsset.ERC1155_ASSET_TYPE) {
            if (typeRight == LibAsset.ERC1155_ASSET_TYPE) {
                (address addressLeft, uint tokenIdLeft) = abi.decode(leftAssetType.data, (address, uint));
                (address addressRight, uint tokenIdRight) = abi.decode(rightAssetType.data, (address, uint));
                if (addressLeft == addressRight && tokenIdLeft == tokenIdRight) {
                    return leftAssetType;
                }
            }
            return LibAsset.AssetType(0, EMPTY);
        }
        address matcher = matchers[typeLeft];
        if (matcher != address(0)) {
            return IAssetMatcher(matcher).matchAssets(leftAssetType, rightAssetType);
        }
        if (typeLeft == typeRight) {
            bytes32 leftHash = keccak256(leftAssetType.data);
            bytes32 rightHash = keccak256(rightAssetType.data);
            if (leftHash == rightHash) {
                return leftAssetType;
            }
        }
        revert("not found IAssetMatcher");
    }
}
