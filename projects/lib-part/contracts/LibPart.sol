// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

/// @title Part type helpers
/// @notice Provides common identifiers and hashing helpers for protocol parts.
/// @author iflelsedeveloper (https://github.com/iflelsedeveloper)
library LibPart {
    /// @notice EIP-712 type hash for `Part`.
    bytes32 public constant TYPE_HASH = keccak256("Part(address account,uint96 value)");

    struct Part {
        address payable account;
        uint96 value;
    }

    /// @notice Hashes the provided part using EIP-712 encoding.
    /// @param part Part data to hash.
    /// @return Part hash.
    function hash(Part memory part) internal pure returns (bytes32) {
        return keccak256(abi.encode(TYPE_HASH, part.account, part.value));
    }
}
