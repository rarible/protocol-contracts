// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;

import "../../lib/ERC1271.sol";
import "./LibOrder.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol";

abstract contract OrderValidator is Initializable, ContextUpgradeable, EIP712Upgradeable {
    using ECDSAUpgradeable for bytes32;
    using AddressUpgradeable for address;

    bytes4 constant internal MAGICVALUE = 0x20c13b0b;

    function __OrderValidator_init_unchained() internal initializer {
        __EIP712_init_unchained("Exchange", "2");
    }

    function validate(LibOrder.Order memory order, bytes memory signature) internal view {
        if (_msgSender() != order.maker) {
            bytes32 hash = LibOrder.hash(order);
            if (order.maker.isContract()) {
                require(
                    ERC1271(order.maker).isValidSignature(_hashTypedDataV4(hash), signature) == MAGICVALUE,
                    "signature verification error"
                );
            } else {
                require(
                    _hashTypedDataV4(hash).recover(signature) == order.maker,
                    "signature verification error"
                );
            }
        }
    }
}
