// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../../contracts/OrderValidator.sol";

contract OrderValidatorTest is OrderValidator {
    function __OrderValidatorTest_init() external initializer {
        __OrderValidator_init_unchained();
    }

    function validateOrderTest(LibOrder.Order calldata order, bytes calldata signature) external view {
        return validate(order, signature);
    }
}
