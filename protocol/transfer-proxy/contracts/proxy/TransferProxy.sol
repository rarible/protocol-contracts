// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import "@rarible/role-operator/contracts/OperatorRole.sol";
import "@rarible/exchange-interfaces/contracts/INftTransferProxy.sol";

contract TransferProxy is INftTransferProxy, Initializable, OperatorRole {
    function __TransferProxy_init(address owner) external initializer {
        __Ownable_init(owner);
    }

    function erc721safeTransferFrom(
        IERC721 token,
        address from,
        address to,
        uint256 tokenId
    ) external override onlyOperator {
        token.safeTransferFrom(from, to, tokenId);
    }

    function erc1155safeTransferFrom(
        IERC1155 token,
        address from,
        address to,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external override onlyOperator {
        token.safeTransferFrom(from, to, id, value, data);
    }
}
