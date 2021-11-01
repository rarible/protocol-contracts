// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./LibAucDataV1.sol";
import "./LibBidDataV1.sol";
import "./TokenToAuction.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155HolderUpgradeable.sol";

/// @dev contract with 
abstract contract AuctionHouseBase is ERC721HolderUpgradeable, ERC1155HolderUpgradeable, TokenToAuction {
    /// @dev auction struct
    struct Auction {
        // asset that is being sold at auction
        LibAsset.Asset sellAsset;
        // asset type that bids are taken in
        LibAsset.AssetType buyAsset;
        // information about the current highest bid
        Bid lastBid;
        // seller address
        address payable seller;
        // buyer address
        address payable buyer;
        // the time when auction ends
        uint endTime;
        // the minimal amount of the first bid
        uint minimalStep;
        // the minimal step between bids
        uint minimalPrice;
        // protocolFee at the time of the purchase
        uint protocolFee;
        // version of Auction to correctly decode data field
        bytes4 dataType;
        // field to store additional information for Auction, can be seen in "LibAucDataV1.sol"
        bytes data;
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
    event AuctionCreated(uint indexed auctionId, Auction auction);
    /// @dev event that emits when bid is placed
    event BidPlaced(uint indexed auctionId, address buyer, Bid bid, uint endTime);
    /// @dev event that emits when auction is finished
    event AuctionFinished(uint indexed auctionId, Auction auction);
    /// @dev event that emits when auction is canceled
    event AuctionCancelled(uint indexed auctionId);

    function __AuctionHouseBase_init() internal initializer {
        __ERC1155Holder_init();
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return this.supportsInterface(interfaceId);
    }

    uint256[50] private ______gap;
}