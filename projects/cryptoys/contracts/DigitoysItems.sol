// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title DigitoysItems
 * @dev ERC721 contract for equippable items that can be attached to Digitoys tokens.
 * Items can be minted, burned, and equipped/unequipped from Digitoys.
 */
contract DigitoysItems is 
    Initializable,
    ERC721EnumerableUpgradeable,
    ERC721BurnableUpgradeable,
    OwnableUpgradeable,
    AccessControlUpgradeable
{
    /// @dev Role for minters who can create new items
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @dev Role for the Digitoys contract to manage items during equip/unequip
    bytes32 public constant DIGITOYS_ROLE = keccak256("DIGITOYS_ROLE");

    /// @dev Counter for auto-incrementing token IDs
    uint256 private _tokenIdCounter;

    /// @dev Base URI for token metadata
    string private _baseTokenURI;

    /// @dev Mapping from token ID to item type (for game logic)
    mapping(uint256 => uint256) private _itemTypes;

    /// @dev Emitted when an item is minted
    event ItemMinted(address indexed to, uint256 indexed tokenId, uint256 itemType);

    /// @dev Emitted when base URI is updated
    event BaseURIUpdated(string newBaseURI);

    /// @custom:oz-upgrades-unsafe-allow constructor
    /// @dev Disable initializers only when deploying behind a proxy.
    /// For direct deployment (testing), leave this empty.
    constructor() {
        // _disableInitializers(); // Commented out for direct deployment in tests
    }

    /**
     * @dev Initializes the contract with name, symbol, and owner.
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _owner Contract owner
     * @param _baseURI Base URI for token metadata
     */
    function initialize(
        string memory _name,
        string memory _symbol,
        address _owner,
        string memory _baseURI
    ) public initializer {
        __ERC721_init(_name, _symbol);
        __ERC721Enumerable_init();
        __ERC721Burnable_init();
        __Ownable_init();
        __AccessControl_init();

        _transferOwnership(_owner);
        _grantRole(DEFAULT_ADMIN_ROLE, _owner);
        _grantRole(MINTER_ROLE, _owner);
        _baseTokenURI = _baseURI;
    }

    /**
     * @dev Mints a new item to the specified address.
     * @param to Address to mint to
     * @param itemType The type of item (for game logic)
     * @return tokenId The ID of the newly minted token
     */
    function mint(address to, uint256 itemType) external onlyRole(MINTER_ROLE) returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _itemTypes[tokenId] = itemType;
        
        emit ItemMinted(to, tokenId, itemType);
        return tokenId;
    }

    /**
     * @dev Mints a new item with a specific token ID.
     * @param to Address to mint to
     * @param tokenId Specific token ID to mint
     * @param itemType The type of item (for game logic)
     */
    function mintWithId(address to, uint256 tokenId, uint256 itemType) external onlyRole(MINTER_ROLE) {
        _safeMint(to, tokenId);
        _itemTypes[tokenId] = itemType;
        
        emit ItemMinted(to, tokenId, itemType);
    }

    /**
     * @dev Returns the item type for a given token.
     * @param tokenId The token ID to query
     */
    function itemType(uint256 tokenId) external view returns (uint256) {
        require(_exists(tokenId), "DigitoysItems: query for nonexistent token");
        return _itemTypes[tokenId];
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
     * @dev Grants the DIGITOYS_ROLE to the Digitoys contract.
     * @param digitoysContract Address of the Digitoys contract
     */
    function setDigitoysContract(address digitoysContract) external onlyOwner {
        _grantRole(DIGITOYS_ROLE, digitoysContract);
    }

    /**
     * @dev Burns an item. Can be called by owner, approved, or DIGITOYS_ROLE.
     * @param tokenId The token ID to burn
     */
    function burnItem(uint256 tokenId) external {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId) || hasRole(DIGITOYS_ROLE, _msgSender()),
            "DigitoysItems: caller is not owner nor approved nor Digitoys"
        );
        _burn(tokenId);
    }

    /**
     * @dev Returns the base URI for token metadata.
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Returns the current token ID counter.
     */
    function currentTokenId() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721EnumerableUpgradeable, ERC721Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Override required by Solidity for multiple inheritance.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal virtual override(ERC721Upgradeable, ERC721EnumerableUpgradeable) {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     */
    uint256[47] private __gap;
}

