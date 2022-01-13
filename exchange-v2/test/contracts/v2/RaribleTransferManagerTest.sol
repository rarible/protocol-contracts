// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../../../contracts/RaribleTransferManager.sol";
import "../../../contracts/ITransferExecutor.sol";
import "../../../contracts/OrderValidator.sol";
import "../../../contracts/AssetMatcher.sol";
import "@rarible/royalties/contracts/IRoyaltiesProvider.sol";

contract RaribleTransferManagerTest is RaribleTransferManager, TransferExecutor, OrderValidator, AssetMatcher {

    function encode(LibOrderDataV1.DataV1 memory data) pure external returns (bytes memory) {
        return abi.encode(data);
    }

    function encodeV2(LibOrderDataV2.DataV2 memory data) pure external returns (bytes memory) {
        return abi.encode(data);
    }

    function checkDoTransfers(
        LibAsset.AssetType memory makeMatch,
        LibAsset.AssetType memory takeMatch,
        LibFill.FillResult memory fill,
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder
    ) payable external {
        LibOrderDataV2.DataV2 memory leftOrderData = LibOrderData.parse(leftOrder);
        LibOrderDataV2.DataV2 memory rightOrderData = LibOrderData.parse(rightOrder);
        //NB!!! Only NOT onChain hashKey calculate here
        bytes32 leftOrderKeyHash = LibOrder.hashKey(leftOrder);
        bytes32 rightOrderKeyHash = LibOrder.hashKey(rightOrder);

        LibOrder.MatchedAssets memory matchedAssets = matchAssets(leftOrder, rightOrder);
        LibFee.MatchFees memory matchFees = getMatchFees(leftOrder, rightOrder, matchedAssets.makeMatch, matchedAssets.takeMatch, leftOrderKeyHash, rightOrderKeyHash);
        doTransfers(LibOrder.MatchedAssets(makeMatch, takeMatch), fill, leftOrder, rightOrder, leftOrderData, rightOrderData, matchFees);
    }

    function __TransferManager_init(
        INftTransferProxy _transferProxy,
        IERC20TransferProxy _erc20TransferProxy,
        uint newProtocolFee,
        address newCommunityWallet,
        IRoyaltiesProvider newRoyaltiesProvider
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __TransferExecutor_init_unchained(_transferProxy, _erc20TransferProxy);
        __RaribleTransferManager_init_unchained(newProtocolFee, newCommunityWallet, newRoyaltiesProvider);
        __OrderValidator_init_unchained();
    }

    function getOrderProtocolFee(LibOrder.Order memory order, bytes32 hash) override internal view returns(uint){
        return protocolFee;
    }

    function getProtocolFee() override internal view returns(uint) {
        return protocolFee;
    }

//    TODO delete this code, function realization: matchAssets(), getMatchFees()
    function matchAssets(LibOrder.Order memory orderLeft, LibOrder.Order memory orderRight) internal view returns (LibOrder.MatchedAssets memory matchedAssets) {
        matchedAssets.makeMatch = matchAssets(orderLeft.makeAsset.assetType, orderRight.takeAsset.assetType);
        require(matchedAssets.makeMatch.assetClass != 0, "assets don't match");
        matchedAssets.takeMatch = matchAssets(orderLeft.takeAsset.assetType, orderRight.makeAsset.assetType);
        require(matchedAssets.takeMatch.assetClass != 0, "assets don't match");
    }

    /// @dev ruturns MatchFees struct with protocol fees of both orders in a match
    function getMatchFees(
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder,
        LibAsset.AssetType memory makeMatch,
        LibAsset.AssetType memory takeMatch,
        bytes32 leftKeyHash,
        bytes32 rightKeyHash
    ) internal view returns(LibFee.MatchFees memory){
        LibFee.MatchFees memory result;
        result.feeSide = LibFeeSide.getFeeSide(makeMatch.assetClass, takeMatch.assetClass);
        uint leftFee = getOrderProtocolFee(leftOrder, leftKeyHash);
        uint rightFee = getOrderProtocolFee(rightOrder, rightKeyHash);
        if (result.feeSide == LibFeeSide.FeeSide.MAKE) {
            result.feeSideProtocolFee = leftFee;
            result.nftSideProtocolFee = rightFee;
        } else if (result.feeSide == LibFeeSide.FeeSide.TAKE) {
            result.feeSideProtocolFee = rightFee;
            result.nftSideProtocolFee = leftFee;
        }

        return result;
    }
}
