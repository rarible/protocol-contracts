// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma abicoder v2;

import "../../contracts/erc-721/LibERC721LazyMint.sol";
import "@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol";
import "@rarible/lib-signature/contracts/LibSignature.sol";

contract ERC721Test is EIP712Upgradeable {
    using LibSignature for bytes32;

    function __ERC721Test_init() external initializer {
        __EIP712_init("Mint721", "1");
    }

    function recover(LibERC721LazyMint.Mint721Data memory data, bytes memory signature) external view returns (address) {
        bytes32 structHash = LibERC721LazyMint.hash(data);
        bytes32 hash = _hashTypedDataV4(structHash);
        return hash.recover(signature);
    }
}
