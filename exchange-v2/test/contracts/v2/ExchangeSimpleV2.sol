// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../../../contracts/ExchangeV2Core.sol";
import "./SimpleTransferManager.sol";

contract ExchangeSimpleV2 is ExchangeV2Core, SimpleTransferManager {
    function __ExchangeSimpleV2_init(
        INftTransferProxy _transferProxy,
        IERC20TransferProxy _erc20TransferProxy
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __TransferExecutor_init_unchained(_transferProxy, _erc20TransferProxy);
        __OrderValidator_init_unchained();
    }

    function isTheSameAsOnChainTest(LibOrder.Order memory order, bytes32 hash) external view returns(bool){
        return isTheSameAsOnChain(order, hash);
    }
}
