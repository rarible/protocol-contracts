// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;
pragma abicoder v2;

import "@rarible/exchange-interfaces/contracts/IWyvernExchange.sol";
import "@rarible/libraries/contracts/LibWyvernData.sol";

contract WyvernExchangeProxy {
    IWyvernExchange public wyvernExchange;
    address public feeReceiver;

    function setWyvernExchange (IWyvernExchange newWyvernExchange) external { //todo onlyOwner
        wyvernExchange = newWyvernExchange;
    }

    function setFeeReceiver(address wallet) external {//todo onlyOwner
        feeReceiver = wallet;
    }

    function atomicMatch_(
        address[14] memory addrs,
        uint[18] memory uints,
        uint8[8] memory feeMethodsSidesKindsHowToCalls,
//        LibWyvernData.DataBytes memory data,
        bytes memory calldataBuy,
        bytes memory calldataSell,
        bytes memory replacementPatternBuy,
        bytes memory replacementPatternSell,
        bytes memory staticExtradataBuy,
        bytes memory staticExtradataSell,
        uint8[2] memory vs,
        bytes32[5] memory rssMetadata)
    external payable {
        wyvernExchange.atomicMatch_(
        addrs,
        uints,
        feeMethodsSidesKindsHowToCalls,
        calldataBuy,
        calldataSell,
        replacementPatternBuy,
        replacementPatternSell,
        staticExtradataBuy,
        staticExtradataSell,
        vs,
        rssMetadata);
    }
}
