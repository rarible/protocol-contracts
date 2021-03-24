// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "./LibFill.sol";
import "./LibFeeSide.sol";
import "./LibOrderDataV1.sol";
import "./ITransferManager.sol";
import "./TransferExecutor.sol";
import "./LibAsset.sol";
import "./RoyaltiesRegistry.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "../../utils/BpLibrary.sol";

abstract contract RaribleTransferManager is ITransferManager, RoyaltiesRegistry{
    using BpLibrary for uint;
    using SafeMathUpgradeable for uint;

    uint public buyerFee;
    uint public sellerFee;

    address public communityWallet;
    mapping(address => address) public walletsForTokens;

    function __RaribleTransferManager_init_unchained(uint newBuyerFee, uint newSellerFee, address newCommunityWallet) internal initializer {
        buyerFee = newBuyerFee;
        sellerFee = newSellerFee;
        communityWallet = newCommunityWallet;
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
    ) override internal returns (uint totalMakeAmount, uint totalTakeAmount) {
        LibFeeSide.FeeSide feeSide = LibFeeSide.getFeeSide(makeMatch.tp, takeMatch.tp);
        totalMakeAmount = fill.makeAmount;
        totalTakeAmount = fill.takeAmount;
        if (feeSide == LibFeeSide.FeeSide.MAKE) {
            totalMakeAmount = doTransfersWithFees(fill.makeAmount, leftOrder, rightOrder, makeMatch, takeMatch,  TO_TAKER);
            transferPayouts(takeMatch, fill.takeAmount, rightOrder.maker, leftOrder, TO_MAKER);
        } else if (feeSide == LibFeeSide.FeeSide.TAKE) {
            totalTakeAmount = doTransfersWithFees(fill.takeAmount, rightOrder, leftOrder, takeMatch, makeMatch, TO_MAKER);
            transferPayouts(makeMatch, fill.makeAmount, leftOrder.maker, rightOrder, TO_TAKER);
        }
    }

    function doTransfersWithFees(
        uint amount,
        LibOrder.Order memory orderCalculate,
        LibOrder.Order memory orderNft,
        LibAsset.AssetType memory matchCalculate,
        LibAsset.AssetType memory matchNft,
        bytes4 transferDirection
    ) internal returns (uint totalAmount) {
        totalAmount = calculateTotalAmount(amount, buyerFee, getOriginFees(orderCalculate));
        uint rest = transferProtocolFee(totalAmount, amount, orderCalculate.maker, matchCalculate, transferDirection);
        rest = transferRoyalties(matchCalculate, matchNft, rest, amount, orderCalculate.maker, transferDirection);
        rest = transferOrigins(matchCalculate, rest, amount, orderCalculate, orderCalculate.maker, transferDirection);
        rest = transferOrigins(matchCalculate, rest, amount, orderNft, orderCalculate.maker, transferDirection);
        rest = transferPayouts(matchCalculate, rest, orderCalculate.maker, orderNft, transferDirection);
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
            if (matchCalculate.tp == LibAsset.ERC20_ASSET_TYPE) {
                tokenAddress = abi.decode(matchCalculate.data, (address));
            }
            if (matchCalculate.tp == LibAsset.ERC1155_ASSET_TYPE) {
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
        //todo detect token1, tokId1
        address token1;
        uint tokId1;
//        royaltiesRegistry = new RoyaltiesRegistry();
        LibPart.Part[] memory fees = getRoyalties(token1, tokId1, matchNft);
        restValue = rest;
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
        LibOrder.Order memory orderCalculate,
        address from,
        bytes4 transferDirection
    ) internal returns (uint restValue) {
        restValue = rest;
        LibPart.Part[] memory  originFees = getOriginFees(orderCalculate);
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
        LibOrder.Order memory orderNft,
        bytes4 transferDirection
    ) internal returns (uint restValue){
        restValue = amount;
        LibPart.Part[] memory payouts = parseOrder(orderNft);
        uint sumPayoutCents;
        for (uint256 i = 0; i < payouts.length; i++) {
            sumPayoutCents += payouts[i].value;
        }
        require(sumPayoutCents == 10000, "Sum payouts cents not equal 100%");
        for (uint256 i = 0; i < payouts.length; i++) {
            (uint newRestValue, uint feeValue) = subFeeInBp(restValue, amount, payouts[i].value);
            restValue = newRestValue;
            if (feeValue > 0) {
                transfer(LibAsset.Asset(matchCalculate, feeValue), from, payouts[i].account, transferDirection, PAYOUT);
            }
        }
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

    function parseOrder(LibOrder.Order memory order) pure internal returns (LibPart.Part[] memory beneficiary) {
        if (order.dataType == LibOrderDataV1.V1) {
            (LibOrderDataV1.DataV1 memory orderData) = LibOrderDataV1.decodeOrderDataV1(order.data);
            beneficiary = orderData.payouts;
        } else{
            beneficiary = new LibPart.Part[](1);
            beneficiary[0].account = payable(order.maker);
            beneficiary[0].value = 10000;
        }
    }

    function getOriginFees(LibOrder.Order memory order) pure internal returns (LibPart.Part[] memory originOrderFees) {
        if (order.dataType == LibOrderDataV1.V1) {
            (LibOrderDataV1.DataV1 memory orderData) = LibOrderDataV1.decodeOrderDataV1(order.data);
            originOrderFees = orderData.originFees;
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
