// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "./SafeViewHTS.sol";

contract SafeViewOperations is SafeViewHTS {
    event Allowance(uint256);
    event GetApproved(address);
    event IsApprovedForAll(bool);
    event IsFrozen(bool);
    event IsKyc(bool);
    event GetTokenCustomFees(IHederaTokenService.FixedFee[], IHederaTokenService.FractionalFee[], IHederaTokenService.RoyaltyFee[]);
    event GetTokenDefaultFreezeStatus(bool);
    event GetTokenDefaultKycStatus(bool);
    event GetTokenExpiryInfo(IHederaTokenService.Expiry);
    event GetFungibleTokenInfo(IHederaTokenService.FungibleTokenInfo);
    event GetTokenInfo(IHederaTokenService.TokenInfo);
    event GetTokenKey(IHederaTokenService.KeyValue);
    event GetNonFungibleTokenInfo(IHederaTokenService.NonFungibleTokenInfo);
    event IsToken(bool);
    event GetTokenType(int32);

    function safeAllowancePublic(address token, address owner, address spender) external returns (uint256 allowance) {
        allowance = safeAllowance(token, owner, spender);
        emit Allowance(allowance);
    }

    function safeGetApprovedPublic(address token, int64 serialNumber) external returns (address approved) {
        approved = safeGetApproved(token, serialNumber);
        emit GetApproved(approved);
    }

    function safeIsApprovedForAllPublic(address token, address owner, address operator) external returns (bool approved) {
        approved = safeIsApprovedForAll(token, owner, operator);
        emit IsApprovedForAll(approved);
    }

    function safeIsFrozenPublic(address token, address account) external returns (bool frozen) {
        frozen = safeIsFrozen(token, account);
        emit IsFrozen(frozen);
    }

    function safeIsKycPublic(address token, address account) external returns (bool kycGranted) {
        kycGranted = safeIsKyc(token, account);
        emit IsKyc(kycGranted);
    }

    function safeGetTokenCustomFeesPublic(address token) external returns (IHederaTokenService.FixedFee[] memory fixedFees, IHederaTokenService.FractionalFee[] memory fractionalFees, IHederaTokenService.RoyaltyFee[] memory royaltyFees) {
        (fixedFees, fractionalFees, royaltyFees) = safeGetTokenCustomFees(token);
        emit GetTokenCustomFees(fixedFees, fractionalFees, royaltyFees);
    }

    function safeGetTokenDefaultFreezeStatusPublic(address token) external returns (bool defaultFreezeStatus) {
        defaultFreezeStatus = safeGetTokenDefaultFreezeStatus(token);
        emit GetTokenDefaultFreezeStatus(defaultFreezeStatus);
    }

    function safeGetTokenDefaultKycStatusPublic(address token) external returns (bool defaultKycStatus) {
        defaultKycStatus = safeGetTokenDefaultKycStatus(token);
        emit GetTokenDefaultKycStatus(defaultKycStatus);
    }

    function safeGetTokenExpiryInfoPublic(address token) external returns (IHederaTokenService.Expiry memory expiry) {
        expiry = safeGetTokenExpiryInfo(token);
        emit GetTokenExpiryInfo(expiry);
    }

    function safeGetFungibleTokenInfoPublic(address token) external returns (IHederaTokenService.FungibleTokenInfo memory fungibleTokenInfo) {
        fungibleTokenInfo = safeGetFungibleTokenInfo(token);
        emit GetFungibleTokenInfo(fungibleTokenInfo);
    }

    function safeGetTokenInfoPublic(address token) external returns (IHederaTokenService.TokenInfo memory tokenInfo) {
        tokenInfo = safeGetTokenInfo(token);
        emit GetTokenInfo(tokenInfo);
    }

    function safeGetTokenKeyPublic(address token, uint keyType) external returns (IHederaTokenService.KeyValue memory key) {
        key = safeGetTokenKey(token, keyType);
        emit GetTokenKey(key);
    }

    function safeGetNonFungibleTokenInfoPublic(address token, int64 serialNumber) external returns (IHederaTokenService.NonFungibleTokenInfo memory nonFungibleTokenInfo) {
        nonFungibleTokenInfo = safeGetNonFungibleTokenInfo(token, serialNumber);
        emit GetNonFungibleTokenInfo(nonFungibleTokenInfo);
    }

    function safeIsTokenPublic(address token) external returns (bool isToken) {
        isToken = safeIsToken(token);
        emit IsToken(isToken);
    }

    function safeGetTokenTypePublic(address token) external returns (int32 tokenType) {
        tokenType = safeGetTokenType(token);
        emit GetTokenType(tokenType);
    }
}
