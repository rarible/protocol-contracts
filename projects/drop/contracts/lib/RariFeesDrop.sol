// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@thirdweb-dev/contracts/lib/CurrencyTransferLib.sol";
import "@thirdweb-dev/contracts/extension/Drop.sol";
import "@thirdweb-dev/contracts/extension/PrimarySale.sol";
import "@thirdweb-dev/contracts/external-deps/openzeppelin/metatx/ERC2771ContextUpgradeable.sol";
import "@thirdweb-dev/contracts/lib/Address.sol";
import "./IRariFeesConfig.sol";

/// @author rari.foundation

//    ______  ___  ______ _____   __                      _       _   _
//    | ___ \/ _ \ | ___ \_   _| / _|                    | |     | | (_)
//    | |_/ / /_\ \| |_/ / | |  | |_ ___  _   _ _ __   __| | __ _| |_ _  ___  _ __
//    |    /|  _  ||    /  | |  |  _/ _ \| | | | '_ \ / _` |/ _` | __| |/ _ \| '_ \
//    | |\ \| | | || |\ \ _| |__| || (_) | |_| | | | | (_| | (_| | |_| | (_) | | | |
//    \_| \_\_| |_/\_| \_|\___(_)_| \___/ \__,_|_| |_|\__,_|\__,_|\__|_|\___/|_| |_|
//

abstract contract RariFeesDrop is PrimarySale, ERC2771ContextUpgradeable, Drop {
    using Address for address;

    /// @dev Max bps in the thirdweb system.
    uint256 private constant MAX_BPS = 10_000;

    struct FeeRecipient {
        address recipient;
        uint96 value;
    }

    struct Fees {
        uint256 creatorFinderFee;
        FeeRecipient creatorFinderFeeRecipient1;
        FeeRecipient creatorFinderFeeRecipient2;
        uint256 buyerFinderFee;
    }

    /// @dev Protocol fee config
    address private feesConfig;

    /// @dev Creator finder fee, amount
    uint256 private creatorFinderFee;
    /// @dev Creator finder fee recipient 1. If value == 10000 then recipient 2 is not read
    FeeRecipient private creatorFinderFeeRecipient1;
    /// @dev Creator finder fee recipient 2
    FeeRecipient private creatorFinderFeeRecipient2;

    /// @dev Buyer finder fee, amount. Can be spread across several addresses (which are specified per tx)
    uint256 private buyerFinderFee;

    address constant private DEFAULT_CONFIG_ADDRESS = address(0); //todo set static address

    // @notice Reads protocol
    function _setupRariFees(address config, Fees memory _fees) internal {
        if (config != address(0)) {
            feesConfig = config;
        } else {
            feesConfig = DEFAULT_CONFIG_ADDRESS;
        }
        creatorFinderFee = _fees.creatorFinderFee;
        creatorFinderFeeRecipient1 = _fees.creatorFinderFeeRecipient1;
        creatorFinderFeeRecipient2 = _fees.creatorFinderFeeRecipient2;
        require(creatorFinderFeeRecipient1.value + creatorFinderFeeRecipient2.value == MAX_BPS, "!CreatorFeeBpsNot10000");
        buyerFinderFee = _fees.buyerFinderFee;
    }

    // @notice Reads RariFeesConfig and returns recipient and fee
    function _readFeesConfig(address currency) internal view returns (address recipient, uint fee) {
        address _config = feesConfig;
        if (_config.isContract()) {
            recipient = IRariFeesConfig(_config).getRecipient();
            fee = IRariFeesConfig(_config).getFee(currency);
        } else {
            recipient = address(0);
            fee = 0;
        }
    }

    /// @notice Lets an account claim tokens.
    /// @dev the only difference from overriden function is that _collectPriceOnClaim also has _data argument
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
        (address protocolFeeRecipient, uint protocolFee) = _readFeesConfig(_currency);
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
            _transferBuyerFinderFee(protocolFeeRecipient, _currency, _buyerFinderFee * _quantityToClaim, _data);
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

    function _transferBuyerFinderFee(address protocolFeeRecipient, address _currency, uint256 _buyerFinderFee, bytes memory _data) internal {
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

    /// @dev this function is not used at all, so no needed.
    /// @dev in this contract another function is used (with extra _data argument)
    function _collectPriceOnClaim(address, uint256, address, uint256) internal override {
        revert();
    }
}