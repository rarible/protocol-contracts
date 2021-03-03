// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;

import "@rarible/royalties/contracts/LibFee.sol";
import "@rarible/lazy-mint/contracts/erc-1155/LibERC1155LazyMint.sol";

library LibMint1155 {
    bytes32 public constant MINT_AND_TRANSFER_TYPEHASH = keccak256("Mint1155(uint256 tokenId,uint256 supply,string tokenURI,address[] creators,Fee[] fees)Fee(address account,uint256 value)");

    function hash(LibERC1155LazyMint.Mint1155Data memory data) internal pure returns (bytes32) {
        bytes32[] memory feesBytes = new bytes32[](data.fees.length);
        for (uint i = 0; i < data.fees.length; i++) {
            feesBytes[i] = LibFee.hash(data.fees[i]);
        }
        bytes32[] memory creatorsBytes = new bytes32[](data.creators.length);
        for (uint i = 0; i < data.creators.length; i++) {
            creatorsBytes[i] = bytes32(uint256(data.creators[i]));
        }
        return keccak256(abi.encode(
                MINT_AND_TRANSFER_TYPEHASH,
                data.tokenId,
                data.supply,
                keccak256(bytes(data.uri)),
                keccak256(abi.encodePacked(creatorsBytes)),
                keccak256(abi.encodePacked(feesBytes))
            ));
    }
}
