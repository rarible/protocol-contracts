// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;

import "../../../contracts/roles/OperatorRole.sol";
import "../../../contracts/exchange/v2/IErc20TransferProxy.sol";
//import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

contract ERC20TransferProxyTest is IErc20TransferProxy, Initializable, OperatorRole {

    function __ERC20TransferProxy_init() external initializer {
        __Ownable_init();
    }

    function erc20safeTransferFrom(IERC20Upgradeable token, address from, address to, uint256 value) override external onlyOperator {
        require(token.transferFrom(from, to, value), "failure while transferring");
    }
}
