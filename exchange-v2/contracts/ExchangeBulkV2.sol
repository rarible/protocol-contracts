// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./ExchangeV2Core.sol";
import "./RaribleTransferManager.sol";
import "@rarible/royalties/contracts/IRoyaltiesProvider.sol";

contract ExchangeBulkV2 is ExchangeV2Core, RaribleTransferManager {
    using SafeMathUpgradeable for uint;
    using LibTransfer for address;

    function __ExchangeV2_init(
        INftTransferProxy _transferProxy,
        IERC20TransferProxy _erc20TransferProxy,
        uint newProtocolFee,
        address newDefaultFeeReceiver,
        IRoyaltiesProvider newRoyaltiesProvider
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __TransferExecutor_init_unchained(_transferProxy, _erc20TransferProxy);
        __RaribleTransferManager_init_unchained(newProtocolFee, newDefaultFeeReceiver, newRoyaltiesProvider);
        __OrderValidator_init_unchained();
    }

    /*Transfer by ExchangeV2 array orders */
    function matchOrdersBulk(
        LibOrder.Order[] memory sellOrders,
        bytes[] memory sellOrderSignatures,
        address buyer
    ) external payable {
        uint totalAmount;
        for (uint256 i = 0; i < sellOrders.length; i++) {
            validateFull(sellOrders[i], sellOrderSignatures[i]);
            LibOrder.Order memory buyerOrder;
            buyerOrder.maker = buyer;
            buyerOrder.makeAsset = sellOrders[i].takeAsset;
            buyerOrder.takeAsset = sellOrders[i].makeAsset;
            buyerOrder.dataType = 0xffffffff;
            totalAmount += matchAndTransferBulk(sellOrders[i], buyerOrder);
        }
        if (msg.value > totalAmount) {
            address(_msgSender()).transferEth(msg.value.sub(totalAmount));
        }
    }

}