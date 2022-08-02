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

contract ExchangeWrapper is OwnableUpgradeable, ERC721HolderUpgradeable, ERC1155HolderUpgradeable {
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
        SeaPortBasicOrders,
        X2Y2,
        LooksRareOrders
    }

    struct PurchaseDetails {
        Markets marketId;
        uint256 amount;
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

    function singlePurchase(PurchaseDetails memory purchaseDetails, uint[] memory fees) external payable {
        purchase(purchaseDetails);

        feesTransfer(msg.value, fees);

        changeTransfer();
    }

    function bulkPurchase(PurchaseDetails[] memory purchaseDetails, uint[] memory fees) external payable {
        for (uint i = 0; i < purchaseDetails.length; i++) {
            purchase(purchaseDetails[i]);
        }

        feesTransfer(msg.value, fees);

        changeTransfer();
    }

    function purchase(PurchaseDetails memory purchaseDetails) internal {
        uint paymentAmount = purchaseDetails.amount;
        if (purchaseDetails.marketId == Markets.SeaPortAdvancedOrders){
            (bool success,) = address(seaPort).call{value : paymentAmount}(purchaseDetails.data);
            require(success, "Purchase SeaPortAdvancedOrders failed");
        } else if (purchaseDetails.marketId == Markets.SeaPortBasicOrders) {
            (LibSeaPort.BasicOrderParameters memory seaPortBasic, bytes4 typeNft) = abi.decode(purchaseDetails.data, (LibSeaPort.BasicOrderParameters, bytes4));
            bool success = ISeaPort(seaPort).fulfillBasicOrder{value : paymentAmount}(seaPortBasic);
            require(success, "Purchase SeaPortBasicOrder failed");
            if (typeNft == LibAsset.ERC721_ASSET_CLASS) {
                IERC721Upgradeable(seaPortBasic.offerToken).safeTransferFrom(address(this), _msgSender(), seaPortBasic.offerIdentifier);
            } else if (typeNft == LibAsset.ERC1155_ASSET_CLASS) {
                IERC1155Upgradeable(seaPortBasic.offerToken).safeTransferFrom(address(this), _msgSender(), seaPortBasic.offerIdentifier, seaPortBasic.offerAmount, "");
            } else {
                revert("Unknown BasicSeaPort offerToken type");
            }
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
    }

    function feesTransfer(uint amount, uint[] memory fees) internal {
        uint spent = amount.sub(address(this).balance);
        for (uint i = 0; i < fees.length; i++) {
            uint feeValue = spent.bp(uint(fees[i] >> 160));
            if (feeValue > 0) {
                LibTransfer.transferEth(address(fees[i]), feeValue);
            }
        }
    }

    function changeTransfer() internal {
        uint ethAmount = address(this).balance;
        if (ethAmount > 0) {
            address(_msgSender()).transferEth(ethAmount);
        }
    }

    /*Transfer by ExchangeV2 sellOrder is in input, buyOrder is generated inside method */
    function matchExchangeV2(
        LibOrder.Order memory sellOrder,
        bytes memory sellOrderSignature,
        uint paymentAmount,
        uint purchaseAmount
    ) internal {
        LibOrder.Order memory buyerOrder;
        buyerOrder.maker = address(this);
        buyerOrder.makeAsset = sellOrder.takeAsset;
        buyerOrder.takeAsset.assetType = sellOrder.makeAsset.assetType;
        buyerOrder.takeAsset.value = purchaseAmount;

        /*set buyer in payout*/
        LibPart.Part[] memory payout = new LibPart.Part[](1);
        payout[0].account = _msgSender();
        payout[0].value = 10000;
        LibOrderDataV2.DataV2 memory data;
        data.payouts = payout;
        buyerOrder.data = abi.encode(data);
        buyerOrder.dataType = bytes4(keccak256("V2"));

        IExchangeV2(exchangeV2).matchOrders{value : paymentAmount }(sellOrder, sellOrderSignature, buyerOrder, "");
    }

    receive() external payable {}
}