// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;

import "./ERC1271.sol";
import "@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/cryptography/ECDSAUpgradeable.sol";

abstract contract ERC1271Validator is EIP712Upgradeable {
    using AddressUpgradeable for address;
    using ECDSAUpgradeable for bytes32;

    string constant SIGNATURE_ERROR = "signature verification error";
    bytes4 constant internal MAGICVALUE = 0x20c13b0b;

    function validate1271(address signer, bytes32 structHash, bytes memory signature) internal view {
        bytes32 hash = _hashTypedDataV4(structHash);
        if (signer.isContract()) {
            require(
                ERC1271(signer).isValidSignature(hash, signature) == MAGICVALUE,
                SIGNATURE_ERROR
            );
        } else {
            require(
                hash.recover(signature) == signer,
                SIGNATURE_ERROR
            );
        }
    }

}
