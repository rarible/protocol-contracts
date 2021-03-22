// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "../../exchange/v2/ITransferProxy.sol";
import "@rarible/lazy-mint/contracts/erc-1155/LibERC1155LazyMint.sol";
import "@rarible/lazy-mint/contracts/erc-1155/IERC1155LazyMint.sol";
import "../../roles/OperatorRole.sol";

contract ERC1155LazyMintTransferProxy is OperatorRole, ITransferProxy {
    function transfer(LibAsset.Asset memory asset, address, address to) override onlyOperator external {
        (address token, LibERC1155LazyMint.Mint1155Data memory data) = abi.decode(asset.assetType.data, (address, LibERC1155LazyMint.Mint1155Data));
        IERC1155LazyMint(token).mintAndTransfer(data, to, asset.amount);
    }
}
