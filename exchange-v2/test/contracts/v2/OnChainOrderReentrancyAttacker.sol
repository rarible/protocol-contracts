// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../../../contracts/ExchangeV2Core.sol";

contract OnChainOrderReentrancyAttacker {
    ExchangeV2Core public exchangeV2;
    LibOrder.Order public attackOrder;
    bool public flg;

    constructor(address _exchangeV2) public {
        exchangeV2 = ExchangeV2Core(_exchangeV2);
    }

    function setOrder(LibOrder.Order memory _order) external {
        attackOrder = _order;
    }

    function upsert() public payable {
        exchangeV2.upsertOrder{value: msg.value }(attackOrder);
    }

    function attack() public payable {
        exchangeV2.upsertOrder{value: msg.value }(attackOrder);
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    fallback() external payable {
        revert("SKS fallback reentrancy attack fallback");
        exchangeV2.cancel(attackOrder);
    }

    receive() external payable {
        if (!flg) {
            flg = true;
            return;
        }
        revert("SKS fallback reentrancy attack receive");
        exchangeV2.upsertOrder{value: msg.value }(attackOrder);
    }
}
