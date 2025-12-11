// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

// <ai_context>
// RariPack is the ERC721 contract that mints RARI pack NFTs. It tracks pack
// types, pricing and treasury, and exposes fully on-chain, dynamic metadata
// including pack open state and the list of locked NFT contents. The metadata
// is consumed by off-chain indexers and UIs together with PackManager and
// NftPool.
// </ai_context>

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

contract RariPack is
    Initializable,
    ERC721Upgradeable,
    OwnableUpgradeable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable
{
    using Strings for uint256;

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

    /// @dev Contracts that are allowed to burn packs and manage contents
    ///      (e.g. PackManager).
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

    /// @dev Per-pack-type image or external URI used in dynamic metadata
    mapping(PackType => string) private _packURIs;

    /// @dev Address that receives mint proceeds
    address public treasury;

    /// @dev Whether a pack has been opened (its contents locked and revealed)
    mapping(uint256 => bool) private _packOpened;

    /// @dev Per-pack locked NFT contents (collections)
    mapping(uint256 => address[]) private _packNftCollections;

    /// @dev Per-pack locked NFT contents (tokenIds)
    mapping(uint256 => uint256[]) private _packNftTokenIds;

    /// @dev Optional human-readable description per pack type
    mapping(PackType => string) private _packDescriptions;

    // -----------------------
    // Events / Errors
    // -----------------------

    event PackPriceUpdated(PackType indexed packType, uint256 oldPrice, uint256 newPrice);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event PackURIUpdated(PackType indexed packType, string oldURI, string newURI);
    event PackDescriptionUpdated(PackType indexed packType, string oldDescription, string newDescription);
    event PackContentsUpdated(uint256 indexed tokenId, address[] collections, uint256[] tokenIds);

    error TreasuryNotSet();
    error IncorrectEthSent();
    error ZeroAmount();
    error PriceNotSet();
    error ArrayLengthMismatch();

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

    /// @notice Burn a pack token and clear its metadata.
    /// @dev Only BURNER_ROLE (e.g. PackManager) can call this.
    function burnPack(uint256 tokenId) external onlyRole(BURNER_ROLE) {
        _burn(tokenId);
        delete _tokenPackType[tokenId];
        delete _packOpened[tokenId];
        delete _packNftCollections[tokenId];
        delete _packNftTokenIds[tokenId];
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

    /// @notice Set image/external URI for a given pack type.
    /// Only DEFAULT_ADMIN_ROLE can call.
    function setPackURI(PackType packType, string calldata newURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        string memory oldURI = _packURIs[packType];
        _packURIs[packType] = newURI;
        emit PackURIUpdated(packType, oldURI, newURI);
    }

    /// @notice Get image/external URI for a pack type.
    function packURI(PackType packType) external view returns (string memory) {
        return _packURIs[packType];
    }

    /// @notice Set human-readable description for a pack type.
    function setPackDescription(PackType packType, string calldata newDescription) external onlyRole(DEFAULT_ADMIN_ROLE) {
        string memory oldDescription = _packDescriptions[packType];
        _packDescriptions[packType] = newDescription;
        emit PackDescriptionUpdated(packType, oldDescription, newDescription);
    }

    /// @notice Get human-readable description for a pack type.
    function packDescription(PackType packType) external view returns (string memory) {
        return _packDescriptions[packType];
    }

    /// @notice ERC721 tokenURI — returns dynamically generated JSON based on pack state.
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        PackType packType = _tokenPackType[tokenId];

        string memory packTypeStr = _packTypeToString(packType);
        string memory idStr = tokenId.toString();
        string memory name = string(abi.encodePacked("RARI ", packTypeStr, " Pack #", idStr));

        string memory description = _packDescriptions[packType];
        if (bytes(description).length == 0) {
            description = string(
                abi.encodePacked(
                    "RARI ",
                    packTypeStr,
                    " Pack containing randomly selected NFTs across rarity pools."
                )
            );
        }

        bool opened = _packOpened[tokenId];

        address[] storage collectionsStorage = _packNftCollections[tokenId];
        uint256[] storage tokenIdsStorage = _packNftTokenIds[tokenId];
        uint256 contentsLen = collectionsStorage.length;

        string memory attrs = _buildAttributes(packTypeStr, opened, contentsLen);
        string memory nftsJson;
        if (opened && contentsLen > 0) {
            nftsJson = _buildNftsJson(collectionsStorage, tokenIdsStorage);
        }

        string memory image = _packURIs[packType];

        bytes memory json = abi.encodePacked(
            '{"name":"',
            name,
            '","description":"',
            description,
            '","attributes":',
            attrs
        );

        if (bytes(image).length != 0) {
            json = abi.encodePacked(json, ',"image":"', image, '"');
        }

        if (opened && contentsLen > 0) {
            json = abi.encodePacked(json, ',"nfts":', nftsJson);
        }

        json = abi.encodePacked(json, "}");

        string memory encoded = Base64.encode(json);
        return string(abi.encodePacked("data:application/json;base64,", encoded));
    }

    function _packTypeToString(PackType packType) internal pure returns (string memory) {
        if (packType == PackType.Bronze) return "Bronze";
        if (packType == PackType.Silver) return "Silver";
        if (packType == PackType.Gold) return "Gold";
        return "Platinum";
    }

    function _buildAttributes(
        string memory packTypeStr,
        bool opened,
        uint256 contentsLen
    ) internal pure returns (string memory) {
        string memory state = opened ? "Opened" : "Unopened";

        return
            string(
                abi.encodePacked(
                    '[{"trait_type":"Pack Type","value":"',
                    packTypeStr,
                    '"},{"trait_type":"Opened","value":"',
                    opened ? "true" : "false",
                    '"},{"trait_type":"State","value":"',
                    state,
                    '"},{"trait_type":"Contents Locked","value":"',
                    contentsLen.toString(),
                    '"}]'
                )
            );
    }

    function _buildNftsJson(
        address[] storage collections,
        uint256[] storage tokenIds
    ) internal view returns (string memory) {
        uint256 len = collections.length;
        bytes memory out = "[";

        for (uint256 i = 0; i < len; i++) {
            if (i > 0) {
                out = abi.encodePacked(out, ",");
            }
            out = abi.encodePacked(
                out,
                '{"collection":"',
                Strings.toHexString(uint160(collections[i]), 20),
                '","tokenId":"',
                tokenIds[i].toString(),
                '"}'
            );
        }

        out = abi.encodePacked(out, "]");
        return string(out);
    }

    // -----------------------
    // Pack contents (for PackManager)
    // -----------------------

    /// @notice Set the locked NFT contents for a pack.
    /// @dev Expected to be called by PackManager after randomness is fulfilled.
    function setPackContents(
        uint256 tokenId,
        address[] calldata collections,
        uint256[] calldata tokenIds
    ) external onlyRole(BURNER_ROLE) {
        _requireOwned(tokenId);
        if (collections.length != tokenIds.length) revert ArrayLengthMismatch();

        delete _packNftCollections[tokenId];
        delete _packNftTokenIds[tokenId];

        for (uint256 i = 0; i < collections.length; i++) {
            _packNftCollections[tokenId].push(collections[i]);
            _packNftTokenIds[tokenId].push(tokenIds[i]);
        }

        _packOpened[tokenId] = true;

        emit PackContentsUpdated(tokenId, collections, tokenIds);
    }

    /// @notice Get the locked NFT contents for a pack.
    function getPackContents(
        uint256 tokenId
    ) external view returns (address[] memory collections, uint256[] memory tokenIds, bool opened) {
        _requireOwned(tokenId);

        opened = _packOpened[tokenId];

        address[] storage storedCollections = _packNftCollections[tokenId];
        uint256[] storage storedTokenIds = _packNftTokenIds[tokenId];
        uint256 len = storedCollections.length;

        collections = new address[](len);
        tokenIds = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            collections[i] = storedCollections[i];
            tokenIds[i] = storedTokenIds[i];
        }
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