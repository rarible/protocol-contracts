// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/transfer-manager/contracts/lib/LibTransfer.sol";
import "@rarible/lib-bp/contracts/BpLibrary.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./interfaces/IWyvernExchange.sol";
import "./interfaces/IExchangeV2.sol";
import "./interfaces/ISeaPort.sol";
import "@rarible/lib-part/contracts/LibPart.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";

contract ExchangeWrapper is OwnableUpgradeable {
    using LibTransfer for address;
    using BpLibrary for uint;
    using SafeMathUpgradeable for uint;

    IWyvernExchange public wyvernExchange;
    IExchangeV2 public exchangeV2;
    ISeaPort public seaPort;

    enum Markets {
        ExchangeV2,
        WyvernExchange,
        SeaPortAdvancedOrders,
        SeaPortBasicOrders
    }

    struct PurchaseDetails {
        Markets marketId;
        uint256 amount;
        bytes data;
    }

    function __ExchangeWrapper_init(
        IWyvernExchange _wyvernExchange,
        IExchangeV2 _exchangeV2,
        ISeaPort _seaPort
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        wyvernExchange = _wyvernExchange;
        exchangeV2 = _exchangeV2;
        seaPort = _seaPort;
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

        bytes memory buyOrderSignature; //empty signature is enough for buyerOrder

        IExchangeV2(exchangeV2).matchOrders{value : paymentAmount }(sellOrder, sellOrderSignature, buyerOrder, buyOrderSignature);
    }

    //this method need to prevent error ERC1155: transfer to non ERC1155Receiver implementer
    function onERC1155Received(address, address, uint256, uint256, bytes memory) public virtual returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    receive() external payable {}
}