// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import {ERC1155Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../../contracts/LibRoyaltiesV2.sol";
import "../../contracts/RoyaltiesV2.sol";
import "../../contracts/impl/AbstractRoyalties.sol";

contract TestERC1155WithRoyaltiesV2_InterfaceError is
    Initializable,
    AbstractRoyalties,
    RoyaltiesV2,
    ERC1155Upgradeable
{
    function mint(address to, uint tokenId, LibPart.Part[] memory _fees, uint amount) external {
        __ERC1155_init("");
        _mint(to, tokenId, amount, "");
        _saveRoyalties(tokenId, _fees);
    }

    function getRaribleV2Royalties(uint256) external pure override returns (LibPart.Part[] memory) {
        revert("getRaribleV2Royalties failed");
    }

    function _onRoyaltiesSet(uint256 _id, LibPart.Part[] memory _fees) internal override {}

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == LibRoyaltiesV2._INTERFACE_ID_ROYALTIES || super.supportsInterface(interfaceId);
    }
}
