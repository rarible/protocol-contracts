// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.11;

/// @author thirdweb

//   $$\     $$\       $$\                 $$\                         $$\
//   $$ |    $$ |      \__|                $$ |                        $$ |
// $$$$$$\   $$$$$$$\  $$\  $$$$$$\   $$$$$$$ |$$\  $$\  $$\  $$$$$$\  $$$$$$$\
// \_$$  _|  $$  __$$\ $$ |$$  __$$\ $$  __$$ |$$ | $$ | $$ |$$  __$$\ $$  __$$\
//   $$ |    $$ |  $$ |$$ |$$ |  \__|$$ /  $$ |$$ | $$ | $$ |$$$$$$$$ |$$ |  $$ |
//   $$ |$$\ $$ |  $$ |$$ |$$ |      $$ |  $$ |$$ | $$ | $$ |$$   ____|$$ |  $$ |
//   \$$$$  |$$ |  $$ |$$ |$$ |      \$$$$$$$ |\$$$$$\$$$$  |\$$$$$$$\ $$$$$$$  |
//    \____/ \__|  \__|\__|\__|       \_______| \_____\____/  \_______|\_______/

//  ==========  External imports    ==========

import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC2981Upgradeable.sol";

import "@thirdweb-dev/contracts/eip/queryable/ERC721AQueryableUpgradeable.sol";

//  ==========  Internal imports    ==========

import "@thirdweb-dev/contracts/external-deps/openzeppelin/metatx/ERC2771ContextUpgradeable.sol";
import "@thirdweb-dev/contracts/lib/CurrencyTransferLib.sol";

//  ==========  Features    ==========

import "@thirdweb-dev/contracts/extension/Multicall.sol";
import "@thirdweb-dev/contracts/extension/ContractMetadata.sol";
import "@thirdweb-dev/contracts/extension/Royalty.sol";
import "@thirdweb-dev/contracts/extension/PrimarySale.sol";
import "@thirdweb-dev/contracts/extension/Ownable.sol";
import "@thirdweb-dev/contracts/extension/SharedMetadata.sol";
import "@thirdweb-dev/contracts/extension/PermissionsEnumerable.sol";
import "@thirdweb-dev/contracts/extension/Drop.sol";
import "./CustomFlatPlatformFee.sol";

