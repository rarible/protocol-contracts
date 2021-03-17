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
            totalMakeAmount = doTransfersWithFees(fill.makeAmount, leftOrder, rightOrder, makeMatch, takeMatch,  TO_TAKER);
            transfer(LibAsset.Asset(takeMatch, fill.takeAmount), rightOrder.maker, parseOrder(leftOrder), TO_MAKER);
        } else if (feeSide == LibFeeSide.FeeSide.TAKE) {
            totalTakeAmount = doTransfersWithFees(fill.takeAmount, rightOrder, leftOrder, takeMatch, makeMatch, TO_MAKER);
            transfer(LibAsset.Asset(makeMatch, fill.makeAmount), leftOrder.maker, parseOrder(rightOrder), TO_TAKER);
        }
    }

    function doTransfersWithFees(
        uint amount,
        LibOrder.Order memory orderCalculate,
        LibOrder.Order memory orderNft,
        LibAsset.AssetType memory matchCalculate,
        LibAsset.AssetType memory matchNft,
        bytes4 to
    ) internal returns (uint totalAmount) {
        totalAmount = calculateTotalAmount(amount, buyerFee, getOriginFees(orderCalculate));
        uint rest = transferProtocolFee(totalAmount, amount, orderCalculate.maker, matchCalculate);
        rest = transferRoyalties(matchCalculate, matchNft, rest, amount, orderCalculate.maker, to);
        rest = transferOrigins(matchCalculate, rest, amount, orderCalculate, orderCalculate.maker, to);
        rest = transferOrigins(matchCalculate, rest, amount, orderNft, orderCalculate.maker, to);
        if (rest > 0) {
            transfer(LibAsset.Asset(matchCalculate, rest), orderCalculate.maker, parseOrder(orderNft), to);
        }
    }

    function transferProtocolFee(
        uint totalAmount,
        uint amount,
        address from,
        LibAsset.AssetType memory matchCalculate
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
            transfer(LibAsset.Asset(matchCalculate, fee), from, getFeeReceiver(tokenAddress), TO_PROTOCOL);
        }
        return rest;
    }

    function transferRoyalties(
        LibAsset.AssetType memory matchCalculate,
        LibAsset.AssetType memory matchNft,
        uint rest,
        uint amount,
        address from,
        bytes4 to
    ) internal returns (uint restValue){
        LibPart.Part[] memory fees = getRoyalties(matchNft);
        restValue = rest;
        for (uint256 i = 0; i < fees.length; i++) {
            (uint newRestValue, uint feeValue) = subFeeInBp(restValue, amount, fees[i].value);
            restValue = newRestValue;
            if (feeValue > 0) {
                transfer(LibAsset.Asset(matchCalculate, feeValue), from, fees[i].account, to);
            }
        }
    }

    function transferOrigins(
        LibAsset.AssetType memory matchCalculate,
        uint rest,
        uint amount,
        LibOrder.Order memory orderCalculate,
        address from,
        bytes4 to
    ) internal returns (uint restValue) {
        restValue = rest;
        LibPart.Part[] memory  originFees = getOriginFees(orderCalculate);
        for (uint256 i = 0; i < originFees.length; i++) {
            (uint newRestValue, uint feeValue) = subFeeInBp(restValue, amount,  originFees[i].value);
            restValue = newRestValue;
            if (feeValue > 0) {
                transfer(LibAsset.Asset(matchCalculate, feeValue), from,  originFees[i].account, to);
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

    function parseOrder(LibOrder.Order memory order) pure internal returns (address beneficiary) {
        beneficiary = order.maker;
        if (order.dataType == LibOrderDataV1.V1) {
            (LibOrderDataV1.DataV1 memory orderData) = LibOrderDataV1.decodeOrderDataV1(order.data);
            if (orderData.benificiary != address(0)) {
                beneficiary = orderData.benificiary;
            }
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

    function getRoyalties(LibAsset.AssetType memory asset) internal view returns (LibPart.Part[] memory feesRecipients) {
        if (asset.tp != LibAsset.ERC1155_ASSET_TYPE && asset.tp != LibAsset.ERC721_ASSET_TYPE) {
            return feesRecipients;
        }
        (address addressAsset, uint tokenIdAsset) = abi.decode(asset.data, (address, uint));
        if (IERC165Upgradeable(addressAsset).supportsInterface(LibRoyaltiesV2._INTERFACE_ID_FEES)) {
            RoyaltiesV2Impl withFees = RoyaltiesV2Impl(addressAsset);
            try withFees.getRoyalties(tokenIdAsset) returns (LibPart.Part[] memory feesRecipientsResult) {
                feesRecipients = feesRecipientsResult;
            } catch {}
        } else if (IERC165Upgradeable(addressAsset).supportsInterface(LibRoyaltiesV1._INTERFACE_ID_FEES)) {
            RoyaltiesV1Impl withFees = RoyaltiesV1Impl(addressAsset);
            address payable[] memory recipients;
            try withFees.getFeeRecipients(tokenIdAsset) returns (address payable[] memory recipientsResult) {
                recipients = recipientsResult;
            } catch {
                return feesRecipients;
            }
            uint[] memory fees;
            try withFees.getFeeBps(tokenIdAsset) returns (uint[] memory feesResult) {
                fees = feesResult;
            } catch {
                return feesRecipients;
            }
            if (fees.length != recipients.length) {
                return feesRecipients;
            }
            feesRecipients = new LibPart.Part[](fees.length);
            for (uint256 i = 0; i < fees.length; i++) {
                feesRecipients[i].value = fees[i];
                feesRecipients[i].account = recipients[i];
            }
        }
        return feesRecipients;
    }


    uint256[46] private __gap;
}
