// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./LibAucDataV1.sol";
import "./LibBidDataV1.sol";
import "@rarible/exchange-v2/contracts/ITransferManager.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@rarible/exchange-v2/contracts/TransferConstants.sol";

abstract contract AuctionHouseBase is IERC721Receiver, IERC1155Receiver, TransferConstants {

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
        bytes4 dataType;        // aucv1
        bytes data;             //duration, buyOutPrice, origin, payouts(?)

        //todo: другие типы аукционов?
        //todo: обсудить с Сашей разные подходы к времени аукционов
        //todo: аукцион не удаляем, помечаем
    }

    //bid struct
    struct Bid {
        uint amount;
        bytes4 dataType;        //bidv1
        bytes data;             //origin, payouts(?)
    }

    event AuctionCreated(uint id, Auction auction);
    event BidPlaced(uint id);
    event AuctionFinished(uint id);
    event AuctionBuaOut(uint id);
    event AuctionCancelled(uint id);

    function encode(LibAucDataV1.DataV1 memory data) pure external returns (bytes memory) {
        return abi.encode(data);
    }

    function encodeBid(LibBidDataV1.DataV1 memory data) pure external returns (bytes memory) {
        return abi.encode(data);
    }

    /**
     * @dev See {IERC721Receiver-onERC721Received}.
     *
     * Always returns `IERC721Receiver.onERC721Received.selector`.
     */
    function onERC721Received(address, address, uint256, bytes memory) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function onERC1155Received(address, address, uint256, uint256, bytes memory) public virtual override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(address, address, uint256[] memory, uint256[] memory, bytes memory) public virtual override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return this.supportsInterface(interfaceId);
    }

    uint256[50] private ______gap;
}