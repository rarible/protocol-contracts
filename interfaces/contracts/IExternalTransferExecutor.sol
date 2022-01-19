// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/lib-asset/contracts/LibAsset.sol";

interface IExternalTransferExecutor {

    /**
     * @dev execute transfer for any asset type (except ETH. ETH transfers should be handled inside the contract)
     */
    function executeTransfer(
        LibAsset.Asset memory asset,
        address from,
        address to,
        bytes4 transferDirection,
        bytes4 transferType
    ) external;
}
