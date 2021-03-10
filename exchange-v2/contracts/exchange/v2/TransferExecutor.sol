// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "./LibAsset.sol";
import "./ITransferProxy.sol";
import "../../transfers/TransferProxy.sol";
import "../../transfers/ERC20TransferProxy.sol";
import "./ITransferExecutor.sol";

abstract contract TransferExecutor is Initializable, OwnableUpgradeable, ITransferExecutor {

    mapping (bytes4 => address) proxies;

    event ProxyChange(bytes4 indexed assetType, address proxy);

    function __TransferExecutor_init_unchained(TransferProxy transferProxy, ERC20TransferProxy erc20TransferProxy) internal {
        proxies[LibAsset.ERC20_ASSET_TYPE] = address(erc20TransferProxy);
        proxies[LibAsset.ERC721_ASSET_TYPE] = address(transferProxy);
        proxies[LibAsset.ERC1155_ASSET_TYPE] = address(transferProxy);
    }

    function setTransferProxy(bytes4 assetType, address proxy) onlyOwner public {
        proxies[assetType] = proxy;
        emit ProxyChange(assetType, proxy);
    }

    function transfer(
        LibAsset.Asset memory asset,
        address from,
        address to,
        bytes4 transferType
    ) internal override {
        if (asset.assetType.tp == LibAsset.ETH_ASSET_TYPE) {
            //todo подумать, что будет, если с обеих сторон eth
            //todo нужно ли проверить from?
            (bool success, ) = to.call{ value: asset.amount }("");
            require(success, "transfer failed");
        } else if (asset.assetType.tp == LibAsset.ERC20_ASSET_TYPE) {
            (address token) = abi.decode(asset.assetType.data, (address));
            ERC20TransferProxy(proxies[LibAsset.ERC20_ASSET_TYPE]).erc20safeTransferFrom(IERC20Upgradeable(token), from, to, asset.amount);
        } else if (asset.assetType.tp == LibAsset.ERC721_ASSET_TYPE) {
            (address token, uint tokenId) = abi.decode(asset.assetType.data, (address, uint256));
            require(asset.amount == 1, "erc721 amount error");
            TransferProxy(proxies[LibAsset.ERC721_ASSET_TYPE]).erc721safeTransferFrom(IERC721Upgradeable(token), from, to, tokenId);
        } else if (asset.assetType.tp == LibAsset.ERC1155_ASSET_TYPE) {
            (address token, uint tokenId) = abi.decode(asset.assetType.data, (address, uint256));
            TransferProxy(proxies[LibAsset.ERC1155_ASSET_TYPE]).erc1155safeTransferFrom(IERC1155Upgradeable(token), from, to, tokenId, asset.amount, "");
        } else {
            ITransferProxy(proxies[asset.assetType.tp]).transfer(asset, from, to);
        }
        emit Transfer(asset, from, to, transferType);
    }

    uint256[49] private __gap;
}
