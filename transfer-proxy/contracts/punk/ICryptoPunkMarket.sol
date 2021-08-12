// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

interface ICryptoPunkMarket {
    function buyPunk(uint punkIndex) payable external;
    function transferPunk(address to, uint punkIndex) external;
}