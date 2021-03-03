pragma solidity ^0.7.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";
import "@rarible/royalties/contracts/LibFee.sol";
import "../mintAndTransfer/erc1155/LibERC1155NonMinted.sol";
import "./LibERC1155NonMinted.sol";

interface IERC1155MintAndTransfer is IERC1155Upgradeable {
    function mintAndTransfer(
        LibERC1155NonMinted.Mint1155Data memory data,
        address to,
        uint256 _amount
    ) external;
}
