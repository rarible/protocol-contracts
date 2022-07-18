// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma abicoder v2;

import "@rarible/lib-asset/contracts/LibAsset.sol";

abstract contract ITransferExecutor {
    function transfer(
        LibAsset.Asset memory asset,
        address from,
        address to,
        address proxy
    ) internal virtual;
}
