// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./ExchangeV2Core.sol";
import "@rarible/transfer-manager/contracts/RaribleTransferManager.sol";

contract ExchangeV2 is ExchangeV2Core, RaribleTransferManager {
    function __ExchangeV2_init(
        address _transferProxy,
        address _erc20TransferProxy,
        uint newProtocolFee,
        address newDefaultFeeReceiver,
        IRoyaltiesProvider newRoyaltiesProvider
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __TransferExecutor_init_unchained(_transferProxy, _erc20TransferProxy);
        __RaribleTransferManager_init_unchained(newProtocolFee, newDefaultFeeReceiver, newRoyaltiesProvider);
        __OrderValidator_init_unchained();
    }

    function __ExchangeV2_init_proxy(
        address _transferProxy,
        address _erc20TransferProxy,
        uint newProtocolFee,
        address newDefaultFeeReceiver,
        IRoyaltiesProvider newRoyaltiesProvider,
        address _initialOwner,
        bytes4[] memory assetTypes, 
        address[] memory proxies,
        bytes4 assetMatcherType,
        address assetMatcher
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __TransferExecutor_init_unchained(_transferProxy, _erc20TransferProxy);
        __RaribleTransferManager_init_unchained(newProtocolFee, newDefaultFeeReceiver, newRoyaltiesProvider);
        __OrderValidator_init_unchained();
        for (uint i = 0; i < assetTypes.length; i++) {
            _setTransferProxy(assetTypes[i], proxies[i]);
        }
        _setAssetMatcher(assetMatcherType, assetMatcher);
        transferOwnership(_initialOwner);
    }
}
