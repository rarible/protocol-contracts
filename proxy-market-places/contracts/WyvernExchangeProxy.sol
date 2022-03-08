// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;
pragma abicoder v2;

import "@rarible/exchange-interfaces/contracts/IWyvernExchange.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@rarible/libraries/contracts/LibFeeCalculate.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

contract WyvernExchangeProxy is OwnableUpgradeable {

    IWyvernExchange public wyvernExchange;
    address payable public protocolFeeReceiverETH;
    address public protocolFeeReceiverERC20;
    uint public protocolFee;

    function __WyvernExchangeProxy_init(
        IWyvernExchange _wyvernExchange,
        address payable _protocolFeeReceiverETH,
        address _protocolFeeReceiverERC20,
        uint _newProtocolFee
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        wyvernExchange = _wyvernExchange;
        protocolFeeReceiverETH = _protocolFeeReceiverETH;
        protocolFeeReceiverERC20 = _protocolFeeReceiverERC20;
        protocolFee = _newProtocolFee;
    }

    function setWyvernExchange(IWyvernExchange newWyvernExchange) external onlyOwner {
        wyvernExchange = newWyvernExchange;
    }

    function setFeeReceiverETH(address payable wallet) external onlyOwner {
        protocolFeeReceiverETH = wallet;
    }

    function setFeeReceiverERC20(address wallet) external onlyOwner {
        protocolFeeReceiverERC20 = wallet;
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
        calculateAndTransferFee (addrs[10], addrs[13], addrs[1], uints[13], uints[4]);
        //todo unkomment because this is main function
//        wyvernExchange.atomicMatch_(
//            addrs,
//            uints,
//            feeMethodsSidesKindsHowToCalls,
//            calldataBuy,
//            calldataSell,
//            replacementPatternBuy,
//            replacementPatternSell,
//            staticExtradataBuy,
//            staticExtradataSell,
//            vs,
//            rssMetadata);
    }

    function calculateAndTransferFee(address sellTakerRelayerFee, address sellPaymentToken, address buyMaker, uint sellBasePrice, uint buyBasePrice) internal {
        uint sellPrice;
        if (sellTakerRelayerFee != address(0)) {
            sellPrice = sellBasePrice;
        } else {
            sellPrice = buyBasePrice;
        }
        (, uint feeValue) = LibFeeCalculate.subFeeInBp(sellPrice, sellPrice, protocolFee);
        if (feeValue > 0 && sellPaymentToken == address(0)) {
            protocolFeeReceiverETH.transfer(feeValue);
        }
        if (feeValue > 0 && sellPaymentToken != address(0)) {
            IERC20Upgradeable(sellPaymentToken).transferFrom(buyMaker, protocolFeeReceiverERC20, feeValue);
        }
    }
}
