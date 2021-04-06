// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;

import "@rarible/royalties/contracts/LibPart.sol";

library LibERC721LazyMint {
    bytes4 constant public ERC721_LAZY_ASSET_CLASS = bytes4(keccak256("ERC721_LAZY"));

    struct Mint721Data {
        uint tokenId;
        string uri;
        address[] creators;
        LibPart.Part[] royalties;
        bytes[] signatures;
    }

    bytes32 public constant MINT_AND_TRANSFER_TYPEHASH = keccak256("Mint721(uint256 tokenId,string tokenURI,address[] creators,Part[] royalties)Part(address account,uint96 value)");

    function hash(Mint721Data memory data) internal pure returns (bytes32) {
        bytes32[] memory feesBytes = new bytes32[](data.royalties.length);
        for (uint i = 0; i < data.royalties.length; i++) {
            feesBytes[i] = LibPart.hash(data.royalties[i]);
        }
        bytes32[] memory creatorsBytes = new bytes32[](data.creators.length);
        for (uint i = 0; i < data.creators.length; i++) {
            creatorsBytes[i] = bytes32(uint256(data.creators[i]));
        }
        return keccak256(abi.encode(
                MINT_AND_TRANSFER_TYPEHASH,
                data.tokenId,
                keccak256(bytes(data.uri)),
                keccak256(abi.encodePacked(creatorsBytes)),
                keccak256(abi.encodePacked(feesBytes))
            ));
    }

}
