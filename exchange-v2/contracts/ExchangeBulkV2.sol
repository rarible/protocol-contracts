// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./lib/LibTransfer.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@rarible/exchange-interfaces/contracts/IWyvernExchange.sol";
import "@rarible/exchange-interfaces/contracts/IExchangeV2.sol";

contract ExchangeBulkV2 is OwnableUpgradeable {
    using LibTransfer for address;

    IWyvernExchange public wyvernExchange;
    IExchangeV2 public exchangeV2;

    struct TradeDetails {
        bool marketWyvern; //if true - market is IWyvernExchange, else IExchangeV2
        uint256 amount;
        bytes tradeData;
    }

    function __ExchangeBulkV2_init(
        IWyvernExchange _wyvernExchange,
        IExchangeV2 _exchangeV2
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        wyvernExchange = _wyvernExchange;
        exchangeV2 = _exchangeV2;
    }

    function bulkTransfer(TradeDetails[] memory tradeDetails) external payable {
        for (uint i = 0; i < tradeDetails.length; i++) {
            if (tradeDetails[i].marketWyvern == true) {
                (bool success,) = address(wyvernExchange).call{value : tradeDetails[i].amount}(tradeDetails[i].tradeData);
                _checkCallResult(success);
            } else {
                (LibOrder.Order memory sellOrder, bytes memory sellOrderSignature) = abi.decode(tradeDetails[i].tradeData, (LibOrder.Order, bytes));
                matchExchangeV2(sellOrder, sellOrderSignature, tradeDetails[i].amount);
            }
        }
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

    function setWyvern(IWyvernExchange _wyvernExchange) external onlyOwner {
        wyvernExchange = _wyvernExchange;
    }

    function setExchange(IExchangeV2 _exchangeV2) external onlyOwner {
        exchangeV2 = _exchangeV2;
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