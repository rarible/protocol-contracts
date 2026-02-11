// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {LiveDropCollection} from "./LiveDropCollection.sol";

/**
 * @title LiveDropFactory
 * @notice Factory contract that deploys LiveDropCollection (ERC-721) contracts
 *         for Live Stream Drops. Each live stream can create a unique NFT collection.
 */
contract LiveDropFactory is Ownable {
    // =========================================================================
    //                              ERRORS
    // =========================================================================

    error InvalidFeeRecipient();
    error InvalidErc20Token();
    error InvalidFeeBps(uint16 bps);
    error ZeroAddress();

    // =========================================================================
    //                              EVENTS
    // =========================================================================

    event CollectionCreated(
        address indexed creator,
        address indexed collection,
        string name,
        string symbol
    );

    event DefaultFeesUpdated(
        uint16 feeBps,
        uint256 feeFixedNative,
        uint256 feeFixedErc20
    );

    event FeeRecipientUpdated(address indexed feeRecipient);

    event DefaultErc20Updated(address indexed erc20Token);

    // =========================================================================
    //                              STRUCTS
    // =========================================================================

    /**
     * @notice Configuration for creating a new collection
     */
    struct CollectionConfig {
        string name;
        string symbol;
        string description;
        string icon;
        string tokenMetaName;
        string tokenMetaDescription;
        string tokenMetaImage;
    }

    // =========================================================================
    //                              STORAGE
    // =========================================================================

    /// @notice Address that receives Rarible fees from all collections
    address public feeRecipient;

    /// @notice Default fee percentage in basis points (0–10000)
    uint16 public defaultFeeBps;

    /// @notice Default fixed fee for native (ETH) mints
    uint256 public defaultFeeFixedNative;

    /// @notice Default fixed fee for ERC-20 mints
    uint256 public defaultFeeFixedErc20;

    /// @notice Default ERC-20 token for payments (e.g., USDC on Base)
    address public defaultErc20;

    /// @notice Array of all collections created by this factory
    address[] public allCollections;

    /// @notice Mapping to check if an address is a collection created by this factory
    mapping(address => bool) public isCollection;

    // =========================================================================
    //                              CONSTRUCTOR
    // =========================================================================

    /**
     * @param owner_ Factory owner address
     * @param feeRecipient_ Address that receives Rarible fees
     * @param defaultFeeBps_ Default fee percentage in basis points
     * @param defaultFeeFixedNative_ Default fixed fee for native mints
     * @param defaultFeeFixedErc20_ Default fixed fee for ERC-20 mints
     * @param defaultErc20_ Default ERC-20 token address
     */
    constructor(
        address owner_,
        address feeRecipient_,
        uint16 defaultFeeBps_,
        uint256 defaultFeeFixedNative_,
        uint256 defaultFeeFixedErc20_,
        address defaultErc20_
    ) Ownable(owner_) {
        if (feeRecipient_ == address(0)) revert InvalidFeeRecipient();
        if (defaultErc20_ == address(0)) revert InvalidErc20Token();
        if (defaultFeeBps_ > 10000) revert InvalidFeeBps(defaultFeeBps_);

        feeRecipient = feeRecipient_;
        defaultFeeBps = defaultFeeBps_;
        defaultFeeFixedNative = defaultFeeFixedNative_;
        defaultFeeFixedErc20 = defaultFeeFixedErc20_;
        defaultErc20 = defaultErc20_;
    }

    // =========================================================================
    //                              COLLECTION CREATION
    // =========================================================================

    /**
     * @notice Create a new LiveDropCollection
     * @param config Collection configuration
     * @return collection Address of the newly created collection
     */
    function createCollection(
        CollectionConfig calldata config
    ) external returns (address collection) {
        LiveDropCollection newCollection = new LiveDropCollection(
            config.name,
            config.symbol,
            msg.sender, // collection owner = caller
            address(this), // factory address
            feeRecipient,
            defaultFeeBps,
            defaultFeeFixedNative,
            defaultFeeFixedErc20,
            defaultErc20,
            msg.sender, // royalty receiver = creator
            1000, // 10% default royalty
            config.description,
            config.icon,
            config.tokenMetaName,
            config.tokenMetaDescription,
            config.tokenMetaImage
        );

        collection = address(newCollection);

        // Register in factory
        allCollections.push(collection);
        isCollection[collection] = true;

        emit CollectionCreated(msg.sender, collection, config.name, config.symbol);
    }

    // =========================================================================
    //                              ADMIN: DEFAULTS
    // =========================================================================

    /**
     * @notice Update default fee configuration for new collections
     * @param feeBps_ New default fee basis points
     * @param feeFixedNative_ New default fixed fee for native mints
     * @param feeFixedErc20_ New default fixed fee for ERC-20 mints
     */
    function setDefaultFees(
        uint16 feeBps_,
        uint256 feeFixedNative_,
        uint256 feeFixedErc20_
    ) external onlyOwner {
        if (feeBps_ > 10000) revert InvalidFeeBps(feeBps_);

        defaultFeeBps = feeBps_;
        defaultFeeFixedNative = feeFixedNative_;
        defaultFeeFixedErc20 = feeFixedErc20_;

        emit DefaultFeesUpdated(feeBps_, feeFixedNative_, feeFixedErc20_);
    }

    /**
     * @notice Update the fee recipient address
     * @param feeRecipient_ New fee recipient
     */
    function setFeeRecipient(
        address feeRecipient_
    ) external onlyOwner {
        if (feeRecipient_ == address(0)) revert InvalidFeeRecipient();

        feeRecipient = feeRecipient_;

        emit FeeRecipientUpdated(feeRecipient_);
    }

    /**
     * @notice Update the default ERC-20 token for new collections
     * @param erc20_ New default ERC-20 token address
     */
    function setDefaultErc20(
        address erc20_
    ) external onlyOwner {
        if (erc20_ == address(0)) revert InvalidErc20Token();

        defaultErc20 = erc20_;

        emit DefaultErc20Updated(erc20_);
    }

    // =========================================================================
    //                              VIEWS
    // =========================================================================

    /**
     * @notice Get the total number of collections created
     */
    function getCollectionCount() external view returns (uint256) {
        return allCollections.length;
    }

    /**
     * @notice Get a paginated list of collections
     * @param offset Start index
     * @param limit Maximum number of results
     * @return collections Array of collection addresses
     */
    function getCollections(
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory collections) {
        uint256 total = allCollections.length;

        if (offset >= total) {
            return new address[](0);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        uint256 size = end - offset;
        collections = new address[](size);

        for (uint256 i = 0; i < size; i++) {
            collections[i] = allCollections[offset + i];
        }
    }

    /**
     * @notice Get current factory default configuration
     * @return _feeRecipient Fee recipient address
     * @return _feeBps Default fee basis points
     * @return _feeFixedNative Default fixed native fee
     * @return _feeFixedErc20 Default fixed ERC-20 fee
     * @return _erc20 Default ERC-20 token address
     */
    function getDefaults()
        external
        view
        returns (
            address _feeRecipient,
            uint16 _feeBps,
            uint256 _feeFixedNative,
            uint256 _feeFixedErc20,
            address _erc20
        )
    {
        return (
            feeRecipient,
            defaultFeeBps,
            defaultFeeFixedNative,
            defaultFeeFixedErc20,
            defaultErc20
        );
    }
}
