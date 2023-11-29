// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ExchangeProtocolFee is Ownable {
    ProtocolFeeData public protocolFee;

    /// @dev event that's emitted when ProtocolFeeData buyerAmount changes
    event BuyerFeeAmountChanged(uint oldValue, uint newValue);

    /// @dev event that's emitted when ProtocolFeeData sellerAmount changes
    event SellerFeeAmountChanged(uint oldValue, uint newValue);

    /// @dev event that's emitted when ProtocolFeeData receiver changes
    event FeeReceiverChanged(address oldValue, address newValue);

    /// @dev struct to store protocol fee - receiver address, buyer fee amount (in bp), seller fee amount (in bp)
    struct ProtocolFeeData {
        address receiver;
        uint48 buyerAmount;
        uint48 sellerAmount;
    }

    function setPrtocolFeeReceiver(address _receiver) public onlyOwner {
        emit FeeReceiverChanged(protocolFee.receiver, _receiver);
        protocolFee.receiver = _receiver;
    }

    function setPrtocolFeeBuyerAmount(uint48 _buyerAmount) public onlyOwner {
        emit BuyerFeeAmountChanged(protocolFee.buyerAmount, _buyerAmount);
        protocolFee.buyerAmount = _buyerAmount;
    }

    function setPrtocolFeeSellerAmount(uint48 _sellerAmount) public onlyOwner {
        emit SellerFeeAmountChanged(protocolFee.sellerAmount, _sellerAmount);
        protocolFee.sellerAmount = _sellerAmount;
    }

    function setAllProtocolFeeData(address _receiver, uint48 _buyerAmount, uint48 _sellerAmount) public onlyOwner {
        setPrtocolFeeReceiver(_receiver);
        setPrtocolFeeBuyerAmount(_buyerAmount);
        setPrtocolFeeSellerAmount(_sellerAmount);
    }
}
