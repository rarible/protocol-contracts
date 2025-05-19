// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "@rarible/exchange-interfaces/contracts/ITransferProxy.sol";
import "@rarible/lazy-mint/contracts/erc-1155/LibERC1155LazyMint.sol";
import "@rarible/lazy-mint/contracts/erc-1155/IERC1155LazyMint.sol";
import "@rarible/role-operator/contracts/OperatorRole.sol";

contract ERC1155LazyMintTransferProxy is OperatorRole, ITransferProxy {

    function __ERC1155LazyMintTransferProxy_init_proxy(address _initialOwner) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        transferOwnership(_initialOwner);
    }

    function transfer(LibAsset.Asset memory asset, address from, address to) override onlyOperator external {
        (address token, LibERC1155LazyMint.Mint1155Data memory data) = abi.decode(asset.assetType.data, (address, LibERC1155LazyMint.Mint1155Data));
        IERC1155LazyMint(token).transferFromOrMint(data, from, to, asset.value);
    }
}
