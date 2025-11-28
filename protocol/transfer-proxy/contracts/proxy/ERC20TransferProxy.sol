// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import "@rarible/role-operator/contracts/OperatorRole.sol";
import "@rarible/exchange-interfaces/contracts/IERC20TransferProxy.sol";

contract ERC20TransferProxy is IERC20TransferProxy, Initializable, OperatorRole {
    function __ERC20TransferProxy_init(address owner) external initializer {
        __Ownable_init(owner);
    }

    function erc20safeTransferFrom(
        IERC20 token,
        address from,
        address to,
        uint256 value
    ) external override onlyOperator {
        require(token.transferFrom(from, to, value), "failure while transferring");
    }
}
