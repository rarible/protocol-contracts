// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;

library LibFee {
    bytes32 public constant FEE_TYPE_HASH = keccak256("Fee(address account,uint256 value)");

    struct Fee {
        address payable account;
        uint value;
    }

    function hash(Fee memory fee) internal pure returns (bytes32) {
        return keccak256(abi.encode(FEE_TYPE_HASH, fee.account, fee.value));
    }
}
