// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/transfer-manager/contracts/lib/LibTransfer.sol";
import "@rarible/lib-bp/contracts/BpLibrary.sol";
import "@rarible/lib-part/contracts/LibPart.sol";

// import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";

// import "@openzeppelin/contracts/token/ERC721/ERC721Holder.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721HolderUpgradeable.sol";
// import "@openzeppelin/contracts/token/ERC1155/ERC1155Holder.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155HolderUpgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

import "./interfaces/IWyvernExchange.sol";
import "./interfaces/IExchangeV2.sol";
import "./interfaces/ISeaPort.sol";
import "./interfaces/Ix2y2.sol";
import "./interfaces/ILooksRare.sol";
import "./interfaces/IBlur.sol";

// import "./libraries/IsPausable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";

// contract RaribleExchangeWrapper is Ownable, ERC721Holder, ERC1155Holder, IsPausable {
contract RaribleExchangeWrapperUpgradeable is Initializable, OwnableUpgradeable, ERC721HolderUpgradeable, ERC1155HolderUpgradeable, PausableUpgradeable {
    using LibTransfer for address;
    using BpLibrary for uint256;
    using SafeMathUpgradeable for uint256;

    //marketplaces
    address public immutable wyvernExchange;
    address public immutable exchangeV2;
    address public immutable seaPort_1_1;
    address public immutable x2y2;
    address public immutable looksRare;
    address public immutable sudoswap;
    address public immutable seaPort_1_4;
    address public immutable looksRareV2;
    address public immutable blur;
    address public immutable seaPort_1_5;
    address public immutable seaPort_1_6;

    //currencties
    address public immutable weth;

    //constants
    uint256 private constant UINT256_MAX = type(uint256).max;

    event Execution(bool result);

    enum Markets {
        ExchangeV2, //0
        WyvernExchange, //1
        SeaPort_1_1, //2
        X2Y2, //3
        LooksRareOrders, //4
        SudoSwap, //5
        SeaPort_1_4, //6
        LooksRareV2, //7
        Blur, //8
        SeaPort_1_5, //9
        SeaPort_1_6 //10
    }

    enum AdditionalDataTypes {
        NoAdditionalData,
        RoyaltiesAdditionalData
    }

    enum Currencies {
        ETH,
        WETH
    }

    /**
        @notice struct for the purchase data
        @param marketId - market key from Markets enum (what market to use)
        @param amount - eth price (amount of eth that needs to be send to the marketplace)
        @param fees - 2 fees (in base points) that are going to be taken on top of order amount encoded in 1 uint256
                        bytes (25,26) used for currency (0 - ETH, 1 - WETH erc-20)
                        bytes (27,28) used for dataType
                        bytes (29,30) used for the first value (goes to feeRecipientFirst)
                        bytes (31,32) are used for the second value (goes to feeRecipientSecond)
        @param data - data for market call
     */
    struct PurchaseDetails {
        Markets marketId;
        uint256 amount;
        uint256 fees;
        bytes data;
    }

    /**
        @notice struct for the data with additional Ddta
        @param data - data for market call
        @param additionalRoyalties - array additional Royalties (in base points plus address Royalty recipient)
     */
    struct AdditionalData {
        bytes data;
        uint256[] additionalRoyalties;
    }

    constructor(
        address[11] memory _marketplaces,
        //address _wyvernExchange, 0
        //address _exchangeV2, 1
        //address _seaPort_1_1, 2
        //address _x2y2, 3
        //address _looksRare, 4
        //address _sudoswap, 5
        //address _seaPort_1_4, 6
        //address _looksRareV2, 7
        //address _blur, 8
        //address _seaPort_1_5, 9
        //address _seaPort_1_6, 10
        address _weth
    ) {
        wyvernExchange = _marketplaces[0];
        exchangeV2 = _marketplaces[1];
        seaPort_1_1 = _marketplaces[2];
        x2y2 = _marketplaces[3];
        looksRare = _marketplaces[4];
        sudoswap = _marketplaces[5];
        seaPort_1_4 = _marketplaces[6];
        looksRareV2 = _marketplaces[7];
        blur = _marketplaces[8];
        seaPort_1_5 = _marketplaces[9];
        seaPort_1_6 = _marketplaces[10];

        weth = _weth;
    }

    function __ExchangeWrapper_init_proxy(address[] memory _transferProxies, address _initialOwner) public initializer {
        __Ownable_init();
        __ERC721Holder_init();
        __ERC1155Holder_init();
        __Pausable_init();

        for (uint256 i = 0; i < _transferProxies.length; ++i) {
            if (weth != address(0)) {
                IERC20Upgradeable(weth).approve(_transferProxies[i], UINT256_MAX);
            }
        }

        transferOwnership(_initialOwner);
    }

    /**
        @notice executes a single purchase
        @param purchaseDetails - deatails about the purchase (more info in PurchaseDetails struct)
        @param feeRecipientFirst - address of the first fee recipient
        @param feeRecipientSecond - address of the second fee recipient
     */
    function singlePurchase(
        PurchaseDetails memory purchaseDetails,
        address feeRecipientFirst,
        address feeRecipientSecond
    ) external payable whenNotPaused {
        //amount of WETH needed for purchases:
        uint256 wethAmountNeeded = getAmountOfWethForPurchase(purchaseDetails);

        //transfer WETH to this contract (if needed)
        if (wethAmountNeeded > 0) {
            IERC20Upgradeable(weth).transferFrom(_msgSender(), address(this), wethAmountNeeded);
        }

        Currencies currency = getCurrency(purchaseDetails.fees);
        bool success;
        uint256 firstFeeAmount;
        uint256 secondFeeAmount;

        if (currency == Currencies.ETH) {
            (success, firstFeeAmount, secondFeeAmount) = purchase(purchaseDetails, false);
            transferFeeETH(firstFeeAmount, feeRecipientFirst);
            transferFeeETH(secondFeeAmount, feeRecipientSecond);
        } else if (currency == Currencies.WETH) {
            (success, firstFeeAmount, secondFeeAmount) = purchaseWETH(purchaseDetails, false);
            transferFeeWETH(firstFeeAmount, feeRecipientFirst);
            transferFeeWETH(secondFeeAmount, feeRecipientSecond);
        } else {
            revert("Unknown purchase currency");
        }

        emit Execution(success);

        //transfer ETH change
        transferChange();
        //transfer WETH change
        if (wethAmountNeeded > 0) {
            transferChangeWETH();
        }
    }

    /**
        @notice executes an array of purchases
        @param purchaseDetails - array of deatails about the purchases (more info in PurchaseDetails struct)
        @param feeRecipientFirst - address of the first fee recipient
        @param feeRecipientSecond - address of the second fee recipient
        @param allowFail - true if fails while executing orders are allowed, false if fail of a single order means fail of the whole batch
     */

    function bulkPurchase(
        PurchaseDetails[] memory purchaseDetails,
        address feeRecipientFirst,
        address feeRecipientSecond,
        bool allowFail
    ) external payable whenNotPaused {
        uint256 sumFirstFeesETH = 0;
        uint256 sumSecondFeesETH = 0;
        uint256 sumFirstFeesWETH = 0;
        uint256 sumSecondFeesWETH = 0;
        bool result = false;

        //amount of WETH needed for purchases:
        uint256 wethAmountNeeded = 0;
        for (uint256 i = 0; i < purchaseDetails.length; ++i) {
            wethAmountNeeded = wethAmountNeeded + getAmountOfWethForPurchase(purchaseDetails[i]);
        }

        //transfer WETH to this contract (if needed)
        if (wethAmountNeeded > 0) {
            IERC20Upgradeable(weth).transferFrom(_msgSender(), address(this), wethAmountNeeded);
        }

        for (uint256 i = 0; i < purchaseDetails.length; ++i) {
            Currencies currency = getCurrency(purchaseDetails[i].fees);
            bool success;
            uint256 firstFeeAmount;
            uint256 secondFeeAmount;

            if (currency == Currencies.ETH) {
                (success, firstFeeAmount, secondFeeAmount) = purchase(purchaseDetails[i], allowFail);

                sumFirstFeesETH = sumFirstFeesETH.add(firstFeeAmount);
                sumSecondFeesETH = sumSecondFeesETH.add(secondFeeAmount);
            } else if (currency == Currencies.WETH) {
                (success, firstFeeAmount, secondFeeAmount) = purchaseWETH(purchaseDetails[i], allowFail);

                sumFirstFeesWETH = sumFirstFeesWETH.add(firstFeeAmount);
                sumSecondFeesWETH = sumSecondFeesWETH.add(secondFeeAmount);
            } else {
                revert("Unknown purchase currency");
            }

            result = result || success;
            emit Execution(success);
        }

        require(result, "no successful executions");

        //pay fees in ETH
        transferFeeETH(sumFirstFeesETH, feeRecipientFirst);
        transferFeeETH(sumSecondFeesETH, feeRecipientSecond);

        //pay fees in WETH
        transferFeeWETH(sumFirstFeesWETH, feeRecipientFirst);
        transferFeeWETH(sumSecondFeesWETH, feeRecipientSecond);

        //transfer ETH change
        transferChange();
        //transfer WETH change
        if (wethAmountNeeded > 0) {
            transferChangeWETH();
        }
    }

    /**
        @notice executes one purchase in ETH
        @param purchaseDetails - details about the purchase
        @param allowFail - true if errors are handled, false if revert on errors
        @return result false if execution failed, true if succeded
        @return firstFeeAmount amount of the first fee of the purchase, 0 if failed
        @return secondFeeAmount amount of the second fee of the purchase, 0 if failed
     */
    function purchase(PurchaseDetails memory purchaseDetails, bool allowFail)
        internal
        returns (
            bool,
            uint256,
            uint256
        )
    {
        (bytes memory marketData, uint256[] memory additionalRoyalties) = getDataAndAdditionalData(purchaseDetails.data, purchaseDetails.fees, purchaseDetails.marketId);
        uint256 paymentAmount = purchaseDetails.amount;
        if (purchaseDetails.marketId == Markets.SeaPort_1_1) {
            (bool success, ) = address(seaPort_1_1).call{value: paymentAmount}(marketData);
            if (allowFail) {
                if (!success) {
                    return (false, 0, 0);
                }
            } else {
                require(success, "Purchase SeaPort_1_1 failed");
            }
        } else if (purchaseDetails.marketId == Markets.WyvernExchange) {
            (bool success, ) = address(wyvernExchange).call{value: paymentAmount}(marketData);
            if (allowFail) {
                if (!success) {
                    return (false, 0, 0);
                }
            } else {
                require(success, "Purchase wyvernExchange failed");
            }
        } else if (purchaseDetails.marketId == Markets.ExchangeV2) {
            (bool success, ) = address(exchangeV2).call{value: paymentAmount}(marketData);
            if (allowFail) {
                if (!success) {
                    return (false, 0, 0);
                }
            } else {
                require(success, "Purchase rarible failed");
            }
        } else if (purchaseDetails.marketId == Markets.X2Y2) {
            Ix2y2.RunInput memory input = abi.decode(marketData, (Ix2y2.RunInput));

            if (allowFail) {
                try Ix2y2(x2y2).run{value: paymentAmount}(input) {} catch {
                    return (false, 0, 0);
                }
            } else {
                Ix2y2(x2y2).run{value: paymentAmount}(input);
            }

            //for every element in input.details[] getting
            // order = input.details[i].orderIdx
            // and from that order getting item = input.details[i].itemId
            for (uint256 i = 0; i < input.details.length; ++i) {
                uint256 orderId = input.details[i].orderIdx;
                uint256 itemId = input.details[i].itemIdx;
                bytes memory data = input.orders[orderId].items[itemId].data;
                {
                    if (input.orders[orderId].dataMask.length > 0 && input.details[i].dataReplacement.length > 0) {
                        _arrayReplace(data, input.details[i].dataReplacement, input.orders[orderId].dataMask);
                    }
                }

                // 1 = erc-721
                if (input.orders[orderId].delegateType == 1) {
                    Ix2y2.Pair721[] memory pairs = abi.decode(data, (Ix2y2.Pair721[]));

                    for (uint256 j = 0; j < pairs.length; j++) {
                        Ix2y2.Pair721 memory p = pairs[j];
                        IERC721Upgradeable(address(p.token)).safeTransferFrom(address(this), _msgSender(), p.tokenId);
                    }
                } else if (input.orders[orderId].delegateType == 2) {
                    // 2 = erc-1155
                    Ix2y2.Pair1155[] memory pairs = abi.decode(data, (Ix2y2.Pair1155[]));

                    for (uint256 j = 0; j < pairs.length; j++) {
                        Ix2y2.Pair1155 memory p = pairs[j];
                        IERC1155Upgradeable(address(p.token)).safeTransferFrom(address(this), _msgSender(), p.tokenId, p.amount, "");
                    }
                } else {
                    revert("unknown delegateType x2y2");
                }
            }
        } else if (purchaseDetails.marketId == Markets.LooksRareOrders) {
            (LibLooksRare.TakerOrder memory takerOrder, LibLooksRare.MakerOrder memory makerOrder, bytes4 typeNft) = abi.decode(marketData, (LibLooksRare.TakerOrder, LibLooksRare.MakerOrder, bytes4));
            if (allowFail) {
                try ILooksRare(looksRare).matchAskWithTakerBidUsingETHAndWETH{value: paymentAmount}(takerOrder, makerOrder) {} catch {
                    return (false, 0, 0);
                }
            } else {
                ILooksRare(looksRare).matchAskWithTakerBidUsingETHAndWETH{value: paymentAmount}(takerOrder, makerOrder);
            }
            if (typeNft == LibAsset.ERC721_ASSET_CLASS) {
                IERC721Upgradeable(makerOrder.collection).safeTransferFrom(address(this), _msgSender(), makerOrder.tokenId);
            } else if (typeNft == LibAsset.ERC1155_ASSET_CLASS) {
                IERC1155Upgradeable(makerOrder.collection).safeTransferFrom(address(this), _msgSender(), makerOrder.tokenId, makerOrder.amount, "");
            } else {
                revert("Unknown token type");
            }
        } else if (purchaseDetails.marketId == Markets.SudoSwap) {
            (bool success, ) = address(sudoswap).call{value: paymentAmount}(marketData);
            if (allowFail) {
                if (!success) {
                    return (false, 0, 0);
                }
            } else {
                require(success, "Purchase sudoswap failed");
            }
        } else if (purchaseDetails.marketId == Markets.SeaPort_1_4) {
            (bool success, ) = address(seaPort_1_4).call{value: paymentAmount}(marketData);
            if (allowFail) {
                if (!success) {
                    return (false, 0, 0);
                }
            } else {
                require(success, "Purchase SeaPort_1_4 failed");
            }
        } else if (purchaseDetails.marketId == Markets.LooksRareV2) {
            (bool success, ) = address(looksRareV2).call{value: paymentAmount}(marketData);
            if (allowFail) {
                if (!success) {
                    return (false, 0, 0);
                }
            } else {
                require(success, "Purchase LooksRareV2 failed");
            }
        } else if (purchaseDetails.marketId == Markets.Blur) {
            (IBlur.Input memory sell, IBlur.Input memory buy, bytes4 typeNft) = abi.decode(marketData, (IBlur.Input, IBlur.Input, bytes4));
            if (allowFail) {
                try IBlur(blur).execute{value: paymentAmount}(sell, buy) {} catch {
                    return (false, 0, 0);
                }
            } else {
                IBlur(blur).execute{value: paymentAmount}(sell, buy);
            }
            if (typeNft == LibAsset.ERC721_ASSET_CLASS) {
                IERC721Upgradeable(sell.order.collection).safeTransferFrom(address(this), _msgSender(), sell.order.tokenId);
            } else if (typeNft == LibAsset.ERC1155_ASSET_CLASS) {
                IERC1155Upgradeable(sell.order.collection).safeTransferFrom(address(this), _msgSender(), sell.order.tokenId, sell.order.amount, "");
            } else {
                revert("Unknown token type");
            }
        } else if (purchaseDetails.marketId == Markets.SeaPort_1_5) {
            (bool success, ) = address(seaPort_1_5).call{value: paymentAmount}(marketData);
            if (allowFail) {
                if (!success) {
                    return (false, 0, 0);
                }
            } else {
                require(success, "Purchase SeaPort_1_5 failed");
            }
        } else if (purchaseDetails.marketId == Markets.SeaPort_1_6) {
            (bool success, ) = address(seaPort_1_6).call{value: paymentAmount}(marketData);
            if (allowFail) {
                if (!success) {
                    return (false, 0, 0);
                }
            } else {
                require(success, "Purchase SeaPort_1_6 failed");
            }
        } else {
            revert("Unknown marketId ETH");
        }

        //transferring royalties
        transferAdditionalRoyaltiesETH(additionalRoyalties, purchaseDetails.amount);

        (uint256 firstFeeAmount, uint256 secondFeeAmount) = getFees(purchaseDetails.fees, purchaseDetails.amount);
        return (true, firstFeeAmount, secondFeeAmount);
    }

    /**
        @notice executes one purchase in WETH
        @param purchaseDetails - details about the purchase
        @param allowFail - true if errors are handled, false if revert on errors
        @return result false if execution failed, true if succeded
        @return firstFeeAmount amount of the first fee of the purchase, 0 if failed
        @return secondFeeAmount amount of the second fee of the purchase, 0 if failed
     */
    function purchaseWETH(PurchaseDetails memory purchaseDetails, bool allowFail)
        internal
        returns (
            bool,
            uint256,
            uint256
        )
    {
        (bytes memory marketData, uint256[] memory additionalRoyalties) = getDataAndAdditionalData(purchaseDetails.data, purchaseDetails.fees, purchaseDetails.marketId);

        //buying
        if (purchaseDetails.marketId == Markets.SeaPort_1_1) {
            (bool success, ) = address(seaPort_1_1).call(marketData);
            if (allowFail) {
                if (!success) {
                    return (false, 0, 0);
                }
            } else {
                require(success, "Purchase SeaPort_1_1 failed WETH");
            }
        } else if (purchaseDetails.marketId == Markets.ExchangeV2) {
            (bool success, ) = address(exchangeV2).call(marketData);
            if (allowFail) {
                if (!success) {
                    return (false, 0, 0);
                }
            } else {
                require(success, "Purchase rarible failed WETH");
            }
        } else if (purchaseDetails.marketId == Markets.SeaPort_1_4) {
            (bool success, ) = address(seaPort_1_4).call(marketData);
            if (allowFail) {
                if (!success) {
                    return (false, 0, 0);
                }
            } else {
                require(success, "Purchase SeaPort_1_4 failed WETH");
            }
        } else if (purchaseDetails.marketId == Markets.SeaPort_1_5) {
            (bool success, ) = address(seaPort_1_5).call(marketData);
            if (allowFail) {
                if (!success) {
                    return (false, 0, 0);
                }
            } else {
                require(success, "Purchase SeaPort_1_5 failed WETH");
            }
        } else if (purchaseDetails.marketId == Markets.SeaPort_1_6) {
            (bool success, ) = address(seaPort_1_6).call(marketData);
            if (allowFail) {
                if (!success) {
                    return (false, 0, 0);
                }
            } else {
                require(success, "Purchase SeaPort_1_6 failed WETH");
            }
        } else {
            revert("Unknown marketId WETH");
        }

        //transfer royalties
        transferAdditionalRoyaltiesWETH(additionalRoyalties, purchaseDetails.amount);

        //get fees
        (uint256 firstFeeAmount, uint256 secondFeeAmount) = getFees(purchaseDetails.fees, purchaseDetails.amount);
        return (true, firstFeeAmount, secondFeeAmount);
    }

    /**
        @notice transfers ETH fee to feeRecipient
        @param feeAmount - amount to be transfered
        @param feeRecipient - address of the recipient
     */
    function transferFeeETH(uint256 feeAmount, address feeRecipient) internal {
        if (feeAmount > 0 && feeRecipient != address(0)) {
            LibTransfer.transferEth(feeRecipient, feeAmount);
        }
    }

    /**
        @notice transfers WETH fee to feeRecipient
        @param feeAmount - amount to be transfered
        @param feeRecipient - address of the recipient
     */
    function transferFeeWETH(uint256 feeAmount, address feeRecipient) internal {
        if (feeAmount > 0 && feeRecipient != address(0)) {
            IERC20Upgradeable(weth).transfer(feeRecipient, feeAmount);
        }
    }

    /**
        @notice transfers change back to sender
     */
    function transferChange() internal {
        uint256 ethAmount = address(this).balance;
        if (ethAmount > 0) {
            address(msg.sender).transferEth(ethAmount);
        }
    }

    /**
        @notice transfers weth change back to sender
     */
    function transferChangeWETH() internal {
        uint256 wethAmount = IERC20Upgradeable(weth).balanceOf(address(this));
        if (wethAmount > 0) {
            IERC20Upgradeable(weth).transfer(_msgSender(), wethAmount);
        }
    }

    /**
        @notice parses fees in base points from one uint and calculates real amount of fees
        @param fees two fees encoded in one uint, 29 and 30 bytes are used for the first fee, 31 and 32 bytes for second fee
        @param amount price of the order
        @return firstFeeAmount real amount for the first fee
        @return secondFeeAmount real amount for the second fee
     */
    function getFees(uint256 fees, uint256 amount) internal pure returns (uint256, uint256) {
        uint256 firstFee = uint256(uint16(fees >> 16));
        uint256 secondFee = uint256(uint16(fees));
        return (amount.bp(firstFee), amount.bp(secondFee));
    }

    /**
        @notice parses "fees" field to find the currency for the purchase
        @param fees field with encoded data
        @return 0 if ETH, 1 if WETH ERC-20
     */
    function getCurrency(uint256 fees) internal pure returns (Currencies) {
        return Currencies(uint16(fees >> 48));
    }

    /**
        @notice parses _data to data for market call and additionalData
        @param feesAndDataType 27 and 28 bytes for dataType
        @return marketData data for market call
        @return additionalRoyalties array uint256, (base point + address)
     */
    function getDataAndAdditionalData(
        bytes memory _data,
        uint256 feesAndDataType,
        Markets marketId
    ) internal pure returns (bytes memory, uint256[] memory) {
        AdditionalDataTypes dataType = AdditionalDataTypes(uint16(feesAndDataType >> 32));
        uint256[] memory additionalRoyalties;

        //return no royalties if wrong data type
        if (dataType == AdditionalDataTypes.NoAdditionalData) {
            return (_data, additionalRoyalties);
        }

        if (dataType == AdditionalDataTypes.RoyaltiesAdditionalData) {
            AdditionalData memory additionalData = abi.decode(_data, (AdditionalData));

            //return no royalties if market doesn't support royalties
            if (supportsRoyalties(marketId)) {
                return (additionalData.data, additionalData.additionalRoyalties);
            } else {
                return (additionalData.data, additionalRoyalties);
            }
        }

        revert("unknown additionalDataType");
    }

    /**
        @notice transfer additional royalties in ETH
        @param _additionalRoyalties array uint256 (base point + royalty recipient address)
     */
    function transferAdditionalRoyaltiesETH(uint256[] memory _additionalRoyalties, uint256 amount) internal {
        for (uint256 i = 0; i < _additionalRoyalties.length; ++i) {
            if (_additionalRoyalties[i] > 0) {
                address payable account = payable(address(_additionalRoyalties[i]));
                uint256 basePoint = uint256(_additionalRoyalties[i] >> 160);
                uint256 value = amount.bp(basePoint);
                transferFeeETH(value, account);
            }
        }
    }

    /**
        @notice transfer additional royalties in WETH
        @param _additionalRoyalties array uint256 (base point + royalty recipient address)
     */
    function transferAdditionalRoyaltiesWETH(uint256[] memory _additionalRoyalties, uint256 amount) internal {
        for (uint256 i = 0; i < _additionalRoyalties.length; ++i) {
            if (_additionalRoyalties[i] > 0) {
                address payable account = payable(address(_additionalRoyalties[i]));
                uint256 basePoint = uint256(_additionalRoyalties[i] >> 160);
                uint256 value = amount.bp(basePoint);
                transferFeeWETH(value, account);
            }
        }
    }

    // modifies `src`
    function _arrayReplace(
        bytes memory src,
        bytes memory replacement,
        bytes memory mask
    ) internal view virtual {
        require(src.length == replacement.length);
        require(src.length == mask.length);

        for (uint256 i = 0; i < src.length; ++i) {
            if (mask[i] != 0) {
                src[i] = replacement[i];
            }
        }
    }

    /**
        @notice returns true if this contract supports additional royalties for the marketplace;
        now royalties are supported for:
          1. SudoSwap
          2. LooksRare old
          3. LooksRare V2
    */
    function supportsRoyalties(Markets marketId) internal pure returns (bool) {
        if (marketId == Markets.SudoSwap || marketId == Markets.LooksRareOrders || marketId == Markets.LooksRareV2) {
            return true;
        }

        return false;
    }

    function getAmountOfWethForPurchase(PurchaseDetails memory detail) internal pure returns (uint256) {
        uint256 result = 0;

        Currencies currency = getCurrency(detail.fees);

        //for every purchase with WETH we sum amount, fees and royalties needed
        if (currency == Currencies.WETH) {
            //add amount
            result = result + detail.amount;

            //add fees
            (uint256 firstFeeAmount, uint256 secondFeeAmount) = getFees(detail.fees, detail.amount);
            result = result + firstFeeAmount + secondFeeAmount;

            //add royalties
            (, uint256[] memory royalties) = getDataAndAdditionalData(detail.data, detail.fees, detail.marketId);
            for (uint256 j = 0; j < royalties.length; ++j) {
                uint256 royaltyBasePoint = uint256(royalties[j] >> 160);
                uint256 royaltyValue = detail.amount.bp(royaltyBasePoint);
                result = result + royaltyValue;
            }
        }

        return result;
    }

    /**
        @notice approves weth for a list of the addresses
        @param transferProxies - array of addresses to approve WETH for
    */
    function approveWETH(address[] calldata transferProxies) external onlyOwner {
        for (uint256 i = 0; i < transferProxies.length; ++i) {
            IERC20Upgradeable(weth).approve(transferProxies[i], UINT256_MAX);
        }
    }

    receive() external payable {}

    uint256[50] private __gap;
}
