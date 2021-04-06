// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "./LibBundle.sol";
import "./LibAsset.sol";
import "./TransferExecutor.sol";
import "./ITransferExecutorBundle.sol";

abstract contract TransferExecutorBundle is TransferExecutor, ITransferExecutorBundle {

    function transferBundle(
        LibBundle.Bundle memory bundle,
        address from,
        address to,
        bytes4 transferDirection,
        bytes4 transferType
    ) internal override {
        for (uint i = 0; i < bundle.bundles.length; i++) {
            transfer(bundle.bundles[i], from, to, transferDirection, transferType);
        }
    }

    uint256[49] private __gap;
}
