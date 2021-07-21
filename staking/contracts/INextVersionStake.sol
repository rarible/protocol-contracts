// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/lib-broken-line/contracts/LibBrokenLine.sol";

interface INextVersionStake {
    function initiateData(uint idLock, LibBrokenLine.LineData memory lineData, address locker, address delegate) external;
}
