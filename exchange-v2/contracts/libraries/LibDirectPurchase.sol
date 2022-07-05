// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

library LibDirectPurchase {
    /*All buy parameters need for create buyOrder and sellOrder*/
    struct Purchase {
        address seller;
        address token;
        bytes4 assetType;
        uint tokenId;
        uint tokenAmount;
        uint price;
        uint salt;
        bytes signature;
    }

    /*All accept bid parameters need for create buyOrder and sellOrder*/
    struct AcceptBid {
        address buyer;
        address tokenPayment;
        address tokenNft;
        bytes4 assetType;
        uint tokenId;
        uint tokenAmount;
        uint price;
        uint salt;
        bytes signature;
    }
}
