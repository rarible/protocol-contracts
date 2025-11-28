// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import "@rarible/exchange-interfaces/contracts/ITransferProxy.sol";
import "@rarible/exchange-interfaces/contracts/INftTransferProxy.sol";
import "@rarible/exchange-interfaces/contracts/IERC20TransferProxy.sol";
import "./interfaces/ITransferExecutor.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./lib/LibTransfer.sol";

abstract contract TransferExecutor is Initializable, OwnableUpgradeable, ITransferExecutor {
    using LibTransfer for address;

    mapping(bytes4 => address) internal proxies;

    event ProxyChange(bytes4 indexed assetType, address proxy);

    function __TransferExecutor_init_unchained(address transferProxy, address erc20TransferProxy) internal {
        proxies[LibAsset.ERC20_ASSET_CLASS] = address(erc20TransferProxy);
        proxies[LibAsset.ERC721_ASSET_CLASS] = address(transferProxy);
        proxies[LibAsset.ERC1155_ASSET_CLASS] = address(transferProxy);
    }

    function setTransferProxy(bytes4 assetType, address proxy) external onlyOwner {
        proxies[assetType] = proxy;
        emit ProxyChange(assetType, proxy);
    }

    function transfer(LibAsset.Asset memory asset, address from, address to, address proxy) internal override {
        if (asset.assetType.assetClass == LibAsset.ERC721_ASSET_CLASS) {
            //not using transfer proxy when transfering from this contract
            (address token, uint tokenId) = abi.decode(asset.assetType.data, (address, uint256));
            require(asset.value == 1, "erc721 value error");
            if (from == address(this)) {
                IERC721(token).safeTransferFrom(address(this), to, tokenId);
            } else {
                INftTransferProxy(proxy).erc721safeTransferFrom(IERC721(token), from, to, tokenId);
            }
        } else if (asset.assetType.assetClass == LibAsset.ERC20_ASSET_CLASS) {
            //not using transfer proxy when transfering from this contract
            (address token) = abi.decode(asset.assetType.data, (address));
            if (from == address(this)) {
                require(IERC20(token).transfer(to, asset.value), "erc20 transfer failed");
            } else {
                IERC20TransferProxy(proxy).erc20safeTransferFrom(IERC20(token), from, to, asset.value);
            }
        } else if (asset.assetType.assetClass == LibAsset.ERC1155_ASSET_CLASS) {
            //not using transfer proxy when transfering from this contract
            (address token, uint tokenId) = abi.decode(asset.assetType.data, (address, uint256));
            if (from == address(this)) {
                IERC1155(token).safeTransferFrom(address(this), to, tokenId, asset.value, "");
            } else {
                INftTransferProxy(proxy).erc1155safeTransferFrom(IERC1155(token), from, to, tokenId, asset.value, "");
            }
        } else if (asset.assetType.assetClass == LibAsset.ETH_ASSET_CLASS) {
            if (to != address(this)) {
                to.transferEth(asset.value);
            }
        } else {
            ITransferProxy(proxy).transfer(asset, from, to);
        }
    }

    uint256[49] private __gap;
}
