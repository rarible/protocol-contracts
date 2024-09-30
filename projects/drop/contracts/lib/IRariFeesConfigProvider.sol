// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IRariFeesConfigProvider {
    function getFee(address currency) external view returns (uint);

    function getRecipient() external view returns (address);
}
