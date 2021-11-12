// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract MinterAccessControl is Initializable, OwnableUpgradeable {
    mapping (address => bool) private _minters;
    bool public minterAccessControlEnabled;

    event MinterAccessControlEnable();
    event MinterAccessControlDisable();
    event MinterGranted(address indexed account);
    event MinterRevoked(address indexed account);

    function __MinterAccessControl_init() internal initializer {
        __Ownable_init_unchained();
        __MinterAccessControl_init_unchained();
    }

    function __MinterAccessControl_init_unchained() internal initializer {
    }

    /**
     * @dev Modifier to validate if the sender is a valid minter
     */
    modifier validateMinter() {
        require(
            !minterAccessControlEnabled || _minters[_msgSender()],
            "MinterAccessControl: caller not minter"
        );
        _;
    }

    /**
     * @dev Enable minter control
     * When enabled, only addresses added to `grantMinter` will be allowed to mint
     */
    function enableMinterAccessControl() external onlyOwner {
        require(!minterAccessControlEnabled, "MinterAccessControl: Already enabled");
        minterAccessControlEnabled = true;
        emit MinterAccessControlEnable();
    }

    /**
     * @dev Disable minter control
     */
    function disableMinterAccessControl() external onlyOwner  {
        require(minterAccessControlEnabled, "MinterAccessControl: Already disabled");
        minterAccessControlEnabled = false;
        emit MinterAccessControlDisable();
    }

    /**
     * @dev Add `_minter` to the list of allowed minters.
     */
    function grantMinter(address _minter) external onlyOwner {
        require(!_minters[_minter], 'MinterAccessControl: Already minter');
        _minters[_minter] = true;
        emit MinterGranted(_minter);
    }

    /**
     * @dev Revoke `_minter` from the list of allowed minters.
     */
    function revokeMinter(address _minter) external onlyOwner {
        require(_minters[_minter], 'MinterAccessControl: Not minter');
        _minters[_minter] = false;
        emit MinterRevoked(_minter);
    }

    /**
     * @dev Returns `true` if minterControl is not enabled or `account` has been granted to minters.
     */
    function isValidMinter(address account) public view returns (bool) {
        return !minterAccessControlEnabled || _minters[account];
    }
}
