// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../../../contracts/ExchangeV2Core.sol";
import "./SimpleTransferManager.sol";

contract ExchangeSimpleV2 is ExchangeV2Core {
    function __ExchangeSimpleV2_init(
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __OrderValidator_init_unchained();
    }
}
