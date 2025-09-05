// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { IWLCollectionRegistry } from "./IWLCollectionRegistry.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

contract WLCollectionListing is Initializable, UUPSUpgradeable, OwnableUpgradeable, AccessControlUpgradeable, ReentrancyGuardUpgradeable, PausableUpgradeable {
    using SafeERC20 for IERC20;
    
    bytes32 public constant WL_ADMIN_ROLE = keccak256("WL_ADMIN_ROLE");

    // Errors
    error InvalidOwner();
    error InvalidTreasury();
    error InvalidTokenAddress();
    error PriceMustBeGreaterThanZero();
    error InvalidCollectionAddress();
    error InvalidChainId();
    error WLTokenNotSetOrNativeDisabled();
    error TreasuryNotSet();
    error IncorrectNativeAmount();
    error UnexpectedNativeValue();
    error NotCreatorNorAdmin();
    error CollectionNotWhitelisted();
    error RegistryNotSet();
    error ZeroRegistryAddress();

    IWLCollectionRegistry public wlCollectionRegistry;
    IERC20 public wlToken;
    uint256 public wlPrice; // Default: 1 token with 18 decimals
    uint256 public nativeWlPrice; // Default: 1 native token (e.g., ETH)
    address public treasury;
    bool public payWithNative;

    event WLTokenSet(address indexed oldToken, address indexed newToken);
    event WLPriceSet(uint256 oldPrice, uint256 newPrice);
    event NativeWLPriceSet(uint256 oldPrice, uint256 newPrice);
    event TreasurySet(address indexed oldTreasury, address indexed newTreasury);
    event PayWithNativeSet(bool payWithNative);
    event WLCollectionRegistrySet(address indexed oldRegistry, address indexed newRegistry);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function initialize(address _initialOwner, address _initialTreasury) public initializer {
        if (_initialOwner == address(0)) revert InvalidOwner();
        if (_initialTreasury == address(0)) revert InvalidTreasury();
        
        __Ownable_init();
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        __Pausable_init();

        _setupRole(DEFAULT_ADMIN_ROLE, _initialOwner);
        _setupRole(WL_ADMIN_ROLE, _initialOwner);
        transferOwnership(_initialOwner);
        
        treasury = _initialTreasury;
        wlPrice = 1 ether;
        nativeWlPrice = 1 ether;
        payWithNative = true;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function setWLToken(address _wlToken) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_wlToken == address(0)) revert InvalidTokenAddress();
        address oldToken = address(wlToken);
        wlToken = IERC20(_wlToken);
        emit WLTokenSet(oldToken, _wlToken);
    }

    function setWLPrice(uint256 _price) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_price == 0) revert PriceMustBeGreaterThanZero();
        uint256 oldPrice = wlPrice;
        wlPrice = _price;
        emit WLPriceSet(oldPrice, _price);
    }

    function setWLCollectionRegistry(address _wlCollectionRegistry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_wlCollectionRegistry == address(0)) revert ZeroRegistryAddress();
        address oldRegistry = address(wlCollectionRegistry);
        wlCollectionRegistry = IWLCollectionRegistry(_wlCollectionRegistry);
        emit WLCollectionRegistrySet(oldRegistry, _wlCollectionRegistry);
    }

    function setNativeWLPrice(uint256 _price) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_price == 0) revert PriceMustBeGreaterThanZero();
        uint256 oldPrice = nativeWlPrice;
        nativeWlPrice = _price;
        emit NativeWLPriceSet(oldPrice, _price);
    }

    function setPayWithNative(bool _payWithNative) external onlyRole(DEFAULT_ADMIN_ROLE) {
        payWithNative = _payWithNative;
        emit PayWithNativeSet(payWithNative);
    }

    function setTreasuryAddress(address _treasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_treasury == address(0)) revert InvalidTreasury();
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasurySet(oldTreasury, _treasury);
    }

    /**
     * @notice Adds a collection to the whitelist.
     * @param collection The collection address.
     * @param chainId The chainId associated with the collection.
     */
    function addToWL(address collection, uint256 chainId) external payable nonReentrant whenNotPaused {
        if (collection == address(0)) revert InvalidCollectionAddress();
        if (address(wlToken) == address(0) && payWithNative == false) revert WLTokenNotSetOrNativeDisabled();
        if (treasury == address(0)) revert TreasuryNotSet();
        if (chainId == 0) revert InvalidChainId();
        if (address(wlCollectionRegistry) == address(0)) revert RegistryNotSet();
        
        if (payWithNative) {
            if (msg.value != nativeWlPrice) revert IncorrectNativeAmount();
            (bool success, ) = treasury.call{value: msg.value}("");
            require(success, "Transfer failed");
        } else {
            if (msg.value != 0) revert UnexpectedNativeValue();
            wlToken.safeTransferFrom(msg.sender, treasury, wlPrice);
        }

        wlCollectionRegistry.addToWL(collection, msg.sender, chainId);
    }

    /**
     * @notice Removes a collection from the whitelist.
     * Only the collection creator can call this.
     */
    function removeFromWL(address collection, uint256 chainId) external nonReentrant whenNotPaused {
        if (address(wlCollectionRegistry) == address(0)) revert RegistryNotSet();
        address creator = wlCollectionRegistry.getCollection(collection, chainId);
        if (creator == address(0)) revert CollectionNotWhitelisted();
        if (!(hasRole(WL_ADMIN_ROLE, msg.sender) || creator == msg.sender)) revert NotCreatorNorAdmin();

        wlCollectionRegistry.removeFromWL(collection, chainId);
    }

    // ===== Storage gap for upgrade safety =====
    uint256[50] private __gap;
}