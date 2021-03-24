// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;

import "@rarible/royalties/contracts/LibPart.sol";

library LibERC1155LazyMint {
    bytes4 constant public ERC1155_LAZY_ASSET_CLASS = bytes4(keccak256("ERC1155_LAZY"));

    struct Mint1155Data {
        uint tokenId;
        string uri;
        uint supply;
        address[] creators;
        LibPart.Part[] royalties;
        bytes[] signatures;
    }
}
