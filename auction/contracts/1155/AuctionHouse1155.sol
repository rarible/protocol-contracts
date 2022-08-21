// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./AuctionHouseBase1155.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155HolderUpgradeable.sol";

/// @dev contract to create and interact with auctions
contract AuctionHouse1155 is ERC1155HolderUpgradeable, AuctionHouseBase1155 {
    using SafeMathUpgradeable96 for uint96;
    using SafeMathUpgradeable for uint;

    function __AuctionHouse1155_init(
        address newDefaultFeeReceiver,
        IRoyaltiesProvider newRoyaltiesProvider,
        address _transferProxy,
        address _erc20TransferProxy,
        uint64 newProtocolFee,
        uint96 _minimalStepBasePoint
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __ERC1155Receiver_init_unchained();
        __ReentrancyGuard_init_unchained();
        __AuctionHouseBase_init_unchained(_minimalStepBasePoint);
        __TransferExecutor_init_unchained(_transferProxy, _erc20TransferProxy);
        __RaribleTransferManager_init_unchained(newProtocolFee, newDefaultFeeReceiver, newRoyaltiesProvider);        
        __AuctionHouse1155_init_unchained();
    }

    function __AuctionHouse1155_init_unchained() internal initializer {  
    }

    /// @dev creates an auction and locks sell asset
    function startAuction(
        address _sellToken,
        uint96 _sellTokenValue,
        uint _sellTokenId,
        address _buyAsset,
        uint96 minimalPrice,
        bytes4 dataType,
        bytes memory data
    ) external {
        //todo: check if token contract supports ERC1155 interface?

        uint _protocolFee;
        LibAucDataV1.DataV1 memory aucData = LibAucDataV1.parse(data, dataType);
        require(aucData.duration >= minimalDuration && aucData.duration <= MAX_DURATION, "incorrect duration");
        require(_sellTokenValue > 0, "incorrect _sellTokenValue");
        require(getValueFromData(aucData.originFee) + _protocolFee <= MAX_FEE_BASE_POINT, "wrong fees");

        uint currentAuctionId = getNextAndIncrementAuctionId();
        address payable sender = _msgSender();
        Auction memory auc = Auction(
            _sellToken,
            _sellTokenValue,
            _sellTokenId,
            _buyAsset,
            0,
            Bid(0, "", ""),
            sender,
            minimalPrice,
            payable(address(0)),
            uint64(_protocolFee),
            dataType,
            data
        );
        auctions[currentAuctionId] = auc;

        transferNFT(
            _sellToken, 
            _sellTokenId, 
            _sellTokenValue, 
            LibAsset.ERC1155_ASSET_CLASS,
            sender,
            address(this)
        );
        
        emit AuctionCreated(currentAuctionId, sender);
    }

    /// @dev put a bid and return locked assets for the last bid
    function putBid(uint _auctionId, Bid memory bid) payable public nonReentrant {
        address payable newBuyer = _msgSender();
        uint newAmount = bid.amount;
        Auction memory currentAuction = auctions[_auctionId];
        uint96 endTime = currentAuction.endTime;
        LibAucDataV1.DataV1 memory aucData = LibAucDataV1.parse(currentAuction.data, currentAuction.dataType);
        uint bidOriginFee = LibBidDataV1.parse(bid.data, bid.dataType).originFee;
        require(getValueFromData(aucData.originFee) + getValueFromData(bidOriginFee) + currentAuction.protocolFee <= MAX_FEE_BASE_POINT, "wrong fees");

        if (currentAuction.buyAsset == address(0)) {
            checkEthReturnChange(bid.amount, newBuyer);
        }
        checkAuctionInProgress(currentAuction.seller, currentAuction.endTime, aucData.startTime);
        if (buyOutVerify(aucData, newAmount)) {
            _buyOut(
                currentAuction,
                bid,
                aucData,
                _auctionId,
                bidOriginFee,
                newBuyer
            );
            return;
        }
        
        uint96 currentTime = uint96(block.timestamp);
        //start action if minimal price is met
        if (currentAuction.buyer == address(0x0)) {//no bid at all
            // set endTime if it's not set
            endTime = currentTime.add(aucData.duration);
            auctions[_auctionId].endTime = endTime;
            require(newAmount >= currentAuction.minimalPrice, "bid too small");
        } else {//there is bid in auction
            require(currentAuction.buyer != newBuyer, "already winning bid");
            uint256 minAmount = _getMinimalNextBid(currentAuction.buyer, currentAuction.minimalPrice, currentAuction.lastBid.amount);
            require(newAmount >= minAmount, "bid too low");
        }

        address proxy = _getProxy(currentAuction.buyAsset);
        reserveBid(
            currentAuction.buyAsset,
            currentAuction.buyer,
            newBuyer,
            currentAuction.lastBid,
            proxy,
            bid.amount
        );
        auctions[_auctionId].lastBid = bid;
        auctions[_auctionId].buyer = newBuyer;

        // auction is extended for EXTENSION_DURATION or minimalDuration if (minimalDuration < EXTENSION_DURATION)
        uint96 minDur = minimalDuration;
        uint96 extension = (minDur < EXTENSION_DURATION) ? minDur : EXTENSION_DURATION;

        // extends auction time if it's about to end
        if (endTime.sub(currentTime) < extension) {
            endTime = currentTime.add(extension);
            auctions[_auctionId].endTime = endTime;
        }
        emit BidPlaced(_auctionId, newBuyer, endTime);
    }

    /// @dev returns the minimal amount of the next bid (without fees)
    function getMinimalNextBid(uint _auctionId) external view returns (uint minBid){
        Auction memory currentAuction = auctions[_auctionId];
        return _getMinimalNextBid(currentAuction.buyer, currentAuction.minimalPrice, currentAuction.lastBid.amount);
    }

    /// @dev returns true if auction exists, false otherwise
    function checkAuctionExistence(uint _auctionId) external view returns (bool){
        return _checkAuctionExistence(auctions[_auctionId].seller);
    }

    /// @dev finishes, deletes and transfers all assets for an auction if it's ended (it exists, it has at least one bid, now > endTme)
    function finishAuction(uint _auctionId) external nonReentrant {
        Auction memory currentAuction = auctions[_auctionId];
        require(_checkAuctionExistence(currentAuction.seller), "there is no auction with this id");
        LibAucDataV1.DataV1 memory aucData = LibAucDataV1.parse(currentAuction.data, currentAuction.dataType);
        require(
            !_checkAuctionRangeTime(currentAuction.endTime, aucData.startTime) &&
            currentAuction.buyer != address(0),
            "only ended auction with bid can be finished"
        );
        uint bidOriginFee = LibBidDataV1.parse(currentAuction.lastBid.data, currentAuction.lastBid.dataType).originFee;

        doTransfers(
            LibDeal.DealSide(
                getSellAsset(
                    currentAuction.sellToken, 
                    currentAuction.sellTokenId,
                    currentAuction.sellTokenValue,
                    LibAsset.ERC1155_ASSET_CLASS
                ),
                getPayouts(currentAuction.seller),
                getOriginFee(aucData.originFee),
                proxies[LibAsset.ERC1155_ASSET_CLASS],
                address(this)
            ), 
            LibDeal.DealSide(
                getBuyAsset(
                    currentAuction.buyAsset,
                    currentAuction.lastBid.amount
                ),
                getPayouts(currentAuction.buyer),
                getOriginFee(bidOriginFee),
                _getProxy(currentAuction.buyAsset),
                address(this)
            ), 
            LibDeal.DealData(
                MAX_FEE_BASE_POINT,
                LibFeeSide.FeeSide.RIGHT
            )
        );
        deactivateAuction(_auctionId);
    }

    /// @dev returns true if auction started and hasn't finished yet, false otherwise
    function checkAuctionRangeTime(uint _auctionId) external view returns (bool){
        return _checkAuctionRangeTime(auctions[_auctionId].endTime, LibAucDataV1.parse(auctions[_auctionId].data, auctions[_auctionId].dataType).startTime);
    }

    /// @dev deletes auction after finalizing
    function deactivateAuction(uint _auctionId) internal {
        emit AuctionFinished(_auctionId);
        delete auctions[_auctionId];
    }

    /// @dev cancels existing auction without bid
    function cancel(uint _auctionId) external nonReentrant {
        Auction memory currentAuction = auctions[_auctionId];
        require(_checkAuctionExistence(currentAuction.seller), "there is no auction with this id");
        address seller = currentAuction.seller;
        require(seller == _msgSender(), "auction owner not detected");
        require(currentAuction.buyer == address(0), "can't cancel auction with bid");
        transferNFT(
            currentAuction.sellToken, 
            currentAuction.sellTokenId, 
            currentAuction.sellTokenValue, 
            LibAsset.ERC1155_ASSET_CLASS,
            address(this),
            seller
        );
        deactivateAuction(_auctionId);
        emit AuctionCancelled(_auctionId);
    }

    // todo will there be a problem if buyer is last bidder?
    /// @dev buyout auction if bid satisfies buyout condition
    function buyOut(uint _auctionId, Bid memory bid) external payable nonReentrant {
        Auction memory currentAuction = auctions[_auctionId];
        LibAucDataV1.DataV1 memory aucData = LibAucDataV1.parse(currentAuction.data, currentAuction.dataType);
        checkAuctionInProgress(currentAuction.seller, currentAuction.endTime, aucData.startTime);
        uint bidOriginFee = LibBidDataV1.parse(bid.data, bid.dataType).originFee;

        require(buyOutVerify(aucData, bid.amount), "not enough for buyout");
        require(getValueFromData(aucData.originFee) + getValueFromData(bidOriginFee) + currentAuction.protocolFee <= MAX_FEE_BASE_POINT, "wrong fees");

        address sender = _msgSender();
        if (currentAuction.buyAsset == address(0)) {
            checkEthReturnChange(bid.amount, sender);
        }
        _buyOut(
            currentAuction,
            bid,
            aucData,
            _auctionId,
            bidOriginFee,
            sender
        );
    }

    function _buyOut(
        Auction memory currentAuction,
        Bid memory bid,
        LibAucDataV1.DataV1 memory aucData,
        uint _auctionId,
        uint newBidOriginFee,
        address sender
    ) internal {
        address proxy = _getProxy(currentAuction.buyAsset);

        _returnBid(
            currentAuction.lastBid,
            currentAuction.buyAsset,
            currentAuction.buyer,
            proxy
        );

        address from;
        if (currentAuction.buyAsset == address(0)) {
            // if buyAsset = ETH
            from = address(this);
        } else {
            // if buyAsset = ERC20
            from = sender;
        }
        doTransfers(
            LibDeal.DealSide(
                getSellAsset(
                    currentAuction.sellToken, 
                    currentAuction.sellTokenId,
                    currentAuction.sellTokenValue,
                    LibAsset.ERC1155_ASSET_CLASS
                ),
                getPayouts(currentAuction.seller),
                getOriginFee(aucData.originFee),
                proxies[LibAsset.ERC1155_ASSET_CLASS],
                address(this)
            ), 
            LibDeal.DealSide(
                getBuyAsset(
                    currentAuction.buyAsset,
                    bid.amount
                ),
                getPayouts(sender),
                getOriginFee(newBidOriginFee),
                proxy,
                from
            ), 
            LibDeal.DealData(
                MAX_FEE_BASE_POINT,
                LibFeeSide.FeeSide.RIGHT
            )
        );
        
        deactivateAuction(_auctionId);
        emit AuctionBuyOut(auctionId, sender);
    }

    /// @dev returns current highest bidder for an auction
    function getCurrentBuyer(uint _auctionId) external view returns(address) {
        return auctions[_auctionId].buyer;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return this.supportsInterface(interfaceId);
    }

}