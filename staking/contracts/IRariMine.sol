// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;


interface IRariMine {
    event Claim(address indexed owner, uint value);
    event Value(address indexed owner, uint value);

    struct Balance {
        address recipient;
        uint256 value;
    }
}
