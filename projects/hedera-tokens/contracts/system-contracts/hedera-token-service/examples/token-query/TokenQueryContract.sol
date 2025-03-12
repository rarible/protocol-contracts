// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "../../HederaTokenService.sol";
import "../../ExpiryHelper.sol";
import "../../KeyHelper.sol";

contract TokenQueryContract is HederaTokenService, ExpiryHelper, KeyHelper {

    event ResponseCode(int responseCode);
    event AllowanceValue(uint256 amount);
    event ApprovedAddress(address approved);
    event Approved(bool approved);
    event Frozen(bool frozen);
    event KycGranted(bool kycGranted);
    event TokenCustomFees(IHederaTokenService.FixedFee[] fixedFees, IHederaTokenService.FractionalFee[] fractionalFees, IHederaTokenService.RoyaltyFee[] royaltyFees);
    event TokenDefaultFreezeStatus(bool defaultFreezeStatus);
    event TokenDefaultKycStatus(bool defaultKycStatus);
    event TokenExpiryInfo(IHederaTokenService.Expiry expiryInfo);
    event FungibleTokenInfo(IHederaTokenService.FungibleTokenInfo tokenInfo);
    event TokenInfo(IHederaTokenService.TokenInfo tokenInfo);
    event TokenKey(IHederaTokenService.KeyValue key);
    event NonFungibleTokenInfo(IHederaTokenService.NonFungibleTokenInfo tokenInfo);
    event IsToken(bool isToken);
    event TokenType(int32 tokenType);

    function allowancePublic(address token, address owner, address spender) public returns (int responseCode, uint256 amount) {
        (responseCode, amount) = HederaTokenService.allowance(token, owner, spender);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert ();
        }

        emit AllowanceValue(amount);
    }

    function getApprovedPublic(address token, uint256 serialNumber) public returns (int responseCode, address approved) {
        (responseCode, approved) = HederaTokenService.getApproved(token, serialNumber);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }

        emit ApprovedAddress(approved);
    }

    function isApprovedForAllPublic(address token, address owner, address operator) public returns (int responseCode, bool approved) {
        (responseCode, approved) = HederaTokenService.isApprovedForAll(token, owner, operator);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }

        emit Approved(approved);
    }

    function isFrozenPublic(address token, address account) public returns (int responseCode, bool frozen) {
        (responseCode, frozen) = HederaTokenService.isFrozen(token, account);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
        emit Frozen(frozen);
    }

    function isKycPublic(address token, address account) external returns (int64 responseCode, bool kycGranted) {
        (responseCode, kycGranted) = HederaTokenService.isKyc(token, account);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }

        emit KycGranted(kycGranted);
    }

    function getTokenCustomFeesPublic(address token) public returns (
        int64 responseCode,
        IHederaTokenService.FixedFee[] memory fixedFees,
        IHederaTokenService.FractionalFee[] memory fractionalFees,
        IHederaTokenService.RoyaltyFee[] memory royaltyFees) {
        (responseCode, fixedFees, fractionalFees, royaltyFees) = HederaTokenService.getTokenCustomFees(token);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }

        emit TokenCustomFees(fixedFees, fractionalFees, royaltyFees);
    }

    function getTokenDefaultFreezeStatusPublic(address token) public returns (int responseCode, bool defaultFreezeStatus) {
        (responseCode, defaultFreezeStatus) = HederaTokenService.getTokenDefaultFreezeStatus(token);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }

        emit TokenDefaultFreezeStatus(defaultFreezeStatus);
    }

    function getTokenDefaultKycStatusPublic(address token) public returns (int responseCode, bool defaultKycStatus) {
        (responseCode, defaultKycStatus) = HederaTokenService.getTokenDefaultKycStatus(token);

        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }

        emit TokenDefaultKycStatus(defaultKycStatus);
    }

    function getTokenExpiryInfoPublic(address token)external returns (int responseCode, IHederaTokenService.Expiry memory expiryInfo) {
        (responseCode, expiryInfo) = HederaTokenService.getTokenExpiryInfo(token);
        emit ResponseCode(responseCode);

        if(responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }

        emit TokenExpiryInfo(expiryInfo);
    }

    function getFungibleTokenInfoPublic(address token) public returns (int responseCode, IHederaTokenService.FungibleTokenInfo memory tokenInfo) {
        (responseCode, tokenInfo) = HederaTokenService.getFungibleTokenInfo(token);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }

        emit FungibleTokenInfo(tokenInfo);
    }

    function getTokenInfoPublic(address token) public returns (int responseCode, IHederaTokenService.TokenInfo memory tokenInfo) {
        (responseCode, tokenInfo) = HederaTokenService.getTokenInfo(token);

        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }

        emit TokenInfo(tokenInfo);
    }

    function getTokenKeyPublic(address token, uint keyType)
    public returns (int64 responseCode, IHederaTokenService.KeyValue memory key) {
        (responseCode, key) = HederaTokenService.getTokenKey(token, keyType);
        emit ResponseCode(responseCode);

        if(responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }

        emit TokenKey(key);
    }

    function getNonFungibleTokenInfoPublic(address token, int64 serialNumber) public returns (int responseCode, IHederaTokenService.NonFungibleTokenInfo memory tokenInfo) {
        (responseCode, tokenInfo) = HederaTokenService.getNonFungibleTokenInfo(token, serialNumber);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }

        emit NonFungibleTokenInfo(tokenInfo);
    }

    function isTokenPublic(address token) public returns (int64 responseCode, bool isTokenFlag) {
        (responseCode, isTokenFlag) = HederaTokenService.isToken(token);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }

        emit IsToken(isTokenFlag);
    }

    function getTokenTypePublic(address token) public returns (int64 responseCode, int32 tokenType) {
        (responseCode, tokenType) = HederaTokenService.getTokenType(token);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }

        emit TokenType(tokenType);
    }
}