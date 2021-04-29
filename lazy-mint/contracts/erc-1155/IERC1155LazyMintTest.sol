// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@rarible/royalties/contracts/LibPart.sol";
import "./LibERC1155LazyMint.sol";
import "./IERC1155LazyMint.sol";

contract ERC1155LazyMintTest is IERC1155LazyMint, ERC1155Upgradeable {

    function __ERC1155Test_init() external initializer {
        __ERC1155_init("LazyMint1155");
    }

    function mintAndTransfer(LibERC1155LazyMint.Mint1155Data memory data, address to, uint256 _amount) public override virtual {
        emit Mint(data.tokenId, data.uri, data.creators, _amount);
    }
}
