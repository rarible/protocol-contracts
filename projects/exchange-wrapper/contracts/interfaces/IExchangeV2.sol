// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "@rarible/exchange-v2/contracts/ExchangeV2.sol";

import {RoyaltiesRegistry} from "@rarible/royalties-registry/contracts/RoyaltiesRegistry.sol";
import {TransferProxy} from "@rarible/transfer-proxy/contracts/proxy/TransferProxy.sol";
import {ERC20TransferProxy} from "@rarible/transfer-proxy/contracts/proxy/ERC20TransferProxy.sol";

interface IExchangeV2 {
    function matchOrders(
        LibOrder.Order memory orderLeft,
        bytes memory signatureLeft,
        LibOrder.Order memory orderRight,
        bytes memory signatureRight
    ) external payable;

    function directPurchase(
        LibDirectTransfer.Purchase calldata direct
    ) external payable;
}