// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/EnumerableSetUpgradeable.sol";

abstract contract MinterAccessControl is Initializable, OwnableUpgradeable {
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    EnumerableSetUpgradeable.AddressSet private _minters;
    
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
        require(!_minters.contains(_minter), 'MinterAccessControl: Already minter');
        _minters.add(_minter);
        emit MinterAdded(_msgSender(), _minter);
    }

    /**
     * @dev Revoke `_minter` from the list of allowed minters.
     */
    function removeMinter(address _minter) external onlyOwner {
        require(_minters.contains(_minter), 'MinterAccessControl: Not minter');
        _minters.remove(_minter);
        emit MinterRemoved(_msgSender(), _minter);
    }

    /**
     * @dev Returns `true` if `account` has been granted to minters.
     */
    function isMinter(address account) public view returns (bool) {
        return _minters.contains(account);
    }

    uint256[50] private __gap;
}
