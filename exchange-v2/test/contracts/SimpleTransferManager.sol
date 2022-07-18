// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma abicoder v2;

import "@rarible/transfer-manager/contracts/interfaces/ITransferManager.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";

abstract contract SimpleTransferManager is ITransferManager {
    using SafeMathUpgradeable for uint;

    function doTransfers(
        LibDeal.DealSide memory left,
        LibDeal.DealSide memory right,
        LibDeal.DealData memory dealData
    ) override internal returns (uint totalMakeValue, uint totalTakeValue) {
        transfer(left.asset, left.from, right.from, left.proxy);
        transfer(right.asset, right.from, left.from, right.proxy);
        totalMakeValue = left.asset.value;
        totalTakeValue = right.asset.value;
    }

    uint256[50] private __gap;
}
