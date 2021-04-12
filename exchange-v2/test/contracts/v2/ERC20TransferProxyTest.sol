// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@rarible/exchange-interfaces/contracts/IERC20TransferProxy.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract ERC20TransferProxyTest is IERC20TransferProxy, Initializable, OwnableUpgradeable {

    function __ERC20TransferProxy_init() external initializer {
        __Ownable_init();
    }

    function erc20safeTransferFrom(IERC20Upgradeable token, address from, address to, uint256 value) override external {
        require(token.transferFrom(from, to, value), "failure while transferring");
    }
}
