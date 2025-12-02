// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import "./libraries/LibOrder.sol";

import "@rarible/lib-signature/contracts/IERC1271.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";

abstract contract OrderValidator is Initializable, ContextUpgradeable, EIP712Upgradeable {
    using ECDSA for bytes32;
    using AddressUpgradeable for address;

    bytes4 internal constant MAGICVALUE = 0x1626ba7e;

    function __OrderValidator_init_unchained() internal initializer {
        __EIP712_init_unchained("Exchange", "2");
    }

    function validate(LibOrder.Order memory order, bytes memory signature) internal view {
        if (order.salt == 0) {
            if (order.maker != address(0)) {
                require(_msgSender() == order.maker, "maker is not tx sender");
            }
        } else {
            if (_msgSender() != order.maker) {
                bytes32 hash = LibOrder.hash(order);
                // if maker is contract checking ERC1271 signature
                if (order.maker.isContract()) {
                    bool isValid = false;

                    try IERC1271(order.maker).isValidSignature(_hashTypedDataV4(hash), signature) returns (
                        bytes4 signatureResult
                    ) {
                        isValid = signatureResult == MAGICVALUE;
                    } catch {
                        isValid = false;
                    }

                    if (!isValid) {
                        require(order.maker != address(0), "no maker");
                        isValid = _hashTypedDataV4(hash).recover(signature) == order.maker;
                    }

                    require(isValid, "contract order signature verification error");
                } else {
                    // if maker is not contract then checking ECDSA signature
                    if (_hashTypedDataV4(hash).recover(signature) != order.maker) {
                        revert("order signature verification error");
                    } else {
                        require(order.maker != address(0), "no maker");
                    }
                }
            }
        }
    }

    uint256[50] private __gap;
}
