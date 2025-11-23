// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

contract TestERC721EX is ERC721Upgradeable {
    string private _contractURI;
    string private _baseURI;
    mapping(uint256 => string) private _tokenURIs;

    constructor(string memory _name, string memory _symbol, string memory uri) initializer {
        __ERC721_init(_name, _symbol);
        _contractURI = uri;
        emit CreateERC721Rarible(_msgSender(), _name, _symbol);
    }

    function mint(address to, uint tokenId, string memory tokenURI) external {
        _mint(to, tokenId);
        _tokenURIs[tokenId] = tokenURI;
    }

    function setBaseURI(string calldata uri) external {
        _baseURI = uri;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return _tokenURI(tokenId);
    }

    function _tokenURI(uint256 tokenId) internal view returns (string memory) {
        string memory __tokenURI = _tokenURIs[tokenId];
        string memory base = _baseURI;
        if (bytes(base).length == 0) {
            return __tokenURI;
        }
        if (bytes(__tokenURI).length == 0) {
            return string(abi.encodePacked(base, Strings.toString(tokenId)));
        }
        return string(abi.encodePacked(base, __tokenURI));
    }

    function setContractURI(string memory uri) external {
        _contractURI = uri;
    }

    function contractURI() external view returns (string memory) {
        return _contractURI;
    }

    function reveal(uint256 _index) external {
        emit TokenURIRevealed(_index, "test");
    }

    function getBatchIdAtIndex(uint256 _index) external view returns (uint256) {
        return 10;
    }

    event TokenURIRevealed(uint256 indexed index, string revealedURI);
    event CreateERC721Rarible(address owner, string name, string symbol);
}
