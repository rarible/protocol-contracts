// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "./LibFill.sol";
import "./LibFeeSide.sol";
import "./LibOrderDataV1.sol";
import "./ITransferManager.sol";
import "./TransferExecutor.sol";
import "@rarible/lib-asset/contracts/LibAsset.sol";
import "@rarible/royalties/contracts/IRoyaltiesProvider.sol";
import "./LibOrderData.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "../utils/BpLibrary.sol";

abstract contract RaribleTransferManager is OwnableUpgradeable, ITransferManager {
    using BpLibrary for uint;
    using SafeMathUpgradeable for uint;

    uint public buyerFee;
    uint public sellerFee;
    IRoyaltiesProvider public royaltiesRegistry;

    address public communityWallet;
    mapping(address => address) public walletsForTokens;

    function __RaribleTransferManager_init_unchained(
        uint newBuyerFee,
        uint newSellerFee,
        address newCommunityWallet,
        IRoyaltiesProvider newRoyaltiesProvider
    ) internal initializer {
        buyerFee = newBuyerFee;
        sellerFee = newSellerFee;
        communityWallet = newCommunityWallet;
        royaltiesRegistry = newRoyaltiesProvider;
    }

    function setBuyerFee(uint newBuyerFee) external onlyOwner {
        buyerFee = newBuyerFee;
    }

    function setSellerFee(uint newSellerFee) external onlyOwner {
        sellerFee = newSellerFee;
    }

    function setCommunityWallet(address payable newCommunityWallet) external onlyOwner {
        communityWallet = newCommunityWallet;
    }

    function setWalletForToken(address token, address wallet) external onlyOwner {
        walletsForTokens[token] = wallet;
    }

    function getFeeReceiver(address token) internal view returns (address) {
        address wallet = walletsForTokens[token];
        if (wallet != address(0)) {
            return wallet;
        }
        return communityWallet;
    }

    function doTransfers(
        LibAsset.AssetType memory makeMatch,
        LibAsset.AssetType memory takeMatch,
        LibFill.FillResult memory fill,
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder
    ) override internal returns (uint totalMakeValue, uint totalTakeValue) {
        LibFeeSide.FeeSide feeSide = LibFeeSide.getFeeSide(makeMatch.assetClass, takeMatch.assetClass);
        totalMakeValue = fill.makeValue;
        totalTakeValue = fill.takeValue;
        LibOrderDataV1.DataV1 memory leftOrderData = LibOrderData.parse(leftOrder);
        LibOrderDataV1.DataV1 memory rightOrderData = LibOrderData.parse(rightOrder);
        if (feeSide == LibFeeSide.FeeSide.MAKE) {
            totalMakeValue = doTransfersWithFees(fill.makeValue, leftOrder.maker, leftOrderData, rightOrderData, makeMatch, takeMatch,  TO_TAKER);
            transferPayouts(takeMatch, fill.takeValue, rightOrder.maker, leftOrderData.payouts, TO_MAKER);
        } else if (feeSide == LibFeeSide.FeeSide.TAKE) {
            totalTakeValue = doTransfersWithFees(fill.takeValue, rightOrder.maker, rightOrderData, leftOrderData, takeMatch, makeMatch, TO_MAKER);
            transferPayouts(makeMatch, fill.makeValue, leftOrder.maker, rightOrderData.payouts, TO_TAKER);
        }
    }

    function doTransfersWithFees(
        uint amount,
        address from,
        LibOrderDataV1.DataV1 memory dataCalculate,
        LibOrderDataV1.DataV1 memory dataNft,
        LibAsset.AssetType memory matchCalculate,
        LibAsset.AssetType memory matchNft,
        bytes4 transferDirection
    ) internal returns (uint totalAmount) {
        totalAmount = calculateTotalAmount(amount, buyerFee, dataCalculate.originFees);
        uint rest = transferProtocolFee(totalAmount, amount, from, matchCalculate, transferDirection);
        rest = transferRoyalties(matchCalculate, matchNft, rest, amount, from, transferDirection);
        rest = transferOrigins(matchCalculate, rest, amount, dataCalculate.originFees, from, transferDirection);
        rest = transferOrigins(matchCalculate, rest, amount, dataNft.originFees, from, transferDirection);
        transferPayouts(matchCalculate, rest, from, dataNft.payouts, transferDirection);
    }

    function transferProtocolFee(
        uint totalAmount,
        uint amount,
        address from,
        LibAsset.AssetType memory matchCalculate,
        bytes4 transferDirection
    ) internal returns (uint) {
        (uint rest, uint fee) = subFeeInBp(totalAmount, amount, buyerFee.add(sellerFee));
        if (fee > 0) {
            address tokenAddress = address(0);
            if (matchCalculate.assetClass == LibAsset.ERC20_ASSET_CLASS) {
                tokenAddress = abi.decode(matchCalculate.data, (address));
            }
            if (matchCalculate.assetClass == LibAsset.ERC1155_ASSET_CLASS) {
                uint tokenId;
                (tokenAddress, tokenId) = abi.decode(matchCalculate.data, (address, uint));
            }
            transfer(LibAsset.Asset(matchCalculate, fee), from, getFeeReceiver(tokenAddress), transferDirection, PROTOCOL);
        }
        return rest;
    }

    function transferRoyalties(
        LibAsset.AssetType memory matchCalculate,
        LibAsset.AssetType memory matchNft,
        uint rest,
        uint amount,
        address from,
        bytes4 transferDirection
    ) internal returns (uint restValue){
        restValue = rest;
        if (matchNft.assetClass != LibAsset.ERC1155_ASSET_CLASS && matchNft.assetClass != LibAsset.ERC721_ASSET_CLASS) {
            return restValue;
        }
        (address token, uint tokenId) = abi.decode(matchNft.data, (address, uint));
        LibPart.Part[] memory fees = royaltiesRegistry.getRoyalties(token, tokenId);
        for (uint256 i = 0; i < fees.length; i++) {
            (uint newRestValue, uint feeValue) = subFeeInBp(restValue, amount, fees[i].value);
            restValue = newRestValue;
            if (feeValue > 0) {
                transfer(LibAsset.Asset(matchCalculate, feeValue), from, fees[i].account, transferDirection, ROYALTY);
            }
        }
    }

    function transferOrigins(
        LibAsset.AssetType memory matchCalculate,
        uint rest,
        uint amount,
        LibPart.Part[] memory originFees,
        address from,
        bytes4 transferDirection
    ) internal returns (uint restValue) {
        restValue = rest;
        for (uint256 i = 0; i < originFees.length; i++) {
            (uint newRestValue, uint feeValue) = subFeeInBp(restValue, amount,  originFees[i].value);
            restValue = newRestValue;
            if (feeValue > 0) {
                transfer(LibAsset.Asset(matchCalculate, feeValue), from,  originFees[i].account, transferDirection, ORIGIN);
            }
        }
    }

    function transferPayouts(
        LibAsset.AssetType memory matchCalculate,
        uint amount,
        address from,
        LibPart.Part[] memory payouts,
        bytes4 transferDirection
    ) internal {
        uint sumBps = 0;
        for (uint256 i = 0; i < payouts.length; i++) {
            uint currentAmount = amount.bp(payouts[i].value);
            sumBps += payouts[i].value;
            if (currentAmount > 0) {
                transfer(LibAsset.Asset(matchCalculate, currentAmount), from, payouts[i].account, transferDirection, PAYOUT);
            }
        }
        require(sumBps == 10000, "Sum payouts Bps not equal 100%");
    }

    function calculateTotalAmount(
        uint amount,
        uint feeOnTopBp,
        LibPart.Part[] memory orderOriginFees
    ) internal pure returns (uint total){
        total = amount.add(amount.bp(feeOnTopBp));
        for (uint256 i = 0; i < orderOriginFees.length; i++) {
            total = total.add(amount.bp(orderOriginFees[i].value));
        }
    }

    function subFeeInBp(uint value, uint total, uint feeInBp) internal pure returns (uint newValue, uint realFee) {
        return subFee(value, total.bp(feeInBp));
    }

    function subFee(uint value, uint fee) internal pure returns (uint newValue, uint realFee) {
        if (value > fee) {
            newValue = value - fee;
            realFee = fee;
        } else {
            newValue = 0;
            realFee = value;
        }
    }


    uint256[46] private __gap;
}
