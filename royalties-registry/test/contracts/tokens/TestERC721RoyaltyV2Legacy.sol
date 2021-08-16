// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "../../contracts/royalty-registry/RoyaltiesV2LegacyImpl.sol";
contract TestERC721RoyaltyV2Legacy is ERC721Upgradeable,  RoyaltiesV2LegacyImpl{
    function mint(address to, uint tokenId) external {
        _mint(to, tokenId);
    }
}