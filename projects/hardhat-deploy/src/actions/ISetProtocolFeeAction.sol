// SPDX-License-Identifier: MIT
// https://etherscan.io/address/0xcaC1fE02cB051672D93eE390136B8E10301B6709#code
pragma solidity ^0.8.16;

interface ISetPrtocolFeeAction {
    function perform(address _receiver, uint48 _buyerAmount, uint48 _sellerAmount) external;
}