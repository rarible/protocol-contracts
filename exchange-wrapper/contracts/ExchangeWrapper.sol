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

    event Execution(bool result);

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
        @param fees - 2 fees (in base points) that are going to be taken on top of order amount encoded in 1 uint256
                        bytes (29,30) used for the first value (goes to feeRecipientFirst)
                        bytes (31,32) are used for the second value (goes to feeRecipientSecond)

        @param data - data for market call 
     */
    struct PurchaseDetails {
        Markets marketId;
        uint256 amount;
        uint fees;
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
        @param feeRecipientFirst - address of the first fee recipient
        @param feeRecipientSecond - address of the second fee recipient
     */
    function singlePurchase(PurchaseDetails memory purchaseDetails, address feeRecipientFirst, address feeRecipientSecond) external payable {
        (bool success, uint feeAmountFirst, uint feeAmountSecond) = purchase(purchaseDetails, false);
        emit Execution(success);
        
        transferFee(feeAmountFirst, feeRecipientFirst);
        transferFee(feeAmountSecond, feeRecipientSecond);

        transferChange();
    }

    /**
        @notice executes an array of purchases
        @param purchaseDetails - array of deatails about the purchases (more info in PurchaseDetails struct)
        @param feeRecipientFirst - address of the first fee recipient
        @param feeRecipientSecond - address of the second fee recipient
        @param allowFail - true if fails while executing orders are allowed, false if fail of a single order means fail of the whole batch
     */
    
    function bulkPurchase(PurchaseDetails[] memory purchaseDetails, address feeRecipientFirst, address feeRecipientSecond, bool allowFail) external payable {
        uint sumFirstFees = 0;
        uint sumSecondFees = 0;
        bool result = false;

        for (uint i = 0; i < purchaseDetails.length; i++) {
            (bool success, uint firstFeeAmount, uint secondFeeAmount) = purchase(purchaseDetails[i], allowFail);

            result = result || success;
            emit Execution(success);

            sumFirstFees = sumFirstFees + firstFeeAmount;
            sumSecondFees = sumSecondFees + secondFeeAmount;
        }

        require(result, "no successful executions");

        transferFee(sumFirstFees, feeRecipientFirst);
        transferFee(sumSecondFees, feeRecipientSecond);

        transferChange();
    }

    /**
        @notice executase one purchase
        @param purchaseDetails - details about the purchase
        @param allowFail - true if errors are handled, false if revert on errors
        @return payment amount for the order. if execution failed (with allowFail = true) or addFee = false for the order then return 0;
     */
    function purchase(PurchaseDetails memory purchaseDetails, bool allowFail) internal returns(bool, uint, uint) {
        uint paymentAmount = purchaseDetails.amount;
        if (purchaseDetails.marketId == Markets.SeaPortAdvancedOrders){
            (bool success,) = address(seaPort).call{value : paymentAmount}(purchaseDetails.data);
            if (allowFail) {
                if (!success) {
                    return (false, 0, 0);
                }
            } else {
                require(success, "Purchase SeaPortAdvancedOrders failed");
            }
        } else if (purchaseDetails.marketId == Markets.WyvernExchange) {
            (bool success,) = address(wyvernExchange).call{value : paymentAmount}(purchaseDetails.data);
            if (allowFail) {
                if (!success) {
                    return (false, 0, 0);
                }
            } else {
                require(success, "Purchase wyvernExchange failed");
            }
        } else if (purchaseDetails.marketId == Markets.ExchangeV2) {
            (bool success,) = address(exchangeV2).call{value : paymentAmount}(purchaseDetails.data);
            if (allowFail) {
                if (!success) {
                    return (false, 0, 0);
                }
            } else {
                require(success, "Purchase rarible failed");
            }
        } else if (purchaseDetails.marketId == Markets.X2Y2) {
            Ix2y2.RunInput memory input = abi.decode(purchaseDetails.data, (Ix2y2.RunInput));

            if (allowFail) {
                try x2y2.run{value : paymentAmount}(input) {
                } catch {
                    return (false, 0, 0);
                }
            } else {
                x2y2.run{value : paymentAmount}(input);
            }
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
            if (allowFail) {
                try ILooksRare(looksRare).matchAskWithTakerBidUsingETHAndWETH{value : paymentAmount}(takerOrder, makerOrder) {
                }   catch {
                    return (false, 0, 0);
                }
            } else {
                ILooksRare(looksRare).matchAskWithTakerBidUsingETHAndWETH{value : paymentAmount}(takerOrder, makerOrder);
            }
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
        
        (uint firstFeeAmount, uint secondFeeAmount) = getFees(purchaseDetails.fees, purchaseDetails.amount);
        return (true, firstFeeAmount, secondFeeAmount);
    }

    function transferFee(uint feeAmount, address feeRecipient) internal {
        if (feeAmount > 0 && feeRecipient != address(0)) {
            LibTransfer.transferEth(feeRecipient, feeAmount);
        }
    }

    function transferChange() internal {
        uint ethAmount = address(this).balance;
        if (ethAmount > 0) {
            address(msg.sender).transferEth(ethAmount);
        }
    }

    function getFees(uint fees, uint amount) internal pure returns(uint, uint) {
        uint firstFee = uint(uint16(fees >> 16));
        uint secondFee = uint(uint16(fees));
        return (amount.bp(firstFee), amount.bp(secondFee));
    }

    receive() external payable {}

    uint256[50] private __gap;
}