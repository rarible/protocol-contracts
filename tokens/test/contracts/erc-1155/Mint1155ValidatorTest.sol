// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "../../../contracts/erc-1155/Mint1155Validator.sol";

contract Mint1155ValidatorTest is Mint1155Validator {
    function __Mint1155ValidatorTest_init() external initializer {
        __Mint1155Validator_init_unchained();
    }

    function validateTest(address sender, LibERC1155LazyMint.Mint1155Data memory data, uint index) external view {
        if (sender != data.creators[index].account) {
            validate(data.creators[index].account, LibERC1155LazyMint.hash(data), data.signatures[index]);
        }
    }
}
