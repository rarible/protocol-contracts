// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "./SafeHTS.sol";

contract SafeOperations is SafeHTS {

    bool finiteTotalSupplyType = true;

    event TokenCreated(address);
    event MintedNft(int64[], int64);
    event BurnToken(int64);
    event ResponseCode(int32);

    function safeAssociateTokenPublic(address sender, address tokenAddress) external {
        safeAssociateToken(tokenAddress, sender);
        emit ResponseCode(HederaResponseCodes.SUCCESS);
    }

    function safeDissociateTokenPublic(address sender, address tokenAddress) external {
        safeDissociateToken(tokenAddress, sender);
        emit ResponseCode(HederaResponseCodes.SUCCESS);
    }

    function safeAssociateTokensPublic(address account, address[] memory tokens) external {
        safeAssociateTokens(account, tokens);
        emit ResponseCode(HederaResponseCodes.SUCCESS);
    }

    function safeDissociateTokensPublic(address account, address[] memory tokens) external {
        safeDissociateTokens(account, tokens);
        emit ResponseCode(HederaResponseCodes.SUCCESS);
    }

    function safeTransferTokensPublic(address token, address[] memory accountIds, int64[] memory amounts) external {
        safeTransferTokens(token, accountIds, amounts);
        emit ResponseCode(HederaResponseCodes.SUCCESS);
    }

    function safeTransferNFTsPublic(address token, address[] memory sender,
        address[] memory receiver, int64[] memory serialNumber) external {
        safeTransferNFTs(token, sender, receiver, serialNumber);
        emit ResponseCode(HederaResponseCodes.SUCCESS);
    }

    function safeTransferTokenPublic(address token, address sender, address receiver, int64 amount) external {
        safeTransferToken(token, sender, receiver, amount);
        emit ResponseCode(HederaResponseCodes.SUCCESS);
    }

    function safeTransferNFTPublic(address token, address sender, address receiver, int64 serialNum) external {
        safeTransferNFT(token, sender, receiver, serialNum);
        emit ResponseCode(HederaResponseCodes.SUCCESS);
    }

    function safeCryptoTransferPublic(IHederaTokenService.TransferList calldata transferList, IHederaTokenService.TokenTransferList[] calldata tokenTransferList) external {
        safeCryptoTransfer(transferList, tokenTransferList);
        emit ResponseCode(HederaResponseCodes.SUCCESS);
    }

    function safeMintTokenPublic(address token, int64 amount,
        bytes[] memory metadata) external returns (int64 newTotalSupply, int64[] memory serialNumbers) {
        (newTotalSupply, serialNumbers) = safeMintToken(token, amount, metadata);
        emit MintedNft(serialNumbers, newTotalSupply);
        emit ResponseCode(HederaResponseCodes.SUCCESS);
    }

    function safeBurnTokenPublic(address token, int64 amount, int64[] memory serialNumbers) external returns (int64 newTotalSupply) {
        (newTotalSupply) = safeBurnToken(token, amount, serialNumbers);
        emit BurnToken(newTotalSupply);
        emit ResponseCode(HederaResponseCodes.SUCCESS);
    }

    function safeCreateFungibleTokenPublic() external payable returns (address tokenAddress) {
        IHederaTokenService.HederaToken memory token;
        token.name = "tokenName";
        token.symbol = "tokenSymbol";
        token.treasury = address(this);

        (tokenAddress) = safeCreateFungibleToken(token, 200, 8);
        emit TokenCreated(tokenAddress);
        emit ResponseCode(HederaResponseCodes.SUCCESS);
    }

    function safeCreateFungibleTokenWithCustomFeesPublic(address feeCollector,
        address existingTokenAddress) external payable returns (address tokenAddress) {
        IHederaTokenService.HederaToken memory token;
        token.name = "tokenName";
        token.symbol = "tokenSymbol";
        token.treasury = address(this);

        IHederaTokenService.FixedFee[] memory fixedFees =
        createFixedFeesWithAllTypes(1, existingTokenAddress, feeCollector);
        IHederaTokenService.FractionalFee[] memory fractionalFees =
        createSingleFractionalFeeWithLimits(4, 5, 10, 30, true, feeCollector);
        (tokenAddress) = safeCreateFungibleTokenWithCustomFees(token, 200, 8, fixedFees, fractionalFees);
        emit TokenCreated(tokenAddress);
        emit ResponseCode(HederaResponseCodes.SUCCESS);
    }

    function safeCreateNonFungibleTokenPublic() external payable returns (address tokenAddress) {
        IHederaTokenService.Expiry memory expiry = IHederaTokenService.Expiry(
            0, msg.sender, 8000000
        );
        IHederaTokenService.HederaToken memory token = IHederaTokenService.HederaToken(
            "tokenName", "tokenSymbol", msg.sender, "memo", finiteTotalSupplyType, 1000, false, getKeys(), expiry
        );
        (tokenAddress) = safeCreateNonFungibleToken(token);
        emit ResponseCode(HederaResponseCodes.SUCCESS);
        emit TokenCreated(tokenAddress);
    }

    function safeCreateNonFungibleTokenWithCustomFeesPublic(address feeCollector,
        address existingTokenAddress) external payable returns (address tokenAddress) {
        IHederaTokenService.HederaToken memory token;
        token.name = "tokenName";
        token.symbol = "tokenSymbol";
        token.memo = "memo";
        token.treasury = address(this);
        IHederaTokenService.RoyaltyFee[] memory royaltyFees =
        createRoyaltyFeesWithAllTypes(4, 5, 10, existingTokenAddress, feeCollector);
        (tokenAddress) = safeCreateNonFungibleTokenWithCustomFees(token, new IHederaTokenService.FixedFee[](0), royaltyFees);
        emit TokenCreated(tokenAddress);
        emit ResponseCode(HederaResponseCodes.SUCCESS);
    }

    function safeApprovePublic(address token, address spender, uint256 amount) external {
        safeApprove(token, spender, amount);
        emit ResponseCode(HederaResponseCodes.SUCCESS);
    }

    function safeApproveNFTPublic(address token, address approved, int64 serialNumber) external {
        safeApproveNFT(token, approved, serialNumber);
        emit ResponseCode(HederaResponseCodes.SUCCESS);
    }

    function safeSetApprovalForAllPublic(address token, address operator, bool approved) external {
        safeSetApprovalForAll(token, operator, approved);
        emit ResponseCode(HederaResponseCodes.SUCCESS);
    }

    function safeDeleteTokenPublic(address token) external {
        safeDeleteToken(token);
        emit ResponseCode(HederaResponseCodes.SUCCESS);
    }

    function safeFreezeTokenPublic(address token, address account) external {
        safeFreezeToken(token, account);
        emit ResponseCode(HederaResponseCodes.SUCCESS);
    }

    function safeUnfreezeTokenPublic(address token, address account) external {
        safeUnfreezeToken(token, account);
        emit ResponseCode(HederaResponseCodes.SUCCESS);
    }

    function safeGrantTokenKycPublic(address token, address account) external {
        safeGrantTokenKyc(token, account);
        emit ResponseCode(HederaResponseCodes.SUCCESS);
    }

    function safeRevokeTokenKycPublic(address token, address account) external {
        safeRevokeTokenKyc(token, account);
        emit ResponseCode(HederaResponseCodes.SUCCESS);
    }

    function safePauseTokenPublic(address token) external {
        safePauseToken(token);
        emit ResponseCode(HederaResponseCodes.SUCCESS);
    }

    function safeUnpauseTokenPublic(address token) external {
        safeUnpauseToken(token);
        emit ResponseCode(HederaResponseCodes.SUCCESS);
    }

    function safeWipeTokenAccountPublic(address token, address account, int64 amount) external {
        safeWipeTokenAccount(token, account, amount);
        emit ResponseCode(HederaResponseCodes.SUCCESS);
    }

    function safeWipeTokenAccountNFTPublic(address token, address account, int64[] memory serialNumbers) external {
        safeWipeTokenAccountNFT(token, account, serialNumbers);
        emit ResponseCode(HederaResponseCodes.SUCCESS);
    }

    function safeUpdateTokenInfoPublic(address token, IHederaTokenService.HederaToken memory tokenInfo) external {
        safeUpdateTokenInfo(token, tokenInfo);
        emit ResponseCode(HederaResponseCodes.SUCCESS);
    }

    function safeUpdateTokenExpiryInfoPublic(address token, IHederaTokenService.Expiry memory expiryInfo) external {
        safeUpdateTokenExpiryInfo(token, expiryInfo);
        emit ResponseCode(HederaResponseCodes.SUCCESS);
    }

    function safeUpdateTokenKeysPublic(address token, IHederaTokenService.TokenKey[] memory keys) external {
        safeUpdateTokenKeys(token, keys);
        emit ResponseCode(HederaResponseCodes.SUCCESS);
    }

    function createRoyaltyFeesWithAllTypes(int32 numerator, int32 denominator, int32 amount,
        address tokenId, address feeCollector) internal pure returns (IHederaTokenService.RoyaltyFee[] memory royaltyFees) {
        royaltyFees = new IHederaTokenService.RoyaltyFee[](3);
        IHederaTokenService.RoyaltyFee memory royaltyFeeWithoutFallback = createRoyaltyFee(numerator, denominator, feeCollector);
        IHederaTokenService.RoyaltyFee memory royaltyFeeWithFallbackHbar = createRoyaltyFeeWithFallbackFee(numerator, denominator, amount, address(0x0), true, feeCollector);
        IHederaTokenService.RoyaltyFee memory royaltyFeeWithFallbackToken = createRoyaltyFeeWithFallbackFee(numerator, denominator, amount, tokenId, false, feeCollector);
        royaltyFees[0] = royaltyFeeWithoutFallback;
        royaltyFees[1] = royaltyFeeWithFallbackHbar;
        royaltyFees[2] = royaltyFeeWithFallbackToken;
    }

    function createRoyaltyFee(int32 numerator, int32 denominator, address feeCollector) internal pure returns (IHederaTokenService.RoyaltyFee memory royaltyFee) {
        royaltyFee.numerator = numerator;
        royaltyFee.denominator = denominator;
        royaltyFee.feeCollector = feeCollector;
    }

    function createRoyaltyFeeWithFallbackFee(int32 numerator, int32 denominator, int32 amount, address tokenId, bool useHbarsForPayment,
        address feeCollector) internal pure returns (IHederaTokenService.RoyaltyFee memory royaltyFee) {
        royaltyFee.numerator = numerator;
        royaltyFee.denominator = denominator;
        royaltyFee.amount = amount;
        royaltyFee.tokenId = tokenId;
        royaltyFee.useHbarsForPayment = useHbarsForPayment;
        royaltyFee.feeCollector = feeCollector;
    }

    function createFixedFeesWithAllTypes(int32 amount, address tokenId, address feeCollector) internal pure returns (IHederaTokenService.FixedFee[] memory fixedFees) {
        fixedFees = new IHederaTokenService.FixedFee[](3);
        IHederaTokenService.FixedFee memory fixedFeeForToken = createFixedFeeForToken(amount, tokenId, feeCollector);
        IHederaTokenService.FixedFee memory fixedFeeForHbars = createFixedFeeForHbars(amount * 2, feeCollector);
        IHederaTokenService.FixedFee memory fixedFeeForCurrentToken = createFixedFeeForCurrentToken(amount * 4, feeCollector);
        fixedFees[0] = fixedFeeForToken;
        fixedFees[1] = fixedFeeForHbars;
        fixedFees[2] = fixedFeeForCurrentToken;
    }

    function createFixedFeeForToken(int32 amount, address tokenId, address feeCollector) internal pure returns (IHederaTokenService.FixedFee memory fixedFee) {
        fixedFee.amount = amount;
        fixedFee.tokenId = tokenId;
        fixedFee.feeCollector = feeCollector;
    }

    function createFixedFeeForHbars(int32 amount, address feeCollector) internal pure returns (IHederaTokenService.FixedFee memory fixedFee) {
        fixedFee.amount = amount;
        fixedFee.useHbarsForPayment = true;
        fixedFee.feeCollector = feeCollector;
    }

    function createFixedFeeForCurrentToken(int32 amount, address feeCollector) internal pure returns (IHederaTokenService.FixedFee memory fixedFee) {
        fixedFee.amount = amount;
        fixedFee.useCurrentTokenForPayment = true;
        fixedFee.feeCollector = feeCollector;
    }

    function createSingleFractionalFeeWithLimits(int32 numerator, int32 denominator, int32 minimumAmount,
        int32 maximumAmount, bool netOfTransfers, address feeCollector) internal pure returns (IHederaTokenService.FractionalFee[] memory fractionalFees) {
        fractionalFees = new IHederaTokenService.FractionalFee[](1);
        IHederaTokenService.FractionalFee memory fractionalFee = createFractionalFeeWithLimits(numerator, denominator, minimumAmount, maximumAmount, netOfTransfers, feeCollector);
        fractionalFees[0] = fractionalFee;
    }

    function createFractionalFeeWithLimits(int32 numerator, int32 denominator, int32 minimumAmount, int32 maximumAmount,
        bool netOfTransfers, address feeCollector) internal pure returns (IHederaTokenService.FractionalFee memory fractionalFee) {
        fractionalFee.numerator = numerator;
        fractionalFee.denominator = denominator;
        fractionalFee.minimumAmount = minimumAmount;
        fractionalFee.maximumAmount = maximumAmount;
        fractionalFee.netOfTransfers = netOfTransfers;
        fractionalFee.feeCollector = feeCollector;
    }

    function getKeys() internal pure returns (IHederaTokenService.TokenKey[] memory) {
        IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](5);

        IHederaTokenService.KeyValue memory keyValueAdmin;
        keyValueAdmin.inheritAccountKey = true;
        IHederaTokenService.KeyValue memory keyValueKyc;
        keyValueKyc.inheritAccountKey = true;
        IHederaTokenService.KeyValue memory keyValueFreeze;
        keyValueFreeze.inheritAccountKey = true;
        IHederaTokenService.KeyValue memory keyValueWipe;
        keyValueWipe.inheritAccountKey = true;
        IHederaTokenService.KeyValue memory keyValueSupply;
        keyValueSupply.inheritAccountKey = true;

        keys[0] = IHederaTokenService.TokenKey(1, keyValueAdmin);
        keys[1] = IHederaTokenService.TokenKey(2, keyValueKyc);
        keys[2] = IHederaTokenService.TokenKey(4, keyValueFreeze);
        keys[3] = IHederaTokenService.TokenKey(8, keyValueWipe);
        keys[4] = IHederaTokenService.TokenKey(16, keyValueSupply);

        return keys;
    }
}
