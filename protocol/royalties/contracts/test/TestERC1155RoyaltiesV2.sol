// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import {ERC1155Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "../../contracts/impl/RoyaltiesV2Impl.sol";
import "../../contracts/LibRoyaltiesV2.sol";

contract TestERC1155RoyaltiesV2 is RoyaltiesV2Impl, ERC1155Upgradeable {
    function initialize() public initializer {
        __ERC1155_init("");
    }
    function mint(address to, uint tokenId, uint amount, LibPart.Part[] memory _fees) external {
        _mint(to, tokenId, amount, "");
        _saveRoyalties(tokenId, _fees);
    }
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == LibRoyaltiesV2._INTERFACE_ID_ROYALTIES || super.supportsInterface(interfaceId);
    }
}
