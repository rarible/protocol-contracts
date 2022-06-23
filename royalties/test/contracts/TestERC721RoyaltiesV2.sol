// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "../../contracts/impl/RoyaltiesV2Impl.sol";
import "../../contracts/LibRoyaltiesV2.sol";

contract TestERC721RoyaltiesV2 is RoyaltiesV2Impl, ERC721Upgradeable {
    function initialize() public initializer {
        _registerInterface(LibRoyaltiesV2._INTERFACE_ID_ROYALTIES);
    }
    function mint(address to, uint tokenId, LibPart.Part[] memory _fees) external {
        _mint(to, tokenId);
        _saveRoyalties(tokenId, _fees);
    }
}
