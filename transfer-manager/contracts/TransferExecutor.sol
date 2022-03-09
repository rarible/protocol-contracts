// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/exchange-interfaces/contracts/ITransferProxy.sol";
import "@rarible/exchange-interfaces/contracts/INftTransferProxy.sol";
import "@rarible/exchange-interfaces/contracts/IERC20TransferProxy.sol";
import "@rarible/exchange-interfaces/contracts/ITransferExecutor.sol";

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./TransferExecutorCore.sol";

abstract contract TransferExecutor is Initializable, OwnableUpgradeable, ITransferExecutor, TransferExecutorCore {
    using LibTransfer for address;

    function __TransferExecutor_init_unchained() internal {   
    }

    function transfer(
        LibAsset.Asset memory asset,
        address from,
        address to,
        address proxy
    ) internal override {
        if (asset.assetType.assetClass == LibAsset.ERC721_ASSET_CLASS) {
            //not using transfer proxy when transfering from this contract
            (address token, uint tokenId) = abi.decode(asset.assetType.data, (address, uint256));
            require(asset.value == 1, "erc721 value error");
            if (from == address(this)){
                IERC721Upgradeable(token).safeTransferFrom(address(this), to, tokenId);
            } else {
                INftTransferProxy(proxy).erc721safeTransferFrom(IERC721Upgradeable(token), from, to, tokenId);
            }
        } else if (asset.assetType.assetClass == LibAsset.ERC20_ASSET_CLASS) {
            //not using transfer proxy when transfering from this contract
            (address token) = abi.decode(asset.assetType.data, (address));
            if (from == address(this)){
                IERC20Upgradeable(token).transfer(to, asset.value);
            } else {
                IERC20TransferProxy(proxy).erc20safeTransferFrom(IERC20Upgradeable(token), from, to, asset.value);
            }
        } else if (asset.assetType.assetClass == LibAsset.ERC1155_ASSET_CLASS) {
            //not using transfer proxy when transfering from this contract
            (address token, uint tokenId) = abi.decode(asset.assetType.data, (address, uint256));
            if (from == address(this)){
                IERC1155Upgradeable(token).safeTransferFrom(address(this), to, tokenId, asset.value, "");
            } else {
                INftTransferProxy(proxy).erc1155safeTransferFrom(IERC1155Upgradeable(token), from, to, tokenId, asset.value, "");  
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
