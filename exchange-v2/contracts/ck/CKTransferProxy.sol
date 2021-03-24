// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "../exchange/v2/ITransferProxy.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";

contract CKTransferProxy is ITransferProxy {
    function transfer(LibAsset.Asset memory asset, address from, address to) external override {
        require(asset.value == 1, "erc721 value error");
        (address token, uint tokenId) = abi.decode(asset.assetType.data, (address, uint256));
        IERC721Upgradeable(token).transferFrom(from, to, tokenId);
    }
}
