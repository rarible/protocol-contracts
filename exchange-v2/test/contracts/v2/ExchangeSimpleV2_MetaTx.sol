// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../../../contracts/ExchangeV2Core.sol";
import "@rarible/meta-tx/contracts/EIP712MetaTransaction.sol";

contract ExchangeSimpleV2_MetaTx is ExchangeV2Core, EIP712MetaTransaction {
    function __ExchangeSimpleV2_init(
        ITransferManager newRaribleTransferManager,
        uint newProtocolFee
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __OrderValidator_init_unchained();
        __EchangeV2Core_init_unchained(newRaribleTransferManager, newProtocolFee);        __MetaTransaction_init_unchained("ExchangeV2","1");
    }

    function _msgSender() internal view virtual override(ContextUpgradeable, EIP712MetaTransaction) returns (address payable) {
        return super._msgSender();
    }

}
