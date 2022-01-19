// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/exchange-interfaces/contracts/ITransferManager.sol";
import "@rarible/transfer-manager/contracts/TransferExecutor.sol";

contract SimpleTransferManager is TransferExecutor, ITransferManager {
    using LibTransfer for address;

    function __SimpleTransferManager_init(
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
    }

    function doTransfers(
//        LibAsset.Asset memory makeMatch,
//        LibAsset.Asset memory takeMatch,
//        LibDeal.Data memory left,
//        LibDeal.Data memory right,
//        address leftMaker,
//        address rightMaker,
//        address originalMessageSender
        LibDeal.DealSide memory left,
        LibDeal.DealSide memory  right,
        LibFeeSide.FeeSide feeSide,
        address initialSender
    ) override payable external returns (uint totalMakeValue, uint totalTakeValue) {
        address leftOrderBeneficiary = left.sideAddress;
        address rightOrderBeneficiary = right.sideAddress;

        transfer(LibAsset.Asset(left.assetType, left.value), left.sideAddress, rightOrderBeneficiary, PAYOUT, TO_TAKER);
        transfer(LibAsset.Asset(right.assetType, right.value), right.sideAddress, leftOrderBeneficiary, PAYOUT, TO_MAKER);

        uint ethBalance = address(this).balance;
        if (ethBalance > 0) {
            address(initialSender).transferEth(ethBalance);
        }
    }

    /*for transferring eth to contract*/
    receive() external payable {}

    uint256[50] private __gap;
}
