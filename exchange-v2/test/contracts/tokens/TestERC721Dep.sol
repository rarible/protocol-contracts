pragma solidity ^0.7.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

contract TestERC721Dep is ERC721Upgradeable {
    function mint(address to, uint tokenId) external {
        _mint(to, tokenId);
    }

    function safeTransferFrom(address, address, uint256) public virtual override {
        revert();
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public virtual override {
        revert();
    }
}
