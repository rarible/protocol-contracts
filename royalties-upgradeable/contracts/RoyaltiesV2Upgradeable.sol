// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol";
import "@rarible/royalties/contracts/LibRoyaltiesV2.sol";
import "@rarible/royalties/contracts/RoyaltiesV2.sol";

abstract contract RoyaltiesV2Upgradeable is ERC165Upgradeable, RoyaltiesV2 {
    function __RoyaltiesV2Upgradeable_init_unchained() internal {
        _registerInterface(LibRoyaltiesV2._INTERFACE_ID_ROYALTIES);
    }
}
