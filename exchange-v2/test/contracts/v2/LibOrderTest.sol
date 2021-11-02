// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../../../contracts/LibOrder.sol";

contract LibOrderTest {
    function calculateRemaining(LibOrder.Order calldata order, uint fill) external pure returns (uint makeAmount, uint takeAmount) {
        return LibOrder.calculateRemaining(order, fill);
    }

    function hashKey(LibOrder.Order calldata order) external pure returns (bytes32) {
        return LibOrder.hashKey(order);
    }

    function validate(LibOrder.Order calldata order) external view {
        LibOrder.validate(order);
    }

    function encodeV2(LibOrderDataV2.DataV2 memory data) pure external returns (bytes memory) {
        return abi.encode(data);
    }
}
