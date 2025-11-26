// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "./RoyaltiesArtBlocksImpl.sol";
contract TestERC721ArtBlocks is ERC721Upgradeable, RoyaltiesArtBlocksImpl {
    string private _baseURIValue;
    function initialize(string memory name_, string memory symbol_, string memory baseURI_) public initializer {
        __ERC721_init(name_, symbol_);

        _baseURIValue = baseURI_;
    }
    function baseURI() external view returns (string memory) {
        return _baseURIValue;
    }
    function mint(address to, uint tokenId) external {
        projects[tokenId].artistAddress = to;
        _mint(to, tokenId);
    }
}
