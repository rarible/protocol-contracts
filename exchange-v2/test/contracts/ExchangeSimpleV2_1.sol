// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma abicoder v2;

import "./ExchangeSimpleV2.sol";

contract ExchangeSimpleV2_1 is ExchangeSimpleV2 {
    function getSomething() external pure returns (uint) {
        return 10;
    }
}
