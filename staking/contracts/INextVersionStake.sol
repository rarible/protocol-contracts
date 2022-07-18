// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma abicoder v2;

import "./lib-broken-line/LibBrokenLine.sol";

interface INextVersionStake {
    function initiateData(uint idLock, LibBrokenLine.LineData memory lineData, address locker, address delegate) external;
}
