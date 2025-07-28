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

contract WLCollectionListing is Initializable, UUPSUpgradeable, OwnableUpgradeable, AccessControlUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20 for IERC20;
    
    bytes32 public constant WL_ADMIN_ROLE = keccak256("WL_ADMIN_ROLE");

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

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
    }

    function initialize(address _initialOwner, address _initialTreasury) public initializer {
        require(_initialOwner != address(0), "Invalid owner");
        require(_initialTreasury != address(0), "Invalid treasury");
        
        __Ownable_init();
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        _setupRole(DEFAULT_ADMIN_ROLE, _initialOwner);
        _setupRole(WL_ADMIN_ROLE, _initialOwner);
        transferOwnership(_initialOwner);
        
        treasury = _initialTreasury;
        wlPrice = 1 ether;
        nativeWlPrice = 1 ether;
        payWithNative = true;
    }

    function setWLToken(address _wlToken) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_wlToken != address(0), "Invalid token address");
        address oldToken = address(wlToken);
        wlToken = IERC20(_wlToken);
        emit WLTokenSet(oldToken, _wlToken);
    }

    function setWLPrice(uint256 _price) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_price > 0, "Price must be greater than 0");
        uint256 oldPrice = wlPrice;
        wlPrice = _price;
        emit WLPriceSet(oldPrice, _price);
    }

    function setWLCollectionRegistry(address _wlCollectionRegistry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address oldRegistry = address(wlCollectionRegistry);
        wlCollectionRegistry = IWLCollectionRegistry(_wlCollectionRegistry);
        emit WLCollectionRegistrySet(oldRegistry, _wlCollectionRegistry);
    }

    function setNativeWLPrice(uint256 _price) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_price > 0, "Price must be greater than 0");
        uint256 oldPrice = nativeWlPrice;
        nativeWlPrice = _price;
        emit NativeWLPriceSet(oldPrice, _price);
    }

    function setPayWithNative(bool _payWithNative) external onlyRole(DEFAULT_ADMIN_ROLE) {
        payWithNative = _payWithNative;
        emit PayWithNativeSet(payWithNative);
    }

    function setTreasuryAddress(address _treasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_treasury != address(0), "Invalid treasury address");
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasurySet(oldTreasury, _treasury);
    }

    /**
     * @notice Adds a collection to the whitelist.
     * @param collection The collection address.
     * @param chainId The chainId associated with the collection.
     */
    function addToWL(address collection, uint256 chainId) external payable nonReentrant {
        require(collection != address(0) , "Invalid collection address");
        require(address(wlToken) != address(0) || payWithNative == true, "WL token not set or pay with native is false");
        require(treasury != address(0), "Treasury not set");
        require(chainId != 0, "Invalid chainId");
        
        uint256 paymentAmount = 0;
        if (payWithNative) {
            require(msg.value == nativeWlPrice, "Incorrect native token amount");
            (bool success, ) = treasury.call{value: msg.value}("");
            require(success, "Transfer failed");
            paymentAmount = msg.value;
        } else {
            require(msg.value == 0, "Do not send native tokens");
            wlToken.safeTransferFrom(msg.sender, treasury, wlPrice);
            paymentAmount = wlPrice;
        }

        wlCollectionRegistry.addToWL(collection, msg.sender, chainId);
    }

    /**
     * @notice Removes a collection from the whitelist.
     * Only the collection creator can call this.
     */
    function removeFromWL(address collection, uint256 chainId) external nonReentrant  {
        address creator = wlCollectionRegistry.getCollection(collection, chainId);
        require(
            hasRole(WL_ADMIN_ROLE, msg.sender) || 
            creator == msg.sender, "Collection not whitelisted"
        );

        wlCollectionRegistry.removeFromWL(collection, chainId);
    }

}