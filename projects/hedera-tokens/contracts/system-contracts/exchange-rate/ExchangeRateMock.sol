// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;

import "./SelfFunding.sol";

contract ExchangeRateMock is SelfFunding {
    event TinyBars(uint256 tinybars);
    event TinyCents(uint256 tinycents);

    function convertTinycentsToTinybars(uint256 tineycents) external returns (uint256 tinybars) {
        tinybars = tinycentsToTinybars(tineycents);
        emit TinyBars(tinybars);
    }

    function convertTinybarsToTinycents(uint256 tinybars) external returns (uint256 tineycents) {
        tineycents = tinybarsToTinycents(tinybars);
        emit TinyCents(tineycents);
    }
}