// SPDX-License-Identifier: MIT

pragma solidity ^0.7.6;

library LibWyvernData {
    struct DataBytes{
        bytes calldataBuy;
        bytes calldataSell;
        bytes replacementPatternBuy;
        bytes replacementPatternSell;
        bytes staticExtradataBuy;
        bytes staticExtradataSell;
    }
}
