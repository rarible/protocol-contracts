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
        LibAsset.Asset memory makeMatch,
        LibAsset.Asset memory takeMatch,
        LibDeal.Data memory left,
        LibDeal.Data memory right,
        address leftMaker,
        address rightMaker,
        address originalMessageSender
    ) override payable external {
        address leftOrderBeneficiary = leftMaker;
        address rightOrderBeneficiary = rightMaker;

        transfer(makeMatch, leftMaker, rightOrderBeneficiary, PAYOUT, TO_TAKER);
        transfer(takeMatch, rightMaker, leftOrderBeneficiary, PAYOUT, TO_MAKER);

        uint ethBalance = address(this).balance;
        if (ethBalance > 0) {
            address(originalMessageSender).transferEth(ethBalance);
        }
    }

    /*for transferring eth to contract*/
    fallback() external payable {}

    uint256[50] private __gap;
}
