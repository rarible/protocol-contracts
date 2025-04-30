// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;

import "@rarible/role-operator/contracts/OperatorRole.sol";
import "@rarible/exchange-interfaces/contracts/INftTransferProxy.sol";

contract TransferProxy is INftTransferProxy, Initializable, OperatorRole {

    function __TransferProxy_init() external initializer {
        __Ownable_init();
    }

    function __TransferProxy_init_proxy(address _initialOwner) external initializer {
        __Ownable_init();
        transferOwnership(_initialOwner);
    }

    function erc721safeTransferFrom(IERC721Upgradeable token, address from, address to, uint256 tokenId) override external onlyOperator {
        token.safeTransferFrom(from, to, tokenId);
    }

    function erc1155safeTransferFrom(IERC1155Upgradeable token, address from, address to, uint256 id, uint256 value, bytes calldata data) override external onlyOperator {
        token.safeTransferFrom(from, to, id, value, data);
    }
}