contract OpenEditionCustomFee is
    Initializable,
    ContractMetadata,
    Royalty,
    PrimarySale,
    Ownable,
    SharedMetadata,
    PermissionsEnumerable,
    Drop,
    ERC2771ContextUpgradeable,
    Multicall,
    ERC721AQueryableUpgradeable
{
    using StringsUpgradeable for uint256;

    /*///////////////////////////////////////////////////////////////
                            State variables
    //////////////////////////////////////////////////////////////*/

    /// @dev Only transfers to or from TRANSFER_ROLE holders are valid, when transfers are restricted.
    bytes32 private transferRole;
    /// @dev Only MINTER_ROLE holders can update the shared metadata of tokens.
    bytes32 private minterRole;

    /// @dev Max bps in the thirdweb system.
    uint256 private constant MAX_BPS = 10_000;

    struct FeeRecipient {
        address recipient;
        uint96 value;
    }

    struct Fees {
        uint56 protocolFee; //todo read this from static contract
        address protocolFeeRecipient; //todo read this from static contract
        uint256 creatorFinderFee;
        FeeRecipient creatorFinderFeeRecipient1;
        FeeRecipient creatorFinderFeeRecipient2;
        uint256 buyerFinderFee;
    }

    /// @dev Protocol fee, amount
    uint256 private protocolFee;
    /// @dev Protocol fee recipient
    address private protocolFeeRecipient;

    /// @dev Creator finder fee, amount
    uint256 private creatorFinderFee;
    /// @dev Creator finder fee recipient 1. If value == 10000 then recipient 2 is not read
    FeeRecipient private creatorFinderFeeRecipient1;
    /// @dev Creator finder fee recipient 2
    FeeRecipient private creatorFinderFeeRecipient2;

    /// @dev Buyer finder fee, amount. Can be spread across several addresses (which are specified per tx)
    uint256 private buyerFinderFee;

    /*///////////////////////////////////////////////////////////////
                    Constructor + initializer logic
    //////////////////////////////////////////////////////////////*/

    constructor() initializer {}

    /// @dev Initializes the contract, like a constructor.
    function initialize(
        address _defaultAdmin,
        string memory _name,
        string memory _symbol,
        string memory _contractURI,
        address[] memory _trustedForwarders,
        address _saleRecipient,
        address _royaltyRecipient,
        uint128 _royaltyBps,
        Fees memory _fees
    ) external initializerERC721A initializer {
        bytes32 _transferRole = keccak256("TRANSFER_ROLE");
        bytes32 _minterRole = keccak256("MINTER_ROLE");

        // Initialize inherited contracts, most base-like -> most derived.
        __ERC2771Context_init(_trustedForwarders);
        __ERC721A_init(_name, _symbol);

        _setupContractURI(_contractURI);
        _setupOwner(_defaultAdmin);

        _setupRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
        _setupRole(_minterRole, _defaultAdmin);
        _setupRole(_transferRole, _defaultAdmin);
        _setupRole(_transferRole, address(0));

        initFees(_fees);
        _setupDefaultRoyaltyInfo(_royaltyRecipient, _royaltyBps);
        _setupPrimarySaleRecipient(_saleRecipient);

        transferRole = _transferRole;
        minterRole = _minterRole;
    }

    function initFees(Fees memory _fees) internal {
        protocolFee = _fees.protocolFee;
        protocolFeeRecipient = _fees.protocolFeeRecipient;
        creatorFinderFee = _fees.creatorFinderFee;
        creatorFinderFeeRecipient1 = _fees.creatorFinderFeeRecipient1;
        creatorFinderFeeRecipient2 = _fees.creatorFinderFeeRecipient2;
        buyerFinderFee = _fees.buyerFinderFee;
    }

    /*///////////////////////////////////////////////////////////////
                        ERC 165 / 721 / 2981 logic
    //////////////////////////////////////////////////////////////*/

    /// @dev Returns the URI for a given tokenId.
    function tokenURI(
        uint256 _tokenId
    ) public view virtual override(ERC721AUpgradeable, IERC721AUpgradeable) returns (string memory) {
        if (!_exists(_tokenId)) {
            revert("!ID");
        }

        return _getURIFromSharedMetadata(_tokenId);
    }

    /// @dev See ERC 165
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721AUpgradeable, IERC165, IERC721AUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId) || type(IERC2981Upgradeable).interfaceId == interfaceId;
    }

    /// @dev The start token ID for the contract.
    function _startTokenId() internal pure override returns (uint256) {
        return 1;
    }

    function startTokenId() public pure returns (uint256) {
        return _startTokenId();
    }

    /// @dev Lets an account claim tokens.
    function claim(
        address _receiver,
        uint256 _quantity,
        address _currency,
        uint256 _pricePerToken,
        AllowlistProof calldata _allowlistProof,
        bytes memory _data
    ) public payable virtual override {
        _beforeClaim(_receiver, _quantity, _currency, _pricePerToken, _allowlistProof, _data);

        uint256 activeConditionId = getActiveClaimConditionId();

        verifyClaim(activeConditionId, _dropMsgSender(), _quantity, _currency, _pricePerToken, _allowlistProof);

        // Update contract state.
        claimCondition.conditions[activeConditionId].supplyClaimed += _quantity;
        claimCondition.supplyClaimedByWallet[activeConditionId][_dropMsgSender()] += _quantity;

        // If there's a price, collect price.
        _collectPriceOnClaim(address(0), _quantity, _currency, _pricePerToken, _data);

        // Mint the relevant tokens to claimer.
        uint256 startTokenId = _transferTokensOnClaim(_receiver, _quantity);

        emit TokensClaimed(activeConditionId, _dropMsgSender(), _receiver, startTokenId, _quantity);

        _afterClaim(_receiver, _quantity, _currency, _pricePerToken, _allowlistProof, _data);
    }

    /*///////////////////////////////////////////////////////////////
                        Internal functions
    //////////////////////////////////////////////////////////////*/

    /// @dev Collects and distributes the primary sale value of NFTs being claimed.
    function _collectPriceOnClaim(
        address _primarySaleRecipient,
        uint256 _quantityToClaim,
        address _currency,
        uint256 _pricePerToken,
        bytes memory _data
    ) internal {
        // _data format = <buyerFinder: address><buyerFinderFeeBps: uint96> X 2 (buyerFinderFeeBps - share, specified in bps)
        // _data is optional. if present should be in the defined format. Can be 1 or 2 finder fees specified
        // sum should be 10000 or tx is reverted otherwise

        // price structure:
        //   protocol fee, read from storage. on contract creation is read from static address
        //   creator finder fee, read from storage, set on contract creation
        //     2 creator finder fees are supported
        //   buyer finder fee, amount is specified in storage (set on creation), shares are specified at the tx level
        //     any number of finder fees are supported
        //   if buyer finders are not specified, then buyer finder fee is paid to the protocol fee recipient
        //   rest goes to creator (seller)
        //
        // constraint: price >= (protocol fee + sum(creator finder fees) + sum(buyer finder fees))

        if (_pricePerToken == 0) {
            require(msg.value == 0, "!Value");
            return;
        }

        uint256 totalPrice = _quantityToClaim * _pricePerToken;

        // Fees. fees - total number of fees already paid
        uint256 fees = protocolFee * _quantityToClaim;

        // Protocol fees
        CurrencyTransferLib.transferCurrency(_currency, _msgSender(), protocolFeeRecipient, fees);

        // Creator finder fees
        uint _creatorFinderFee = creatorFinderFee;
        if (_creatorFinderFee != 0) {
            _transferCreatorFinderFee(_currency, _creatorFinderFee * _quantityToClaim);
            fees += _creatorFinderFee * _quantityToClaim;
        }

        // Buyer finder fees
        uint _buyerFinderFee = buyerFinderFee;
        if (_buyerFinderFee != 0) {
            _transferBuyerFinderFee(_currency, _buyerFinderFee * _quantityToClaim, _data);
            fees += _buyerFinderFee * _quantityToClaim;
        }

        require(totalPrice >= fees, "price less than fees");

        bool validMsgValue;
        if (_currency == CurrencyTransferLib.NATIVE_TOKEN) {
            validMsgValue = msg.value == totalPrice;
        } else {
            validMsgValue = msg.value == 0;
        }
        require(validMsgValue, "!V");

        address saleRecipient = _primarySaleRecipient == address(0) ? primarySaleRecipient() : _primarySaleRecipient;

        CurrencyTransferLib.transferCurrency(_currency, _msgSender(), saleRecipient, totalPrice - fees);
    }

    function _transferCreatorFinderFee(address _currency, uint256 _creatorFinderFee) internal {
        FeeRecipient memory creatorFeeRecipient1 = creatorFinderFeeRecipient1;
        uint creatorFeeRecipient1Amount = _creatorFinderFee * creatorFeeRecipient1.value / MAX_BPS;
        CurrencyTransferLib.transferCurrency(_currency, _msgSender(), creatorFeeRecipient1.recipient, creatorFeeRecipient1Amount);

        if (creatorFeeRecipient1.value < MAX_BPS) {
            FeeRecipient memory creatorFeeRecipient2 = creatorFinderFeeRecipient2;
            uint creatorFeeRecipient2Amount = _creatorFinderFee * creatorFeeRecipient2.value / MAX_BPS;
            CurrencyTransferLib.transferCurrency(_currency, _msgSender(), creatorFeeRecipient2.recipient, creatorFeeRecipient2Amount);
        }
    }

    function _transferBuyerFinderFee(address _currency, uint256 _buyerFinderFee, bytes memory _data) internal {
        if (_data.length == 0) {
            CurrencyTransferLib.transferCurrency(_currency, _msgSender(), protocolFeeRecipient, _buyerFinderFee);
        } else {
            if (_data.length == 32) {
                address recipient;
                uint bps;
                assembly {
                    recipient := shr(96, mload(add(_data, 32)))
                    bps := shr(160, mload(add(_data, 52)))
                }
                require(bps == MAX_BPS, "!BuyerFeeBpsNot10000");
                CurrencyTransferLib.transferCurrency(_currency, _msgSender(), recipient, _buyerFinderFee);
            } else if (_data.length == 64) {
                address recipient1;
                uint bps1;
                address recipient2;
                uint bps2;
                assembly {
                    recipient1 := shr(96, mload(add(_data, 32)))
                    bps1 := shr(160, mload(add(_data, 52)))
                    recipient2 := shr(96, mload(add(_data, 64)))
                    bps2 := shr(160, mload(add(_data, 84)))
                }
                require(bps1 + bps2 == MAX_BPS, "!BuyerFeeBpsNot10000");
                CurrencyTransferLib.transferCurrency(_currency, _msgSender(), recipient1, (_buyerFinderFee) * bps1 / MAX_BPS);
                CurrencyTransferLib.transferCurrency(_currency, _msgSender(), recipient2, (_buyerFinderFee) * bps2 / MAX_BPS);
            } else {
                revert("!DataLength");
            }
        }
    }

    function _collectPriceOnClaim(address, uint256, address, uint256) internal override {
        revert();
    }

    /// @dev Transfers the NFTs being claimed.
    function _transferTokensOnClaim(
        address _to,
        uint256 _quantityBeingClaimed
    ) internal override returns (uint256 startTokenId_) {
        startTokenId_ = _nextTokenId();
        _safeMint(_to, _quantityBeingClaimed);
    }

    /// @dev Checks whether primary sale recipient can be set in the given execution context.
    function _canSetPrimarySaleRecipient() internal view override returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    /// @dev Checks whether owner can be set in the given execution context.
    function _canSetOwner() internal view override returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    /// @dev Checks whether royalty info can be set in the given execution context.
    function _canSetRoyaltyInfo() internal view override returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    /// @dev Checks whether contract metadata can be set in the given execution context.
    function _canSetContractURI() internal view override returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    /// @dev Checks whether platform fee info can be set in the given execution context.
    function _canSetClaimConditions() internal view override returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    /// @dev Returns whether the shared metadata of tokens can be set in the given execution context.
    function _canSetSharedMetadata() internal view virtual override returns (bool) {
        return hasRole(minterRole, _msgSender());
    }

    /*///////////////////////////////////////////////////////////////
                        Miscellaneous
    //////////////////////////////////////////////////////////////*/

    /**
     * Returns the total amount of tokens minted in the contract.
     */
    function totalMinted() external view returns (uint256) {
        unchecked {
            return _nextTokenId() - _startTokenId();
        }
    }

    /// @dev The tokenId of the next NFT that will be minted / lazy minted.
    function nextTokenIdToMint() external view returns (uint256) {
        return _nextTokenId();
    }

    /// @dev The next token ID of the NFT that can be claimed.
    function nextTokenIdToClaim() external view returns (uint256) {
        return _nextTokenId();
    }

    /// @dev Burns `tokenId`. See {ERC721-_burn}.
    function burn(uint256 tokenId) external virtual {
        // note: ERC721AUpgradeable's `_burn(uint256,bool)` internally checks for token approvals.
        _burn(tokenId, true);
    }

    /// @dev See {ERC721-_beforeTokenTransfer}.
    function _beforeTokenTransfers(
        address from,
        address to,
        uint256 startTokenId_,
        uint256 quantity
    ) internal virtual override {
        super._beforeTokenTransfers(from, to, startTokenId_, quantity);

        // if transfer is restricted on the contract, we still want to allow burning and minting
        if (!hasRole(transferRole, address(0)) && from != address(0) && to != address(0)) {
            if (!hasRole(transferRole, from) && !hasRole(transferRole, to)) {
                revert("!T");
            }
        }
    }

    function _dropMsgSender() internal view virtual override returns (address) {
        return _msgSender();
    }

    function _msgSenderERC721A() internal view virtual override returns (address) {
        return _msgSender();
    }

    function _msgSender()
        internal
        view
        virtual
        override(ERC2771ContextUpgradeable, Multicall)
        returns (address sender)
    {
        return ERC2771ContextUpgradeable._msgSender();
    }
}