// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./LibAucDataV1.sol";
import "./LibBidDataV1.sol";
import "./TokenToAuction.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155HolderUpgradeable.sol";

abstract contract AuctionHouseBase is ERC721HolderUpgradeable, ERC1155HolderUpgradeable, TokenToAuction {

    //auction struct
    struct Auction {
        LibAsset.Asset sellAsset;
        LibAsset.AssetType buyAsset;
        Bid lastBid;
        address payable seller;
        address payable buyer;
        uint endTime;
        uint minimalStep;
        uint minimalPrice;
        uint protocolFee;
        bytes4 dataType;
        bytes data;
    }

    //bid struct
    struct Bid {
        uint amount;
        bytes4 dataType;
        bytes data;
    }

    event AuctionCreated(uint indexed auctionId, Auction auction);
    event BidPlaced(uint indexed auctionId, Bid bid, uint endTime);
    event AuctionFinished(uint indexed auctionId, Auction auction);
    event AuctionCancelled(uint indexed auctionId);

    function __AuctionHouseBase_init() internal initializer {
        __ERC1155Holder_init();
        __AuctuinHouseBase_init_uncahined();
    }

    function __AuctuinHouseBase_init_uncahined() internal initializer {
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return this.supportsInterface(interfaceId);
    }

    uint256[50] private ______gap;
}