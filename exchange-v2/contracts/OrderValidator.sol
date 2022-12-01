// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "./libraries/LibOrder.sol";

import "@rarible/lib-signature/contracts/IERC1271.sol";
import "@rarible/lib-signature/contracts/LibSignature.sol";

import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol";

abstract contract OrderValidator is Initializable, ContextUpgradeable, EIP712Upgradeable {
    using LibSignature for bytes32;
    using AddressUpgradeable for address;
    
    bytes4 constant internal MAGICVALUE = 0x1626ba7e;

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
                    require(
                        IERC1271(order.maker).isValidSignature(_hashTypedDataV4(hash), signature) == MAGICVALUE,
                        "contract order signature verification error"
                    );
                } else {
                    // if maker is not contract then checking ECDSA signature
                    address signer;
                    if (signature.length == 65) {
                        signer = _hashTypedDataV4(hash).recover(signature);
                    }
                    if (signer != order.maker) {
                        revert("order signature verification error");
                    } else {
                        require (order.maker != address(0), "no maker");
                    }
                }
            }
        }
    }

    uint256[50] private __gap;
}
