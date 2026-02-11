// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title LiveDropCollection
 * @notice ERC-721 NFT collection created by LiveDropFactory for Live Stream Drops.
 *         Supports paid minting (native ETH + ERC-20), Rarible fee system,
 *         ERC-2981 royalties, on-chain metadata, pause/unpause, and burn.
 */
contract LiveDropCollection is ERC721, ERC2981, Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // =========================================================================
    //                              ERRORS
    // =========================================================================

    error UnauthorizedCaller(address caller);
    error OnlyFactoryOwner(address caller);
    error InvalidAmount();
    error InsufficientValue(uint256 required, uint256 sent);
    error FeeExceedsAmount(uint256 fee, uint256 amount);
    error InvalidFeeRecipient();
    error InvalidErc20Token();
    error InvalidRoyaltyBps(uint256 bps);
    error RefundFailed();
    error ZeroAddress();
    error TokenDoesNotExist(uint256 tokenId);

    // =========================================================================
    //                              EVENTS
    // =========================================================================

    event MintedNative(
        address indexed to,
        uint256 indexed tokenId,
        uint256 amount,
        uint256 fee
    );

    event MintedErc20(
        address indexed to,
        uint256 indexed tokenId,
        uint256 amount,
        uint256 fee,
        address indexed token
    );

    event FeesUpdated(
        uint16 feeBps,
        uint256 feeFixedNative,
        uint256 feeFixedErc20
    );

    event FeeRecipientUpdated(address indexed feeRecipient);

    event RoyaltyUpdated(address indexed receiver, uint96 bps);

    event Erc20TokenUpdated(address indexed token);

    event CollectionMetadataUpdated(string description, string icon);

    event TokenMetadataUpdated(string name, string description, string image);

    // =========================================================================
    //                              CONSTANTS
    // =========================================================================

    uint16 public constant MAX_BPS = 10000;

    // =========================================================================
    //                              IMMUTABLES
    // =========================================================================

    /// @notice Address of the LiveDropFactory that deployed this collection
    address public immutable factory;

    // =========================================================================
    //                              STORAGE
    // =========================================================================

    // --- Fee configuration ---
    address public feeRecipient;
    uint16 public feeBps;
    uint256 public feeFixedNative;
    uint256 public feeFixedErc20;

    // --- ERC-20 payment token ---
    address public erc20Token;

    // --- Collection metadata (on-chain) ---
    string public collectionDescription;
    string public collectionIcon;

    // --- Token metadata (on-chain, shared by all tokens) ---
    string public tokenMetaName;
    string public tokenMetaDescription;
    string public tokenMetaImage;

    // --- Minting counter ---
    uint256 private _totalMinted;

    // =========================================================================
    //                              MODIFIERS
    // =========================================================================

    /**
     * @notice Restricts to collection owner or the current factory owner
     */
    modifier onlyOwnerOrFactoryOwner() {
        if (msg.sender != owner() && msg.sender != Ownable(factory).owner()) {
            revert UnauthorizedCaller(msg.sender);
        }
        _;
    }

    /**
     * @notice Restricts to the current factory owner only
     */
    modifier onlyFactoryOwner() {
        if (msg.sender != Ownable(factory).owner()) {
            revert OnlyFactoryOwner(msg.sender);
        }
        _;
    }

    // =========================================================================
    //                              CONSTRUCTOR
    // =========================================================================

    /**
     * @param name_ ERC-721 collection name
     * @param symbol_ ERC-721 collection symbol
     * @param owner_ Collection owner (the creator who called the factory)
     * @param factory_ Address of the LiveDropFactory
     * @param feeRecipient_ Rarible fee recipient
     * @param feeBps_ Fee percentage in basis points
     * @param feeFixedNative_ Fixed fee for native mints (wei)
     * @param feeFixedErc20_ Fixed fee for ERC-20 mints (token units)
     * @param erc20Token_ ERC-20 payment token address
     * @param royaltyReceiver_ Default royalty receiver
     * @param royaltyBps_ Default royalty basis points
     * @param description_ On-chain collection description
     * @param icon_ On-chain collection icon URI
     * @param tokenMetaName_ Shared token metadata name
     * @param tokenMetaDescription_ Shared token metadata description
     * @param tokenMetaImage_ Shared token metadata image URI
     */
    constructor(
        string memory name_,
        string memory symbol_,
        address owner_,
        address factory_,
        address feeRecipient_,
        uint16 feeBps_,
        uint256 feeFixedNative_,
        uint256 feeFixedErc20_,
        address erc20Token_,
        address royaltyReceiver_,
        uint96 royaltyBps_,
        string memory description_,
        string memory icon_,
        string memory tokenMetaName_,
        string memory tokenMetaDescription_,
        string memory tokenMetaImage_
    ) ERC721(name_, symbol_) Ownable(owner_) {
        if (factory_ == address(0)) revert ZeroAddress();
        if (feeRecipient_ == address(0)) revert InvalidFeeRecipient();
        if (erc20Token_ == address(0)) revert InvalidErc20Token();
        if (feeBps_ > MAX_BPS) revert InvalidRoyaltyBps(feeBps_);
        if (royaltyBps_ > MAX_BPS) revert InvalidRoyaltyBps(royaltyBps_);

        factory = factory_;
        feeRecipient = feeRecipient_;
        feeBps = feeBps_;
        feeFixedNative = feeFixedNative_;
        feeFixedErc20 = feeFixedErc20_;
        erc20Token = erc20Token_;
        collectionDescription = description_;
        collectionIcon = icon_;
        tokenMetaName = tokenMetaName_;
        tokenMetaDescription = tokenMetaDescription_;
        tokenMetaImage = tokenMetaImage_;

        // Set default royalty in constructor (factory can't call setRoyalty externally)
        _setDefaultRoyalty(royaltyReceiver_, royaltyBps_);
    }

    // =========================================================================
    //                              MINTING
    // =========================================================================

    /**
     * @notice Mint an NFT by paying with native ETH
     * @param to Recipient of the NFT
     * @param amount Payment amount (fee is deducted from this)
     */
    function mintNative(
        address to,
        uint256 amount
    ) external payable whenNotPaused nonReentrant {
        if (amount == 0) revert InvalidAmount();
        if (msg.value < amount) revert InsufficientValue(amount, msg.value);

        // Calculate fee
        uint256 fee = _calculateFee(amount, feeFixedNative);
        if (fee > amount) revert FeeExceedsAmount(fee, amount);

        // Mint token (state change first — CEI pattern)
        uint256 tokenId = _totalMinted;
        _totalMinted += 1;
        _safeMint(to, tokenId);

        // Transfer fee to Rarible
        if (fee > 0) {
            _transferNative(feeRecipient, fee);
        }

        // Transfer remainder to collection owner
        uint256 remainder = amount - fee;
        if (remainder > 0) {
            _transferNative(owner(), remainder);
        }

        // Refund excess
        uint256 excess = msg.value - amount;
        if (excess > 0) {
            _transferNative(msg.sender, excess);
        }

        emit MintedNative(to, tokenId, amount, fee);
    }

    /**
     * @notice Mint an NFT by paying with ERC-20 token
     * @param to Recipient of the NFT
     * @param amount Payment amount in token's smallest units (fee deducted from this)
     */
    function mintErc20(
        address to,
        uint256 amount
    ) external whenNotPaused nonReentrant {
        if (amount == 0) revert InvalidAmount();

        // Calculate fee
        uint256 fee = _calculateFee(amount, feeFixedErc20);
        if (fee > amount) revert FeeExceedsAmount(fee, amount);

        IERC20 token = IERC20(erc20Token);

        // Transfer full amount from minter to this contract
        token.safeTransferFrom(msg.sender, address(this), amount);

        // Mint token (state change — CEI pattern)
        uint256 tokenId = _totalMinted;
        _totalMinted += 1;
        _safeMint(to, tokenId);

        // Transfer fee to Rarible
        if (fee > 0) {
            token.safeTransfer(feeRecipient, fee);
        }

        // Transfer remainder to collection owner
        uint256 remainder = amount - fee;
        if (remainder > 0) {
            token.safeTransfer(owner(), remainder);
        }

        emit MintedErc20(to, tokenId, amount, fee, erc20Token);
    }

    // =========================================================================
    //                              BURN
    // =========================================================================

    /**
     * @notice Burn a token. Caller must be owner or approved.
     * @param tokenId Token ID to burn
     */
    function burn(uint256 tokenId) external {
        // _update in OZ5 checks ownership/approval internally when called via _burn
        // but we use the explicit _isAuthorized check for clarity
        address tokenOwner = _requireOwned(tokenId);
        if (!_isAuthorized(tokenOwner, msg.sender, tokenId)) {
            revert ERC721InsufficientApproval(msg.sender, tokenId);
        }
        _burn(tokenId);
    }

    // =========================================================================
    //                              VIEWS
    // =========================================================================

    /**
     * @notice Returns total number of minted tokens
     */
    function totalSupply() external view returns (uint256) {
        return _totalMinted;
    }

    /**
     * @notice Returns token metadata as base64-encoded JSON
     * @param tokenId Token ID (must exist)
     */
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        _requireOwned(tokenId);

        string memory json = string(
            abi.encodePacked(
                '{"name":"',
                _escapeJson(tokenMetaName),
                '","description":"',
                _escapeJson(tokenMetaDescription),
                '","image":"',
                _escapeJson(tokenMetaImage),
                '"}'
            )
        );

        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(bytes(json))
                )
            );
    }

    /**
     * @notice Returns collection metadata as base64-encoded JSON
     */
    function contractURI() external view returns (string memory) {
        string memory json = string(
            abi.encodePacked(
                '{"name":"',
                _escapeJson(name()),
                '","description":"',
                _escapeJson(collectionDescription),
                '","image":"',
                _escapeJson(collectionIcon),
                '"}'
            )
        );

        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(bytes(json))
                )
            );
    }

    // =========================================================================
    //                              ADMIN: FEES
    // =========================================================================

    /**
     * @notice Update fee percentages and fixed amounts
     * @dev Callable by collection owner or factory owner
     */
    function setFees(
        uint16 feeBps_,
        uint256 feeFixedNative_,
        uint256 feeFixedErc20_
    ) external onlyOwnerOrFactoryOwner {
        if (feeBps_ > MAX_BPS) revert InvalidRoyaltyBps(feeBps_);

        feeBps = feeBps_;
        feeFixedNative = feeFixedNative_;
        feeFixedErc20 = feeFixedErc20_;

        emit FeesUpdated(feeBps_, feeFixedNative_, feeFixedErc20_);
    }

    /**
     * @notice Update the fee recipient (Rarible protection)
     * @dev Only callable by factory owner — prevents collection owners
     *      from redirecting Rarible fees to themselves
     */
    function setFeeRecipient(
        address feeRecipient_
    ) external onlyFactoryOwner {
        if (feeRecipient_ == address(0)) revert InvalidFeeRecipient();

        feeRecipient = feeRecipient_;

        emit FeeRecipientUpdated(feeRecipient_);
    }

    // =========================================================================
    //                              ADMIN: ROYALTY
    // =========================================================================

    /**
     * @notice Update ERC-2981 royalty configuration
     * @param receiver Royalty receiver address
     * @param bps Royalty percentage in basis points (0–10000)
     */
    function setRoyalty(
        address receiver,
        uint96 bps
    ) external onlyOwnerOrFactoryOwner {
        if (bps > MAX_BPS) revert InvalidRoyaltyBps(bps);

        _setDefaultRoyalty(receiver, bps);

        emit RoyaltyUpdated(receiver, bps);
    }

    // =========================================================================
    //                              ADMIN: ERC-20 TOKEN
    // =========================================================================

    /**
     * @notice Update the ERC-20 payment token address
     * @param token_ New ERC-20 token address (cannot be zero)
     */
    function setErc20Token(
        address token_
    ) external onlyOwnerOrFactoryOwner {
        if (token_ == address(0)) revert InvalidErc20Token();

        erc20Token = token_;

        emit Erc20TokenUpdated(token_);
    }

    // =========================================================================
    //                              ADMIN: METADATA
    // =========================================================================

    /**
     * @notice Update collection-level metadata
     * @param description_ New collection description
     * @param icon_ New collection icon URI
     */
    function setCollectionMetadata(
        string calldata description_,
        string calldata icon_
    ) external onlyOwnerOrFactoryOwner {
        collectionDescription = description_;
        collectionIcon = icon_;

        emit CollectionMetadataUpdated(description_, icon_);
    }

    /**
     * @notice Update token-level metadata (shared by all tokens)
     * @param name_ New token metadata name
     * @param description_ New token metadata description
     * @param image_ New token metadata image URI
     */
    function setTokenMetadata(
        string calldata name_,
        string calldata description_,
        string calldata image_
    ) external onlyOwnerOrFactoryOwner {
        tokenMetaName = name_;
        tokenMetaDescription = description_;
        tokenMetaImage = image_;

        emit TokenMetadataUpdated(name_, description_, image_);
    }

    // =========================================================================
    //                              ADMIN: PAUSE
    // =========================================================================

    /**
     * @notice Pause minting
     */
    function pause() external onlyOwnerOrFactoryOwner {
        _pause();
    }

    /**
     * @notice Unpause minting
     */
    function unpause() external onlyOwnerOrFactoryOwner {
        _unpause();
    }

    // =========================================================================
    //                              ERC-165
    // =========================================================================

    /**
     * @notice Override supportsInterface for ERC-721 + ERC-2981
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // =========================================================================
    //                              INTERNAL
    // =========================================================================

    /**
     * @dev Calculate total fee = (amount * feeBps / 10000) + fixedFee
     */
    function _calculateFee(
        uint256 amount,
        uint256 fixedFee
    ) internal view returns (uint256) {
        uint256 percentFee = (amount * feeBps) / MAX_BPS;
        return percentFee + fixedFee;
    }

    /**
     * @dev Transfer native ETH safely. Reverts on failure.
     */
    function _transferNative(address to, uint256 amount) internal {
        (bool success, ) = to.call{value: amount}("");
        if (!success) revert RefundFailed();
    }

    /**
     * @dev Escape double quotes in JSON strings by replacing " with \"
     *      This is a minimal escape — sufficient for on-chain metadata
     */
    function _escapeJson(
        string memory input
    ) internal pure returns (string memory) {
        bytes memory inputBytes = bytes(input);
        uint256 extraChars = 0;

        for (uint256 i = 0; i < inputBytes.length; i++) {
            if (inputBytes[i] == '"' || inputBytes[i] == "\\") {
                extraChars++;
            }
        }

        if (extraChars == 0) return input;

        bytes memory output = new bytes(inputBytes.length + extraChars);
        uint256 j = 0;

        for (uint256 i = 0; i < inputBytes.length; i++) {
            if (inputBytes[i] == '"' || inputBytes[i] == "\\") {
                output[j++] = "\\";
            }
            output[j++] = inputBytes[i];
        }

        return string(output);
    }
}
