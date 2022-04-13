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
            address proxy;
            if (tradeDetails[i].marketWyvern == true) {
                proxy = address(wyvernExchange);
            } else {
                proxy = address(exchangeV2);
            }
            (bool success,) = proxy.call{value : tradeDetails[i].amount}(tradeDetails[i].tradeData);
            // check if the call passed successfully
            _checkCallResult(success);
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

    receive() external payable {}
}