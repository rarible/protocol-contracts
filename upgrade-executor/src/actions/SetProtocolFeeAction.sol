// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.13;

import "./interfaces/ExchangeProtocolFee.sol";

contract SetProtocolFeeAction {
    ExchangeProtocolFee public immutable exchangeV2;

    constructor(ExchangeProtocolFee _exchangeV2) {
        exchangeV2 = _exchangeV2;
    }

    function perform(address _receiver, uint48 _buyerAmount, uint48 _sellerAmount) external {
        exchangeV2.setAllProtocolFeeData(_receiver, _buyerAmount, _sellerAmount);
    }
}
