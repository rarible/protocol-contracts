// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

/**
 * @title ERC1271
 * @notice Implementation of the ERC1271 interface
 * @author iflelsedeveloper (https://github.com/iflelsedeveloper)
 */
abstract contract ERC1271 {
    /// @notice The interface id for the ERC1271 interface
    bytes4 public constant ERC1271_INTERFACE_ID = 0xfb855dc9; // this.isValidSignature.selector

    /// @notice The magic number for a valid signature
    bytes4 public constant ERC1271_RETURN_VALID_SIGNATURE = 0x1626ba7e;
    /// @notice The magic number for an invalid signature
    bytes4 public constant ERC1271_RETURN_INVALID_SIGNATURE = 0x00000000;

    /**
     * @notice Function must be implemented by deriving contract
     * @param _hash Arbitrary length data signed on the behalf of address(this)
     * @param _signature Signature byte array associated with _data
     * @return A bytes4 magic value 0x1626ba7e if the signature check passes, 0x00000000 if not
     *
     * MUST NOT modify state (using STATICCALL for solc < 0.5, view modifier for solc > 0.5)
     * MUST allow external calls
     */
    function isValidSignature(bytes32 _hash, bytes memory _signature) public view virtual returns (bytes4);

    /**
     * @notice Returns the magic number for the isValidSignature function
     * @param isValid Whether the signature is valid
     * @return The magic number
     */
    function _returnIsValidSignatureMagicNumber(bool isValid) internal pure returns (bytes4) {
        return isValid ? ERC1271_RETURN_VALID_SIGNATURE : ERC1271_RETURN_INVALID_SIGNATURE;
    }
}
