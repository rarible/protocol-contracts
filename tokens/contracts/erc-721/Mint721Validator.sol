// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;

import "../erc-1271/ERC1271Validator.sol";
import "./LibMint721.sol";
import "@rarible/lazy-mint/contracts/erc-721/LibERC721LazyMint.sol";

contract Mint721Validator is ERC1271Validator {
    function __Mint721Validator_init_unchained() internal initializer {
        __EIP712_init("Mint721", "1");
    }

    function validate(LibERC721LazyMint.Mint721Data memory data, uint index) internal view {
        validate1271(data.creators[index], LibMint721.hash(data), data.signatures[index]);
    }
    uint256[50] private __gap;
}
