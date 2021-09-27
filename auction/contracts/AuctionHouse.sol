// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./AuctionHouseBase.sol";

abstract contract AbstractFeesDataFromRTM {
    uint public protocolFee;

    address public defaultFeeReceiver;
    mapping(address => address) public feeReceivers;
}

contract AuctionHouse is AuctionHouseBase, Initializable, OwnableUpgradeable, TransferExecutor, TransferConstants {
    mapping(uint => Auction) public auctions;   //save auctions here

    uint256 private auctionId;          //unic. auction id
    address payable public wallet;      //to reserve ETH

    AbstractFeesDataFromRTM feeData;

    uint256 private constant EXTENSION_DURATION = 15 minutes;
    uint256 private constant MAX_DURATION = 1000 days;

    function __AuctionHouse_init(
        INftTransferProxy _transferProxy,
        IERC20TransferProxy _erc20TransferProxy
    //        address  payable _exchangeV2Proxy
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __TransferExecutor_init_unchained(_transferProxy, _erc20TransferProxy);
        _initializeAuctionId();
        //TODO delete comments make code work again
        //        require(_exchangeV2Proxy != address(0), "_exchangeV2Proxy can't be zero");
        //        feeData = AbstractFeesDataFromRTM(_exchangeV2Proxy);
    }

    function setEthAddress(address payable _addr) public {
        wallet = _addr;
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
        bytes memory data
    ) public {
        uint currenAuctionId = getNextAndIncrementAuctionId();
        LibAucDataV1.DataV1 memory aucData = LibAucDataV1.parse(data, dataType);

        require(_sellAsset.assetType.assetClass != LibAsset.ETH_ASSET_CLASS, "can't sell ETH on auction");

        auctions[currenAuctionId] = Auction(
            _sellAsset,
            _buyAsset,
            Bid(0, "", ""),
            _msgSender(),
            payable(address(0)),
            endTime,
            minimalStep,
            minimalPrice,
        //            feeData.protocolFee(), TODO: do fee works
            0,
            dataType,
            data
        );
        //if no endTime, duration must be set
        // if we now start time and end time 
        if (endTime == 0) {
            require(aucData.duration >= EXTENSION_DURATION && aucData.duration <= MAX_DURATION, "wrong auction duration");

            if (aucData.startTime > 0) {
                auctions[currenAuctionId].endTime = aucData.startTime + aucData.duration;
            }
        }
        transfer(_sellAsset, _msgSender(), address(this), TO_LOCK, LOCK);
        emit AuctionCreated(currenAuctionId, auctions[currenAuctionId]);
    }

    //put a bid and return locked assets for the last bid
    function putBid(uint _auctionId, Bid memory bid) payable external {
        require(checkAuctionExistance(_auctionId), "there is no auction with this id");
        address payable bidPlacer = _msgSender();
        if (buyOutVerify(_auctionId, bidPlacer)) {
            //set auction finished
        }
        Auction storage currentAuction = auctions[_auctionId];
        uint currentTime = block.timestamp;
        uint _buyAssetValue = bid.amount;
        LibAucDataV1.DataV1 memory aucData = LibAucDataV1.parse(currentAuction.data, currentAuction.dataType);

        //start action if minimal price is met
        if (currentAuction.buyer == address(0x0)) {//no bid at all
            require(_buyAssetValue >= currentAuction.minimalPrice, "bid can't be less than minimal price");
            currentAuction.endTime = currentTime + aucData.duration;
        } else {    //there is bid in auction
            require(currentAuction.endTime >= currentTime, "NFTMarketReserveAuction: Auction is over");
            require(currentAuction.buyer != bidPlacer, "NFTMarketReserveAuction: You already have an outstanding bid");
            uint256 minAmount = getMinimalNextBid(_auctionId);
            require(_buyAssetValue >= minAmount, "NFTMarketReserveAuction: Bid amount too low");
        }
        reserveValue(currentAuction.buyAsset, currentAuction.buyer, bidPlacer, currentAuction.lastBid.amount, _buyAssetValue);
        currentAuction.lastBid.amount = _buyAssetValue;
        currentAuction.buyer = bidPlacer;
        //extend auction if time left < EXTENSION_DURATION
        if (currentAuction.endTime - currentTime < EXTENSION_DURATION) {
            currentAuction.endTime = currentTime + EXTENSION_DURATION;
        }
        emit BidPlaced(_auctionId);
    }

    function buyOutVerify(uint _auctionId, address payable _buyAssetValue) internal returns (bool) {
        return true;
    }

    function reserveValue(LibAsset.AssetType memory _buyAssetType, address oldBuyer, address newBuyer, uint oldAmount, uint newAmount) internal {
        if (oldBuyer != address(0x0)) {
            //return reserved to oldBuyer
            LibAsset.Asset memory returnAsset;
            returnAsset.assetType = _buyAssetType;
            returnAsset.value = oldAmount;
            transfer(returnAsset, address(this), oldBuyer, TO_LOCK, UNLOCK);
        }
        //send reserved to contract
        LibAsset.Asset memory reservedAsset;
        reservedAsset.assetType = _buyAssetType;
        reservedAsset.value = newAmount;
        if (reservedAsset.assetType.assetClass == LibAsset.ETH_ASSET_CLASS) {
            transfer(reservedAsset, address(0x0), wallet, TO_LOCK, LOCK);
        } else {
            transfer(reservedAsset, newBuyer, address(this), TO_LOCK, LOCK);
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

    function getCurrentBidWithFees(uint _auctionId) internal view returns (uint){
        uint result;

        return result;
    }

    function getMinimalNextBid(uint _auctionId) internal view returns (uint){
        Auction storage currentAuction = auctions[_auctionId];
        if (currentAuction.buyer == address(0x0)) {
            return (currentAuction.minimalPrice);
        } else {
            return (currentAuction.lastBid.amount + currentAuction.minimalStep);
        }
    }

    function checkAuctionExistance(uint _auctionId) internal view returns (bool){
        if (auctions[_auctionId].seller == address(0)) {
            return false;
        } else {
            return true;
        }
    }

    uint256[50] private ______gap;
}