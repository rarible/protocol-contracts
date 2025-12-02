// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import "../../contracts/OrderValidator.sol";

contract OrderValidatorTest is OrderValidator {
    function __OrderValidatorTest_init() external initializer {
        __OrderValidator_init_unchained();
    }

    function validateOrderTest(LibOrder.Order calldata order, bytes calldata signature) external view {
        return validate(order, signature);
    }

    function validateOrderTest2(LibOrder.Order calldata order, bytes calldata signature) external {
        return validate(order, signature);
    }
}
