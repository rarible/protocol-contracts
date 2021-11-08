// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "../../../contracts/Mint721Validator.sol";

contract Mint721ValidatorTest is Mint721Validator {
    function __Mint721ValidatorTest_init() external initializer {
        __Mint721Validator_init_unchained();
    }

    function validateTest(LibERC721LazyMint.Mint721Data memory data, uint index) external view {
        validate(data.creators[index].account, LibERC721LazyMint.hash(data), data.signatures[index]);
    }
}
