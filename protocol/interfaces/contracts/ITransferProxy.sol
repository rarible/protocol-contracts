// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import "@rarible/lib-asset/contracts/LibAsset.sol";

interface ITransferProxy {
    function transfer(LibAsset.Asset calldata asset, address from, address to) external;
}
