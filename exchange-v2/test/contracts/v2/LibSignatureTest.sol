// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma abicoder v2;

import "../../../contracts/Lib/LibSignature.sol";
import "../../../contracts/LibOrder.sol";
import "@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol";

contract LibSignatureTest is EIP712Upgradeable{
    using LibSignature for bytes32;

    function recoverFromSigTest(bytes32 hash, bytes memory signature) external pure returns (address) {
        return hash.recover(signature);
    }

    function recoverFromParamsTest(bytes32 hash, uint8 v, bytes32 r, bytes32 s) external pure returns (address) {
        return hash.recover(v, r, s);
    }

    function getKeccak(string memory message) external pure returns(bytes32){
        return keccak256(bytes(message));
    }
}
