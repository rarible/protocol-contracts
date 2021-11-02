// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol";
import "@rarible/royalties/contracts/LibRoyalties2981.sol";
import "@rarible/royalties/contracts/IRoyalties2981.sol";

abstract contract Royalties2981Upgradeable is ERC165Upgradeable, IRoyalties2981 {
    function __Royalties2981Upgradeable_init_unchained() internal initializer {
        _registerInterface(LibRoyalties2981._INTERFACE_ID_ROYALTIES);
    }
}
