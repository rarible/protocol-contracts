// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

abstract contract MinterAccessControl is OwnableUpgradeable {
    mapping(address => bool) private _minters;
    
    event MinterStatusChanged(address indexed minter, bool indexed status);

    function __MinterAccessControl_init() internal initializer {
        __Ownable_init_unchained();
        __MinterAccessControl_init_unchained();
    }

    function __MinterAccessControl_init_unchained() internal initializer {
    }

    /**
     * @dev Add `_minter` to the list of allowed minters.
     */
    function addMinter(address _minter) external onlyOwner {
        _minters[_minter] = true;
        emit MinterStatusChanged(_minter, true);
    }

    /**
     * @dev Revoke `_minter` from the list of allowed minters.
     */
    function removeMinter(address _minter) external onlyOwner {
        _minters[_minter] = false;
        emit MinterStatusChanged(_minter, false);
    }

    /**
     * @dev Returns `true` if `account` has been granted to minters.
     */
    function isMinter(address account) public view returns (bool) {
        return _minters[account];
    }

    uint256[50] private __gap;
}
