// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;

import "@rarible/royalties/contracts/LibPart.sol";

library LibERC721LazyMint {
    bytes4 constant public ERC721_NON_MINTED_ASSET_TYPE = bytes4(keccak256("ERC721_LAZY"));

    struct Mint721Data {
        uint tokenId;
        string uri;
        address[] creators;
        LibFee.LibPart[] royalties;
        bytes[] signatures;
    }
}
