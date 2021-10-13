// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./AuctionHouseBase.sol";

contract AuctionHouse is AuctionHouseBase, Initializable, OwnableUpgradeable, TransferExecutor {
    mapping(uint => Auction) public auctions;   //save auctions here

    uint256 private auctionId;          //unic. auction id
    address private nftTransferProxy;
    address private erc20TransferProxy;

    uint256 private constant EXTENSION_DURATION = 15 minutes;
    uint256 private constant MAX_DURATION = 1000 days;

    function __AuctionHouse_init(
        INftTransferProxy _transferProxy,
        IERC20TransferProxy _erc20TransferProxy
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __TransferExecutor_init_unchained(_transferProxy, _erc20TransferProxy);
        _initializeAuctionId();
        nftTransferProxy = address(_transferProxy);
        erc20TransferProxy = address(_erc20TransferProxy);
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
        uint currentAuctionId = getNextAndIncrementAuctionId();
        require(_sellAsset.assetType.assetClass != LibAsset.ETH_ASSET_CLASS, "can't sell ETH on auction");
        LibAucDataV1.DataV1 memory aucData = LibAucDataV1.parse(data, dataType);
        (uint startTimeCalculate, uint endTimeCalculate) = setTimeRange(aucData.startTime, endTime, aucData.duration);
        auctions[currentAuctionId] = Auction(
            _sellAsset,
            _buyAsset,
            Bid(0, "", ""),
            _msgSender(),
            payable(address(0)),
            startTimeCalculate,
            endTimeCalculate,
            minimalStep,
            minimalPrice,
            0,
            dataType,
            data
        );
        transfer(_sellAsset, _msgSender(), address(this), TO_LOCK, LOCK);
        setApproveForTransferProxy(_sellAsset);
        emit AuctionCreated(currentAuctionId, auctions[currentAuctionId]);
    }

    function setTimeRange(uint _startTime, uint _endTime, uint _duration) internal returns (uint startTime, uint endTime){
        if (_startTime == 0) {
            startTime = block.timestamp;
        } else {
            startTime = _startTime;
        }
        if (_endTime == 0) {
            require(_duration >= EXTENSION_DURATION && _duration <= MAX_DURATION, "wrong auction duration");
            endTime = startTime + _duration;
        } else {
            endTime = _endTime;
        }
        require(endTime > startTime, "error in auction time range");
    }

    function setApproveForTransferProxy(LibAsset.Asset memory _asset) internal {
        if (_asset.assetType.assetClass == LibAsset.ERC20_ASSET_CLASS) {
            (address token) = abi.decode(_asset.assetType.data, (address));
            IERC20Upgradeable(token).approve(erc20TransferProxy, _asset.value);
        } else if (_asset.assetType.assetClass == LibAsset.ERC721_ASSET_CLASS) {
            (address token, uint tokenId) = abi.decode(_asset.assetType.data, (address, uint256));
            require(_asset.value == 1, "erc721 value error");
            IERC721Upgradeable(token).setApprovalForAll(nftTransferProxy, true);
        } else if (_asset.assetType.assetClass == LibAsset.ERC1155_ASSET_CLASS) {
            (address token,) = abi.decode(_asset.assetType.data, (address, uint256));
            IERC1155Upgradeable(token).setApprovalForAll(nftTransferProxy, true);
        }
    }

    function _initializeAuctionId() internal {
        auctionId = 1;
    }

    function getNextAndIncrementAuctionId() internal returns (uint256) {
        return auctionId++;
    }

    uint256[50] private ______gap;
}