// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@rarible/lib-asset/contracts/LibAsset.sol";

library LibDirectTransfer { //LibDirectTransfers
    /*All buy parameters need for create buyOrder and sellOrder*/
    struct Purchase {
        address sellOrderMaker; //
        uint256 sellOrderNftAmount;
        bytes4 nftAssetClass;
        bytes nftData;
        uint256 sellOrderPaymentAmount;
        address paymentToken;
        uint256 sellOrderSalt;
        uint sellOrderStart;
        uint sellOrderEnd;
        bytes4 sellOrderDataType;
        bytes sellOrderData;
        bytes sellOrderSignature;

        uint256 buyOrderPaymentAmount;
        uint256 buyOrderNftAmount;
        bytes buyOrderData;
    }

    /*All accept bid parameters need for create buyOrder and sellOrder*/
    struct AcceptBid {
        address bidMaker; //
        uint256 bidNftAmount;
        bytes4 nftAssetClass;
        bytes nftData;
        uint256 bidPaymentAmount;
        address paymentToken;
        uint256 bidSalt;
        uint bidStart;
        uint bidEnd;
        bytes4 bidDataType;
        bytes bidData;
        bytes bidSignature;

        uint256 sellOrderPaymentAmount;
        uint256 sellOrderNftAmount;
        bytes sellOrderData;
    }
}
