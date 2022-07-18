// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma abicoder v2;

import "../../contracts/RaribleTransferManager.sol";
import "@rarible/lazy-mint/contracts/erc-721/LibERC721LazyMint.sol";
import "@rarible/lazy-mint/contracts/erc-1155/LibERC1155LazyMint.sol";
import "../../contracts/TransferExecutor.sol";

//contract RaribleSimpleTest is RaribleTransferManager, TransferExecutor{
contract RaribleSimpleTest is RaribleTransferManager, TransferExecutor {

    function getRoyaltiesByAssetTest(LibAsset.AssetType memory matchNft) external returns (LibPart.Part[] memory) {
        return getRoyaltiesByAssetType(matchNft);
    }

    function encode721(LibERC721LazyMint.Mint721Data memory data)
    external
    view
    returns (bytes memory)
    {
        return abi.encode(address(this), data);
    }

    function encode1155(LibERC1155LazyMint.Mint1155Data memory data)
    external
    view
    returns (bytes memory)
    {
        return abi.encode(address(this), data);
    }
}
