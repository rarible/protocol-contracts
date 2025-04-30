// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;

import "@rarible/role-operator/contracts/OperatorRole.sol";
import "@rarible/exchange-interfaces/contracts/IERC20TransferProxy.sol";

contract ERC20TransferProxy is IERC20TransferProxy, Initializable, OperatorRole {

    function __ERC20TransferProxy_init() external initializer {
        __Ownable_init();
    }

    function __ERC20TransferProxy_init_proxy(address _initialOwner) external initializer {
        __Ownable_init();
        transferOwnership(_initialOwner);
    }

    function erc20safeTransferFrom(IERC20Upgradeable token, address from, address to, uint256 value) override external onlyOperator {
        require(token.transferFrom(from, to, value), "failure while transferring");
    }
}
