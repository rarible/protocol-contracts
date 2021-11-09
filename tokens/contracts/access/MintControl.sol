// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract MintControl is Initializable, OwnableUpgradeable {
    mapping (address => bool) private _minters;
    bool public minterControlEnabled;

    event MinterControlEnable(address indexed sender);
    event MinterControlDisable(address indexed sender);
    event MinterGranted(address indexed account, address indexed sender);
    event MinterRevoked(address indexed account, address indexed sender);

    function __MintControl_init() internal initializer {
        __Ownable_init_unchained();
        __MintControl_init_unchained();
    }

    function __MintControl_init_unchained() internal initializer {
    }

    /**
     * @dev Modifier to validate if the sender is a valid minter
     */
    modifier validateMinter() {
        require(
            !minterControlEnabled || _minters[_msgSender()],
            "MintControl: caller not minter"
        );
        _;
    }

    /**
     * @dev Enable minter control
     * When enabled, only addresses added to `grantMinter` will be allowed to mint
     */
    function enableMinterControl() external onlyOwner {
        require(!minterControlEnabled, "MintControl: Already enabled");
        minterControlEnabled = true;
        emit MinterControlEnable(_msgSender());
    }

    /**
     * @dev Disable minter control
     */
    function disableMinterControl() external onlyOwner  {
        require(minterControlEnabled, "MintControl: Already disabled");
        minterControlEnabled = false;
        emit MinterControlDisable(_msgSender());
    }

    /**
     * @dev Add `_minter` to the list of allowed minters.
     */
    function grantMinter(address _minter) external onlyOwner {
        require(!_minters[_minter], 'MintControl: Already minter');
        _minters[_minter] = true;
        emit MinterGranted(_minter, _msgSender());
    }

    /**
     * @dev Revoke `_minter` from the list of allowed minters.
     */
    function revokeMinter(address _minter) external onlyOwner {
        require(_minters[_minter], 'MintControl: Not minter');
        _minters[_minter] = false;
        emit MinterRevoked(_minter, _msgSender());
    }

    /**
     * @dev Returns `true` if minterControl is not enabled or `account` has been granted to minters.
     */
    function isValidMinter(address account) public view returns (bool) {
        return !minterControlEnabled || _minters[account];
    }
}
