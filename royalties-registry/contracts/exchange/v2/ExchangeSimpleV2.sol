// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "./ExchangeV2Core.sol";
import "./SimpleTransferManager.sol";

contract ExchangeSimpleV2 is ExchangeV2Core, SimpleTransferManager {
    function __ExchangeSimpleV2_init(
        TransferProxy _transferProxy,
        ERC20TransferProxy _erc20TransferProxy
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __TransferExecutor_init_unchained(_transferProxy, _erc20TransferProxy);
        __OrderValidator_init_unchained();
    }
}
