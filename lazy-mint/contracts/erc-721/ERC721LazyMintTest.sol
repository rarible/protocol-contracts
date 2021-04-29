// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/cryptography/ECDSAUpgradeable.sol";
import "@rarible/royalties/contracts/LibPart.sol";
import "./LibERC721LazyMint.sol";
import "./IERC721LazyMint.sol";

contract ERC721LazyMintTest is IERC721LazyMint, ERC721Upgradeable {

    function __ERC721LazyMintTest_init() external initializer {
        __ERC721_init("LazyMint721", "1");
    }

    function mintAndTransfer(LibERC721LazyMint.Mint721Data memory data, address to) public override virtual {
        emit Mint(data.tokenId, data.uri, data.creators);
    }
}
