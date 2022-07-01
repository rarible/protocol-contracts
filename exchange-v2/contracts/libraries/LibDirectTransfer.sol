// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@rarible/lib-asset/contracts/LibAsset.sol";

library LibDirectTransfer { //LibDirectTransfers
    /*All buy parameters need for create buyOrder and sellOrder*/
    struct Purchase {
        uint tokenSellAmount;
        uint tokenPurchaseAmount;
        uint priceSell;
        uint pricePurchase;
        uint salt;
        address seller;
        bytes4 nftClass;
        bytes4 paymentClass;
        bytes nftData;
        bytes paymentData;
        bytes sellOrderData;
        bytes purchaseOrderData;
        bytes signature;
    }

    /*All accept bid parameters need for create buyOrder and sellOrder*/
    struct AcceptBid {
        uint tokenBidAmount;
        uint tokenAcceptAmount;
        uint priceBid;
        uint priceAccept;
        uint salt;
        address buyer;
        bytes4 nftClass;
        bytes nftData;
        bytes paymentData;
        bytes bidOrderData;
        bytes acceptOrderData;
        bytes signature;
    }
}
