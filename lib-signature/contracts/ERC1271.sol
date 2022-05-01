// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

abstract contract ERC1271 {
    bytes4 constant public ERC1271_INTERFACE_ID = 0xfb855dc9; // this.isValidSignature.selector

    bytes4 constant public ERC1271_RETURN_VALID_SIGNATURE =   0x1626ba7e;
    bytes4 constant public ERC1271_RETURN_INVALID_SIGNATURE = 0x00000000;

    /**
    * @dev Function must be implemented by deriving contract
    * @param _hash Arbitrary length data signed on the behalf of address(this)
    * @param _signature Signature byte array associated with _data
    * @return A bytes4 magic value 0x1626ba7e if the signature check passes, 0x00000000 if not
    *
    * MUST NOT modify state (using STATICCALL for solc < 0.5, view modifier for solc > 0.5)
    * MUST allow external calls
    */
    function isValidSignature(bytes32 _hash, bytes memory _signature) public virtual view returns (bytes4);

    function returnIsValidSignatureMagicNumber(bool isValid) internal pure returns (bytes4) {
        return isValid ? ERC1271_RETURN_VALID_SIGNATURE : ERC1271_RETURN_INVALID_SIGNATURE;
    }
}