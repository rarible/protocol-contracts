// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;
pragma abicoder v2;

import "@rarible/exchange-interfaces/contracts/IWyvernExchange.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@rarible/libraries/contracts/LibFeeCalculate.sol";


contract WyvernExchangeProxy is OwnableUpgradeable {

    IWyvernExchange public wyvernExchange;
    address payable public protocolFeeReceiver;
    uint public protocolFee;

    function __WyvernExchangeProxy_init(
        IWyvernExchange _wyvernExchange,
        uint _newProtocolFee
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        wyvernExchange = _wyvernExchange;
        protocolFee = _newProtocolFee;
    }

    function setWyvernExchange(IWyvernExchange newWyvernExchange) external onlyOwner {
        wyvernExchange = newWyvernExchange;
    }

    function setFeeReceiver(address payable wallet) external onlyOwner {
        protocolFeeReceiver = wallet;
    }

    function setFee(uint newProtocolFee) external onlyOwner {
        protocolFee = newProtocolFee;
    }

    function atomicMatch_(
        address[14] memory addrs,
        uint[18] memory uints,
        uint8[8] memory feeMethodsSidesKindsHowToCalls,
        bytes memory calldataBuy,
        bytes memory calldataSell,
        bytes memory replacementPatternBuy,
        bytes memory replacementPatternSell,
        bytes memory staticExtradataBuy,
        bytes memory staticExtradataSell,
        uint8[2] memory vs,
        bytes32[5] memory rssMetadata)
    external payable {
        calculateAndTransferFee (addrs[10], uints[13], uints[4]);
        //todo unkomment because this is main function
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

    function calculateAndTransferFee(address sellTakerRelayerFee, uint sellBasePrice, uint buyBasePrice) internal {
        uint sellPrice;
        if (sellTakerRelayerFee != address(0)) {
            sellPrice = sellBasePrice;
        } else {
            sellPrice = buyBasePrice;
        }
        (, uint feeValue) = LibFeeCalculate.subFeeInBp(sellPrice, sellPrice, protocolFee);
        if (feeValue > 0) {
            protocolFeeReceiver.transfer(feeValue);
        }

    }
}
