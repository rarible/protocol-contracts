// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title DigitoysBaseERC721
 * @dev Base ERC721 contract with lock/unlock functionality.
 * Locked tokens cannot be transferred until unlocked.
 */
abstract contract DigitoysBaseERC721 is 
    Initializable,
    ERC721EnumerableUpgradeable,
    OwnableUpgradeable 
{
    /// @dev Mapping from token ID to locked status
    mapping(uint256 => bool) private _lockedTokens;

    /// @dev Address authorized to lock/unlock tokens (e.g., game server)
    address private _locker;

    /// @dev Emitted when a token is locked
    event Locked(uint256 indexed tokenId);

    /// @dev Emitted when a token is unlocked
    event Unlocked(uint256 indexed tokenId);

    /// @dev Emitted when the locker address is updated
    event LockerUpdated(address indexed previousLocker, address indexed newLocker);

    /// @dev Error when trying to transfer a locked token
    error TokenLocked(uint256 tokenId);

    /// @dev Error when caller is not authorized to lock/unlock
    error NotAuthorizedToLock();

    /// @dev Error when token is already in the requested state
    error TokenAlreadyInState(uint256 tokenId, bool locked);

    /// @dev Error when token does not exist
    error TokenDoesNotExist(uint256 tokenId);

    /**
     * @dev Initializes the contract with name, symbol, and owner.
     */
    function __DigitoysBaseERC721_init(
        string memory _name,
        string memory _symbol,
        address _owner,
        address _lockerAddress
    ) internal onlyInitializing {
        __ERC721_init(_name, _symbol);
        __ERC721Enumerable_init();
        __Ownable_init();
        _transferOwnership(_owner);
        _locker = _lockerAddress;
    }

    /**
     * @dev Modifier to check if caller is authorized to lock/unlock tokens.
     * Owner, locker, and token owner can lock/unlock.
     */
    modifier onlyAuthorizedToLock(uint256 tokenId) {
        if (!_isAuthorizedToLock(tokenId)) {
            revert NotAuthorizedToLock();
        }
        _;
    }

    /**
     * @dev Returns true if the token is locked.
     * @param tokenId The token ID to check
     */
    function isLocked(uint256 tokenId) public view returns (bool) {
        return _lockedTokens[tokenId];
    }

    /**
     * @dev Returns the current locker address.
     */
    function locker() public view returns (address) {
        return _locker;
    }

    /**
     * @dev Locks a token, preventing transfers.
     * Can be called by owner, locker, or token owner.
     * @param tokenId The token ID to lock
     */
    function lock(uint256 tokenId) external onlyAuthorizedToLock(tokenId) {
        if (!_exists(tokenId)) {
            revert TokenDoesNotExist(tokenId);
        }
        if (_lockedTokens[tokenId]) {
            revert TokenAlreadyInState(tokenId, true);
        }

        _lockedTokens[tokenId] = true;
        emit Locked(tokenId);
        _afterLock(tokenId);
    }

    /**
     * @dev Unlocks a token, allowing transfers.
     * Can be called by owner, locker, or token owner.
     * @param tokenId The token ID to unlock
     */
    function unlock(uint256 tokenId) external onlyAuthorizedToLock(tokenId) {
        if (!_exists(tokenId)) {
            revert TokenDoesNotExist(tokenId);
        }
        if (!_lockedTokens[tokenId]) {
            revert TokenAlreadyInState(tokenId, false);
        }

        _lockedTokens[tokenId] = false;
        emit Unlocked(tokenId);
        _afterUnlock(tokenId);
    }

    /**
     * @dev Sets the locker address. Only owner can call.
     * @param newLocker The new locker address
     */
    function setLocker(address newLocker) external onlyOwner {
        address previousLocker = _locker;
        _locker = newLocker;
        emit LockerUpdated(previousLocker, newLocker);
    }

    /**
     * @dev Internal function to check if caller is authorized to lock/unlock.
     * @param tokenId The token ID being locked/unlocked
     */
    function _isAuthorizedToLock(uint256 tokenId) internal view returns (bool) {
        address caller = _msgSender();
        return caller == owner() || 
               caller == _locker || 
               (_exists(tokenId) && caller == ownerOf(tokenId));
    }

    /**
     * @dev Hook called after a token is locked. Override in derived contracts.
     * @param tokenId The token ID that was locked
     */
    function _afterLock(uint256 tokenId) internal virtual {
        // Override in derived contracts
    }

    /**
     * @dev Hook called after a token is unlocked. Override in derived contracts.
     * @param tokenId The token ID that was unlocked
     */
    function _afterUnlock(uint256 tokenId) internal virtual {
        // Override in derived contracts
    }

    /**
     * @dev Internal mint function that optionally locks the token.
     * @param to The address to mint to
     * @param tokenId The token ID to mint
     * @param locked Whether to lock the token after minting
     */
    function _mintWithLock(address to, uint256 tokenId, bool locked) internal {
        _safeMint(to, tokenId);
        if (locked) {
            _lockedTokens[tokenId] = true;
            emit Locked(tokenId);
            _afterLock(tokenId);
        }
    }

    /**
     * @dev Override to prevent transfers of locked tokens.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
        
        // Allow minting (from == address(0)) even for locked tokens
        if (from != address(0)) {
            for (uint256 i = 0; i < batchSize; i++) {
                uint256 tokenId = firstTokenId + i;
                if (_lockedTokens[tokenId]) {
                    revert TokenLocked(tokenId);
                }
            }
        }
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721EnumerableUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     */
    uint256[48] private __gap;
}

