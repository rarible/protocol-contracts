// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import "../../contracts/OperatorRole.sol";

contract OperatorRoleTest is OperatorRole {
    function __OperatorRoleTest_init(address initialOwner) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained(initialOwner);
    }

    function getSomething() external view onlyOperator returns (uint) {
        return 10;
    }
}
