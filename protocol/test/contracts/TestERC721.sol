// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./dependencies/RenderingContract.sol";
import "@openzeppelin/contracts/interfaces/IERC4906.sol";

contract TestERC721 is ERC721Upgradeable, OwnableUpgradeable, RenderingContract, IERC4906 {
    string private _baseURI;
    constructor(string memory _name, string memory _symbol) {
        __ERC721_init(_name, _symbol);
        __Ownable_init(_msgSender());
    }

    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }

    function mintFromContract(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }

    function setBaseURI(string calldata uri) external {
        _baseURI = uri;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return _tokenURI(tokenId);
    }

    function _tokenURI(uint256 tokenId) internal view returns (string memory) {
        string memory base = _baseURI;
        if (bytes(base).length == 0) {
            return "";
        }
        return string(abi.encodePacked(base, Strings.toString(tokenId)));
    }

    function reveal(uint256 _index) external {
        emit TokenURIRevealed(_index, "test");
    }

    function getBatchIdAtIndex(uint256) external pure returns (uint256) {
        return 10;
    }

    function mintWithPrice(address to, uint256[] memory tokenIds, address currency, uint256 pricePerToken) external {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _mint(to, tokenIds[i]);
        }
        IERC20(currency).transferFrom(_msgSender(), owner(), pricePerToken * tokenIds.length);
    }

    function updateMetaData(uint256 _tokenId) external {
        emit MetadataUpdate(_tokenId);
    }

    function updateBatchMetaData(uint256 _fromTokenId, uint256 _toTokenId) external {
        emit BatchMetadataUpdate(_fromTokenId, _toTokenId);
    }

    event TokenURIRevealed(uint256 indexed index, string revealedURI);
}
