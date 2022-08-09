// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/transfer-manager/contracts/lib/LibTransfer.sol";
import "@rarible/lib-bp/contracts/BpLibrary.sol";
import "@rarible/lib-part/contracts/LibPart.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155HolderUpgradeable.sol";

import "./interfaces/IWyvernExchange.sol";
import "./interfaces/IExchangeV2.sol";
import "./interfaces/ISeaPort.sol";
import "./interfaces/Ix2y2.sol";
import "./interfaces/ILooksRare.sol";

contract ExchangeWrapper is ERC721HolderUpgradeable, OwnableUpgradeable, ERC1155HolderUpgradeable {
    using LibTransfer for address;
    using BpLibrary for uint;
    using SafeMathUpgradeable for uint;

    IWyvernExchange public wyvernExchange;
    IExchangeV2 public exchangeV2;
    ISeaPort public seaPort;
    Ix2y2 public x2y2;
    ILooksRare public looksRare;

    enum Markets {
        ExchangeV2,
        WyvernExchange,
        SeaPortAdvancedOrders,
        X2Y2,
        LooksRareOrders
    }

    /**
        @notice struct for the purchase data
        @param marketId - market key from Markets enum (what market to use)
        @param amount - eth price (amount of eth that needs to be send to the marketplace)
        @param addFee - true if wrapper adds additional fees on top of the order
        @param data - data for market call 
     */
    struct PurchaseDetails {
        Markets marketId;
        uint256 amount;
        bool addFee;
        bytes data;
    }

    function __ExchangeWrapper_init(
        IWyvernExchange _wyvernExchange,
        IExchangeV2 _exchangeV2,
        ISeaPort _seaPort,
        Ix2y2 _x2y2,
        ILooksRare _looksRare
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        wyvernExchange = _wyvernExchange;
        exchangeV2 = _exchangeV2;
        seaPort = _seaPort;
        x2y2 = _x2y2;
        looksRare = _looksRare;
    }

    function setWyvern(IWyvernExchange _wyvernExchange) external onlyOwner {
        wyvernExchange = _wyvernExchange;
    }

    function setExchange(IExchangeV2 _exchangeV2) external onlyOwner {
        exchangeV2 = _exchangeV2;
    }

    function setSeaPort(ISeaPort _seaPort) external onlyOwner {
        seaPort = _seaPort;
    }

    function setX2Y2(Ix2y2 _x2y2) external onlyOwner {
        x2y2 = _x2y2;
    }

    function setLooksRare(ILooksRare _looksRare) external onlyOwner {
        looksRare = _looksRare;
    }

    /**
        @notice executes a single purchase
        @param purchaseDetails - deatails about the purchase (more info in PurchaseDetails struct)
        @param originFeeFirst - first optional fee (address + amount encoded in uint, first 12 bytes are amount, last 20 bytes are address)
        @param originFeeSecond - second optional fee (address + amount encoded in uint, first 12 bytes are amount, last 20 bytes are address)
     */
    function singlePurchase(PurchaseDetails memory purchaseDetails, uint originFeeFirst, uint originFeeSecond) external payable {
        uint amountForFees = purchase(purchaseDetails);

        _transferFees(amountForFees, originFeeFirst, originFeeSecond);

        transferChange();
    }

    /**
        @notice executes an array of purchases
        @param purchaseDetails - array of deatails about the purchases (more info in PurchaseDetails struct)
        @param originFeeFirst - first optional fee (address + amount encoded in uint, first 12 bytes are amount, last 20 bytes are address)
        @param originFeeSecond - second optional fee (address + amount encoded in uint, first 12 bytes are amount, last 20 bytes are address)
        @param allowFail - true if fails while executing orders are allowed, false if fail of a single order means fail of the whole batch
     */
    function bulkPurchase(PurchaseDetails[] memory purchaseDetails, uint originFeeFirst, uint originFeeSecond, bool allowFail) external payable {
        uint amountForFees = 0;
        for (uint i = 0; i < purchaseDetails.length; i++) {
            amountForFees = amountForFees + purchase(purchaseDetails[i]);
        }

        _transferFees(amountForFees, originFeeFirst, originFeeSecond);

        transferChange();
    }

    function purchase(PurchaseDetails memory purchaseDetails) internal returns(uint){
        uint paymentAmount = purchaseDetails.amount;
        if (purchaseDetails.marketId == Markets.SeaPortAdvancedOrders){
            (bool success,) = address(seaPort).call{value : paymentAmount}(purchaseDetails.data);
            require(success, "Purchase SeaPortAdvancedOrders failed");
        } else if (purchaseDetails.marketId == Markets.WyvernExchange) {
            (bool success,) = address(wyvernExchange).call{value : paymentAmount}(purchaseDetails.data);
            require(success, "Purchase wyvernExchange failed");
        } else if (purchaseDetails.marketId == Markets.ExchangeV2) {
            (LibOrder.Order memory sellOrder, bytes memory sellOrderSignature, uint purchaseAmount) = abi.decode(purchaseDetails.data, (LibOrder.Order, bytes, uint));
            matchExchangeV2(sellOrder, sellOrderSignature, paymentAmount, purchaseAmount);
        } else if (purchaseDetails.marketId == Markets.X2Y2) {
            Ix2y2.RunInput memory input = abi.decode(purchaseDetails.data, (Ix2y2.RunInput));
            x2y2.run{value : paymentAmount}(input);
            for (uint i = 0; i < input.orders.length; i++) {
                for (uint j = 0; j < input.orders[i].items.length; j++) {
                    Ix2y2.Pair[] memory pairs = abi.decode(input.orders[i].items[j].data, (Ix2y2.Pair[]));
                    for (uint256 k = 0; k < pairs.length; k++) {
                        Ix2y2.Pair memory p = pairs[k];
                        IERC721Upgradeable(address(p.token)).safeTransferFrom(address(this), _msgSender(), p.tokenId);
                    }    
                }
            } 
        } else if (purchaseDetails.marketId == Markets.LooksRareOrders) {
            (LibLooksRare.TakerOrder memory takerOrder, LibLooksRare.MakerOrder memory makerOrder, bytes4 typeNft) = abi.decode(purchaseDetails.data, (LibLooksRare.TakerOrder, LibLooksRare.MakerOrder, bytes4));
            ILooksRare(looksRare).matchAskWithTakerBidUsingETHAndWETH{value : paymentAmount}(takerOrder, makerOrder);

            if (typeNft == LibAsset.ERC721_ASSET_CLASS) {
                IERC721Upgradeable(makerOrder.collection).safeTransferFrom(address(this), _msgSender(), makerOrder.tokenId);
            } else if (typeNft == LibAsset.ERC1155_ASSET_CLASS) {
                IERC1155Upgradeable(makerOrder.collection).safeTransferFrom(address(this), _msgSender(), makerOrder.tokenId, makerOrder.amount, "");
            } else {
                revert("Unknown token type");
            }
        } else {
            revert("Unknown purchase details");
        }

        return (purchaseDetails.addFee) ? paymentAmount : 0;
    }

    function _transferFees(uint amount, uint originFeeFirst, uint originFeeSecond) internal {
        _transferFee(amount, originFeeFirst);
        _transferFee(amount, originFeeSecond);
    }

    function _transferFee(uint amount, uint fee) internal {
        uint feeValue = amount.bp(uint(fee >> 160));
        if (feeValue > 0) {
            LibTransfer.transferEth(address(fee), feeValue);
        }
    }

    function transferChange() internal {
        uint ethAmount = address(this).balance;
        if (ethAmount > 0) {
            address(msg.sender).transferEth(ethAmount);
        }
    }

    /*Transfer by ExchangeV2 sellOrder is in input, buyOrder is generated inside method */
    function matchExchangeV2(
        LibOrder.Order memory sellOrder,
        bytes memory sellOrderSignature,
        uint paymentAmount,
        uint purchaseAmount
    ) internal {
        bytes4 dataType = sellOrder.dataType;
        if (dataType == LibOrderDataV3.V3_SELL){

            IExchangeV2(exchangeV2).directPurchase{ value : paymentAmount }(
                LibDirectTransfer.Purchase(
                    sellOrder.makeAsset.value,
                    purchaseAmount,
                    sellOrder.takeAsset.value,
                    sellOrder.takeAsset.value,
                    sellOrder.salt,
                    sellOrder.maker,
                    sellOrder.makeAsset.assetType.assetClass,
                    sellOrder.takeAsset.assetType.assetClass,
                    sellOrder.makeAsset.assetType.data,
                    sellOrder.takeAsset.assetType.data,
                    sellOrder.data,
                    getBuyOrderData(sellOrder.data),
                    sellOrderSignature
                )
            );
        } else {
            LibOrder.Order memory buyerOrder;
            buyerOrder.maker = address(this);
            buyerOrder.makeAsset = sellOrder.takeAsset;
            buyerOrder.takeAsset.assetType = sellOrder.makeAsset.assetType;
            buyerOrder.takeAsset.value = purchaseAmount;

            LibOrderData.GenericOrderData memory sellDataGeneric = LibOrderData.parse(sellOrder);

            LibOrderDataV2.DataV2 memory data;
            data.originFees = sellDataGeneric.originFees;
            LibPart.Part[] memory payout = new LibPart.Part[](1);
            payout[0].account = _msgSender();
            payout[0].value = 10000;
            data.payouts = payout;
            
            buyerOrder.data = abi.encode(data);
            buyerOrder.dataType = LibOrderDataV2.V2;

            IExchangeV2(exchangeV2).matchOrders{value : paymentAmount }(sellOrder, sellOrderSignature, buyerOrder, "");
        }    
    }

    function getBuyOrderData(bytes memory sellData) internal view returns(bytes memory)  {
        LibOrderDataV3.DataV3_SELL memory sellDataV3 = abi.decode(sellData, (LibOrderDataV3.DataV3_SELL));

        LibOrderDataV3.DataV3_BUY memory result;
        result.originFeeFirst = sellDataV3.originFeeFirst;
        result.originFeeSecond = sellDataV3.originFeeSecond;
        result.marketplaceMarker = sellDataV3.marketplaceMarker;
        result.payouts = (uint256(10000) << 160) + uint256(_msgSender());
        return abi.encode(result);
    }

    receive() external payable {}

    uint256[50] private __gap;
}