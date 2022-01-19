// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/lib-asset/contracts/LibAsset.sol";
import "@rarible/exchange-interfaces/contracts/IExternalTransferExecutor.sol";
import "./lib/LibTransfer.sol";

abstract contract InternalTransferExecutor {
    using LibTransfer for address;

    function getExternalTransferExecutor() internal virtual returns (IExternalTransferExecutor);

    /**
     * @dev execute a transfer
     */
    function transfer(
        LibAsset.Asset memory asset,
        address from,
        address to,
        bytes4 transferDirection,
        bytes4 transferType
    ) internal {
        if (asset.assetType.assetClass == LibAsset.ETH_ASSET_CLASS) {
            require(msg.sender == from, "InternalTransferExecutor: incorrect from");
            require(msg.value >= asset.value, "InternalTransferExecutor: not enough ETH");
            if (to != address(this)) {
                to.transferEth(asset.value);
            }
            uint256 change = msg.value - asset.value;
            if (change > 0) {
                address(msg.sender).transferEth(change);
            }
        } else {
            getExternalTransferExecutor().executeTransfer(asset, from, to, transferDirection, transferType);
        }
    }
}
