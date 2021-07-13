// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

library LibSignature {
    /**
     * @dev Returns the r, s, v parameters from the given signature
     */
    function getParamsFromSig(bytes memory signature) internal pure returns (bytes32, bytes32, uint8) {
        // Check the signature length
        if (signature.length != 65) {
            revert("ECDSA: invalid signature length");
        }

        // Divide the signature in r, s and v variables
        bytes32 r;
        bytes32 s;
        uint8 v;

        //the only way to get signature parametrs currently is to use assembly.
        // solhint-disable-next-line no-inline-assembly
        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
        }

        return (r, s, v);
    }
}
