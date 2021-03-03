// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;

import "@rarible/royalties/contracts/LibFee.sol";
import "../erc-1271/ERC1271Validator.sol";
import "./LibMint1155.sol";
import "@rarible/lazy-mint/contracts/erc-1155/LibERC1155LazyMint.sol";

contract Mint1155Validator is ERC1271Validator {
    function __Mint1155Validator_init_unchained() internal initializer {
        __EIP712_init_unchained("Mint1155", "1");
    }

    function validate(address sender, LibERC1155LazyMint.Mint1155Data memory data, uint index) internal view {
        address creator = data.creators[index];
        if (sender != creator) {
            validate1271(data.creators[index], LibMint1155.hash(data), data.signatures[index]);
        }
    }
}
