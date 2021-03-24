// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "./ExchangeV2Core.sol";
import "./RaribleTransferManager.sol";
import "./RoyaltiesRegistry.sol";

contract ExchangeV2 is ExchangeV2Core, RaribleTransferManager {
    function __ExchangeV2_init(
        TransferProxy _transferProxy,
        ERC20TransferProxy _erc20TransferProxy,
        uint newBuyerFee,
        uint newSellerFee,
        address newCommunityWallet,
        RoyaltiesRegistry newRoyaltiesRegistry
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __TransferExecutor_init_unchained(_transferProxy, _erc20TransferProxy);
        __RaribleTransferManager_init_unchained(newBuyerFee, newSellerFee, newCommunityWallet, newRoyaltiesRegistry);
        __OrderValidator_init_unchained();
    }
}
