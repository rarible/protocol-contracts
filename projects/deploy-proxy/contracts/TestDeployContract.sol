// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

contract TestDeployContract {
    // State variables to store the values
    uint256 public value1;
    uint256 public value2;

    // Constructor with two parameters to initialize the state variables
    constructor(uint256 _value1, uint256 _value2) {
        value1 = _value1;
        value2 = _value2;
    }

    // Function to get the first value
    function getValue1() public view returns (uint256) {
        return value1;
    }

    // Function to get the second value
    function getValue2() public view returns (uint256) {
        return value2;
    }
}
