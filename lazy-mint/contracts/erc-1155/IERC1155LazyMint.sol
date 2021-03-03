// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";
import "@rarible/royalties/contracts/LibFee.sol";
import "./LibERC1155LazyMint.sol";

interface IERC1155LazyMint is IERC1155Upgradeable {
    function mintAndTransfer(
        LibERC1155LazyMint.Mint1155Data memory data,
        address to,
        uint256 _amount
    ) external;
}
