// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import "../../contracts/ExchangeV2Core.sol";
import "./SimpleTransferManager.sol";

contract ExchangeSimpleV2 is ExchangeV2Core, SimpleTransferManager {
    function __ExchangeSimpleV2_init(
        address _transferProxy,
        address _erc20TransferProxy,
        address initialOwner
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained(initialOwner);
        __OrderValidator_init_unchained();
        __TransferExecutor_init_unchained(_transferProxy, _erc20TransferProxy);
    }
}
