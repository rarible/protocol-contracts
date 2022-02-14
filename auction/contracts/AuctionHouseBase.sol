// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./LibAucDataV1.sol";
import "./LibBidDataV1.sol";
import "./TokenToAuction.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/// @dev contract with 
abstract contract AuctionHouseBase is OwnableUpgradeable, ERC721HolderUpgradeable, ERC1155HolderUpgradeable, TokenToAuction, ReentrancyGuardUpgradeable {

    /// @dev auction struct
    struct Auction {
        // asset that is being sold at auction
        SellAsset sellAsset;
        // asset type that bids are taken in
        address buyAsset;
        // information about the current highest bid
        Bid lastBid;
        // seller address
        address payable seller;
        // buyer address
        address payable buyer;
        // the time when auction ends
        uint128 endTime;
        // the minimal amount of the first bid
        uint128 minimalStep;
        // the minimal step between bids
        uint128 minimalPrice;
        // protocolFee at the time of the purchase
        uint128 protocolFee;
        // version of Auction to correctly decode data field
        bytes4 dataType;
        // field to store additional information for Auction, can be seen in "LibAucDataV1.sol"
        bytes data;
    }

    struct SellAsset {
        address token;
        uint tokenId;
    }

    /// @dev bid struct
    struct Bid {
        // the amount 
        uint amount;
        // version of Bid to correctly decode data field
        bytes4 dataType;
        // field to store additional information for Bid, can be seen in "LibBidDataV1.sol"
        bytes data;
    }

    /// @dev event that emits when auction is created
    event AuctionCreated(uint indexed auctionId, uint128 endTime);
    /// @dev event that emits when bid is placed
    event BidPlaced(uint indexed auctionId, uint endTime);
    /// @dev event that emits when auction is finished
    event AuctionFinished(uint indexed auctionId);
    /// @dev event that emits when auction is canceled
    event AuctionCancelled(uint indexed auctionId);
    /// @dev event that emits when auction is bought out
    event AuctionBuyOut(uint indexed auctionId);

    /// @dev event that's emitted when new transfer proxy is set
    event ProxyChange(bytes4 indexed assetType, address proxy);
    /// @dev event that's emitted when user can withdraw ETH from the AuctionHouse
    event AvailableToWithdraw(address indexed owner, uint added, uint total);
    /// @dev event that's emitted when minimal auction duration changes
    event MinimalDurationChanged(uint oldValue, uint newValue);
    /// @dev event that's emitted when protocolFee changes
    event ProtocolFeeChanged(uint oldValue, uint newValue);

    function __AuctionHouseBase_init_unchained() internal initializer {
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return this.supportsInterface(interfaceId);
    }

    uint256[50] private ______gap;
}