// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@rarible/lazy-mint/contracts/erc-721/LibERC721LazyMint.sol";
import "@rarible/lazy-mint/contracts/erc-1155/LibERC1155LazyMint.sol";
import "@rarible/libraries/contracts/LibFill.sol";
import "@rarible/libraries/contracts/LibFeeSide.sol";
import "@rarible/libraries/contracts/LibDeal.sol";
import "@rarible/exchange-interfaces/contracts/ITransferManager.sol";

import "./TransferExecutor.sol";

contract RaribleTransferManager is TransferExecutor, ITransferManager {
    using BpLibrary for uint;
    using SafeMathUpgradeable for uint;
    using LibTransfer for address;

    function __RaribleTransferManager_init(
        address newDefaultFeeReceiver,
        IRoyaltiesProvider newRoyaltiesProvider,
        address transferProxy,
        address erc20TransferProxy
    ) internal initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __TransferExecutor_init_unchained();
        __RaribleTransferManager_init_unchained();
        __TransferExecutorCore_init_unchained(newDefaultFeeReceiver, newRoyaltiesProvider, transferProxy, erc20TransferProxy);
    }

    function __RaribleTransferManager_init_unchained() internal initializer {
    }

    function doTransfers(
        LibDeal.DealSide memory left,
        LibDeal.DealSide memory right,
        LibFeeSide.FeeSide feeSide,
        uint _protocolFee
    ) override internal returns (uint totalLeftValue, uint totalRightValue) {
        totalLeftValue = left.asset.value;
        totalRightValue = right.asset.value;

        if (feeSide == LibFeeSide.FeeSide.LEFT) {
            totalLeftValue = doTransfersWithFees(left, right, _protocolFee);
            transferPayouts(right.asset.assetType, right.asset.value, right.from, left.payouts, right.proxy);
        } else if (feeSide == LibFeeSide.FeeSide.RIGHT) {
            totalRightValue = doTransfersWithFees(right, left, _protocolFee);
            transferPayouts(left.asset.assetType, left.asset.value, left.from, right.payouts, left.proxy);
        } else {
            transferPayouts(left.asset.assetType, left.asset.value, left.from, right.payouts, left.proxy);
            transferPayouts(right.asset.assetType, right.asset.value, right.from, left.payouts, right.proxy);
        }
    }

    function doTransfersWithFees(
        LibDeal.DealSide memory calculateSide,
        LibDeal.DealSide memory nftSide,
        uint _protocolFee
    ) internal returns (uint totalAmount) {
        totalAmount = calculateTotalAmount(calculateSide.asset.value, _protocolFee, calculateSide.originFees);
        uint rest = transferProtocolFee(totalAmount, calculateSide.asset.value, calculateSide.from, _protocolFee, _protocolFee, calculateSide.asset.assetType, calculateSide.proxy);
        rest = transferRoyalties(calculateSide.asset.assetType, nftSide.asset.assetType, rest, calculateSide.asset.value, calculateSide.from, calculateSide.proxy);
        (rest,) = transferFees(calculateSide.asset.assetType, rest, calculateSide.asset.value, calculateSide.originFees, calculateSide.from, calculateSide.proxy);
        (rest,) = transferFees(calculateSide.asset.assetType, rest, calculateSide.asset.value, nftSide.originFees, calculateSide.from, calculateSide.proxy);
        transferPayouts(calculateSide.asset.assetType, rest, calculateSide.from, nftSide.payouts, calculateSide.proxy);
    }

    function transferProtocolFee(
        uint totalAmount,
        uint amount,
        address from,
        uint feeSideProtocolFee,
        uint nftSideProtocolFee,
        LibAsset.AssetType memory matchCalculate,
        address proxy
    ) internal returns (uint) {
        (uint rest, uint fee) = subFeeInBp(totalAmount, amount, feeSideProtocolFee + nftSideProtocolFee);
        if (fee > 0) {
            address tokenAddress = address(0);
            if (matchCalculate.assetClass == LibAsset.ERC20_ASSET_CLASS) {
                tokenAddress = abi.decode(matchCalculate.data, (address));
            } else if (matchCalculate.assetClass == LibAsset.ERC1155_ASSET_CLASS) {
                uint tokenId;
                (tokenAddress, tokenId) = abi.decode(matchCalculate.data, (address, uint));
            }
            transfer(LibAsset.Asset(matchCalculate, fee), from, getFeeReceiver(tokenAddress), proxy);
        }
        return rest;
    }

    function transferRoyalties(
        LibAsset.AssetType memory matchCalculate,
        LibAsset.AssetType memory matchNft,
        uint rest,
        uint amount,
        address from,
        address proxy
    ) internal returns (uint) {
        LibPart.Part[] memory fees = getRoyaltiesByAssetType(matchNft);

        (uint result, uint totalRoyalties) = transferFees(matchCalculate, rest, amount, fees, from, proxy);
        require(totalRoyalties <= 5000, "Royalties are too high (>50%)");
        return result;
    }

    function getRoyaltiesByAssetType(LibAsset.AssetType memory matchNft) internal returns (LibPart.Part[] memory) {
        if (matchNft.assetClass == LibAsset.ERC1155_ASSET_CLASS || matchNft.assetClass == LibAsset.ERC721_ASSET_CLASS) {
            (address token, uint tokenId) = abi.decode(matchNft.data, (address, uint));
            return royaltiesRegistry.getRoyalties(token, tokenId);
        } else if (matchNft.assetClass == LibERC1155LazyMint.ERC1155_LAZY_ASSET_CLASS) {
            (, LibERC1155LazyMint.Mint1155Data memory data) = abi.decode(matchNft.data, (address, LibERC1155LazyMint.Mint1155Data));
            return data.royalties;
        } else if (matchNft.assetClass == LibERC721LazyMint.ERC721_LAZY_ASSET_CLASS) {
            (, LibERC721LazyMint.Mint721Data memory data) = abi.decode(matchNft.data, (address, LibERC721LazyMint.Mint721Data));
            return data.royalties;
        }
        LibPart.Part[] memory empty;
        return empty;
    }

    function transferFees(
        LibAsset.AssetType memory matchCalculate,
        uint rest,
        uint amount,
        LibPart.Part[] memory fees,
        address from,
        address proxy
    ) internal returns (uint restValue, uint totalFees) {
        totalFees = 0;
        restValue = rest;
        for (uint256 i = 0; i < fees.length; i++) {
            totalFees = totalFees.add(fees[i].value);
            (uint newRestValue, uint feeValue) = subFeeInBp(restValue, amount, fees[i].value);
            restValue = newRestValue;
            if (feeValue > 0) {
                transfer(LibAsset.Asset(matchCalculate, feeValue), from, fees[i].account, proxy);
            }
        }
    }

    function transferPayouts(
        LibAsset.AssetType memory matchCalculate,
        uint amount,
        address from,
        LibPart.Part[] memory payouts,
        address proxy
    ) internal {
        require(payouts.length > 0, "transferPayouts: nothing to transfer");
        uint sumBps = 0;
        uint restValue = amount;
        for (uint256 i = 0; i < payouts.length - 1; i++) {
            uint currentAmount = amount.bp(payouts[i].value);
            sumBps = sumBps.add(payouts[i].value);
            if (currentAmount > 0) {
                restValue = restValue.sub(currentAmount);
                transfer(LibAsset.Asset(matchCalculate, currentAmount), from, payouts[i].account, proxy);
            }
        }
        LibPart.Part memory lastPayout = payouts[payouts.length - 1];
        sumBps = sumBps.add(lastPayout.value);
        require(sumBps == 10000, "Sum payouts Bps not equal 100%");
        if (restValue > 0) {
            transfer(LibAsset.Asset(matchCalculate, restValue), from, lastPayout.account, proxy);
        }
    }

    function calculateTotalAmount(
        uint amount,
        uint feeOnTopBp,
        LibPart.Part[] memory orderOriginFees
    ) override internal pure returns (uint total) {
        total = amount.add(amount.bp(feeOnTopBp));
        for (uint256 i = 0; i < orderOriginFees.length; i++) {
            total = total.add(amount.bp(orderOriginFees[i].value));
        }
    }

    uint256[46] private __gap;
}
