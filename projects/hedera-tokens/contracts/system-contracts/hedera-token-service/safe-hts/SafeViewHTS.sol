// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "../IHederaTokenService.sol";
import "../../HederaResponseCodes.sol";

abstract contract SafeViewHTS {

    address constant precompileAddress = address(0x167);
    // 90 days in seconds
    int32 constant defaultAutoRenewPeriod = 7776000;

    error AllowanceFailed();
    error GetApprovedFailed();
    error IsApprovedForAllFailed();
    error IsFrozenFailed();
    error IsKYCGrantedFailed();
    error GetTokenCustomFeesFailed();
    error GetTokenDefaultFreezeStatusFailed();
    error GetTokenDefaultKYCStatusFailed();
    error GetTokenExpiryInfoFailed();
    error GetFungibleTokenInfoFailed();
    error GetTokenInfoFailed();
    error GetTokenKeyFailed();
    error GetNonFungibleTokenInfoFailed();
    error IsTokenFailed();
    error GetTokenTypeFailed();

    function safeAllowance(address token, address owner, address spender) internal returns (uint256 allowance) {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.allowance.selector, token, owner, spender));
        (responseCode, allowance) = success ? abi.decode(result, (int32, uint256)) : (HederaResponseCodes.UNKNOWN, 0);
        if (responseCode != HederaResponseCodes.SUCCESS) revert AllowanceFailed();
    }

    function safeGetApproved(address token, int64 serialNumber) internal returns (address approved) {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getApproved.selector, token, serialNumber));
        (responseCode, approved) = success ? abi.decode(result, (int32, address)) : (HederaResponseCodes.UNKNOWN, address(0));
        if (responseCode != HederaResponseCodes.SUCCESS) revert GetApprovedFailed();
    }

    function safeIsApprovedForAll(address token, address owner, address operator) internal returns (bool approved) {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.isApprovedForAll.selector, token, owner, operator));
        (responseCode, approved) = success ? abi.decode(result, (int32, bool)) : (HederaResponseCodes.UNKNOWN, false);
        if (responseCode != HederaResponseCodes.SUCCESS) revert IsApprovedForAllFailed();
    }

    function safeIsFrozen(address token, address account) internal returns (bool frozen) {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.isFrozen.selector, token, account));
        (responseCode, frozen) = success ? abi.decode(result, (int32, bool)) : (HederaResponseCodes.UNKNOWN, false);
        if (responseCode != HederaResponseCodes.SUCCESS) revert IsFrozenFailed();
    }

    function safeIsKyc(address token, address account) internal returns (bool kycGranted) {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.isKyc.selector, token, account));
        (responseCode, kycGranted) = success ? abi.decode(result, (int32, bool)) : (HederaResponseCodes.UNKNOWN, false);
        if (responseCode != HederaResponseCodes.SUCCESS) revert IsKYCGrantedFailed();
    }

    function safeGetTokenCustomFees(address token) internal returns (IHederaTokenService.FixedFee[] memory fixedFees, IHederaTokenService.FractionalFee[] memory fractionalFees, IHederaTokenService.RoyaltyFee[] memory royaltyFees) {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getTokenCustomFees.selector, token));
        (responseCode, fixedFees, fractionalFees, royaltyFees) =
        success
        ? abi.decode(result, (int32, IHederaTokenService.FixedFee[], IHederaTokenService.FractionalFee[], IHederaTokenService.RoyaltyFee[]))
        : (HederaResponseCodes.UNKNOWN, fixedFees, fractionalFees, royaltyFees);
        if (responseCode != HederaResponseCodes.SUCCESS) revert GetTokenCustomFeesFailed();
    }

    function safeGetTokenDefaultFreezeStatus(address token) internal returns (bool defaultFreezeStatus) {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getTokenDefaultFreezeStatus.selector, token));
        (responseCode, defaultFreezeStatus) = success ? abi.decode(result, (int32, bool)) : (HederaResponseCodes.UNKNOWN, false);
        if (responseCode != HederaResponseCodes.SUCCESS) revert GetTokenDefaultFreezeStatusFailed();
    }

    function safeGetTokenDefaultKycStatus(address token) internal returns (bool defaultKycStatus) {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getTokenDefaultKycStatus.selector, token));
        (responseCode, defaultKycStatus) = success ? abi.decode(result, (int32, bool)) : (HederaResponseCodes.UNKNOWN, false);
        if (responseCode != HederaResponseCodes.SUCCESS) revert GetTokenDefaultKYCStatusFailed();
    }

    function safeGetTokenExpiryInfo(address token) internal returns (IHederaTokenService.Expiry memory expiry) {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getTokenExpiryInfo.selector, token));
        (responseCode, expiry) = success ? abi.decode(result, (int32, IHederaTokenService.Expiry)) : (HederaResponseCodes.UNKNOWN, expiry);
        if (responseCode != HederaResponseCodes.SUCCESS) revert GetTokenExpiryInfoFailed();
    }

    function safeGetFungibleTokenInfo(address token) internal returns (IHederaTokenService.FungibleTokenInfo memory fungibleTokenInfo) {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getFungibleTokenInfo.selector, token));
        (responseCode, fungibleTokenInfo) = success ? abi.decode(result, (int32, IHederaTokenService.FungibleTokenInfo)) : (HederaResponseCodes.UNKNOWN, fungibleTokenInfo);
        if (responseCode != HederaResponseCodes.SUCCESS) revert GetFungibleTokenInfoFailed();
    }

    function safeGetTokenInfo(address token) internal returns (IHederaTokenService.TokenInfo memory tokenInfo) {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getTokenInfo.selector, token));
        (responseCode, tokenInfo) = success ? abi.decode(result, (int32, IHederaTokenService.TokenInfo)) : (HederaResponseCodes.UNKNOWN, tokenInfo);
        if (responseCode != HederaResponseCodes.SUCCESS) revert GetTokenInfoFailed();
    }

    function safeGetTokenKey(address token, uint keyType) internal returns (IHederaTokenService.KeyValue memory key) {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getTokenKey.selector, token, keyType));
        (responseCode, key) = success ? abi.decode(result, (int32, IHederaTokenService.KeyValue)) : (HederaResponseCodes.UNKNOWN, key);
        if (responseCode != HederaResponseCodes.SUCCESS) revert GetTokenKeyFailed();
    }

    function safeGetNonFungibleTokenInfo(address token, int64 serialNumber) internal returns (IHederaTokenService.NonFungibleTokenInfo memory nonFungibleTokenInfo) {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getNonFungibleTokenInfo.selector, token, serialNumber));
        (responseCode, nonFungibleTokenInfo) = success ? abi.decode(result, (int32, IHederaTokenService.NonFungibleTokenInfo)) : (HederaResponseCodes.UNKNOWN, nonFungibleTokenInfo);
        if (responseCode != HederaResponseCodes.SUCCESS) revert GetNonFungibleTokenInfoFailed();
    }


    function safeIsToken(address token) internal returns (bool isToken) {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.isToken.selector, token));
        (responseCode, isToken) = success ? abi.decode(result, (int32, bool)) : (HederaResponseCodes.UNKNOWN, false);
        if (responseCode != HederaResponseCodes.SUCCESS) revert IsTokenFailed();
    }

    function safeGetTokenType(address token) internal returns (int32 tokenType) {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getTokenType.selector, token));
        (responseCode, tokenType) = success ? abi.decode(result, (int32, int32)) : (HederaResponseCodes.UNKNOWN, int32(0));
        if (responseCode != HederaResponseCodes.SUCCESS) revert GetTokenTypeFailed();
    }

    function tryDecodeSuccessResponseCode(bool success, bytes memory result) private pure returns (bool) {
        return (success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN) == HederaResponseCodes.SUCCESS;
    }

    function nonEmptyExpiry(IHederaTokenService.HederaToken memory token) private view {
        if (token.expiry.second == 0 && token.expiry.autoRenewPeriod == 0) {
            token.expiry.autoRenewPeriod = defaultAutoRenewPeriod;
            token.expiry.autoRenewAccount = address(this);
        }
    }
}
