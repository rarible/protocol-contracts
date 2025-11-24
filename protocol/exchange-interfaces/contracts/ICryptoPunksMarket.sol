// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

interface ICryptoPunksMarket {
    //to get address punk owner from mapping (uint => address) public punkIndexToAddress;
    function punkIndexToAddress(uint key) external returns (address);

    function buyPunk(uint punkIndex) payable external;

    function transferPunk(address to, uint punkIndex) external;

    function offerPunkForSaleToAddress(uint punkIndex, uint minSalePriceInWei, address toAddress) external;
}