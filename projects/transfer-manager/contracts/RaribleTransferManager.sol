// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "@rarible/lazy-mint/contracts/erc-721/LibERC721LazyMint.sol";
import "@rarible/lazy-mint/contracts/erc-1155/LibERC1155LazyMint.sol";

import "@rarible/exchange-interfaces/contracts/IRoyaltiesProvider.sol";

import "@rarible/lib-bp/contracts/BpLibrary.sol";

import "./interfaces/ITransferManager.sol";

abstract contract RaribleTransferManager is OwnableUpgradeable, ITransferManager {
    using BpLibrary for uint;
    using SafeMathUpgradeable for uint;

    ProtocolFeeData public protocolFee;
    IRoyaltiesProvider public royaltiesRegistry;

    //deprecated
    address private defaultFeeReceiver;
    // deprecated
    mapping(address => address) private feeReceivers;

    /// @dev event that's emitted when ProtocolFeeData buyerAmount changes
    event BuyerFeeAmountChanged(uint oldValue, uint newValue);

    /// @dev event that's emitted when ProtocolFeeData sellerAmount changes
    event SellerFeeAmountChanged(uint oldValue, uint newValue);

    /// @dev event that's emitted when ProtocolFeeData receiver changes
    event FeeReceiverChanged(address oldValue, address newValue);

    /// @dev struct to store protocol fee - receiver address, buyer fee amount (in bp), seller fee amount (in bp)
    struct ProtocolFeeData {
        address receiver;
        uint48 buyerAmount;
        uint48 sellerAmount;
    }

    /**
        @notice initialises RaribleTransferManager state
        @param newProtocolFee deprecated
        @param newDefaultFeeReceiver deprecated
        @param newRoyaltiesProvider royaltiesRegistry contract address
     */
    function __RaribleTransferManager_init_unchained(
        uint newProtocolFee,
        address newDefaultFeeReceiver,
        IRoyaltiesProvider newRoyaltiesProvider
    ) internal initializer {
        royaltiesRegistry = newRoyaltiesProvider;
    }

    function setRoyaltiesRegistry(IRoyaltiesProvider newRoyaltiesRegistry) external onlyOwner {
        royaltiesRegistry = newRoyaltiesRegistry;
    }

    function setPrtocolFeeReceiver(address _receiver) public onlyOwner {
        emit FeeReceiverChanged(protocolFee.receiver, _receiver);
        protocolFee.receiver = _receiver;
    }

    function setPrtocolFeeBuyerAmount(uint48 _buyerAmount) public onlyOwner {
        emit BuyerFeeAmountChanged(protocolFee.buyerAmount, _buyerAmount);
        protocolFee.buyerAmount = _buyerAmount;
    }

    function setPrtocolFeeSellerAmount(uint48 _sellerAmount) public onlyOwner {
        emit SellerFeeAmountChanged(protocolFee.sellerAmount, _sellerAmount);
        protocolFee.sellerAmount = _sellerAmount;
    }

    function setAllProtocolFeeData(address _receiver, uint48 _buyerAmount, uint48 _sellerAmount) public onlyOwner {
        setPrtocolFeeReceiver(_receiver);
        setPrtocolFeeBuyerAmount(_buyerAmount);
        setPrtocolFeeSellerAmount(_sellerAmount);
    }

    /**
        @notice executes transfers for 2 matched orders
        @param left DealSide from the left order (see LibDeal.sol)
        @param right DealSide from the right order (see LibDeal.sol)
        @param feeSide feeSide of the match
        @return totalLeftValue - total amount for the left order
        @return totalRightValue - total amout for the right order
    */
    function doTransfers(
        LibDeal.DealSide memory left,
        LibDeal.DealSide memory right,
        LibFeeSide.FeeSide feeSide
    ) override internal returns (uint totalLeftValue, uint totalRightValue) {
        totalLeftValue = left.asset.value;
        totalRightValue = right.asset.value;

        if (feeSide == LibFeeSide.FeeSide.LEFT) {
            totalLeftValue = doTransfersWithFees(left, right, protocolFee);
            transferPayouts(right.asset.assetType, right.asset.value, right.from, left.payouts, right.proxy);
        } else if (feeSide == LibFeeSide.FeeSide.RIGHT) {
            totalRightValue = doTransfersWithFees(right, left,protocolFee);
            transferPayouts(left.asset.assetType, left.asset.value, left.from, right.payouts, left.proxy);
        } else {
            transferPayouts(left.asset.assetType, left.asset.value, left.from, right.payouts, left.proxy);
            transferPayouts(right.asset.assetType, right.asset.value, right.from, left.payouts, right.proxy);
        }
    }

    /**
        @notice executes the fee-side transfers (payment + fees)
        @param paymentSide DealSide of the fee-side order
        @param nftSide  DealSide of the nft-side order
        @param _protocolFee protocol fee data
        @return totalAmount of fee-side asset
    */
    function doTransfersWithFees(
        LibDeal.DealSide memory paymentSide,
        LibDeal.DealSide memory nftSide,
        ProtocolFeeData memory _protocolFee
    ) internal returns (uint totalAmount) {
        totalAmount = calculateTotalAmount(paymentSide.asset.value, _protocolFee, paymentSide.originFees);
        uint rest = transferProtocolFee(totalAmount, paymentSide.asset.value, paymentSide.from, _protocolFee, paymentSide.asset.assetType, paymentSide.proxy);

        rest = transferRoyalties(paymentSide.asset.assetType, nftSide.asset.assetType, nftSide.payouts, rest, paymentSide.asset.value, paymentSide.from, paymentSide.proxy);
        if (
            paymentSide.originFees.length  == 1 &&
            nftSide.originFees.length  == 1 &&
            nftSide.originFees[0].account == paymentSide.originFees[0].account
        ) { 
            LibPart.Part[] memory origin = new  LibPart.Part[](1);
            origin[0].account = nftSide.originFees[0].account;
            origin[0].value = nftSide.originFees[0].value + paymentSide.originFees[0].value;
            (rest,) = transferFees(paymentSide.asset.assetType, rest, paymentSide.asset.value, origin, paymentSide.from, paymentSide.proxy);
        } else {
            (rest,) = transferFees(paymentSide.asset.assetType, rest, paymentSide.asset.value, paymentSide.originFees, paymentSide.from, paymentSide.proxy);
            (rest,) = transferFees(paymentSide.asset.assetType, rest, paymentSide.asset.value, nftSide.originFees, paymentSide.from, paymentSide.proxy);
        }
        transferPayouts(paymentSide.asset.assetType, rest, paymentSide.from, nftSide.payouts, paymentSide.proxy);
    }

    function transferProtocolFee(
        uint totalAmount,
        uint amount,
        address from,
        ProtocolFeeData memory _protocolFee,
        LibAsset.AssetType memory matchCalculate,
        address proxy
    ) internal returns (uint) {
        (uint rest, uint fee) = subFeeInBp(totalAmount, amount, _protocolFee.buyerAmount + _protocolFee.sellerAmount);
        if (fee > 0) {
            transfer(LibAsset.Asset(matchCalculate, fee), from, _protocolFee.receiver, proxy);
        }
        return rest;
    }

    /**
        @notice Transfer royalties. If there is only one royalties receiver and one address in payouts and they match,
           nothing is transferred in this function
        @param paymentAssetType Asset Type which represents payment
        @param nftAssetType Asset Type which represents NFT to pay royalties for
        @param payouts Payouts to be made
        @param rest How much of the amount left after previous transfers
        @param from owner of the Asset to transfer
        @param proxy Transfer proxy to use
        @return How much left after transferring royalties
    */
    function transferRoyalties(
        LibAsset.AssetType memory paymentAssetType,
        LibAsset.AssetType memory nftAssetType,
        LibPart.Part[] memory payouts,
        uint rest,
        uint amount,
        address from,
        address proxy
    ) internal returns (uint) {
        LibPart.Part[] memory royalties = getRoyaltiesByAssetType(nftAssetType);
        if (
            royalties.length == 1 &&
            payouts.length == 1 &&
            royalties[0].account == payouts[0].account
        ) {
            require(royalties[0].value <= 5000, "Royalties are too high (>50%)");
            return rest;
        }
        (uint result, uint totalRoyalties) = transferFees(paymentAssetType, rest, amount, royalties, from, proxy);
        require(totalRoyalties <= 5000, "Royalties are too high (>50%)");
        return result;
    }

    /**
        @notice calculates royalties by asset type. If it's a lazy NFT, then royalties are extracted from asset. otherwise using royaltiesRegistry
        @param nftAssetType NFT Asset Type to calculate royalties for
        @return calculated royalties (Array of LibPart.Part)
    */
    function getRoyaltiesByAssetType(LibAsset.AssetType memory nftAssetType) internal returns (LibPart.Part[] memory) {
        if (nftAssetType.assetClass == LibAsset.ERC1155_ASSET_CLASS || nftAssetType.assetClass == LibAsset.ERC721_ASSET_CLASS) {
            (address token, uint tokenId) = abi.decode(nftAssetType.data, (address, uint));
            return royaltiesRegistry.getRoyalties(token, tokenId);
        } else if (nftAssetType.assetClass == LibERC1155LazyMint.ERC1155_LAZY_ASSET_CLASS) {
            (, LibERC1155LazyMint.Mint1155Data memory data) = abi.decode(nftAssetType.data, (address, LibERC1155LazyMint.Mint1155Data));
            return data.royalties;
        } else if (nftAssetType.assetClass == LibERC721LazyMint.ERC721_LAZY_ASSET_CLASS) {
            (, LibERC721LazyMint.Mint721Data memory data) = abi.decode(nftAssetType.data, (address, LibERC721LazyMint.Mint721Data));
            return data.royalties;
        }
        LibPart.Part[] memory empty;
        return empty;
    }

    /**
        @notice Transfer fees
        @param assetType Asset Type to transfer
        @param rest How much of the amount left after previous transfers
        @param amount Total amount of the Asset. Used as a base to calculate part from (100%)
        @param fees Array of LibPart.Part which represents fees to pay
        @param from owner of the Asset to transfer
        @param proxy Transfer proxy to use
        @return newRest how much left after transferring fees
        @return totalFees total number of fees in bp
    */
    function transferFees(
        LibAsset.AssetType memory assetType,
        uint rest,
        uint amount,
        LibPart.Part[] memory fees,
        address from,
        address proxy
    ) internal returns (uint newRest, uint totalFees) {
        totalFees = 0;
        newRest = rest;
        for (uint256 i = 0; i < fees.length; ++i) {
            totalFees = totalFees.add(fees[i].value);
            uint feeValue;
            (newRest, feeValue) = subFeeInBp(newRest, amount, fees[i].value);
            if (feeValue > 0) {
                transfer(LibAsset.Asset(assetType, feeValue), from, fees[i].account, proxy);
            }
        }
    }

    /**
        @notice transfers main part of the asset (payout)
        @param assetType Asset Type to transfer
        @param amount Amount of the asset to transfer
        @param from Current owner of the asset
        @param payouts List of payouts - receivers of the Asset
        @param proxy Transfer Proxy to use
    */
    function transferPayouts(
        LibAsset.AssetType memory assetType,
        uint amount,
        address from,
        LibPart.Part[] memory payouts,
        address proxy
    ) internal {
        require(payouts.length > 0, "transferPayouts: nothing to transfer");
        uint sumBps = 0;
        uint rest = amount;
        for (uint256 i = 0; i < payouts.length - 1; ++i) {
            uint currentAmount = amount.bp(payouts[i].value);
            sumBps = sumBps.add(payouts[i].value);
            if (currentAmount > 0) {
                rest = rest.sub(currentAmount);
                transfer(LibAsset.Asset(assetType, currentAmount), from, payouts[i].account, proxy);
            }
        }
        LibPart.Part memory lastPayout = payouts[payouts.length - 1];
        sumBps = sumBps.add(lastPayout.value);
        require(sumBps == 10000, "Sum payouts Bps not equal 100%");
        if (rest > 0) {
            transfer(LibAsset.Asset(assetType, rest), from, lastPayout.account, proxy);
        }
    }
    
    /**
        @notice calculates total amount of fee-side asset that is going to be used in match
        @param amount fee-side order value
        @param _protocolFee protocol fee
        @param orderOriginFees fee-side order's origin fee (it adds on top of the amount)
        @return total amount of fee-side asset
    */
    function calculateTotalAmount(
        uint amount,
        ProtocolFeeData memory _protocolFee,
        LibPart.Part[] memory orderOriginFees
    ) internal pure returns (uint) {
        
        uint fees = _protocolFee.buyerAmount;
        for (uint256 i = 0; i < orderOriginFees.length; ++i) {
            require(orderOriginFees[i].value <= 10000, "origin fee is too big");
            fees = fees + orderOriginFees[i].value;
        }

        return amount.add(amount.bp(fees));
    }

    function subFeeInBp(uint value, uint total, uint feeInBp) internal pure returns (uint newValue, uint realFee) {
        return subFee(value, total.bp(feeInBp));
    }

    function subFee(uint value, uint fee) internal pure returns (uint newValue, uint realFee) {
        if (value > fee) {
            newValue = value.sub(fee);
            realFee = fee;
        } else {
            newValue = 0;
            realFee = value;
        }
    }

    uint256[46] private __gap;
}
