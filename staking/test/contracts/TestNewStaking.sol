// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "@rarible/lib-broken-line/contracts/LibBrokenLine.sol";
import "../../contracts/INextVersionStake.sol";

contract TestNewStaking is INextVersionStake {
    function initiateData(uint idLock, LibBrokenLine.LineData memory lineData, address locker, address delegate) override external {

    }
}
