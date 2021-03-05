pragma solidity ^0.7.0;

import "../../../contracts/roles/OperatorRole.sol";

contract OperatorRoleTest is OperatorRole {
    function __OperatorRoleTest_init() external initializer {
        __Ownable_init();
    }

    function getSomething() external view onlyOperator returns (uint) {
        return 10;
    }
}
