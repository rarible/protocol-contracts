// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

library BpLibrary {
    function bp(uint value, uint bpValue) internal pure returns (uint) {
        return (value * bpValue) / 10000;
    }
}
