// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "../../exchange/v2/ITransferProxy.sol";
import "@rarible/lazy-mint/contracts/erc-721/LibERC721LazyMint.sol";
import "@rarible/lazy-mint/contracts/erc-721/IERC721LazyMint.sol";

contract ERC721LazyMintTransferProxy is ITransferProxy {
    function transfer(LibAsset.Asset memory asset, address, address to) override external {
        require(asset.amount == 1, "erc721 amount error");
        (address token, LibERC721LazyMint.Mint721Data memory data) = abi.decode(asset.assetType.data, (address, LibERC721LazyMint.Mint721Data));
        IERC721LazyMint(token).mintAndTransfer(data, to);
    }
}
