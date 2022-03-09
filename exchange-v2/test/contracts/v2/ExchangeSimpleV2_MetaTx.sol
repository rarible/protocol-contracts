// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../../../contracts/ExchangeV2Core.sol";
import "./SimpleTransferManager.sol";
import "@rarible/meta-tx/contracts/EIP712MetaTransaction.sol";

contract ExchangeSimpleV2_MetaTx is ExchangeV2Core, SimpleTransferManager, EIP712MetaTransaction {
    function __ExchangeSimpleV2_init(
        address _transferProxy,
        address _erc20TransferProxy
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __OrderValidator_init_unchained();
        __TransferExecutor_init_unchained(_transferProxy, _erc20TransferProxy);
        __MetaTransaction_init_unchained("ExchangeV2","1");
    }

    function _msgSender() internal view virtual override(ContextUpgradeable, EIP712MetaTransaction) returns (address payable) {
        return super._msgSender();
    }

    function getProtocolFee() internal override virtual view returns(uint) {
        return 0;
    }

}
