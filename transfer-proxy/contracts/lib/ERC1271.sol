// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;

abstract contract ERC1271 {

    // bytes4(keccak256("isValidSignature(bytes,bytes)")
    bytes4 constant internal MAGICVALUE = 0x20c13b0b;

    /**
     * @dev Should return whether the signature provided is valid for the provided data
     * @param _hash Hash of the data signed on the behalf of address(this)
     * @param _signature Signature byte array associated with _data
     *
     * MUST return the bytes4 magic value 0x20c13b0b when function passes.
     * MUST NOT modify state (using STATICCALL for solc < 0.5, view modifier for solc > 0.5)
     * MUST allow external calls
     */
    function isValidSignature(bytes32 _hash, bytes calldata _signature) virtual external view returns (bytes4 magicValue);
}