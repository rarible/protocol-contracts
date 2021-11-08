// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "../roles/OperatorRole.sol";
import "@rarible/exchange-interfaces/contracts/ITransferProxy.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";

contract TransferProxyForDeprecated is Initializable, OperatorRole, ITransferProxy {
    bytes4 constant public ERC721_DEP_ASSET_TYPE = bytes4(keccak256("ERC721_DEP"));

    function __TransferProxyForDeprecated_init() external initializer {
        __Ownable_init();
    }

    function transfer(LibAsset.Asset memory asset, address from, address to) override external onlyOperator {
        require(asset.assetType.assetClass == ERC721_DEP_ASSET_TYPE, "not supported asset type");
        require(asset.value == 1, "value validation error");
        (address token, uint tokenId) = abi.decode(asset.assetType.data, (address, uint));
        IERC721Upgradeable(token).transferFrom(from, to, tokenId);
    }
}