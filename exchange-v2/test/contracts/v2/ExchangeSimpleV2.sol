// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../../../contracts/ExchangeV2Core.sol";
//import "./SimpleTransferManager.sol";

contract ExchangeSimpleV2 is ExchangeV2Core {
    function __ExchangeSimpleV2_init(
        ITransferManager newRaribleTransferManager,
        uint newProtocolFee
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __OrderValidator_init_unchained();
        __EchangeV2Core_init_unchained(newRaribleTransferManager, newProtocolFee);
    }

    function getExternalTransferExecutor() internal view override returns (IExternalTransferExecutor) {
        return transferManager;
    }

    function isTheSameAsOnChainTest(LibOrder.Order memory order, bytes32 hash) external view returns(bool) {
//        return isTheSameAsOnChain(order, hash);
    }

    function getOrderProtocolFee(LibOrder.Order memory order, bytes32 hash) override internal view returns(uint) {
        return protocolFee;
    }

    function getProtocolFee() override internal view returns(uint) {
        return protocolFee;
    }
}
