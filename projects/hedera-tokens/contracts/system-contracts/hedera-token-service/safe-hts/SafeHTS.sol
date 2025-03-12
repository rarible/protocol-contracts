// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "../../HederaResponseCodes.sol";
import "../IHederaTokenService.sol";

abstract contract SafeHTS {

    address constant precompileAddress = address(0x167);
    // 90 days in seconds
    int32 constant defaultAutoRenewPeriod = 7776000;

    error CryptoTransferFailed();
    error MintFailed();
    error BurnFailed();
    error MultipleAssociationsFailed();
    error SingleAssociationFailed();
    error MultipleDissociationsFailed();
    error SingleDissociationFailed();
    error TokensTransferFailed();
    error NFTsTransferFailed();
    error TokenTransferFailed();
    error NFTTransferFailed();
    error CreateFungibleTokenFailed();
    error CreateFungibleTokenWithCustomFeesFailed();
    error CreateNonFungibleTokenFailed();
    error CreateNonFungibleTokenWithCustomFeesFailed();
    error ApproveFailed();
    error NFTApproveFailed();
    error SetTokenApprovalForAllFailed();
    error TokenDeleteFailed();
    error FreezeTokenFailed();
    error UnfreezeTokenFailed();
    error GrantTokenKYCFailed();
    error RevokeTokenKYCFailed();
    error PauseTokenFailed();
    error UnpauseTokenFailed();
    error WipeTokenAccountFailed();
    error WipeTokenAccountNFTFailed();
    error UpdateTokenInfoFailed();
    error UpdateTokenExpiryInfoFailed();
    error UpdateTokenKeysFailed();

    function safeCryptoTransfer(IHederaTokenService.TransferList memory transferList, IHederaTokenService.TokenTransferList[] memory tokenTransfers) internal {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.cryptoTransfer.selector, transferList, tokenTransfers));
        if (!tryDecodeSuccessResponseCode(success, result)) revert CryptoTransferFailed();
    }

    function safeMintToken(address token, int64 amount, bytes[] memory metadata) internal returns (int64 newTotalSupply, int64[] memory serialNumbers) {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.mintToken.selector,
            token, amount, metadata));
        (responseCode, newTotalSupply, serialNumbers) = success ? abi.decode(result, (int32, int64, int64[])) : (HederaResponseCodes.UNKNOWN, int64(0), new int64[](0));
        if (responseCode != HederaResponseCodes.SUCCESS) revert MintFailed();
    }

    function safeBurnToken(address token, int64 amount, int64[] memory serialNumbers) internal returns (int64 newTotalSupply) {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.burnToken.selector,
            token, amount, serialNumbers));
        (responseCode, newTotalSupply) = success ? abi.decode(result, (int32, int64)) : (HederaResponseCodes.UNKNOWN, int64(0));
        if (responseCode != HederaResponseCodes.SUCCESS) revert BurnFailed();
    }

    function safeAssociateTokens(address account, address[] memory tokens) internal {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.associateTokens.selector,
            account, tokens));
        if (!tryDecodeSuccessResponseCode(success, result)) revert MultipleAssociationsFailed();
    }

    function safeAssociateToken(address token, address account) internal {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.associateToken.selector,
            account, token));
        if (!tryDecodeSuccessResponseCode(success, result)) revert SingleAssociationFailed();
    }

    function safeDissociateTokens(address account, address[] memory tokens) internal {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.dissociateTokens.selector,
            account, tokens));
        if (!tryDecodeSuccessResponseCode(success, result)) revert MultipleDissociationsFailed();
    }

    function safeDissociateToken(address token, address account) internal {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.dissociateToken.selector,
            account, token));
        if (!tryDecodeSuccessResponseCode(success, result)) revert SingleDissociationFailed();
    }

    function safeTransferTokens(address token, address[] memory accountIds, int64[] memory amounts) internal {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.transferTokens.selector,
            token, accountIds, amounts));
        if (!tryDecodeSuccessResponseCode(success, result)) revert TokensTransferFailed();
    }

    function safeTransferNFTs(address token, address[] memory sender, address[] memory receiver, int64[] memory serialNumber) internal {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.transferNFTs.selector,
            token, sender, receiver, serialNumber));
        if (!tryDecodeSuccessResponseCode(success, result)) revert NFTsTransferFailed();
    }

    function safeTransferToken(address token, address sender, address receiver, int64 amount) internal {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.transferToken.selector,
            token, sender, receiver, amount));
        if (!tryDecodeSuccessResponseCode(success, result)) revert TokenTransferFailed();
    }

    function safeTransferNFT(address token, address sender, address receiver, int64 serialNumber) internal {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.transferNFT.selector,
            token, sender, receiver, serialNumber));
        if (!tryDecodeSuccessResponseCode(success, result)) revert NFTTransferFailed();
    }

    function safeCreateFungibleToken(IHederaTokenService.HederaToken memory token, int64 initialTotalSupply, int32 decimals) internal returns (address tokenAddress) {
        nonEmptyExpiry(token);
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call{value : msg.value}(
            abi.encodeWithSelector(IHederaTokenService.createFungibleToken.selector,
            token, initialTotalSupply, decimals));
        (responseCode, tokenAddress) = success ? abi.decode(result, (int32, address)) : (HederaResponseCodes.UNKNOWN, address(0));
        if (responseCode != HederaResponseCodes.SUCCESS) revert CreateFungibleTokenFailed();
    }

    function safeCreateFungibleTokenWithCustomFees(IHederaTokenService.HederaToken memory token,
        int64 initialTotalSupply,
        int32 decimals,
        IHederaTokenService.FixedFee[] memory fixedFees,
        IHederaTokenService.FractionalFee[] memory fractionalFees) internal returns
    (address tokenAddress) {
        nonEmptyExpiry(token);
        int responseCode;
        (bool success, bytes memory result) = precompileAddress.call{value : msg.value}(
            abi.encodeWithSelector(IHederaTokenService.createFungibleTokenWithCustomFees.selector,
            token, initialTotalSupply, decimals, fixedFees, fractionalFees));
        (responseCode, tokenAddress) = success ? abi.decode(result, (int32, address)) : (HederaResponseCodes.UNKNOWN, address(0));
        if (responseCode != HederaResponseCodes.SUCCESS) revert CreateFungibleTokenWithCustomFeesFailed();
    }

    function safeCreateNonFungibleToken(IHederaTokenService.HederaToken memory token) internal returns
    (address tokenAddress) {
        nonEmptyExpiry(token);
        int responseCode;
        (bool success, bytes memory result) = precompileAddress.call{value : msg.value}(
            abi.encodeWithSelector(IHederaTokenService.createNonFungibleToken.selector, token));
        (responseCode, tokenAddress) = success ? abi.decode(result, (int32, address)) : (HederaResponseCodes.UNKNOWN, address(0));
        if (responseCode != HederaResponseCodes.SUCCESS) revert CreateNonFungibleTokenFailed();
    }

    function safeCreateNonFungibleTokenWithCustomFees(IHederaTokenService.HederaToken memory token,
        IHederaTokenService.FixedFee[] memory fixedFees,
        IHederaTokenService.RoyaltyFee[] memory royaltyFees) internal returns
    (address tokenAddress) {
        nonEmptyExpiry(token);
        int responseCode;
        (bool success, bytes memory result) = precompileAddress.call{value : msg.value}(
            abi.encodeWithSelector(IHederaTokenService.createNonFungibleTokenWithCustomFees.selector,
            token, fixedFees, royaltyFees));
        (responseCode, tokenAddress) = success ? abi.decode(result, (int32, address)) : (HederaResponseCodes.UNKNOWN, address(0));
        if (responseCode != HederaResponseCodes.SUCCESS) revert CreateNonFungibleTokenWithCustomFeesFailed();
    }

    function safeApprove(address token, address spender, uint256 amount) internal {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.approve.selector, token, spender, amount));
        if (!tryDecodeSuccessResponseCode(success, result)) revert ApproveFailed();
    }

    function safeApproveNFT(address token, address approved, int64 serialNumber) internal {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.approveNFT.selector, token, approved, serialNumber));
        if (!tryDecodeSuccessResponseCode(success, result)) revert NFTApproveFailed();
    }

    function safeSetApprovalForAll(address token, address operator, bool approved) internal {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.setApprovalForAll.selector, token, operator, approved));
        if (!tryDecodeSuccessResponseCode(success, result)) revert SetTokenApprovalForAllFailed();
    }

    function safeDeleteToken(address token) internal {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.deleteToken.selector, token));
        if (!tryDecodeSuccessResponseCode(success, result)) revert TokenDeleteFailed();
    }

    function safeFreezeToken(address token, address account) internal {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.freezeToken.selector, token, account));
        if (!tryDecodeSuccessResponseCode(success, result)) revert FreezeTokenFailed();
    }

    function safeUnfreezeToken(address token, address account) internal {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.unfreezeToken.selector, token, account));
        if (!tryDecodeSuccessResponseCode(success, result)) revert UnfreezeTokenFailed();
    }

    function safeGrantTokenKyc(address token, address account) internal {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.grantTokenKyc.selector, token, account));
        if (!tryDecodeSuccessResponseCode(success, result)) revert GrantTokenKYCFailed();
    }

    function safeRevokeTokenKyc(address token, address account) internal {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.revokeTokenKyc.selector, token, account));
        if (!tryDecodeSuccessResponseCode(success, result)) revert RevokeTokenKYCFailed();
    }

    function safePauseToken(address token) internal {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.pauseToken.selector, token));
        if (!tryDecodeSuccessResponseCode(success, result)) revert PauseTokenFailed();
    }

    function safeUnpauseToken(address token) internal {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.unpauseToken.selector, token));
        if (!tryDecodeSuccessResponseCode(success, result)) revert UnpauseTokenFailed();
    }

    function safeWipeTokenAccount(address token, address account, int64 amount) internal {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.wipeTokenAccount.selector, token, account, amount));
        if (!tryDecodeSuccessResponseCode(success, result)) revert WipeTokenAccountFailed();
    }

    function safeWipeTokenAccountNFT(address token, address account, int64[] memory serialNumbers) internal {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.wipeTokenAccountNFT.selector, token, account, serialNumbers));
        if (!tryDecodeSuccessResponseCode(success, result)) revert WipeTokenAccountNFTFailed();
    }

    function safeUpdateTokenInfo(address token, IHederaTokenService.HederaToken memory tokenInfo) internal {
        nonEmptyExpiry(tokenInfo);
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.updateTokenInfo.selector, token, tokenInfo));
        if (!tryDecodeSuccessResponseCode(success, result)) revert UpdateTokenInfoFailed();
    }

    function safeUpdateTokenExpiryInfo(address token, IHederaTokenService.Expiry memory expiryInfo) internal {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.updateTokenExpiryInfo.selector, token, expiryInfo));
        if (!tryDecodeSuccessResponseCode(success, result)) revert UpdateTokenExpiryInfoFailed();
    }

    function safeUpdateTokenKeys(address token, IHederaTokenService.TokenKey[] memory keys) internal {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.updateTokenKeys.selector, token, keys));
        if (!tryDecodeSuccessResponseCode(success, result)) revert UpdateTokenKeysFailed();
    }

    function tryDecodeSuccessResponseCode(bool success, bytes memory result) private pure returns (bool) {
        return (success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN) == HederaResponseCodes.SUCCESS;
    }

    function nonEmptyExpiry(IHederaTokenService.HederaToken memory token) private view
    {
        if (token.expiry.second == 0 && token.expiry.autoRenewPeriod == 0) {
            token.expiry.autoRenewPeriod = defaultAutoRenewPeriod;
            token.expiry.autoRenewAccount = address(this);
        }
    }
}
