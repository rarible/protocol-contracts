// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

/// @title Asset type helpers
/// @notice Provides common identifiers and hashing helpers for protocol assets.
/// @author iflelsedeveloper (https://github.com/iflelsedeveloper)
library LibAsset {
    /// @notice Identifier for native ETH assets.
    bytes4 public constant ETH_ASSET_CLASS = bytes4(keccak256("ETH"));
    /// @notice Identifier for ERC20 token assets.
    bytes4 public constant ERC20_ASSET_CLASS = bytes4(keccak256("ERC20"));
    /// @notice Identifier for ERC721 token assets.
    bytes4 public constant ERC721_ASSET_CLASS = bytes4(keccak256("ERC721"));
    /// @notice Identifier for ERC1155 token assets.
    bytes4 public constant ERC1155_ASSET_CLASS = bytes4(keccak256("ERC1155"));
    /// @notice Identifier for collection-wide assets.
    bytes4 public constant COLLECTION = bytes4(keccak256("COLLECTION"));
    /// @notice Identifier for CryptoPunks assets.
    bytes4 public constant CRYPTO_PUNKS = bytes4(keccak256("CRYPTO_PUNKS"));

    /// @dev EIP-712 type hash for `AssetType`.
    bytes32 constant ASSET_TYPE_TYPEHASH = keccak256("AssetType(bytes4 assetClass,bytes data)");

    /// @notice EIP-712 type hash for `Asset`.
    bytes32 constant ASSET_TYPEHASH =
        keccak256("Asset(AssetType assetType,uint256 value)AssetType(bytes4 assetClass,bytes data)");

    struct AssetType {
        bytes4 assetClass;
        bytes data;
    }

    struct Asset {
        AssetType assetType;
        uint256 value;
    }

    /// @notice Hashes the provided asset type using EIP-712 encoding.
    /// @param assetType Asset type data to hash.
    /// @return Asset type hash.
    function hash(AssetType memory assetType) internal pure returns (bytes32) {
        // prettier-ignore
        return keccak256(abi.encode(
            ASSET_TYPE_TYPEHASH, 
            assetType.assetClass, 
            keccak256(assetType.data)
        ));
    }

    /// @notice Hashes the provided asset using EIP-712 encoding.
    /// @param asset Asset data to hash.
    /// @return Asset hash.
    function hash(Asset memory asset) internal pure returns (bytes32) {
        // prettier-ignore
        return keccak256(abi.encode(
            ASSET_TYPEHASH, 
            hash(asset.assetType), 
            asset.value
        ));
    }
}
