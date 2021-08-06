// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../../../contracts/ExchangeV2Core.sol";
import "../../../contracts/MetaTransaction.sol";
import "./SimpleTransferManager.sol";

//contract ExchangeSimpleV2_MetaTx is ExchangeV2Core, MetaTransaction, SimpleTransferManager { Error:New storage layout is incompatible
contract ExchangeSimpleV2_MetaTx is ExchangeV2Core, SimpleTransferManager, MetaTransaction {
    function __ExchangeSimpleV2_init(
        INftTransferProxy _transferProxy,
        IERC20TransferProxy _erc20TransferProxy
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __TransferExecutor_init_unchained(_transferProxy, _erc20TransferProxy);
        __OrderValidator_init_unchained();
    }
}
