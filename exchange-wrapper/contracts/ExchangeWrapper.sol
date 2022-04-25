// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/exchange-v2/contracts/lib/LibTransfer.sol";
import "@rarible/exchange-v2/contracts/lib/BpLibrary.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@rarible/exchange-interfaces/contracts/IWyvernExchange.sol";
import "@rarible/exchange-interfaces/contracts/IExchangeV2.sol";
import "@rarible/royalties/contracts/LibPart.sol";


contract ExchangeWrapper is OwnableUpgradeable {
    using LibTransfer for address;
    using BpLibrary for uint;
    using SafeMathUpgradeable for uint;


    IWyvernExchange public wyvernExchange;
    IExchangeV2 public exchangeV2;

    enum Markets {
        ExchangeV2,
        WyvernExchange
    }

    struct PurchaseDetails {
        Markets marketId;
        uint256 amount;
        bytes data;
    }

    function __ExchangeWrapper_init(
        IWyvernExchange _wyvernExchange,
        IExchangeV2 _exchangeV2
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        wyvernExchange = _wyvernExchange;
        exchangeV2 = _exchangeV2;
    }

    function setWyvern(IWyvernExchange _wyvernExchange) external onlyOwner {
        wyvernExchange = _wyvernExchange;
    }

    function setExchange(IExchangeV2 _exchangeV2) external onlyOwner {
        exchangeV2 = _exchangeV2;
    }

    function singlePurchase(PurchaseDetails memory purchaseDetails, uint[] memory fees) external payable {
        dataTransfer(purchaseDetails);

        feesTransfer(msg.value, fees);

        changeTransfer();
    }

    function bulkPurchase(PurchaseDetails[] memory purchaseDetails, uint[] memory fees) external payable {
        for (uint i = 0; i < purchaseDetails.length; i++) {
            dataTransfer(purchaseDetails[i]);
        }

        feesTransfer(msg.value, fees);

        changeTransfer();
    }

    function dataTransfer(PurchaseDetails memory purchaseDetails) internal {
        uint paymentAmount = purchaseDetails.amount;
        if (purchaseDetails.marketId == Markets.WyvernExchange) {
            (bool success,) = address(wyvernExchange).call{value : paymentAmount}(purchaseDetails.data);
            _checkCallResult(success);
        } else if (purchaseDetails.marketId == Markets.ExchangeV2) {
            (LibOrder.Order memory sellOrder, bytes memory sellOrderSignature) = abi.decode(purchaseDetails.data, (LibOrder.Order, bytes));
            matchExchangeV2(sellOrder, sellOrderSignature, paymentAmount);
        }
    }

    function feesTransfer(uint amount, uint[] memory fees) internal {
        uint spent = amount.sub(address(this).balance);
        for (uint i = 0; i < fees.length; i++) {
            uint feeValue = spent.bp(uint(fees[i] >> 160));
            if (feeValue > 0) {
                LibTransfer.transferEth(address(fees[i]), feeValue);
            }
        }
    }

    function changeTransfer() internal {
        uint ethAmount = address(this).balance;
        if (ethAmount > 0) {
            address(_msgSender()).transferEth(ethAmount);
        }
    }

    function _checkCallResult(bool _success) internal pure {
        if (!_success) {
            // Copy revert reason from call
            assembly {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }
        }
    }

    /*Transfer by ExchangeV2 sellOrder is in input, buyOrder is generated inside method */
    function matchExchangeV2(
        LibOrder.Order memory sellOrder,
        bytes memory sellOrderSignature,
        uint amount
    ) internal {
        LibOrder.Order memory buyerOrder;
        buyerOrder.maker = address(this);
        buyerOrder.makeAsset = sellOrder.takeAsset;
        buyerOrder.takeAsset = sellOrder.makeAsset;

        /*set buyer in payout*/
        LibPart.Part[] memory payout = new LibPart.Part[](1);
        payout[0].account = _msgSender();
        payout[0].value = 10000;
        LibOrderDataV2.DataV2 memory data;
        data.payouts = payout;
        buyerOrder.data = abi.encode(data);
        buyerOrder.dataType = bytes4(keccak256("V2"));

        bytes memory buyOrderSignature; //empty signature is enough for buyerOrder

        IExchangeV2(exchangeV2).matchOrders{value : amount }(sellOrder, sellOrderSignature, buyerOrder, buyOrderSignature);
    }

    receive() external payable {}
}