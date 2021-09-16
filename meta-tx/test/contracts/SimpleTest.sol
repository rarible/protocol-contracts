// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

abstract contract SimpleTest {
    event SimpleEventSum(uint result);
    function testFunctionSum(uint a, uint b) internal returns(uint) {
        uint result = a + b;
        emit SimpleEventSum(result);
        return result;
    }
}
