// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/exchange-interfaces/contracts/ITransferManager.sol";
import "@rarible/transfer-manager/contracts/TransferExecutor.sol";

contract SimpleTransferManager is TransferExecutor, ITransferManager {
    using SafeMathUpgradeable for uint;
    using LibTransfer for address;

    function __SimpleTransferManager_init(
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
    }

    function doTransfers(
        LibAsset.AssetType memory makeMatch,
        LibAsset.AssetType memory takeMatch,
        LibFill.FillResult memory fill,
        LibFill.FillEthTransfer memory ethBack,
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder,
        LibOrderDataV2.DataV2 memory leftOrderData,
        LibOrderDataV2.DataV2 memory rightOrderData
    ) override payable external  {
        address leftOrderBeneficiary = leftOrder.maker;
        address rightOrderBeneficiary = rightOrder.maker;

        transfer(LibAsset.Asset(makeMatch, fill.leftValue), leftOrder.maker, rightOrderBeneficiary, PAYOUT, TO_TAKER);
        transfer(LibAsset.Asset(takeMatch, fill.rightValue), rightOrder.maker, leftOrderBeneficiary, PAYOUT, TO_MAKER);
        uint totalMakeValue = fill.leftValue;
        uint totalTakeValue = fill.rightValue;
        deReturnResidue(makeMatch, takeMatch, totalMakeValue, totalTakeValue, ethBack);
    }

    function deReturnResidue(
        LibAsset.AssetType memory makeMatch,
        LibAsset.AssetType memory takeMatch,
        uint totalMakeValue,
        uint totalTakeValue,
        LibFill.FillEthTransfer memory ethBack
    ) internal {
        uint ethValue = ethBack.value;
        if ((makeMatch.assetClass == LibAsset.ETH_ASSET_CLASS) && (ethValue != 0)) {
            if (ethValue > totalMakeValue) {
                address(ethBack.back).transferEth(ethValue.sub(totalMakeValue));
            }
        } else if ((takeMatch.assetClass == LibAsset.ETH_ASSET_CLASS) && (ethValue != 0)) {
            if (ethValue > totalTakeValue) {
                address(ethBack.back).transferEth(ethValue.sub(totalTakeValue));
            }
        }
    }

    /*for transferring eth to contract*/
    fallback() external payable { }

    uint256[50] private __gap;
}
