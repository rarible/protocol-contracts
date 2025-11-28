// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import "@rarible/role-operator/contracts/OperatorRole.sol";
import "@rarible/exchange-interfaces/contracts/ITransferProxy.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract TransferProxyForDeprecated is Initializable, OperatorRole, ITransferProxy {
    bytes4 public constant ERC721_DEP_ASSET_TYPE = bytes4(keccak256("ERC721_DEP"));

    function __TransferProxyForDeprecated_init(address owner) external initializer {
        __Ownable_init(owner);
    }

    function transfer(LibAsset.Asset memory asset, address from, address to) external override onlyOperator {
        require(asset.assetType.assetClass == ERC721_DEP_ASSET_TYPE, "not supported asset type");
        require(asset.value == 1, "value validation error");
        (address token, uint tokenId) = abi.decode(asset.assetType.data, (address, uint));
        IERC721(token).transferFrom(from, to, tokenId);
    }
}
