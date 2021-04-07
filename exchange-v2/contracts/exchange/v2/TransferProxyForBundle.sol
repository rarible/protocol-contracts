// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "../../roles/OperatorRole.sol";
import "./ITransferProxy.sol";

contract TransferProxyForBundle is Initializable, OperatorRole, ITransferProxy {
    bytes4 constant public BUNDLE_CLASS = bytes4(keccak256("BUNDLE"));

    function __TransferProxyForBundle_init() external initializer {
        __Ownable_init();
    }

    function transfer(LibAsset.Asset memory asset, address from, address to) override external onlyOperator {
        require(asset.assetType.assetClass == BUNDLE_CLASS, "not supported asset type");
        require(asset.value == 1, "value validation error");
//        (address token, uint tokenId) = abi.decode(asset.assetType.data, (address, uint));TODO: delete need for brain k.shcherbakov@rarible.com
//        IERC721Upgradeable(token).transferFrom(from, to, tokenId); TODO: delete need for brain k.shcherbakov@rarible.com
        //TODO: write transfer logic
    }
}