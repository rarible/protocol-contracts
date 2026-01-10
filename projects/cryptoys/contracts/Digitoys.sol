// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./DigitoysBaseERC721.sol";
import "./DigitoysItems.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";

/**
 * @title Digitoys
 * @dev Main Digitoys NFT contract with lock/unlock functionality and item equipping system.
 * Items can be equipped to Digitoys tokens using EIP712 signatures for secure operations.
 */
contract Digitoys is DigitoysBaseERC721, EIP712Upgradeable {
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.UintSet;
    using ECDSAUpgradeable for bytes32;

    /// @notice EIP712 typehash for item equipping signature
    bytes32 public constant EQUIP_TYPEHASH =
        keccak256("Equip(uint256 itemId,uint256 equippingTokenId,address owner,uint256 deadline)");

    /// @dev Address of the signer for equip signatures
    address private _signer;

    /// @dev Address of the Digitoys items contract
    DigitoysItems public items;

    /// @dev Mapping of token IDs to equipped item token IDs
    mapping(uint256 => EnumerableSetUpgradeable.UintSet) private _equippedTokens;

    /// @dev Token ID counter for auto-increment minting
    uint256 private _tokenIdCounter;

    /// @dev Base URI for token metadata
    string private _baseTokenURI;

    // Custom errors
    error InvalidSignature();
    error SignatureExpired();
    error CannotEquipToOthersTokens();
    error NotEquipped();
    error NotOwnerOfToken();
    error ItemAlreadyEquipped();
    error ZeroAddress();

    // Events
    event Equipped(uint256 indexed itemId, uint256 indexed tokenId);
    event Unequipped(uint256 indexed itemId, uint256 indexed tokenId);
    event SignerUpdated(address indexed previousSigner, address indexed newSigner);
    event ItemsContractUpdated(address indexed previousItems, address indexed newItems);
    event BaseURIUpdated(string newBaseURI);

    /// @custom:oz-upgrades-unsafe-allow constructor
    /// @dev Disable initializers only when deploying behind a proxy.
    /// For direct deployment (testing), leave this empty.
    constructor() {
        // _disableInitializers(); // Commented out for direct deployment in tests
    }

    /**
     * @dev Initializes the contract.
     * @param _owner Contract owner
     * @param _signerAddress Address authorized to sign equip messages
     * @param _lockerAddress Address authorized to lock/unlock tokens
     * @param _itemsAddress Address of the DigitoysItems contract
     * @param _baseURI Base URI for token metadata
     */
    function initialize(
        address _owner,
        address _signerAddress,
        address _lockerAddress,
        address _itemsAddress,
        string memory _baseURI
    ) public initializer {
        if (_owner == address(0) || _signerAddress == address(0)) {
            revert ZeroAddress();
        }
        
        __DigitoysBaseERC721_init("Digitoys", "TOYS", _owner, _lockerAddress);
        __EIP712_init("Digitoys", "1");
        
        _signer = _signerAddress;
        items = DigitoysItems(_itemsAddress);
        _baseTokenURI = _baseURI;
    }

    /**
     * @dev Mints a new Digitoys token.
     * @param to Address to mint to
     * @param isLocked Whether the token should be locked after minting
     * @return tokenId The ID of the newly minted token
     */
    function mintToy(address to, bool isLocked) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _mintWithLock(to, tokenId, isLocked);
        return tokenId;
    }

    /**
     * @dev Mints a new Digitoys token with a specific ID.
     * @param to Address to mint to
     * @param tokenId Specific token ID to mint
     * @param isLocked Whether the token should be locked after minting
     */
    function mintToyWithId(address to, uint256 tokenId, bool isLocked) external onlyOwner {
        _mintWithLock(to, tokenId, isLocked);
    }

    /**
     * @dev Mints an item and equips it to a Digitoys token in one transaction.
     * Requires a valid signature from the signer.
     * @param equippingTokenId The Digitoys token ID to equip the item to
     * @param itemType The type of item to mint
     * @param deadline Signature expiration timestamp
     * @param signature EIP712 signature from the signer
     * @return itemId The ID of the newly minted and equipped item
     */
    function mintEquippedItem(
        uint256 equippingTokenId,
        uint256 itemType,
        uint256 deadline,
        bytes calldata signature
    ) external returns (uint256) {
        if (block.timestamp > deadline) {
            revert SignatureExpired();
        }
        
        address tokenOwner = ownerOf(equippingTokenId);
        if (_msgSender() != tokenOwner) {
            revert CannotEquipToOthersTokens();
        }

        // Mint the item first to get the itemId
        uint256 itemId = items.mint(address(this), itemType);

        // Verify signature for equipping
        bytes32 digest = _getEquipDigest(itemId, equippingTokenId, tokenOwner, deadline);
        if (!_verifySignature(digest, signature)) {
            revert InvalidSignature();
        }

        // Equip the item
        _equippedTokens[equippingTokenId].add(itemId);
        emit Equipped(itemId, equippingTokenId);

        return itemId;
    }

    /**
     * @dev Equips an existing item to a Digitoys token.
     * Caller must own both the Digitoys token and the item.
     * @param itemId The item token ID to equip
     * @param tokenId The Digitoys token ID to equip to
     * @param deadline Signature expiration timestamp
     * @param signature EIP712 signature from the signer
     */
    function equip(
        uint256 itemId,
        uint256 tokenId,
        uint256 deadline,
        bytes calldata signature
    ) external {
        _equip(itemId, tokenId, _msgSender(), deadline, signature);
    }

    /**
     * @dev Equips an item to a Digitoys token on behalf of the owner.
     * Requires a valid signature from the token owner.
     * @param itemId The item token ID to equip
     * @param tokenId The Digitoys token ID to equip to
     * @param tokenOwner The owner of the Digitoys token
     * @param deadline Signature expiration timestamp
     * @param signature EIP712 signature from the signer
     */
    function equipFor(
        uint256 itemId,
        uint256 tokenId,
        address tokenOwner,
        uint256 deadline,
        bytes calldata signature
    ) external {
        _equip(itemId, tokenId, tokenOwner, deadline, signature);
    }

    /**
     * @dev Unequips an item from a Digitoys token.
     * Caller must own the Digitoys token.
     * @param tokenId The Digitoys token ID to unequip from
     * @param itemId The item token ID to unequip
     */
    function unequip(uint256 tokenId, uint256 itemId) external {
        _unequip(tokenId, itemId, _msgSender());
    }

    /**
     * @dev Unequips an item from a Digitoys token on behalf of the owner.
     * @param tokenId The Digitoys token ID to unequip from
     * @param itemId The item token ID to unequip
     * @param tokenOwner The owner of the Digitoys token
     */
    function unequipFor(uint256 tokenId, uint256 itemId, address tokenOwner) external {
        // Only owner, approved, or the token owner themselves can unequip
        if (_msgSender() != tokenOwner && 
            _msgSender() != owner() && 
            !isApprovedForAll(tokenOwner, _msgSender())) {
            revert NotOwnerOfToken();
        }
        _unequip(tokenId, itemId, tokenOwner);
    }

    /**
     * @dev Returns the list of equipped item IDs for a Digitoys token.
     * @param tokenId The Digitoys token ID to query
     * @return Array of equipped item token IDs
     */
    function equippedItems(uint256 tokenId) external view returns (uint256[] memory) {
        return _equippedTokens[tokenId].values();
    }

    /**
     * @dev Returns the number of equipped items for a Digitoys token.
     * @param tokenId The Digitoys token ID to query
     * @return Number of equipped items
     */
    function equippedItemsCount(uint256 tokenId) external view returns (uint256) {
        return _equippedTokens[tokenId].length();
    }

    /**
     * @dev Checks if an item is equipped to a Digitoys token.
     * @param tokenId The Digitoys token ID
     * @param itemId The item token ID
     * @return True if the item is equipped
     */
    function isEquipped(uint256 tokenId, uint256 itemId) external view returns (bool) {
        return _equippedTokens[tokenId].contains(itemId);
    }

    /**
     * @dev Returns the current signer address.
     */
    function signer() external view returns (address) {
        return _signer;
    }

    /**
     * @dev Sets the signer address. Only owner can call.
     * @param _newSigner The new signer address
     */
    function setSigner(address _newSigner) external onlyOwner {
        if (_newSigner == address(0)) {
            revert ZeroAddress();
        }
        address previousSigner = _signer;
        _signer = _newSigner;
        emit SignerUpdated(previousSigner, _newSigner);
    }

    /**
     * @dev Sets the DigitoysItems contract address. Only owner can call.
     * @param _newItems The new items contract address
     */
    function setItemsContract(address _newItems) external onlyOwner {
        if (_newItems == address(0)) {
            revert ZeroAddress();
        }
        address previousItems = address(items);
        items = DigitoysItems(_newItems);
        emit ItemsContractUpdated(previousItems, _newItems);
    }

    /**
     * @dev Sets the base URI for token metadata.
     * @param _newBaseURI New base URI
     */
    function setBaseURI(string memory _newBaseURI) external onlyOwner {
        _baseTokenURI = _newBaseURI;
        emit BaseURIUpdated(_newBaseURI);
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public pure override returns (string memory) {
        return "Digitoys";
    }

    /**
     * @dev Returns the symbol of the token.
     */
    function symbol() public pure override returns (string memory) {
        return "TOYS";
    }

    /**
     * @dev Returns the current token ID counter.
     */
    function currentTokenId() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @dev Hook called after a token is locked.
     * Unequips all items when a token is locked.
     */
    function _afterLock(uint256 tokenId) internal virtual override {
        // Optionally unequip all items when locked
        // This is left empty for flexibility - override in derived contracts if needed
    }

    /**
     * @dev Hook called after a token is unlocked.
     */
    function _afterUnlock(uint256 tokenId) internal virtual override {
        // Override in derived contracts if needed
    }

    /**
     * @dev Internal function to equip an item.
     */
    function _equip(
        uint256 itemId,
        uint256 tokenId,
        address tokenOwner,
        uint256 deadline,
        bytes calldata signature
    ) internal {
        if (block.timestamp > deadline) {
            revert SignatureExpired();
        }

        if (ownerOf(tokenId) != tokenOwner) {
            revert NotOwnerOfToken();
        }

        // Verify signature
        bytes32 digest = _getEquipDigest(itemId, tokenId, tokenOwner, deadline);
        if (!_verifySignature(digest, signature)) {
            revert InvalidSignature();
        }

        // Check if already equipped
        if (_equippedTokens[tokenId].contains(itemId)) {
            revert ItemAlreadyEquipped();
        }

        // Transfer item to this contract (escrow while equipped)
        items.transferFrom(tokenOwner, address(this), itemId);

        // Add to equipped set
        _equippedTokens[tokenId].add(itemId);
        emit Equipped(itemId, tokenId);
    }

    /**
     * @dev Internal function to unequip an item.
     */
    function _unequip(uint256 tokenId, uint256 itemId, address tokenOwner) internal {
        if (ownerOf(tokenId) != tokenOwner) {
            revert NotOwnerOfToken();
        }

        if (!_equippedTokens[tokenId].contains(itemId)) {
            revert NotEquipped();
        }

        // Remove from equipped set
        _equippedTokens[tokenId].remove(itemId);

        // Transfer item back to owner
        items.transferFrom(address(this), tokenOwner, itemId);

        emit Unequipped(itemId, tokenId);
    }

    /**
     * @dev Generates the EIP712 digest for an equip operation.
     */
    function _getEquipDigest(
        uint256 itemId,
        uint256 equippingTokenId,
        address tokenOwner,
        uint256 deadline
    ) internal view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(
                abi.encode(
                    EQUIP_TYPEHASH,
                    itemId,
                    equippingTokenId,
                    tokenOwner,
                    deadline
                )
            )
        );
    }

    /**
     * @dev Verifies that a signature was created by the signer.
     */
    function _verifySignature(bytes32 digest, bytes calldata signature) internal view returns (bool) {
        address recovered = digest.recover(signature);
        return recovered == _signer;
    }

    /**
     * @dev Returns the base URI for token metadata.
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Returns the domain separator for EIP712.
     */
    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     */
    uint256[44] private __gap;
}

