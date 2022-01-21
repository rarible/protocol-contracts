// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/exchange-interfaces/contracts/ITransferManager.sol";
import "@rarible/transfer-manager/contracts/TransferExecutor.sol";
import "@rarible/transfer-proxy/contracts/roles/OperatorRole.sol";
import "@rarible/libraries/contracts/BpLibrary.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";

contract SimpleTransferManager is TransferExecutor, ITransferManager, OperatorRole {
    using LibTransfer for address;
    using BpLibrary for uint;
    using SafeMathUpgradeable for uint;

    function __SimpleTransferManager_init(
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
    }

    function doTransfers(
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

    function calculateTotalAmount(
        uint amount,
        uint feeOnTopBp,
        LibPart.Part[] memory orderOriginFees
    ) override public pure returns (uint total) {
        total = amount.add(amount.bp(feeOnTopBp));
        for (uint256 i = 0; i < orderOriginFees.length; i++) {
            total = total.add(amount.bp(orderOriginFees[i].value));
        }
    }

    function executeTransfer(
        LibAsset.Asset memory asset,
        address from,
        address to,
        bytes4 transferDirection,
        bytes4 transferType
    ) override external onlyOperator {
        require(asset.assetType.assetClass != LibAsset.ETH_ASSET_CLASS, "ETH not supported");
        transfer(asset, from, to, transferDirection, transferType);
    }

    /*for transferring eth to contract*/
    receive() external payable {}

    uint256[50] private __gap;
}
