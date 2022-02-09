// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

interface IWETH {
    function name() external view returns (string memory);
    function withdraw(uint wad) external;
}

