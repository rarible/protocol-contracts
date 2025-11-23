// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

contract TestERC721EX is ERC721Upgradeable {
    string private _contractURI;

    constructor(string memory _name, string memory _symbol, string memory uri) {
        __ERC721_init(_name, _symbol);
        _contractURI = uri;
        emit CreateERC721Rarible(_msgSender(), _name, _symbol);
    }

    function mint(address to, uint tokenId, string memory tokenURI) external {
        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
    }

    function setBaseURI(string calldata uri) external {
        _setBaseURI(uri);
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
