// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "../../contracts/impl/RoyaltiesV1Impl.sol";
import "../../contracts/LibRoyaltiesV1.sol";

contract TestERC721RoyaltiesV1 is RoyaltiesV1Impl, ERC721Upgradeable {
    function initialize() public initializer {
        __ERC721_init("", "");
    }
    function mint(address to, uint tokenId, LibPart.Part[] memory _fees) external {
        _mint(to, tokenId);
        _saveRoyalties(tokenId, _fees);
    }
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == LibRoyaltiesV1._INTERFACE_ID_FEES || super.supportsInterface(interfaceId);
    }
}
