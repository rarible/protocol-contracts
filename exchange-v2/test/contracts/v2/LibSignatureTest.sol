// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "../../../contracts/Lib/LibSignature.sol";

contract LibSignatureTest {
    using LibSignature for bytes;

    function getParamsFromSigTest(bytes memory signature) public pure returns (bytes32, bytes32, uint8) {

        bytes32 r;
        bytes32 s;
        uint8 v;
        (r, s, v) = signature.getParamsFromSig();

        return (r, s, v);
    }
}
