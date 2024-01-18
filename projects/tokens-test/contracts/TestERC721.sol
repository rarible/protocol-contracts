// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

contract TestERC721 is ERC721Upgradeable {
    constructor(string memory _name, string memory _symbol) public {
        __ERC721_init(_name, _symbol);
    }

    function mint(address to, uint tokenId) external {
        _mint(to, tokenId);
    }

    function setBaseURI(string calldata uri) external {

    }

    function reveal(uint256 _index) external {
        emit TokenURIRevealed(_index, "test");
    }

    function getBatchIdAtIndex(uint256 _index) external view returns (uint256) {
        return 10;
    }

    event TokenURIRevealed(uint256 indexed index, string revealedURI);
}
