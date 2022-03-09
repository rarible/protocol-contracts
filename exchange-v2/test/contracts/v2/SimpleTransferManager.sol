// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/exchange-interfaces/contracts/ITransferManager.sol";
import "@rarible/libraries/contracts/BpLibrary.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";

abstract contract SimpleTransferManager is ITransferManager {
    using SafeMathUpgradeable for uint;

    function doTransfers(
        LibDeal.DealSide memory left,
        LibDeal.DealSide memory right,
        LibFeeSide.FeeSide feeSide,
        uint protocolFee
    ) override internal returns (uint totalMakeValue, uint totalTakeValue) {
        transfer(left.asset, left.from, right.from, left.proxy);
        transfer(right.asset, right.from, left.from, right.proxy);
        totalMakeValue = left.asset.value;
        totalTakeValue = right.asset.value;
    }

    uint256[50] private __gap;
}
