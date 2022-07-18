// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.9.0;

import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import "@rarible/royalties/contracts/LibRoyaltiesV1.sol";
import "@rarible/royalties/contracts/RoyaltiesV1.sol";

abstract contract RoyaltiesV1Upgradeable is ERC165Upgradeable, RoyaltiesV1 {
    function __RoyaltiesV1Upgradeable_init_unchained() internal initializer {
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == LibRoyaltiesV1._INTERFACE_ID_FEES || super.supportsInterface(interfaceId);
    }
}
