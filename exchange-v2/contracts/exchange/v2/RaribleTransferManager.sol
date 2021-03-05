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
import "@rarible/royalties/contracts/RoyaltiesV1.sol";
import "@rarible/royalties/contracts/LibRoyaltiesV2.sol";
import "@rarible/royalties/contracts/LibRoyaltiesV1.sol";
import "@rarible/royalties/contracts/impl/RoyaltiesV1Impl.sol";
import "@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "../../utils/BpLibrary.sol";

abstract contract RaribleTransferManager is OwnableUpgradeable, ITransferManager {
    using BpLibrary for uint;
    using SafeMathUpgradeable for uint;

    bytes4 constant TO_PROTOCOL = bytes4(keccak256("TO_PROTOCOL"));

    uint public buyerFee;
    uint public sellerFee;

    address public communityWallet;
    mapping(address => address) public walletsForTokens;

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
            totalMakeAmount = doTransfersWithFees(fill.makeAmount, leftOrder.maker, makeMatch, takeMatch, parseOrder(rightOrder), TO_TAKER);
            transfer(LibAsset.Asset(takeMatch, fill.takeAmount), rightOrder.maker, parseOrder(leftOrder), TO_MAKER);
        } else if (feeSide == LibFeeSide.FeeSide.TAKE) {
            totalTakeAmount = doTransfersWithFees(fill.takeAmount, rightOrder.maker, takeMatch, makeMatch, parseOrder(leftOrder), TO_MAKER);
            transfer(LibAsset.Asset(makeMatch, fill.makeAmount), leftOrder.maker, parseOrder(rightOrder), TO_TAKER);
        }
    }

    function doTransfersWithFees(
        uint amount,
        address from,
        LibAsset.AssetType memory matchCalculate,
        LibAsset.AssetType memory matchNft,//todo unused param
        address orderBeneficiary,
        bytes4 to
    ) internal returns (uint totalAmount) {
        uint totalAmount = calculateTotalAmount(amount, buyerFee);
        uint rest = totalAmount;
        uint fee;
        //todo combine code to function transferProtocolFee(...)
        (rest, fee) = subFeeInBp(rest, amount, buyerFee.add(sellerFee));
        if (fee > 0) {
            //todo это не будет работать, например с эфиром, нужно по-другому сделать (data будет пустое)
            (address tokenAddress) = abi.decode(matchCalculate.data, (address));
            transfer(LibAsset.Asset(matchCalculate, fee), from, getFeeReceiver(tokenAddress), TO_PROTOCOL);
        }
        //todo create function transferRoyalties(need matchNft,...)
        transfer(LibAsset.Asset(matchCalculate, rest), from, orderBeneficiary, to);
    }

    function calculateTotalAmount(uint amount, uint feeOnTopBp) internal pure returns (uint total){
        total = amount.add(amount.bp(feeOnTopBp));
    }

    function parseOrder(LibOrder.Order memory order) pure internal returns (address beneficiary) {
        beneficiary = order.maker;
        if (order.dataType == LibOrderDataV1.V1) {
            (address orderBeneficiary) = abi.decode(order.data, (address));
            if (orderBeneficiary != address(0)) {
                beneficiary = orderBeneficiary;
            }
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
}
