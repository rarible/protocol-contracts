// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;

import "@rarible/royalties/contracts/LibFee.sol";

library LibERC1155LazyMint {
    bytes4 constant public ERC1155_NON_MINTED_ASSET_TYPE = bytes4(keccak256("ERC1155_NON_MINTED"));

    struct Mint1155Data {
        uint tokenId;
        string uri;
        uint supply;
        address[] creators;
        LibFee.Fee[] fees;
        bytes[] signatures;
    }
}
