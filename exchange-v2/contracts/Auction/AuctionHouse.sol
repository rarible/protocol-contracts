// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../ITransferManager.sol";
import "../lib/LibTransfer.sol";
import "../LibOrder.sol";
import "../TransferConstants.sol";

abstract contract AbstractFeesDataFromRTM {
    uint public protocolFee;

    address public defaultFeeReceiver;
    mapping(address => address) public feeReceivers;
}

contract AuctionHouse is TransferExecutor, TransferConstants {

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
        bytes4 dataType; // aucv1
        bytes data;//duration, origin, payouts(?), buyOutPrice, protocolFee
        
        //todo: другие типы аукционов?
        //todo: обсудить с Сашей разные подходы к времени аукционов
        //todo: задача сделать базовую версию, чтоб потом можно было апгрейднуть
        //todo: аукцион не удаляем, помечаем
    }

    //bid struct
    struct Bid {
        uint amount;
        bytes4 dataType;//bidv1
        bytes data;//origin, payouts(?)
    }

    mapping (uint => Auction) public auctions;

    uint256 private auctionId;

    AbstractFeesDataFromRTM feeData;

    uint256 private constant EXTENSION_DURATION = 15 minutes;    
    uint256 private constant MAX_DURATION = 1000 days;

    event AuctionCreated(uint id, Auction auction);
    event BidPlaced();
    event AuctionCanceled();
    event AuctionFinished();

    function __AuctionHouse_init(
        INftTransferProxy _transferProxy,
        IERC20TransferProxy _erc20TransferProxy,
        address  payable _exchangeV2Proxy
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __TransferExecutor_init_unchained(_transferProxy, _erc20TransferProxy);
        _initializeAuctionId();

        require(_exchangeV2Proxy != address(0), "_exchangeV2Proxy can't be zero");
        feeData = AbstractFeesDataFromRTM(_exchangeV2Proxy);
    }

    function _initializeAuctionId() internal {
        auctionId = 1;
    }

    function getNextAndIncrementAuctionId() internal returns (uint256) {
        return auctionId++;
    }

    //creates auction and locks assets to sell
    function startAuction(
        LibAsset.Asset memory _sellAsset,
        LibAsset.AssetType memory _buyAsset,
        uint endTime,
        uint minimalStep,
        uint minimalPrice,
        bytes4 dataType,
        bytes data
    ) public {
        uint currenAuctionId = getNextAndIncrementAuctionId();

        require(_sellAsset.assetType.assetClass != LibAsset.ETH_ASSET_CLASS, "can't sell ethere on auction");
        require(duration >= EXTENSION_DURATION && duration <=  MAX_DURATION,"wrong auction duration");

        auctions[currenAuctionId] = Auction(
            _sellAsset,
            _buyAsset,
            0,
            _msgSender(),
            payable(address(0)),
            duration,
            0,
            minimalStep,
            minimalPrice,
            buyOutPrice,
            feeData.protocolFee()
        );

        emit AuctionCreated(currenAuctionId, auctions[currenAuctionId]);


        transfer(_sellAsset, _msgSender(),  address(this) , TO_LOCK, LOCK);
    }

    //put a bid and return locked assets for the last bid
    function bid(uint _auctionId, uint _buyAssetValue) public {
        Auction storage currentAuction = auctions[_auctionId];

        uint currentTime = block.timestamp;

        require(checkAuctionExistance(_auctionId), "there is no auction with this id");
        

        //start action if minimal price is met
        if (currentAuction.endTime == 0) {
            require(_buyAssetValue >= currentAuction.minimalPrice, "bid can't be less than minimal price");
            currentAuction.endTime = currentTime + currentAuction.duration;
            
        } else {
            //if this is not the first bid - return the previous bid
            require(_buyAssetValue > currentAuction.amount, "new bid can't be less than current");
            returnBid(_auctionId);
        }

        require(currentAuction.endTime > currentTime, "auction is already finished");

        //extend auction if time left < EXTENSION_DURATION
        if (currentAuction.endTime - currentTime < EXTENSION_DURATION){
            currentAuction.endTime = currentTime + EXTENSION_DURATION;
        }


    }

    //cancel auction without bid
    function cancel() public {

    }

    //checks if auction is valid 
    //(e.g. it started, wasn't canceled, didn't finish)
    function isAuctionValid() internal {

    }

    //tranfers funds
    //deletes data?
    function finishAuction() public {

    }

    
    //buyout and finish auction
    function buyOut() public {
        finishAuction();
    }

    function returnBid(uint _auctionId) internal {
        uint toReturn = getCurrentBidWithFees(_auctionId);
    }

    function getCurrentBidWithFees(uint _auctionId) internal view returns(uint){
        uint result;

        return result;
    }

    function getMinimalNextBid(uint _auctionId) internal view returns(uint){

    }

    function checkAuctionExistance(uint _auctionId) internal view returns(bool){
        if (auctions[_auctionId].seller == address(0)) {
            return false;
        } else {
            return true;
        }
    }
    
    uint256[50] private ______gap;
}