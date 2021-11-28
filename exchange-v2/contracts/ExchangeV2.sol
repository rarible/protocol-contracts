// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./ExchangeV2Core.sol";
import "./EmptyGap.sol";

contract ExchangeV2 is ExchangeV2Core, EmptyGap {
    function __ExchangeV2_init(
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __OrderValidator_init_unchained();
    }
}