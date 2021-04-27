// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;

import "./interfaces/ERC1271.sol";
import "./LibOrder.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol";

abstract contract OrderValidator is Initializable, ContextUpgradeable, EIP712Upgradeable {
    using ECDSAUpgradeable for bytes32;
    using AddressUpgradeable for address;

    bytes4 constant internal MAGICVALUE = 0x1626ba7e;

    function __OrderValidator_init_unchained() internal initializer {
        __EIP712_init_unchained("Exchange", "2");
    }

    function validate(LibOrder.Order memory order, bytes memory signature) internal view {
        if (order.salt == 0) {
            require(_msgSender() == order.maker, "maker is not tx sender");
        } else {
            if (_msgSender() != order.maker) {
                bytes32 hash = LibOrder.hash(order);
                if (order.maker.isContract()) {
                    require(
                        ERC1271(order.maker).isValidSignature(_hashTypedDataV4(hash), signature) == MAGICVALUE,
                        "contract order signature verification error"
                    );
                } else {
                    require(
                        _hashTypedDataV4(hash).recover(signature) == order.maker,
                        "order signature verification error"
                    );
                }
            }
        }
    }

    uint256[50] private __gap;
}
