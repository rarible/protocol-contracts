// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import "@rarible/lib-signature/contracts/ERC1271.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Address.sol";

abstract contract ERC1271Validator is EIP712Upgradeable {
    using Address for address;
    using ECDSA for bytes32;
    string constant SIGNATURE_ERROR = "signature verification error";
    bytes4 internal constant MAGICVALUE = 0x1626ba7e;
    function validate1271(address signer, bytes32 structHash, bytes memory signature) internal view {
        bytes32 hash = _hashTypedDataV4(structHash);
        address signerFromSig;
        if (signature.length == 65) {
            signerFromSig = hash.recover(signature);
        }
        if (signerFromSig != signer) {
            if (_isContract(signer)) {
                require(ERC1271(signer).isValidSignature(hash, signature) == MAGICVALUE, SIGNATURE_ERROR);
            } else {
                revert(SIGNATURE_ERROR);
            }
        }
    }

    /**
     * @dev Returns true if `account` has code associated with it.
     *
     * This is a thin wrapper around `account.code.length > 0`.
     *
     * ⚠ Account Abstraction notes:
     * - `false` **does not mean** “EOA for sure”.
     *   It can also be:
     *     * a contract in construction,
     *     * a counterfactual (not-yet-deployed) smart account,
     *     * an address where a contract used to live.
     * - Do **not** use this to block contracts or to distinguish EOAs vs contracts
     *   for permissions. Here we only use it to decide whether it makes sense to
     *   attempt an ERC-1271 call.
     */
    function _isContract(address account) private view returns (bool) {
        return account.code.length > 0;
    }

    uint256[50] private __gap;
}
