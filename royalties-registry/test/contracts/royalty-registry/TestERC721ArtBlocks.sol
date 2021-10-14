// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "../../contracts/royalty-registry/RoyaltiesArtBlocksImpl.sol";
contract TestERC721ArtBlocks is ERC721Upgradeable,  RoyaltiesArtBlocksImpl{
    function mint(address to, uint tokenId) external {
        projects[tokenId].artistAddress = to;
        _mint(to, tokenId);
    }
}
