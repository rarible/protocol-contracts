// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma abicoder v2;

contract LibEncoderTest {

    struct Balance {
        address recipient;
        uint256 value;
    }

    function encodeAbi(Balance[] memory _balances) external pure returns (bytes memory) {
        return abi.encode(_balances);
    }

}