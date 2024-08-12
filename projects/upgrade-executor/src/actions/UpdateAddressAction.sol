// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.7.6;

import "@rarible/exchange-wrapper/contracts/RaribleExchangeWrapperUpgradeable.sol";

contract UpdateAddressAction {
    function perform(
        address target,
        RaribleExchangeWrapperUpgradeable.Markets market,
        address newAddress
    ) public {
        RaribleExchangeWrapperUpgradeable(payable(target)).updateMarketplaceAddress(market, newAddress);
    }
}
