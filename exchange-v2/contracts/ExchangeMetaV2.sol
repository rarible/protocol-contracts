// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./ExchangeV2Core.sol";
import "./EmptyGap.sol";
import "@rarible/meta-tx/contracts/EIP712MetaTransaction.sol";

contract ExchangeMetaV2 is ExchangeV2Core, EmptyGap, EIP712MetaTransaction {
    function __ExchangeV2_init(
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __OrderValidator_init_unchained();
        __MetaTransaction_init_unchained("ExchangeMetaV2", "1");
    }

    function _msgSender() internal view virtual override(ContextUpgradeable, EIP712MetaTransaction) returns (address payable) {
        return super._msgSender();
    }
}
