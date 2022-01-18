// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./ExchangeV2Core.sol";
import "./EmptyGap.sol";

contract ExchangeV2 is ExchangeV2Core, EmptyGap {
    function __ExchangeV2_init(
        ITransferManager newRaribleTransferManager
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __OrderValidator_init_unchained();
        __EchangeV2Core_init_unchained(newRaribleTransferManager);
    }
    
    function getOrderProtocolFee(LibOrder.Order memory order, bytes32 hash) override internal view returns(uint) {
        if (isTheSameAsOnChain(order, hash)) {
            return onChainOrders[hash].fee;
        } else {
            return protocolFee;
        }
    }

    function getProtocolFee() override internal view returns(uint) {
        return protocolFee;
    }

}
