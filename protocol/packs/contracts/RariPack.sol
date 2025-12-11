// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

contract RariPack is
    Initializable,
    ERC721Upgradeable,
    OwnableUpgradeable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable
{
    // -----------------------
    // Types
    // -----------------------

    enum PackType {
        Bronze,
        Silver,
        Gold,
        Platinum
    }

    // -----------------------
    // Roles
    // -----------------------

    /// @dev Contracts that are allowed to burn packs (e.g. "open pack" contract)
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    // DEFAULT_ADMIN_ROLE comes from AccessControl (0x00)

    // -----------------------
    // Storage
    // -----------------------

    /// @dev Incremental token id counter
    uint256 private _nextTokenId;

    /// @dev tokenId => pack type
    mapping(uint256 => PackType) private _tokenPackType;

    /// @dev Price per pack type in wei
    mapping(PackType => uint256) private _packPrices;

    /// @dev Metadata URI per pack type (e.g. IPFS JSON)
    mapping(PackType => string) private _packURIs;

    /// @dev Address that receives mint proceeds
    address public treasury;

    // -----------------------
    // Events / Errors
    // -----------------------

    event PackPriceUpdated(PackType indexed packType, uint256 oldPrice, uint256 newPrice);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event PackURIUpdated(PackType indexed packType, string oldURI, string newURI);

    error TreasuryNotSet();
    error IncorrectEthSent();
    error ZeroAmount();
    error PriceNotSet();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // -----------------------
    // Init
    // -----------------------

    function initialize(
        address initialOwner,
        address initialTreasury,
        string memory name_,
        string memory symbol_
    ) external initializer {
        __ERC721_init(name_, symbol_);
        __Ownable_init(initialOwner);
        __AccessControl_init();
        __ReentrancyGuard_init();

        // AccessControl admin & burner
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(BURNER_ROLE, initialOwner);

        // Set treasury
        treasury = initialTreasury;
        emit TreasuryUpdated(address(0), initialTreasury);

        _nextTokenId = 1;
    }

    // -----------------------
    // Mint / Burn
    // -----------------------

    /// @notice Public mint: anyone can buy packs by paying the price in ETH.
    /// @param to Address that will receive the packs.
    /// @param packType Type of pack to mint.
    /// @param amount Number of packs (NFTs) to mint.
    function mintPack(address to, PackType packType, uint256 amount) external payable nonReentrant {
        if (amount == 0) revert ZeroAmount();

        uint256 pricePerPack = _packPrices[packType];
        if (pricePerPack == 0) revert PriceNotSet();

        uint256 totalPrice = pricePerPack * amount;
        if (msg.value != totalPrice) revert IncorrectEthSent();

        if (treasury == address(0)) revert TreasuryNotSet();

        for (uint256 i = 0; i < amount; i++) {
            uint256 tokenId = _nextTokenId++;
            _tokenPackType[tokenId] = packType;
            _safeMint(to, tokenId);
        }

        // Forward ETH to treasury
        (bool sent, ) = treasury.call{value: totalPrice}("");
        require(sent, "RariPack: ETH transfer failed");
    }

    /// @notice Burn a pack token. Only BURNER_ROLE (e.g. pack-opening contract) can call this.
    function burnPack(uint256 tokenId) external onlyRole(BURNER_ROLE) {
        _burn(tokenId);
        delete _tokenPackType[tokenId];
    }

    // -----------------------
    // Pricing
    // -----------------------

    /// @notice Set price for a given pack type (in wei).
    /// Only DEFAULT_ADMIN_ROLE can call.
    function setPackPrice(PackType packType, uint256 newPrice) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 oldPrice = _packPrices[packType];
        _packPrices[packType] = newPrice;
        emit PackPriceUpdated(packType, oldPrice, newPrice);
    }

    /// @notice Get price for a given pack type (in wei).
    function packPrice(PackType packType) external view returns (uint256) {
        return _packPrices[packType];
    }

    /// @notice Convenience getter by packTypeId (0..3: Bronze..Platinum).
    function packPriceById(uint256 packTypeId) external view returns (uint256) {
        require(packTypeId <= uint256(type(PackType).max), "RariPack: invalid pack type id");
        return _packPrices[PackType(packTypeId)];
    }

    // -----------------------
    // Metadata per pack type
    // -----------------------

    /// @notice Set metadata URI for a given pack type (e.g. IPFS JSON).
    /// Only DEFAULT_ADMIN_ROLE can call.
    function setPackURI(PackType packType, string calldata newURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        string memory oldURI = _packURIs[packType];
        _packURIs[packType] = newURI;
        emit PackURIUpdated(packType, oldURI, newURI);
    }

    /// @notice Get metadata URI for a pack type.
    function packURI(PackType packType) external view returns (string memory) {
        return _packURIs[packType];
    }

    /// @notice ERC721 tokenURI — returns URI based on the pack type of the token.
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        PackType packType = _tokenPackType[tokenId];
        return _packURIs[packType];
    }

    // -----------------------
    // Treasury
    // -----------------------

    /// @notice Change treasury address. Only DEFAULT_ADMIN_ROLE can call.
    function setTreasury(address newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        emit TreasuryUpdated(treasury, newTreasury);
        treasury = newTreasury;
    }

    // -----------------------
    // Helpers / Overrides
    // -----------------------

    /// @notice Get pack type of a given tokenId.
    function packTypeOf(uint256 tokenId) external view returns (PackType) {
        _requireOwned(tokenId);
        return _tokenPackType[tokenId];
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721Upgradeable, AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    uint256[50] private __gap;
}
