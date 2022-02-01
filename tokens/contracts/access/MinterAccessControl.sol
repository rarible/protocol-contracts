// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

abstract contract MinterAccessControl is Initializable, OwnableUpgradeable {
    mapping(address => bool) private _minters;
    
    event MinterAdded(address indexed operator, address indexed minter);
    event MinterRemoved(address indexed operator, address indexed minter);

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
        require(!_minters[_minter], 'Already minter');
        _minters[_minter] = true;
        emit MinterAdded(_msgSender(), _minter);
    }

    /**
     * @dev Revoke `_minter` from the list of allowed minters.
     */
    function removeMinter(address _minter) external onlyOwner {
        require(_minters[_minter], 'Not minter');
        _minters[_minter] = false;
        emit MinterRemoved(_msgSender(), _minter);
    }

    /**
     * @dev Returns `true` if `account` has been granted to minters.
     */
    function isMinter(address account) public view returns (bool) {
        return _minters[account];
    }

    uint256[9] private __gap;
}
